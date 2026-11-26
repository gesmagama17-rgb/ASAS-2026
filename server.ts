import express, { type NextFunction, type Request, type Response } from 'express';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import crypto from 'node:crypto';
import dns from 'node:dns';
import net from 'node:net';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import multer from 'multer';
import mammoth from 'mammoth';
import { SEED_EXAMS, SEED_QUESTIONS } from './src/utils/defaultSeedBank';
import { classifyOrigin, normalizePublicBaseUrl } from './src/utils/shareUrl';
import {
  normalizeCustomBackHalf,
  parseBitlyUserResponse,
  translateBitlyError,
  validateLongUrlForBitly,
} from './src/utils/bitlyClient';
import type {
  BitlyShortLinkRecord,
  BitlyStatus,
  CountsByType,
  ExamPackage,
  Question,
  QuestionType,
  ScoringMode,
  StudentAnswerValue,
  StudentSubmission,
} from './src/types/exam';
import {
  buildReviewItems,
  buildStudentExamSummary,
  computeCountsFromQuestions,
  computeSubmissionScores,
  sanitizeQuestionsForStudent,
  selectQuestionsForExam,
} from './src/utils/examScoring';
import { parseWordHtmlToQuestions } from './src/utils/wordQuestionParser';
import { buildSampleWordTemplateBuffer } from './src/utils/wordTemplate';
import { buildExamItemAnalysis } from './src/utils/itemAnalysis';

dotenv.config();

const PORT = 3000;
const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'store.json');
const SESSION_COOKIE = 'tka_guru_session';

interface TeacherSession {
  token: string;
  createdAt: string;
  expiresAt: number;
}

interface BitlyConnectionRecord {
  accessToken?: string;
  login?: string;
  name?: string;
  defaultGroupGuid?: string;
  domain?: string;
  authMethod?: 'token' | 'oauth' | 'env';
  connectedAt?: string;
}

interface DatabaseSchema {
  questions: Question[];
  exams: ExamPackage[];
  submissions: StudentSubmission[];
  teacherAuth: {
    salt: string;
    passwordHash: string;
    teacherName: string;
    schoolName: string;
    publicBaseUrl?: string;
  };
  sessions: TeacherSession[];
  bitly?: BitlyConnectionRecord;
  bitlyShortLinks?: Record<string, BitlyShortLinkRecord>;
}

function isPrivateOrReservedIp(ip: string): boolean {
  const cleaned = ip.replace(/^::ffff:/i, '');
  if (net.isIPv4(cleaned)) {
    const parts = cleaned.split('.').map(Number);
    if (parts.length !== 4 || parts.some((n) => Number.isNaN(n))) return true;
    const [a, b] = parts;
    if (a === 0 || a === 10 || a === 127) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true;
    if (a >= 224) return true;
    return false;
  }
  const lower = cleaned.toLowerCase();
  return (
    lower === '::' ||
    lower === '::1' ||
    lower.startsWith('fc') ||
    lower.startsWith('fd') ||
    lower.startsWith('fe80')
  );
}

function getEffectivePublicBaseUrl(): string {
  return (db.teacherAuth.publicBaseUrl || process.env.PUBLIC_APP_URL || '').trim();
}

function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

function verifyPassword(password: string, salt: string, expectedHash: string): boolean {
  const actual = hashPassword(password, salt);
  const a = Buffer.from(actual, 'hex');
  const b = Buffer.from(expectedHash, 'hex');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function createInitialDb(): DatabaseSchema {
  const salt = crypto.randomBytes(16).toString('hex');
  const initialPass = process.env.TEACHER_PASSWORD || 'makale2026';
  return {
    questions: SEED_QUESTIONS,
    exams: SEED_EXAMS,
    submissions: [],
    teacherAuth: {
      salt,
      passwordHash: hashPassword(initialPass, salt),
      teacherName: 'Guru Kelas V',
      schoolName: 'UPT SDN 2 Makale Selatan',
      publicBaseUrl: '',
    },
    sessions: [],
  };
}

function loadDb(): DatabaseSchema {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    const initial = createInitialDb();
    saveDb(initial);
    return initial;
  }
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw) as DatabaseSchema;
    if (!Array.isArray(parsed.questions) || !Array.isArray(parsed.exams)) {
      throw new Error('Invalid DB schema');
    }
    return parsed;
  } catch {
    const fallback = createInitialDb();
    saveDb(fallback);
    return fallback;
  }
}

function saveDb(data: DatabaseSchema): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const tmpPath = `${DB_FILE}.${process.pid}.tmp`;
  fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf-8');
  fs.renameSync(tmpPath, DB_FILE);
}

let db: DatabaseSchema = loadDb();

function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  const result: Record<string, string> = {};
  if (!cookieHeader) return result;
  for (const part of cookieHeader.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const val = decodeURIComponent(part.slice(idx + 1).trim());
    result[key] = val;
  }
  return result;
}

function extractSessionToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }
  const cookies = parseCookies(req.headers.cookie);
  return cookies[SESSION_COOKIE] || null;
}

function isValidTeacherSession(token: string | null): boolean {
  if (!token) return false;
  const now = Date.now();
  const activeSessions = db.sessions.filter((s) => s.expiresAt > now);
  if (activeSessions.length !== db.sessions.length) {
    db.sessions = activeSessions;
    saveDb(db);
  }
  return activeSessions.some((s) => s.token === token);
}

function requireTeacherAuth(req: Request, res: Response, next: NextFunction): void {
  const token = extractSessionToken(req);
  if (!isValidTeacherSession(token)) {
    res.status(401).json({ error: 'Akses ditolak. Silakan masuk sebagai guru.' });
    return;
  }
  next();
}

function generateShareCode(subject: string): string {
  const prefix = subject
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 8) || 'UJIAN';
  const suffix = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `${prefix}-${suffix}`;
}

function resolveExamQuestions(exam: ExamPackage): Question[] {
  const qMap = new Map(db.questions.map((q) => [q.id, q]));
  let items = exam.questionIds
    .map((id) => qMap.get(id))
    .filter((q): q is Question => Boolean(q));

  if (items.length === 0 && exam.selectionMode === 'auto') {
    const ids = selectQuestionsForExam({
      allQuestions: db.questions,
      subject: exam.subject,
      selectionMode: 'auto',
      countsByType: exam.countsByType,
      shuffle: exam.shuffleQuestions,
    });
    items = ids
      .map((id) => qMap.get(id))
      .filter((q): q is Question => Boolean(q));
  }

  return items;
}

function getExamScoringConfig(exam: ExamPackage | undefined) {
  if (!exam) return undefined;
  return {
    scoringMode: exam.scoringMode || 'weighted_split',
    objectiveWeightPercent: exam.objectiveWeightPercent ?? 60,
    essayWeightPercent: exam.essayWeightPercent ?? 40,
  };
}

function recalculateSubmissionsForExam(examId?: string): number {
  let updatedCount = 0;
  db.submissions = db.submissions.map((sub) => {
    if (examId && sub.examId !== examId) return sub;
    const exam = db.exams.find((e) => e.id === sub.examId);
    const questions = exam
      ? resolveExamQuestions(exam)
      : db.questions.filter((q) => q.id in sub.answers);
    if (questions.length === 0) return sub;

    const recomputed = computeSubmissionScores({
      questions,
      answers: sub.answers,
      essayScores: sub.essayScores,
      scoringConfig: getExamScoringConfig(exam),
    });

    updatedCount += 1;
    return {
      ...sub,
      objectiveCorrectCount: recomputed.objectiveCorrectCount,
      objectiveTotalCount: recomputed.objectiveTotalCount,
      objectiveScore: recomputed.objectiveScore,
      essayTotalCount: recomputed.essayTotalCount,
      essayScore: recomputed.essayScore,
      finalScore: recomputed.finalScore,
      gradingStatus: recomputed.gradingStatus,
    };
  });
  return updatedCount;
}

const pendingBitlyOAuthStates = new Map<
  string,
  { createdAt: number; redirectUri: string }
>();

function pruneBitlyOAuthStates(): void {
  const cutoff = Date.now() - 10 * 60 * 1000;
  for (const [key, value] of pendingBitlyOAuthStates.entries()) {
    if (value.createdAt < cutoff) {
      pendingBitlyOAuthStates.delete(key);
    }
  }
}

function getAppBaseOrigin(req?: Request): string {
  const envAppUrl = (process.env.APP_URL || '').trim();
  if (envAppUrl && envAppUrl !== 'MY_APP_URL' && /^https?:\/\//i.test(envAppUrl)) {
    return envAppUrl.replace(/\/+$/, '');
  }
  const publicUrl = getEffectivePublicBaseUrl();
  if (publicUrl) {
    return publicUrl.replace(/\/+$/, '');
  }
  if (req) {
    const protoHeader = req.headers['x-forwarded-proto'];
    const proto =
      typeof protoHeader === 'string' && protoHeader.trim()
        ? protoHeader.split(',')[0].trim()
        : req.protocol || 'http';
    const host = req.get('host') || `localhost:${PORT}`;
    return `${proto}://${host}`.replace(/\/+$/, '');
  }
  return `http://localhost:${PORT}`;
}

function getBitlyCallbackUrl(req?: Request): string {
  return `${getAppBaseOrigin(req)}/api/bitly/callback`;
}

function getActiveBitlyToken(): string {
  const saved = (db.bitly?.accessToken || '').trim();
  if (saved) return saved;
  return (process.env.BITLY_ACCESS_TOKEN || '').trim();
}

function isBitlyOAuthConfigured(): boolean {
  return Boolean(
    (process.env.BITLY_CLIENT_ID || '').trim() &&
      (process.env.BITLY_CLIENT_SECRET || '').trim()
  );
}

function buildPublicBitlyStatus(req?: Request): BitlyStatus {
  const envToken = (process.env.BITLY_ACCESS_TOKEN || '').trim();
  const savedToken = (db.bitly?.accessToken || '').trim();
  const connected = Boolean(savedToken || envToken);
  return {
    connected,
    login: db.bitly?.login,
    name: db.bitly?.name,
    domain: db.bitly?.domain || 'bit.ly',
    authMethod: savedToken ? db.bitly?.authMethod || 'token' : envToken ? 'env' : undefined,
    connectedAt: db.bitly?.connectedAt,
    oauthConfigured: isBitlyOAuthConfigured(),
    callbackUrl: getBitlyCallbackUrl(req),
    envTokenActive: Boolean(envToken),
  };
}

async function fetchBitlyAccountProfile(accessToken: string): Promise<{
  login: string;
  name: string;
  defaultGroupGuid?: string;
  domain: string;
}> {
  const userRes = await fetch('https://api-ssl.bitly.com/v4/user', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
    signal: AbortSignal.timeout(10000),
  });
  const userData = await userRes.json().catch(() => ({}));
  if (!userRes.ok) {
    throw new Error(translateBitlyError(userRes.status, userData));
  }
  const parsed = parseBitlyUserResponse(userData);
  let defaultGroupGuid = parsed.defaultGroupGuid;
  if (!defaultGroupGuid) {
    const groupsRes = await fetch('https://api-ssl.bitly.com/v4/groups', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(10000),
    });
    if (groupsRes.ok) {
      const groupsData = (await groupsRes.json().catch(() => ({}))) as {
        groups?: Array<{ guid?: string }>;
      };
      defaultGroupGuid = groupsData.groups?.[0]?.guid;
    }
  }
  return {
    login: parsed.login,
    name: parsed.name,
    defaultGroupGuid,
    domain: 'bit.ly',
  };
}

const wordUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '5mb' }));
  app.use('/data', (_req, res) => {
    res.status(404).end();
  });

  // --- Teacher Auth Endpoints ---
  app.get('/api/teacher/me', (req, res) => {
    const token = extractSessionToken(req);
    const authenticated = isValidTeacherSession(token);
    if (!authenticated) {
      res.json({ authenticated: false });
      return;
    }
    res.json({
      authenticated: true,
      teacherName: db.teacherAuth.teacherName,
      schoolName: db.teacherAuth.schoolName,
      publicBaseUrl: getEffectivePublicBaseUrl(),
    });
  });

  app.post('/api/teacher/login', (req, res) => {
    const { password } = req.body as { password?: string };
    if (!password || typeof password !== 'string') {
      res.status(400).json({ error: 'Kata sandi guru wajib diisi.' });
      return;
    }
    const valid = verifyPassword(
      password.trim(),
      db.teacherAuth.salt,
      db.teacherAuth.passwordHash
    );
    if (!valid) {
      res.status(401).json({ error: 'Kata sandi guru salah.' });
      return;
    }
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + 1000 * 60 * 60 * 12; // 12 hours
    db.sessions.push({
      token: sessionToken,
      createdAt: new Date().toISOString(),
      expiresAt,
    });
    saveDb(db);

    res.setHeader(
      'Set-Cookie',
      `${SESSION_COOKIE}=${encodeURIComponent(sessionToken)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 12}`
    );
    res.json({
      authenticated: true,
      token: sessionToken,
      teacherName: db.teacherAuth.teacherName,
      schoolName: db.teacherAuth.schoolName,
      publicBaseUrl: getEffectivePublicBaseUrl(),
    });
  });

  app.post('/api/teacher/logout', (req, res) => {
    const token = extractSessionToken(req);
    if (token) {
      db.sessions = db.sessions.filter((s) => s.token !== token);
      saveDb(db);
    }
    res.setHeader(
      'Set-Cookie',
      `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
    );
    res.json({ ok: true });
  });

  app.put('/api/teacher/settings', requireTeacherAuth, (req, res) => {
    const { teacherName, schoolName, newPassword, currentPassword, publicBaseUrl } = req.body as {
      teacherName?: string;
      schoolName?: string;
      newPassword?: string;
      currentPassword?: string;
      publicBaseUrl?: string;
    };

    if (teacherName && teacherName.trim()) {
      db.teacherAuth.teacherName = teacherName.trim();
    }
    if (schoolName && schoolName.trim()) {
      db.teacherAuth.schoolName = schoolName.trim();
    }
    if (publicBaseUrl !== undefined) {
      const normalized = normalizePublicBaseUrl(String(publicBaseUrl));
      if (!normalized.ok) {
        res.status(400).json({ error: normalized.error });
        return;
      }
      if (normalized.origin && classifyOrigin(normalized.origin) === 'ai_studio_dev') {
        res.status(400).json({
          error:
            'URL ais-dev-... adalah alamat preview pribadi Google AI Studio yang mewajibkan login. Gunakan URL publik hasil Deploy.',
        });
        return;
      }
      db.teacherAuth.publicBaseUrl = normalized.origin;
    }
    if (newPassword && newPassword.trim()) {
      if (newPassword.trim().length < 4) {
        res.status(400).json({ error: 'Kata sandi baru minimal 4 karakter.' });
        return;
      }
      if (
        !currentPassword ||
        !verifyPassword(currentPassword.trim(), db.teacherAuth.salt, db.teacherAuth.passwordHash)
      ) {
        res.status(400).json({ error: 'Kata sandi lama tidak sesuai.' });
        return;
      }
      const newSalt = crypto.randomBytes(16).toString('hex');
      db.teacherAuth.salt = newSalt;
      db.teacherAuth.passwordHash = hashPassword(newPassword.trim(), newSalt);
    }
    saveDb(db);
    res.json({
      teacherName: db.teacherAuth.teacherName,
      schoolName: db.teacherAuth.schoolName,
      publicBaseUrl: getEffectivePublicBaseUrl(),
    });
  });

  app.post('/api/teacher/verify-public-url', requireTeacherAuth, async (req, res) => {
    const rawUrl = typeof req.body?.url === 'string' ? req.body.url : '';
    const normalized = normalizePublicBaseUrl(rawUrl);
    if (!normalized.ok || !normalized.origin) {
      res.status(400).json({
        reachablePublicly: false,
        status: 'error',
        message: normalized.ok
          ? 'Masukkan URL publik aplikasi yang akan diperiksa.'
          : normalized.error,
      });
      return;
    }

    const originKind = classifyOrigin(normalized.origin);
    if (originKind === 'ai_studio_dev') {
      res.json({
        reachablePublicly: false,
        status: 'requires_auth',
        origin: normalized.origin,
        message:
          'Alamat ais-dev-... adalah preview editor Google AI Studio dan selalu meminta murid login. Gunakan URL publik hasil Deploy.',
      });
      return;
    }

    let parsed: URL;
    try {
      parsed = new URL(normalized.origin);
    } catch {
      res.status(400).json({
        reachablePublicly: false,
        status: 'error',
        message: 'Format URL tidak valid.',
      });
      return;
    }

    const host = parsed.hostname.toLowerCase();
    if (
      parsed.protocol !== 'https:' ||
      host === 'localhost' ||
      host.endsWith('.local') ||
      host.endsWith('.internal') ||
      net.isIP(host) !== 0
    ) {
      res.status(400).json({
        reachablePublicly: false,
        status: 'error',
        message: 'Gunakan alamat domain HTTPS publik yang valid (contoh: https://nama-app.run.app).',
      });
      return;
    }

    try {
      const addresses = await dns.promises.lookup(host, { all: true });
      if (addresses.length === 0 || addresses.some((a) => isPrivateOrReservedIp(a.address))) {
        res.status(400).json({
          reachablePublicly: false,
          status: 'error',
          message: 'Alamat tujuan bukan domain internet publik yang valid.',
        });
        return;
      }

      const target = `${normalized.origin}/api/student/exams`;
      const probe = await fetch(target, {
        method: 'GET',
        redirect: 'manual',
        signal: AbortSignal.timeout(6000),
      });

      if (probe.status === 200) {
        const contentType = probe.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          res.json({
            reachablePublicly: true,
            status: 'ok',
            origin: normalized.origin,
            message:
              'Link publik aktif! Murid bisa langsung membuka ujian dari WhatsApp/browser tanpa login Google AI Studio.',
          });
          return;
        }
      }

      if (probe.status === 301 || probe.status === 302 || probe.status === 401 || probe.status === 403) {
        res.json({
          reachablePublicly: false,
          status: 'requires_auth',
          origin: normalized.origin,
          message:
            'Alamat ini masih meminta login Google / belum dibuka untuk umum. Saat Deploy, pastikan akses publik (Allow unauthenticated) diaktifkan.',
        });
        return;
      }

      if (probe.status === 404) {
        res.json({
          reachablePublicly: false,
          status: 'not_found',
          origin: normalized.origin,
          message:
            'Alamat belum aktif (404). Pastikan aplikasi sudah selesai di-Deploy terlebih dahulu.',
        });
        return;
      }

      res.json({
        reachablePublicly: false,
        status: 'error',
        origin: normalized.origin,
        message: `Server merespons status HTTP ${probe.status}. Periksa kembali URL hasil Deploy.`,
      });
    } catch {
      res.json({
        reachablePublicly: false,
        status: 'error',
        origin: normalized.origin,
        message: 'Tidak dapat menghubungi URL tersebut. Periksa penulisan domain dan koneksi.',
      });
    }
  });

  // --- Teacher Bitly Integration Endpoints ---
  app.get('/api/teacher/bitly/status', requireTeacherAuth, async (req, res) => {
    const envToken = (process.env.BITLY_ACCESS_TOKEN || '').trim();
    if (envToken && !db.bitly?.accessToken && !db.bitly?.login) {
      try {
        const profile = await fetchBitlyAccountProfile(envToken);
        db.bitly = {
          login: profile.login,
          name: profile.name,
          defaultGroupGuid: profile.defaultGroupGuid,
          domain: profile.domain,
          authMethod: 'env',
          connectedAt: new Date().toISOString(),
        };
        saveDb(db);
      } catch {
        // Keep status readable even if env token check temporarily fails
      }
    }
    res.json({
      status: buildPublicBitlyStatus(req),
      shortLinks: db.bitlyShortLinks || {},
    });
  });

  app.post('/api/teacher/bitly/connect-token', requireTeacherAuth, async (req, res) => {
    const rawToken = typeof req.body?.accessToken === 'string' ? req.body.accessToken.trim() : '';
    const envToken = (process.env.BITLY_ACCESS_TOKEN || '').trim();
    const tokenToUse = rawToken || envToken;

    if (!tokenToUse) {
      res.status(400).json({
        error: 'Masukkan Generic Access Token dari akun Bit.ly Anda terlebih dahulu.',
      });
      return;
    }

    try {
      const profile = await fetchBitlyAccountProfile(tokenToUse);
      db.bitly = {
        accessToken: rawToken || undefined,
        login: profile.login,
        name: profile.name,
        defaultGroupGuid: profile.defaultGroupGuid,
        domain: profile.domain,
        authMethod: rawToken ? 'token' : 'env',
        connectedAt: new Date().toISOString(),
      };
      saveDb(db);
      res.json({
        status: buildPublicBitlyStatus(req),
        shortLinks: db.bitlyShortLinks || {},
      });
    } catch (err) {
      res.status(400).json({
        error:
          err instanceof Error
            ? err.message
            : 'Gagal memverifikasi token Bit.ly. Periksa kembali token Anda.',
      });
    }
  });

  app.get('/api/teacher/bitly/oauth/url', requireTeacherAuth, (req, res) => {
    const clientId = (process.env.BITLY_CLIENT_ID || '').trim();
    const clientSecret = (process.env.BITLY_CLIENT_SECRET || '').trim();
    if (!clientId || !clientSecret) {
      res.status(400).json({
        error:
          'BITLY_CLIENT_ID dan BITLY_CLIENT_SECRET belum dikonfigurasi di Secrets. Anda tetap bisa menghubungkan Bit.ly secara instan menggunakan Access Token.',
        callbackUrl: getBitlyCallbackUrl(req),
      });
      return;
    }

    pruneBitlyOAuthStates();
    const state = crypto.randomBytes(24).toString('hex');
    const redirectUri = getBitlyCallbackUrl(req);
    pendingBitlyOAuthStates.set(state, {
      createdAt: Date.now(),
      redirectUri,
    });

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      state,
    });
    res.json({
      url: `https://bitly.com/oauth/authorize?${params.toString()}`,
      callbackUrl: redirectUri,
    });
  });

  const handleBitlyOAuthCallback = async (req: Request, res: Response) => {
    const renderPopupPage = (payload: { type: string; error?: string }, text: string) => {
      const safePayload = JSON.stringify(payload).replace(/</g, '\\u003c');
      const safeText = text.replace(/[<>&]/g, '');
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(`<!doctype html>
<html lang="id">
  <head><meta charset="utf-8"><title>Koneksi Bit.ly</title></head>
  <body style="font-family:system-ui,sans-serif;padding:24px;color:#0f172a;background:#f8fafc;">
    <p>${safeText}</p>
    <script>
      (function () {
        var payload = ${safePayload};
        if (window.opener) {
          window.opener.postMessage(payload, '*');
          window.close();
        } else {
          window.location.href = '/guru';
        }
      })();
    </script>
  </body>
</html>`);
    };

    const oauthError = typeof req.query.error === 'string' ? req.query.error : '';
    if (oauthError) {
      renderPopupPage(
        { type: 'BITLY_OAUTH_ERROR', error: 'Otorisasi Bit.ly dibatalkan oleh pengguna.' },
        'Otorisasi Bit.ly dibatalkan. Jendela ini akan tertutup otomatis.'
      );
      return;
    }

    const code = typeof req.query.code === 'string' ? req.query.code : '';
    const state = typeof req.query.state === 'string' ? req.query.state : '';
    pruneBitlyOAuthStates();
    const storedState = state ? pendingBitlyOAuthStates.get(state) : undefined;
    if (state) pendingBitlyOAuthStates.delete(state);

    if (!code || !storedState) {
      renderPopupPage(
        { type: 'BITLY_OAUTH_ERROR', error: 'Sesi otorisasi Bit.ly tidak valid atau kedaluwarsa.' },
        'Sesi otorisasi tidak valid. Silakan ulangi dari Portal Guru.'
      );
      return;
    }

    const clientId = (process.env.BITLY_CLIENT_ID || '').trim();
    const clientSecret = (process.env.BITLY_CLIENT_SECRET || '').trim();
    if (!clientId || !clientSecret) {
      renderPopupPage(
        { type: 'BITLY_OAUTH_ERROR', error: 'Konfigurasi OAuth Bit.ly di server belum lengkap.' },
        'Konfigurasi OAuth Bit.ly belum lengkap.'
      );
      return;
    }

    try {
      const formBody = new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: storedState.redirectUri,
      });

      const tokenRes = await fetch('https://api-ssl.bitly.com/oauth/access_token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
        },
        body: formBody.toString(),
        signal: AbortSignal.timeout(10000),
      });

      const rawText = await tokenRes.text();
      let accessToken = '';
      try {
        const parsedJson = JSON.parse(rawText) as { access_token?: string };
        accessToken = (parsedJson.access_token || '').trim();
      } catch {
        const parsedParams = new URLSearchParams(rawText);
        accessToken = (parsedParams.get('access_token') || '').trim();
      }

      if (!tokenRes.ok || !accessToken) {
        renderPopupPage(
          { type: 'BITLY_OAUTH_ERROR', error: 'Gagal menukar kode OAuth dengan token Bit.ly.' },
          'Gagal menukar kode OAuth Bit.ly. Silakan coba lagi.'
        );
        return;
      }

      const profile = await fetchBitlyAccountProfile(accessToken);
      db.bitly = {
        accessToken,
        login: profile.login,
        name: profile.name,
        defaultGroupGuid: profile.defaultGroupGuid,
        domain: profile.domain,
        authMethod: 'oauth',
        connectedAt: new Date().toISOString(),
      };
      saveDb(db);

      renderPopupPage(
        { type: 'BITLY_OAUTH_SUCCESS' },
        'Akun Bit.ly berhasil terhubung! Jendela ini akan tertutup otomatis.'
      );
    } catch {
      renderPopupPage(
        { type: 'BITLY_OAUTH_ERROR', error: 'Terjadi kesalahan saat menghubungkan Bit.ly.' },
        'Terjadi kesalahan koneksi ke Bit.ly.'
      );
    }
  };

  app.get(['/api/bitly/callback', '/api/bitly/callback/'], handleBitlyOAuthCallback);

  app.post('/api/teacher/bitly/shorten', requireTeacherAuth, async (req, res) => {
    const token = getActiveBitlyToken();
    if (!token) {
      res.status(400).json({
        error: 'Akun Bit.ly belum terhubung. Hubungkan akun Bit.ly Anda terlebih dahulu.',
      });
      return;
    }

    const rawTargetKey = typeof req.body?.targetKey === 'string' ? req.body.targetKey.trim() : '';
    const targetKey = rawTargetKey.replace(/[^a-zA-Z0-9_-]+/g, '-').slice(0, 64);
    const rawLongUrl = typeof req.body?.longUrl === 'string' ? req.body.longUrl : '';
    const rawCustomSlug = typeof req.body?.customSlug === 'string' ? req.body.customSlug : '';

    if (!targetKey) {
      res.status(400).json({ error: 'Target paket ujian tidak valid.' });
      return;
    }

    const urlValidation = validateLongUrlForBitly(rawLongUrl);
    if (!urlValidation.ok) {
      res.status(400).json({ error: urlValidation.error });
      return;
    }

    try {
      let groupGuid = db.bitly?.defaultGroupGuid;
      if (!groupGuid) {
        try {
          const profile = await fetchBitlyAccountProfile(token);
          groupGuid = profile.defaultGroupGuid;
          db.bitly = {
            ...(db.bitly || {}),
            login: profile.login,
            name: profile.name,
            defaultGroupGuid: profile.defaultGroupGuid,
            domain: profile.domain,
          };
          saveDb(db);
        } catch {
          // Proceed without group_guid if Bitly allows default group inference
        }
      }

      const domain = db.bitly?.domain || 'bit.ly';
      const shortenBody: Record<string, string> = {
        long_url: urlValidation.url,
        domain,
      };
      if (groupGuid) {
        shortenBody.group_guid = groupGuid;
      }

      const shortenRes = await fetch('https://api-ssl.bitly.com/v4/shorten', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(shortenBody),
        signal: AbortSignal.timeout(10000),
      });

      const shortenData = (await shortenRes.json().catch(() => ({}))) as {
        id?: string;
        link?: string;
        long_url?: string;
      };

      if (!shortenRes.ok || !shortenData.link || !shortenData.id) {
        res.status(shortenRes.status >= 400 ? shortenRes.status : 400).json({
          error: translateBitlyError(shortenRes.status, shortenData),
        });
        return;
      }

      let finalShortUrl = shortenData.link;
      let finalBitlinkId = shortenData.id;
      let appliedCustomSlug: string | undefined;
      let warning = '';

      const cleanSlug = normalizeCustomBackHalf(rawCustomSlug);
      if (cleanSlug) {
        const customBitlink = `${domain}/${cleanSlug}`;
        const customRes = await fetch('https://api-ssl.bitly.com/v4/custom_bitlinks', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            custom_bitlink: customBitlink,
            bitlink_id: shortenData.id,
          }),
          signal: AbortSignal.timeout(10000),
        });
        const customData = (await customRes.json().catch(() => ({}))) as {
          custom_bitlink?: string;
        };
        if (customRes.ok && customData.custom_bitlink) {
          finalShortUrl = `https://${customData.custom_bitlink}`;
          finalBitlinkId = customData.custom_bitlink;
          appliedCustomSlug = cleanSlug;
        } else {
          warning = `Link pendek ${shortenData.link} berhasil dibuat, namun nama khusus "${cleanSlug}" tidak dapat diterapkan (${translateBitlyError(customRes.status, customData)}).`;
        }
      }

      const record: BitlyShortLinkRecord = {
        targetKey,
        shortUrl: finalShortUrl,
        longUrl: urlValidation.url,
        bitlinkId: finalBitlinkId,
        customSlug: appliedCustomSlug,
        createdAt: new Date().toISOString(),
      };

      if (!db.bitlyShortLinks) {
        db.bitlyShortLinks = {};
      }
      db.bitlyShortLinks[targetKey] = record;
      saveDb(db);

      res.json({
        shortLink: record,
        shortLinks: db.bitlyShortLinks,
        warning: warning || undefined,
      });
    } catch {
      res.status(502).json({
        error: 'Gagal menghubungi server Bit.ly. Periksa koneksi internet server dan coba lagi.',
      });
    }
  });

  app.delete('/api/teacher/bitly/disconnect', requireTeacherAuth, (req, res) => {
    db.bitly = undefined;
    saveDb(db);
    res.json({ status: buildPublicBitlyStatus(req) });
  });

  app.delete('/api/teacher/bitly/links/:targetKey', requireTeacherAuth, (req, res) => {
    const targetKey = req.params.targetKey;
    if (db.bitlyShortLinks && targetKey in db.bitlyShortLinks) {
      delete db.bitlyShortLinks[targetKey];
      saveDb(db);
    }
    res.json({ shortLinks: db.bitlyShortLinks || {} });
  });

  // --- Teacher Questions CRUD ---
  app.get('/api/teacher/questions', requireTeacherAuth, (req, res) => {
    const subject = typeof req.query.subject === 'string' ? req.query.subject : '';
    const type = typeof req.query.type === 'string' ? req.query.type : '';
    const search = typeof req.query.search === 'string' ? req.query.search.toLowerCase() : '';

    const filtered = db.questions.filter((q) => {
      if (subject && subject !== 'Semua' && q.subject !== subject) return false;
      if (type && type !== 'Semua' && q.type !== type) return false;
      if (search && !q.prompt.toLowerCase().includes(search)) return false;
      return true;
    });

    res.json({ questions: filtered, totalCount: db.questions.length });
  });

  app.get('/api/teacher/questions/word-template', requireTeacherAuth, async (_req, res) => {
    try {
      const buffer = await buildSampleWordTemplateBuffer();
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      );
      res.setHeader(
        'Content-Disposition',
        'attachment; filename="template-bank-soal-tka-sd.docx"'
      );
      res.send(buffer);
    } catch {
      res.status(500).json({ error: 'Gagal membuat file template Word.' });
    }
  });

  app.post(
    '/api/teacher/questions/parse-word',
    requireTeacherAuth,
    (req, res, next) => {
      wordUpload.single('file')(req, res, (err) => {
        if (err) {
          res.status(400).json({ error: 'File terlalu besar (maksimal 10 MB) atau gagal dibaca.' });
          return;
        }
        next();
      });
    },
    async (req, res) => {
      if (!req.file) {
        res.status(400).json({ error: 'Pilih file Word (.docx) terlebih dahulu.' });
        return;
      }
      const ext = path.extname(req.file.originalname || '').toLowerCase();
      if (ext === '.doc') {
        res.status(400).json({
          error:
            'Format .doc lama belum didukung langsung. Silakan simpan ulang file di Microsoft Word sebagai format .docx lalu unggah kembali.',
        });
        return;
      }
      if (ext !== '.docx') {
        res.status(400).json({
          error: 'Hanya file Microsoft Word berformat .docx yang didukung.',
        });
        return;
      }

      const defaultSubject =
        typeof req.body?.subject === 'string' && req.body.subject.trim()
          ? req.body.subject.trim()
          : 'IPAS';

      try {
        const [htmlRes, textRes] = await Promise.all([
          mammoth.convertToHtml({ buffer: req.file.buffer }),
          mammoth.extractRawText({ buffer: req.file.buffer }),
        ]);

        const parsed = parseWordHtmlToQuestions({
          html: htmlRes.value,
          rawText: textRes.value,
          defaultSubject,
        });

        if (parsed.length === 0) {
          res.status(422).json({
            error:
              'Tidak ditemukan butir soal bernomor di dalam file Word. Pastikan soal diberi nomor (misal 1., 2., 3.) dan opsi A., B., C., D.',
          });
          return;
        }

        res.json({
          questions: parsed,
          fileName: req.file.originalname,
        });
      } catch {
        res.status(400).json({
          error:
            'File .docx tidak dapat dibaca atau rusak. Pastikan file berasal dari Microsoft Word / Google Docs (.docx).',
        });
      }
    }
  );

  app.post('/api/teacher/questions/bulk', requireTeacherAuth, (req, res) => {
    const body = req.body as {
      subject?: string;
      questions?: Array<Partial<Question>>;
    };

    if (!Array.isArray(body.questions) || body.questions.length === 0) {
      res.status(400).json({ error: 'Tidak ada soal yang dipilih untuk disimpan.' });
      return;
    }

    const validTypes: QuestionType[] = [
      'pg',
      'pg_kompleks',
      'benar_salah',
      'isian_singkat',
      'uraian',
    ];
    const defaultSubject = body.subject?.trim() || 'IPAS';
    const created: Question[] = [];

    for (const item of body.questions) {
      if (!item.prompt?.trim()) continue;
      const qType: QuestionType =
        item.type && validTypes.includes(item.type) ? item.type : 'pg';

      const newQ: Question = {
        id: `word-${crypto.randomBytes(4).toString('hex')}`,
        subject: item.subject?.trim() || defaultSubject,
        type: qType,
        prompt: item.prompt.trim(),
        passage: item.passage?.trim() || undefined,
        tableData: item.tableData,
        options: item.options,
        correctAnswer:
          item.correctAnswer ?? (qType === 'pg_kompleks' ? ['A'] : qType === 'pg' ? 'A' : ''),
        rubric: item.rubric?.trim() || undefined,
        maxScore:
          typeof item.maxScore === 'number' && item.maxScore > 0
            ? item.maxScore
            : qType === 'uraian'
              ? 4
              : 1,
        weight: typeof item.weight === 'number' && item.weight > 0 ? item.weight : 1,
        sourceTag: 'Upload Word',
        createdAt: new Date().toISOString(),
      };
      created.push(newQ);
    }

    if (created.length === 0) {
      res.status(400).json({ error: 'Semua soal kosong atau tidak valid.' });
      return;
    }

    db.questions.unshift(...created);
    saveDb(db);
    res.status(201).json({ insertedCount: created.length, questions: created });
  });

  app.post('/api/teacher/questions', requireTeacherAuth, (req, res) => {
    const body = req.body as Partial<Question>;
    if (!body.subject?.trim() || !body.type || !body.prompt?.trim()) {
      res.status(400).json({ error: 'Mata pelajaran, bentuk soal, dan pertanyaan wajib diisi.' });
      return;
    }

    const validTypes: QuestionType[] = ['pg', 'pg_kompleks', 'benar_salah', 'isian_singkat', 'uraian'];
    if (!validTypes.includes(body.type)) {
      res.status(400).json({ error: 'Bentuk soal tidak valid.' });
      return;
    }

    const id = `guru-${crypto.randomBytes(4).toString('hex')}`;
    const newQuestion: Question = {
      id,
      subject: body.subject.trim(),
      type: body.type,
      prompt: body.prompt.trim(),
      passage: body.passage?.trim() || undefined,
      tableData: body.tableData,
      diagramId: body.diagramId?.trim() || undefined,
      options: body.options,
      correctAnswer: body.correctAnswer ?? (body.type === 'pg_kompleks' ? ['A'] : ''),
      rubric: body.rubric?.trim() || undefined,
      maxScore:
        typeof body.maxScore === 'number' && body.maxScore > 0
          ? body.maxScore
          : body.type === 'uraian'
            ? 4
            : 1,
      weight: typeof body.weight === 'number' && body.weight > 0 ? body.weight : 1,
      sourceTag: 'Soal Guru',
      createdAt: new Date().toISOString(),
    };

    db.questions.unshift(newQuestion);
    saveDb(db);
    res.status(201).json({ question: newQuestion });
  });

  app.put('/api/teacher/questions/:id', requireTeacherAuth, (req, res) => {
    const { id } = req.params;
    const idx = db.questions.findIndex((q) => q.id === id);
    if (idx === -1) {
      res.status(404).json({ error: 'Soal tidak ditemukan.' });
      return;
    }
    const existing = db.questions[idx];
    const body = req.body as Partial<Question>;

    const updated: Question = {
      ...existing,
      subject: body.subject?.trim() || existing.subject,
      type: body.type || existing.type,
      prompt: body.prompt?.trim() || existing.prompt,
      passage: body.passage !== undefined ? body.passage.trim() || undefined : existing.passage,
      tableData: body.tableData !== undefined ? body.tableData : existing.tableData,
      diagramId: body.diagramId !== undefined ? body.diagramId.trim() || undefined : existing.diagramId,
      options: body.options !== undefined ? body.options : existing.options,
      correctAnswer: body.correctAnswer !== undefined ? body.correctAnswer : existing.correctAnswer,
      rubric: body.rubric !== undefined ? body.rubric.trim() || undefined : existing.rubric,
      maxScore:
        typeof body.maxScore === 'number' && body.maxScore > 0
          ? body.maxScore
          : existing.maxScore,
      weight:
        typeof body.weight === 'number' && body.weight > 0
          ? body.weight
          : existing.weight ?? 1,
    };

    db.questions[idx] = updated;
    // Recalculate scores on submissions referencing this question so edited keys, weights, and maxScores stay accurate
    recalculateSubmissionsForExam();
    saveDb(db);
    res.json({ question: updated });
  });

  app.delete('/api/teacher/questions/:id', requireTeacherAuth, (req, res) => {
    const { id } = req.params;
    const before = db.questions.length;
    db.questions = db.questions.filter((q) => q.id !== id);
    if (db.questions.length === before) {
      res.status(404).json({ error: 'Soal tidak ditemukan.' });
      return;
    }
    for (const exam of db.exams) {
      exam.questionIds = exam.questionIds.filter((qid) => qid !== id);
    }
    saveDb(db);
    res.json({ ok: true });
  });

  // --- Teacher Exams CRUD ---
  app.get('/api/teacher/exams', requireTeacherAuth, (_req, res) => {
    res.json({ exams: db.exams });
  });

  app.post('/api/teacher/exams', requireTeacherAuth, (req, res) => {
    const body = req.body as Partial<ExamPackage>;
    if (!body.title?.trim() || !body.subject?.trim()) {
      res.status(400).json({ error: 'Judul paket dan mata pelajaran wajib diisi.' });
      return;
    }

    const selectionMode = body.selectionMode === 'manual' ? 'manual' : 'auto';
    const countsByType: CountsByType = {
      pg: Number(body.countsByType?.pg ?? 0),
      pg_kompleks: Number(body.countsByType?.pg_kompleks ?? 0),
      benar_salah: Number(body.countsByType?.benar_salah ?? 0),
      isian_singkat: Number(body.countsByType?.isian_singkat ?? 0),
      uraian: Number(body.countsByType?.uraian ?? 0),
    };

    const questionIds = selectQuestionsForExam({
      allQuestions: db.questions,
      subject: body.subject.trim(),
      selectionMode,
      countsByType,
      manualQuestionIds: Array.isArray(body.questionIds) ? body.questionIds : [],
      shuffle: Boolean(body.shuffleQuestions),
    });

    if (questionIds.length === 0) {
      res.status(400).json({
        error: 'Tidak ada soal yang cocok dengan pilihan mata pelajaran dan bentuk soal tersebut.',
      });
      return;
    }

    const qMap = new Map(db.questions.map((q) => [q.id, q]));
    const resolvedQuestions = questionIds
      .map((qid) => qMap.get(qid))
      .filter((q): q is Question => Boolean(q));

    const requestedShareCode = body.shareCode
      ? body.shareCode.trim().toUpperCase().replace(/[^A-Z0-9-]+/g, '-')
      : generateShareCode(body.subject.trim());

    const duplicateCode = db.exams.some((e) => e.shareCode === requestedShareCode);
    const shareCode = duplicateCode ? generateShareCode(body.subject.trim()) : requestedShareCode;

    const scoringMode: ScoringMode =
      body.scoringMode === 'total_points' ? 'total_points' : 'weighted_split';
    const objectiveWeightPercent =
      typeof body.objectiveWeightPercent === 'number' && body.objectiveWeightPercent >= 0
        ? body.objectiveWeightPercent
        : 60;
    const essayWeightPercent =
      typeof body.essayWeightPercent === 'number' && body.essayWeightPercent >= 0
        ? body.essayWeightPercent
        : 40;

    const now = new Date().toISOString();
    const newExam: ExamPackage = {
      id: `exam-${crypto.randomBytes(4).toString('hex')}`,
      shareCode,
      title: body.title.trim(),
      subject: body.subject.trim(),
      assessmentType: body.assessmentType || 'Latihan Harian',
      gradeLevel: body.gradeLevel?.trim() || 'V (Lima) / Fase C',
      academicYear: body.academicYear?.trim() || '2026/2027',
      schoolName: body.schoolName?.trim() || db.teacherAuth.schoolName,
      durationMinutes: Math.max(5, Math.min(180, Number(body.durationMinutes || 60))),
      token: body.token?.trim().toUpperCase() || '',
      isActive: body.isActive !== false,
      showResultsToStudent: body.showResultsToStudent !== false,
      shuffleQuestions: Boolean(body.shuffleQuestions),
      shuffleOptions: Boolean(body.shuffleOptions),
      selectionMode,
      countsByType: computeCountsFromQuestions(resolvedQuestions),
      questionIds,
      scoringMode,
      objectiveWeightPercent,
      essayWeightPercent,
      instructions:
        Array.isArray(body.instructions) && body.instructions.length > 0
          ? body.instructions
          : [
              'Berdoalah sebelum mulai mengerjakan soal.',
              'Pastikan nama lengkap dan kelas sudah terisi dengan benar.',
              'Bacalah setiap soal dengan cermat sebelum menjawab.',
              'Periksa kembali seluruh jawaban sebelum mengumpulkan.',
            ],
      createdAt: now,
      updatedAt: now,
    };

    db.exams.unshift(newExam);
    saveDb(db);
    res.status(201).json({ exam: newExam });
  });

  app.put('/api/teacher/exams/:id', requireTeacherAuth, (req, res) => {
    const { id } = req.params;
    const idx = db.exams.findIndex((e) => e.id === id);
    if (idx === -1) {
      res.status(404).json({ error: 'Paket ujian tidak ditemukan.' });
      return;
    }
    const existing = db.exams[idx];
    const body = req.body as Partial<ExamPackage>;

    const selectionMode = body.selectionMode ?? existing.selectionMode;
    const subject = body.subject?.trim() || existing.subject;
    const countsByType = body.countsByType ?? existing.countsByType;

    let questionIds = existing.questionIds;
    if (
      body.selectionMode !== undefined ||
      body.countsByType !== undefined ||
      body.questionIds !== undefined ||
      body.subject !== undefined
    ) {
      questionIds = selectQuestionsForExam({
        allQuestions: db.questions,
        subject,
        selectionMode,
        countsByType,
        manualQuestionIds: body.questionIds ?? existing.questionIds,
        shuffle: body.shuffleQuestions ?? existing.shuffleQuestions,
      });
    }

    const qMap = new Map(db.questions.map((q) => [q.id, q]));
    const resolvedQuestions = questionIds
      .map((qid) => qMap.get(qid))
      .filter((q): q is Question => Boolean(q));

    const updated: ExamPackage = {
      ...existing,
      title: body.title?.trim() || existing.title,
      subject,
      assessmentType: body.assessmentType ?? existing.assessmentType,
      gradeLevel: body.gradeLevel?.trim() || existing.gradeLevel,
      academicYear: body.academicYear?.trim() || existing.academicYear,
      schoolName: body.schoolName?.trim() || existing.schoolName,
      durationMinutes:
        body.durationMinutes !== undefined
          ? Math.max(5, Math.min(180, Number(body.durationMinutes)))
          : existing.durationMinutes,
      token: body.token !== undefined ? body.token.trim().toUpperCase() : existing.token,
      isActive: body.isActive !== undefined ? body.isActive : existing.isActive,
      showResultsToStudent:
        body.showResultsToStudent !== undefined
          ? body.showResultsToStudent
          : existing.showResultsToStudent,
      shuffleQuestions:
        body.shuffleQuestions !== undefined
          ? body.shuffleQuestions
          : existing.shuffleQuestions,
      shuffleOptions:
        body.shuffleOptions !== undefined ? body.shuffleOptions : existing.shuffleOptions,
      selectionMode,
      countsByType: computeCountsFromQuestions(resolvedQuestions),
      questionIds,
      scoringMode: body.scoringMode ?? existing.scoringMode ?? 'weighted_split',
      objectiveWeightPercent:
        typeof body.objectiveWeightPercent === 'number'
          ? Math.max(0, body.objectiveWeightPercent)
          : existing.objectiveWeightPercent ?? 60,
      essayWeightPercent:
        typeof body.essayWeightPercent === 'number'
          ? Math.max(0, body.essayWeightPercent)
          : existing.essayWeightPercent ?? 40,
      updatedAt: new Date().toISOString(),
    };

    db.exams[idx] = updated;
    recalculateSubmissionsForExam(updated.id);
    saveDb(db);
    res.json({ exam: updated });
  });

  app.delete('/api/teacher/exams/:id', requireTeacherAuth, (req, res) => {
    const { id } = req.params;
    const before = db.exams.length;
    db.exams = db.exams.filter((e) => e.id !== id);
    if (db.exams.length === before) {
      res.status(404).json({ error: 'Paket ujian tidak ditemukan.' });
      return;
    }
    saveDb(db);
    res.json({ ok: true });
  });

  // --- Teacher Submissions & Essay Grading ---
  app.get('/api/teacher/submissions', requireTeacherAuth, (req, res) => {
    const examId = typeof req.query.examId === 'string' ? req.query.examId : '';
    const filtered = db.submissions.filter((s) => (!examId || examId === 'Semua' ? true : s.examId === examId));
    res.json({ submissions: filtered });
  });

  app.get('/api/teacher/submissions/:id', requireTeacherAuth, (req, res) => {
    const sub = db.submissions.find((s) => s.id === req.params.id);
    if (!sub) {
      res.status(404).json({ error: 'Data jawaban siswa tidak ditemukan.' });
      return;
    }
    const exam = db.exams.find((e) => e.id === sub.examId);
    const questions = exam ? resolveExamQuestions(exam) : [];
    const reviews = buildReviewItems(questions, sub, true);
    res.json({ submission: sub, reviews });
  });

  app.patch('/api/teacher/submissions/:id/grade', requireTeacherAuth, (req, res) => {
    const idx = db.submissions.findIndex((s) => s.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ error: 'Data jawaban siswa tidak ditemukan.' });
      return;
    }
    const sub = db.submissions[idx];
    const { essayScores, teacherNote } = req.body as {
      essayScores?: Record<string, number>;
      teacherNote?: string;
    };

    const exam = db.exams.find((e) => e.id === sub.examId);
    const questions = exam
      ? resolveExamQuestions(exam)
      : db.questions.filter((q) => q.id in sub.answers);

    const mergedEssayScores = {
      ...sub.essayScores,
      ...(essayScores || {}),
    };

    const recomputed = computeSubmissionScores({
      questions,
      answers: sub.answers,
      essayScores: mergedEssayScores,
      scoringConfig: getExamScoringConfig(exam),
    });

    const updated: StudentSubmission = {
      ...sub,
      essayScores: mergedEssayScores,
      objectiveCorrectCount: recomputed.objectiveCorrectCount,
      objectiveTotalCount: recomputed.objectiveTotalCount,
      objectiveScore: recomputed.objectiveScore,
      essayTotalCount: recomputed.essayTotalCount,
      essayScore: recomputed.essayScore,
      finalScore: recomputed.finalScore,
      gradingStatus: recomputed.gradingStatus,
      teacherNote: teacherNote !== undefined ? teacherNote : sub.teacherNote,
    };

    db.submissions[idx] = updated;
    saveDb(db);

    const reviews = buildReviewItems(questions, updated, true);
    res.json({ submission: updated, reviews });
  });

  app.delete('/api/teacher/submissions/:id', requireTeacherAuth, (req, res) => {
    const before = db.submissions.length;
    db.submissions = db.submissions.filter((s) => s.id !== req.params.id);
    if (db.submissions.length === before) {
      res.status(404).json({ error: 'Data jawaban tidak ditemukan.' });
      return;
    }
    saveDb(db);
    res.json({ ok: true });
  });

  app.get('/api/teacher/item-analysis/:examId', requireTeacherAuth, (req, res) => {
    const exam = db.exams.find((e) => e.id === req.params.examId);
    if (!exam) {
      res.status(404).json({ error: 'Paket ujian tidak ditemukan.' });
      return;
    }
    const questions = resolveExamQuestions(exam);
    const analysis = buildExamItemAnalysis({
      exam,
      questions,
      submissions: db.submissions,
    });
    res.json({ analysis });
  });

  // --- Student Public Endpoints (NO teacher data, NO answer keys exposed!) ---
  app.get('/api/student/exams', (_req, res) => {
    const summaries = db.exams
      .filter((e) => e.isActive)
      .map((e) => buildStudentExamSummary(e, resolveExamQuestions(e)));
    res.json({ exams: summaries });
  });

  app.get('/api/student/exams/:code', (req, res) => {
    const code = req.params.code.trim().toUpperCase();
    const exam = db.exams.find(
      (e) => e.shareCode.toUpperCase() === code || e.id.toUpperCase() === code
    );
    if (!exam || !exam.isActive) {
      res.status(404).json({ error: 'Paket ujian tidak ditemukan atau sudah dinonaktifkan guru.' });
      return;
    }

    const summary = buildStudentExamSummary(exam, resolveExamQuestions(exam));
    res.json({ exam: summary });
  });

  app.post('/api/student/exams/:code/start', (req, res) => {
    const code = req.params.code.trim().toUpperCase();
    const { studentName, studentClass, studentAbsen, token } = req.body as {
      studentName?: string;
      studentClass?: string;
      studentAbsen?: string;
      token?: string;
    };

    const exam = db.exams.find(
      (e) => e.shareCode.toUpperCase() === code || e.id.toUpperCase() === code
    );
    if (!exam || !exam.isActive) {
      res.status(404).json({ error: 'Paket ujian tidak ditemukan atau sudah dinonaktifkan guru.' });
      return;
    }

    if (!studentName?.trim() || !studentClass?.trim()) {
      res.status(400).json({ error: 'Nama lengkap dan kelas wajib diisi.' });
      return;
    }

    if (exam.token && exam.token.trim().length > 0) {
      if (!token || token.trim().toUpperCase() !== exam.token.trim().toUpperCase()) {
        res.status(403).json({ error: 'Token ujian tidak sesuai. Periksa kembali token dari guru.' });
        return;
      }
    }

    let questions = resolveExamQuestions(exam);
    if (exam.shuffleQuestions) {
      questions = [...questions].sort(() => Math.random() - 0.5);
    }

    const summary = buildStudentExamSummary(exam, questions);
    const sanitized = sanitizeQuestionsForStudent(questions, exam.shuffleOptions);

    res.json({
      exam: summary,
      questions: sanitized,
      student: {
        studentName: studentName.trim(),
        studentClass: studentClass.trim(),
        studentAbsen: studentAbsen?.trim() || '-',
      },
      startedAt: new Date().toISOString(),
    });
  });

  app.post('/api/student/submissions', (req, res) => {
    const body = req.body as {
      examCode?: string;
      studentName?: string;
      studentClass?: string;
      studentAbsen?: string;
      answers?: Record<string, StudentAnswerValue>;
      flaggedQuestionIds?: string[];
      questionOrderIds?: string[];
      startedAt?: string;
      durationUsedSeconds?: number;
    };

    if (!body.examCode || !body.studentName?.trim() || !body.studentClass?.trim()) {
      res.status(400).json({ error: 'Data peserta dan kode ujian wajib dilengkapi.' });
      return;
    }

    const code = body.examCode.trim().toUpperCase();
    const exam = db.exams.find(
      (e) => e.shareCode.toUpperCase() === code || e.id.toUpperCase() === code
    );
    if (!exam) {
      res.status(404).json({ error: 'Paket ujian tidak ditemukan.' });
      return;
    }

    let questions = resolveExamQuestions(exam);
    if (Array.isArray(body.questionOrderIds) && body.questionOrderIds.length > 0) {
      const qMap = new Map(questions.map((q) => [q.id, q]));
      const ordered = body.questionOrderIds
        .map((qid) => qMap.get(qid))
        .filter((q): q is Question => Boolean(q));
      if (ordered.length > 0) {
        questions = ordered;
      }
    }

    const answers = body.answers || {};
    const scored = computeSubmissionScores({
      questions,
      answers,
      scoringConfig: getExamScoringConfig(exam),
    });

    const submission: StudentSubmission = {
      id: `sub-${crypto.randomBytes(5).toString('hex')}`,
      examId: exam.id,
      examCode: exam.shareCode,
      examTitle: exam.title,
      subject: exam.subject,
      studentName: body.studentName.trim(),
      studentClass: body.studentClass.trim(),
      studentAbsen: body.studentAbsen?.trim() || '-',
      answers,
      flaggedQuestionIds: Array.isArray(body.flaggedQuestionIds) ? body.flaggedQuestionIds : [],
      startedAt: body.startedAt || new Date().toISOString(),
      submittedAt: new Date().toISOString(),
      durationUsedSeconds: Math.max(0, Number(body.durationUsedSeconds || 0)),
      objectiveCorrectCount: scored.objectiveCorrectCount,
      objectiveTotalCount: scored.objectiveTotalCount,
      objectiveScore: scored.objectiveScore,
      essayScores: {},
      essayTotalCount: scored.essayTotalCount,
      essayScore: scored.essayScore,
      finalScore: scored.finalScore,
      gradingStatus: scored.gradingStatus,
    };

    db.submissions.unshift(submission);
    saveDb(db);

    const reviews = exam.showResultsToStudent
      ? buildReviewItems(questions, submission, true)
      : undefined;

    res.status(201).json({
      submission,
      showResults: exam.showResultsToStudent,
      reviews,
    });
  });

  const httpServer = http.createServer(app);

  // --- Vite / Static Serving ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR === 'true' ? false : { server: httpServer },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.get('/manifest.webmanifest', (_req, res) => {
      res.setHeader('Content-Type', 'application/manifest+json; charset=utf-8');
      res.sendFile(path.join(distPath, 'manifest.webmanifest'));
    });
    app.get('/sw.js', (_req, res) => {
      res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Service-Worker-Allowed', '/');
      res.sendFile(path.join(distPath, 'sw.js'));
    });
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`TKA ASAS SD server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
