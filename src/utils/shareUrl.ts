export type OriginKind = 'ai_studio_dev' | 'ai_studio_shared' | 'localhost' | 'public';

export function classifyOrigin(originOrUrl: string): OriginKind {
  try {
    const parsed = new URL(originOrUrl);
    const host = parsed.hostname.toLowerCase();
    if (host.startsWith('ais-dev-')) return 'ai_studio_dev';
    if (host.startsWith('ais-pre-')) return 'ai_studio_shared';
    if (host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0') {
      return 'localhost';
    }
    return 'public';
  } catch {
    return 'public';
  }
}

export function normalizePublicBaseUrl(
  rawInput: string
): { ok: true; origin: string } | { ok: false; error: string } {
  const trimmed = rawInput.trim();
  if (!trimmed) {
    return { ok: true, origin: '' };
  }

  if (/^(javascript|data|vbscript|file):/i.test(trimmed)) {
    return { ok: false, error: 'Format URL tidak valid.' };
  }

  const withProtocol = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : trimmed.startsWith('localhost') || trimmed.startsWith('127.0.0.1')
    ? `http://${trimmed}`
    : `https://${trimmed}`;

  try {
    const parsed = new URL(withProtocol);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return { ok: false, error: 'URL harus menggunakan protokol https://.' };
    }
    if (!parsed.hostname || !parsed.hostname.includes('.') && parsed.hostname !== 'localhost') {
      return { ok: false, error: 'Masukkan alamat domain lengkap yang valid (contoh: https://aplikasi.run.app).' };
    }
    return { ok: true, origin: `${parsed.protocol}//${parsed.host}` };
  } catch {
    return { ok: false, error: 'Format URL tidak valid. Contoh: https://nama-app.run.app' };
  }
}

export function resolveStudentShareBaseUrl(params: {
  configuredPublicUrl?: string | null;
  currentOrigin: string;
}): {
  baseUrl: string;
  originKind: OriginKind;
  usesCustomPublicUrl: boolean;
} {
  const configured = (params.configuredPublicUrl || '').trim();
  if (configured) {
    const normalized = normalizePublicBaseUrl(configured);
    if (normalized.ok && normalized.origin) {
      return {
        baseUrl: normalized.origin,
        originKind: classifyOrigin(normalized.origin),
        usesCustomPublicUrl: true,
      };
    }
  }

  const cleanOrigin = params.currentOrigin.replace(/\/+$/, '');
  return {
    baseUrl: cleanOrigin,
    originKind: classifyOrigin(cleanOrigin),
    usesCustomPublicUrl: false,
  };
}

export function buildStudentExamUrl(baseUrl: string, shareCode: string): string {
  const cleanBase = baseUrl.replace(/\/+$/, '');
  return `${cleanBase}/ujian/${encodeURIComponent(shareCode.trim())}`;
}

export function buildStudentCatalogUrl(baseUrl: string): string {
  const cleanBase = baseUrl.replace(/\/+$/, '');
  return `${cleanBase}/mulai`;
}

export function buildWhatsAppShareMessage(
  exam: {
    title: string;
    subject: string;
    questionCount: number;
    durationMinutes: number;
    token?: string;
  },
  shareUrl: string
): string {
  const tokenLine = exam.token?.trim()
    ? `\nToken Ujian: *${exam.token.trim()}*`
    : '';
  return (
    `Assalamu'alaikum / Selamat pagi anak-anak Kelas V.\n` +
    `Silakan kerjakan latihan *${exam.title}* (${exam.subject}, ${exam.questionCount} soal, waktu ${exam.durationMinutes} menit) langsung melalui link berikut:\n` +
    `${shareUrl}${tokenLine}\n` +
    `Selamat mengerjakan dengan jujur dan teliti!`
  );
}
