import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  BookOpen,
  Check,
  ClipboardList,
  Copy,
  Download,
  FileSpreadsheet,
  Globe,
  KeyRound,
  Link2,
  LogOut,
  Plus,
  QrCode,
  Search,
  Settings,
  Share2,
  ShieldCheck,
  Trash2,
  Edit3,
  ArrowLeft,
  Upload,
} from 'lucide-react';
import type {
  ExamPackage,
  Question,
  QuestionType,
  StudentSubmission,
} from '../types/exam';
import {
  getQuestionMaxScore,
  getQuestionWeight,
  QUESTION_TYPE_LABELS,
} from '../utils/examScoring';
import {
  buildStudentCatalogUrl,
  buildStudentExamUrl,
  buildWhatsAppShareMessage,
  classifyOrigin,
  normalizePublicBaseUrl,
  resolveStudentShareBaseUrl,
} from '../utils/shareUrl';
import { STANDARD_SUBJECTS } from '../data/subjects';
import { TeacherQuestionModal } from './TeacherQuestionModal';
import { TeacherExamModal } from './TeacherExamModal';
import { TeacherGradingModal } from './TeacherGradingModal';
import { TeacherWordImportModal } from './TeacherWordImportModal';
import { TeacherItemAnalysisTab } from './TeacherItemAnalysisTab';
import { TeacherQrModal } from './TeacherQrModal';
import { PWAInstallButton } from './PWAInstallButton';

interface TeacherPortalProps {
  onBackToHome: () => void;
}

type TeacherTab = 'exams' | 'questions' | 'submissions' | 'analysis' | 'settings';

const TOKEN_STORAGE_KEY = 'tka_guru_token';

export const TeacherPortal: React.FC<TeacherPortalProps> = ({ onBackToHome }) => {
  const [authToken, setAuthToken] = useState<string>(
    () => window.sessionStorage.getItem(TOKEN_STORAGE_KEY) || ''
  );
  const [authChecked, setAuthChecked] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [teacherName, setTeacherName] = useState('Guru Kelas V');
  const [schoolName, setSchoolName] = useState('UPT SDN 2 Makale Selatan');

  // Login form state
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  // Portal workspace state
  const [activeTab, setActiveTab] = useState<TeacherTab>('exams');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [exams, setExams] = useState<ExamPackage[]>([]);
  const [submissions, setSubmissions] = useState<StudentSubmission[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Filters
  const [subjectFilter, setSubjectFilter] = useState('Semua');
  const [typeFilter, setTypeFilter] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [submissionExamFilter, setSubmissionExamFilter] = useState('Semua');
  const [submissionSearch, setSubmissionSearch] = useState('');

  // Modals & notifications
  const [questionModalOpen, setQuestionModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [wordImportOpen, setWordImportOpen] = useState(false);
  const [examModalOpen, setExamModalOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<ExamPackage | null>(null);
  const [gradingSubmissionId, setGradingSubmissionId] = useState<string | null>(null);
  const [analysisExamId, setAnalysisExamId] = useState<string>('');
  const [inlineWeights, setInlineWeights] = useState<
    Record<string, { maxScore: number; weight: number }>
  >({});
  const [savingInlineId, setSavingInlineId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [qrModalTarget, setQrModalTarget] = useState<{
    title: string;
    subtitle: string;
    shareCode?: string;
    token?: string;
    shareUrl: string;
  } | null>(null);

  // Public Share URL state
  const [publicBaseUrl, setPublicBaseUrl] = useState('');
  const [publicUrlDraft, setPublicUrlDraft] = useState('');
  const [editingPublicUrl, setEditingPublicUrl] = useState(false);
  const [savingPublicUrl, setSavingPublicUrl] = useState(false);
  const [publicUrlFeedback, setPublicUrlFeedback] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);

  // Settings form
  const [settingsName, setSettingsName] = useState('');
  const [settingsSchool, setSettingsSchool] = useState('');
  const [settingsPublicUrl, setSettingsPublicUrl] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [settingsStatus, setSettingsStatus] = useState('');

  const authHeaders = useMemo(() => {
    const h: Record<string, string> = {};
    if (authToken) {
      h.Authorization = `Bearer ${authToken}`;
    }
    return h;
  }, [authToken]);

  const loadWorkspaceData = useCallback(async (tokenOverride?: string) => {
    const tok = tokenOverride ?? authToken;
    const headers: Record<string, string> = {};
    if (tok) {
      headers.Authorization = `Bearer ${tok}`;
    }
    setLoadingData(true);
    try {
      const [qRes, eRes, sRes] = await Promise.all([
        fetch('/api/teacher/questions', { headers }),
        fetch('/api/teacher/exams', { headers }),
        fetch('/api/teacher/submissions', { headers }),
      ]);
      if (qRes.ok) {
        const qData = await qRes.json();
        setQuestions(qData.questions || []);
      }
      if (eRes.ok) {
        const eData = await eRes.json();
        setExams(eData.exams || []);
      }
      if (sRes.ok) {
        const sData = await sRes.json();
        setSubmissions(sData.submissions || []);
      }
    } finally {
      setLoadingData(false);
    }
  }, [authToken]);

  useEffect(() => {
    let active = true;
    async function checkAuth() {
      try {
        const res = await fetch('/api/teacher/me', { headers: authHeaders });
        const data = await res.json();
        if (!active) return;
        if (data.authenticated) {
          setAuthenticated(true);
          setTeacherName(data.teacherName || 'Guru Kelas V');
          setSchoolName(data.schoolName || 'UPT SDN 2 Makale Selatan');
          setPublicBaseUrl(data.publicBaseUrl || '');
          setPublicUrlDraft(data.publicBaseUrl || '');
          setSettingsName(data.teacherName || 'Guru Kelas V');
          setSettingsSchool(data.schoolName || 'UPT SDN 2 Makale Selatan');
          setSettingsPublicUrl(data.publicBaseUrl || '');
          await loadWorkspaceData();
        } else {
          setAuthenticated(false);
        }
      } catch {
        if (active) setAuthenticated(false);
      } finally {
        if (active) setAuthChecked(true);
      }
    }
    checkAuth();
    return () => {
      active = false;
    };
  }, [authHeaders, loadWorkspaceData]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoggingIn(true);
    try {
      const res = await fetch('/api/teacher/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: passwordInput }),
      });
      const data = await res.json();
      if (!res.ok) {
        setLoginError(data.error || 'Gagal masuk ke Portal Guru.');
        return;
      }
      if (data.token) {
        window.sessionStorage.setItem(TOKEN_STORAGE_KEY, data.token);
        setAuthToken(data.token);
      }
      setAuthenticated(true);
      setTeacherName(data.teacherName || 'Guru Kelas V');
      setSchoolName(data.schoolName || 'UPT SDN 2 Makale Selatan');
      setPublicBaseUrl(data.publicBaseUrl || '');
      setPublicUrlDraft(data.publicBaseUrl || '');
      setSettingsName(data.teacherName || 'Guru Kelas V');
      setSettingsSchool(data.schoolName || 'UPT SDN 2 Makale Selatan');
      setSettingsPublicUrl(data.publicBaseUrl || '');
      setPasswordInput('');
      await loadWorkspaceData(data.token);
    } catch {
      setLoginError('Terjadi kesalahan koneksi.');
    } finally {
      setLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/teacher/logout', { method: 'POST', headers: authHeaders });
    window.sessionStorage.removeItem(TOKEN_STORAGE_KEY);
    setAuthToken('');
    setAuthenticated(false);
  };

  const handleSaveQuestion = async (payload: Partial<Question>, editId?: string) => {
    const url = editId ? `/api/teacher/questions/${editId}` : '/api/teacher/questions';
    const method = editId ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Gagal menyimpan soal.');
    await loadWorkspaceData();
    setFeedbackMsg(editId ? 'Soal berhasil diperbarui.' : 'Soal baru ditambahkan ke Bank Soal.');
  };

  const handleDeleteQuestion = async (id: string) => {
    const res = await fetch(`/api/teacher/questions/${id}`, {
      method: 'DELETE',
      headers: authHeaders,
    });
    if (res.ok) {
      await loadWorkspaceData();
      setFeedbackMsg('Soal berhasil dihapus.');
    }
  };

  const handleSaveInlineWeight = async (q: Question) => {
    const draft = inlineWeights[q.id];
    if (!draft) return;
    const nextMaxScore = Number(draft.maxScore);
    const nextWeight = Number(draft.weight);
    if (!Number.isFinite(nextMaxScore) || nextMaxScore <= 0 || !Number.isFinite(nextWeight) || nextWeight <= 0) {
      setFeedbackMsg('Skor dan bobot soal harus lebih besar dari 0.');
      return;
    }
    setSavingInlineId(q.id);
    try {
      const res = await fetch(`/api/teacher/questions/${q.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({
          maxScore: nextMaxScore,
          weight: nextWeight,
        }),
      });
      if (res.ok) {
        setInlineWeights((prev) => {
          const copy = { ...prev };
          delete copy[q.id];
          return copy;
        });
        await loadWorkspaceData();
        setFeedbackMsg('Skor & bobot soal berhasil diperbarui (nilai siswa terkait ikut diperbarui).');
      }
    } finally {
      setSavingInlineId(null);
    }
  };

  const handleSaveExam = async (payload: Partial<ExamPackage>, editId?: string) => {
    const url = editId ? `/api/teacher/exams/${editId}` : '/api/teacher/exams';
    const method = editId ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Gagal menyimpan paket ujian.');
    await loadWorkspaceData();
    setFeedbackMsg(
      editId
        ? 'Paket ujian berhasil diperbarui.'
        : 'Paket ujian baru dibuat dan siap dibagikan ke murid.'
    );
  };

  const handleToggleExamActive = async (exam: ExamPackage) => {
    const res = await fetch(`/api/teacher/exams/${exam.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({ isActive: !exam.isActive }),
    });
    if (res.ok) {
      await loadWorkspaceData();
    }
  };

  const handleDeleteExam = async (id: string) => {
    const res = await fetch(`/api/teacher/exams/${id}`, {
      method: 'DELETE',
      headers: authHeaders,
    });
    if (res.ok) {
      await loadWorkspaceData();
      setFeedbackMsg('Paket ujian dihapus.');
    }
  };

  const shareResolution = useMemo(
    () =>
      resolveStudentShareBaseUrl({
        configuredPublicUrl: publicBaseUrl,
        currentOrigin: window.location.origin,
      }),
    [publicBaseUrl]
  );

  const handleSaveAndVerifyPublicUrl = async (e?: React.FormEvent, verifyOnly = false) => {
    if (e) e.preventDefault();
    setPublicUrlFeedback(null);
    const targetInput = verifyOnly ? shareResolution.baseUrl : publicUrlDraft;
    const normalized = normalizePublicBaseUrl(targetInput);
    if (!normalized.ok) {
      setPublicUrlFeedback({ ok: false, message: normalized.error });
      return;
    }

    if (normalized.origin && classifyOrigin(normalized.origin) === 'ai_studio_dev') {
      setPublicUrlFeedback({
        ok: false,
        message:
          'URL ais-dev-... adalah alamat preview pribadi Google AI Studio yang mewajibkan login. Gunakan URL publik hasil Deploy.',
      });
      return;
    }

    setSavingPublicUrl(true);
    try {
      if (!verifyOnly) {
        const saveRes = await fetch('/api/teacher/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', ...authHeaders },
          body: JSON.stringify({ publicBaseUrl: normalized.origin }),
        });
        const saveData = await saveRes.json();
        if (!saveRes.ok) {
          setPublicUrlFeedback({
            ok: false,
            message: saveData.error || 'Gagal menyimpan URL publik.',
          });
          return;
        }
        setPublicBaseUrl(saveData.publicBaseUrl || '');
        setPublicUrlDraft(saveData.publicBaseUrl || '');
        setSettingsPublicUrl(saveData.publicBaseUrl || '');
        if (!normalized.origin) {
          setEditingPublicUrl(false);
          setPublicUrlFeedback({
            ok: true,
            message: 'Pengaturan URL khusus dihapus. Link kembali memakai alamat situs saat ini.',
          });
          return;
        }
      }

      const verifyRes = await fetch('/api/teacher/verify-public-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ url: normalized.origin }),
      });
      const verifyData = await verifyRes.json();
      setPublicUrlFeedback({
        ok: Boolean(verifyData.reachablePublicly),
        message: verifyData.message || 'Pemeriksaan URL selesai.',
      });
      if (verifyData.reachablePublicly) {
        setEditingPublicUrl(false);
      }
    } catch {
      setPublicUrlFeedback({
        ok: false,
        message: 'Gagal menghubungi server untuk memverifikasi URL publik.',
      });
    } finally {
      setSavingPublicUrl(false);
    }
  };

  const copyShareLink = async (exam: ExamPackage, withWhatsAppText = false) => {
    const url = buildStudentExamUrl(shareResolution.baseUrl, exam.shareCode);
    const content = withWhatsAppText
      ? buildWhatsAppShareMessage(
          {
            title: exam.title,
            subject: exam.subject,
            questionCount: exam.questionIds.length,
            durationMinutes: exam.durationMinutes,
            token: exam.token,
          },
          url
        )
      : url;

    try {
      await navigator.clipboard.writeText(content);
      setCopiedId(withWhatsAppText ? `${exam.id}-wa` : exam.id);
      window.setTimeout(() => setCopiedId(null), 2200);
    } catch {
      setFeedbackMsg(`Link ujian: ${url}`);
    }
  };

  const copyGeneralStudentLink = async () => {
    const url = buildStudentCatalogUrl(shareResolution.baseUrl);
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId('catalog-student');
      window.setTimeout(() => setCopiedId(null), 2200);
    } catch {
      setFeedbackMsg(`Link daftar ujian murid: ${url}`);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsStatus('');
    const res = await fetch('/api/teacher/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({
        teacherName: settingsName,
        schoolName: settingsSchool,
        publicBaseUrl: settingsPublicUrl,
        currentPassword: newPassword ? currentPassword : undefined,
        newPassword: newPassword || undefined,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setSettingsStatus(data.error || 'Gagal menyimpan pengaturan.');
      return;
    }
    setTeacherName(data.teacherName);
    setSchoolName(data.schoolName);
    setPublicBaseUrl(data.publicBaseUrl || '');
    setPublicUrlDraft(data.publicBaseUrl || '');
    setSettingsPublicUrl(data.publicBaseUrl || '');
    setCurrentPassword('');
    setNewPassword('');
    setSettingsStatus('Pengaturan portal berhasil disimpan.');
  };

  const exportCsv = () => {
    const headers = [
      'Nama Siswa',
      'Kelas',
      'No Absen',
      'Paket Ujian',
      'Mata Pelajaran',
      'Objektif Benar',
      'Total Objektif',
      'Nilai Objektif',
      'Nilai Uraian',
      'Nilai Akhir',
      'Status',
      'Waktu Dikumpulkan',
    ];
    const rows = filteredSubmissions.map((s) => [
      s.studentName,
      s.studentClass,
      s.studentAbsen,
      s.examTitle,
      s.subject,
      String(s.objectiveCorrectCount),
      String(s.objectiveTotalCount),
      s.objectiveScore !== null ? String(s.objectiveScore) : '-',
      s.essayScore !== null ? String(s.essayScore) : '-',
      s.finalScore !== null ? String(s.finalScore) : '-',
      s.gradingStatus === 'selesai' ? 'Selesai' : 'Menunggu Koreksi Uraian',
      new Date(s.submittedAt).toLocaleString('id-ID'),
    ]);
    const csvContent =
      '\uFEFF' +
      [headers, ...rows]
        .map((row) =>
          row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
        )
        .join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `nilai-asas-sd-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const availableSubjects = useMemo(() => {
    const set = new Set([...STANDARD_SUBJECTS, ...questions.map((q) => q.subject)]);
    return ['Semua', ...Array.from(set)];
  }, [questions]);

  const filteredQuestions = useMemo(() => {
    const search = searchQuery.toLowerCase();
    return questions.filter((q) => {
      if (subjectFilter !== 'Semua' && q.subject !== subjectFilter) return false;
      if (typeFilter !== 'Semua' && q.type !== typeFilter) return false;
      if (search && !q.prompt.toLowerCase().includes(search)) return false;
      return true;
    });
  }, [questions, subjectFilter, typeFilter, searchQuery]);

  const filteredSubmissions = useMemo(() => {
    const search = submissionSearch.toLowerCase();
    return submissions.filter((s) => {
      if (submissionExamFilter !== 'Semua' && s.examId !== submissionExamFilter) {
        return false;
      }
      if (
        search &&
        !s.studentName.toLowerCase().includes(search) &&
        !s.studentClass.toLowerCase().includes(search)
      ) {
        return false;
      }
      return true;
    });
  }, [submissions, submissionExamFilter, submissionSearch]);

  const pendingEssayCount = useMemo(
    () => submissions.filter((s) => s.gradingStatus === 'menunggu_koreksi_uraian').length,
    [submissions]
  );

  // --- AUTH LOADING ---
  if (!authChecked) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-sky-700 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // --- TEACHER LOGIN GATE ---
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <header className="bg-white border-b border-slate-200 px-6 py-4">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <button
              type="button"
              onClick={onBackToHome}
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-slate-900 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Halaman Siswa</span>
            </button>
            <div className="text-xs font-medium text-slate-500">Portal Khusus Guru</div>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-xl p-7">
            <div className="w-11 h-11 rounded-lg bg-sky-50 border border-sky-200 text-sky-700 flex items-center justify-center">
              <KeyRound className="w-5 h-5" />
            </div>
            <h1 className="mt-4 text-2xl font-bold text-slate-900">Masuk Portal Guru</h1>
            <p className="mt-1 text-sm text-slate-600">
              Kelola bank soal ASAS, bentuk & jumlah soal, link ujian murid, dan koreksi nilai uraian.
            </p>

            {loginError && (
              <div role="alert" className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {loginError}
              </div>
            )}

            <form onSubmit={handleLogin} className="mt-5 space-y-4">
              <div>
                <label htmlFor="teacher-password" className="block text-sm font-semibold text-slate-800 mb-1.5">
                  Kata Sandi Guru
                </label>
                <input
                  id="teacher-password"
                  type="password"
                  required
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Masukkan kata sandi guru"
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-600"
                />
                <p className="mt-1.5 text-xs text-slate-500">
                  Kata sandi awal standar: <code className="font-mono text-slate-700">makale2026</code> (dapat diubah di menu Pengaturan).
                </p>
              </div>
              <button
                type="submit"
                disabled={loggingIn}
                className="w-full py-2.5 px-4 bg-sky-700 hover:bg-sky-800 text-white text-sm font-semibold rounded-lg disabled:opacity-60 cursor-pointer"
              >
                {loggingIn ? 'Memverifikasi...' : 'Masuk ke Portal Guru'}
              </button>
            </form>
          </div>
        </main>
      </div>
    );
  }

  // --- AUTHENTICATED TEACHER DASHBOARD ---
  const navItems: Array<{ id: TeacherTab; label: string; icon: React.ReactNode }> = [
    { id: 'exams', label: 'Paket Ujian & Link', icon: <Share2 className="w-4 h-4" /> },
    { id: 'questions', label: `Bank Soal (${questions.length})`, icon: <BookOpen className="w-4 h-4" /> },
    {
      id: 'submissions',
      label: `Hasil & Koreksi (${submissions.length})`,
      icon: <ClipboardList className="w-4 h-4" />,
    },
    {
      id: 'analysis',
      label: 'Analisis Butir Soal',
      icon: <BarChart3 className="w-4 h-4" />,
    },
    { id: 'settings', label: 'Pengaturan', icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:sticky lg:top-0 lg:h-screen bg-white border-r border-slate-200 shrink-0">
        <div className="px-5 py-5 border-b border-slate-200">
          <div className="text-base font-bold text-slate-900">Portal Guru TKA</div>
          <div className="text-xs text-slate-500 mt-0.5 truncate">{schoolName}</div>
        </div>

        <nav className="flex-1 p-3 space-y-1" aria-label="Menu Portal Guru">
          {navItems.map((item) => {
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  active
                    ? 'bg-sky-50 text-sky-800'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-200 space-y-2">
          <div className="text-xs text-slate-500 truncate">{teacherName}</div>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Keluar Portal</span>
          </button>
        </div>
      </aside>

      {/* Main Content Column */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="bg-white border-b border-slate-200 px-4 sm:px-8 py-4 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-slate-900 truncate">
              {navItems.find((n) => n.id === activeTab)?.label}
            </h1>
            <p className="text-xs text-slate-500 truncate">
              Rujukan standar soal ASAS Kelas V · {schoolName}
            </p>
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            <PWAInstallButton
              compact={true}
              installUrlOverride={shareResolution.baseUrl}
            />
            <button
              type="button"
              onClick={onBackToHome}
              className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 whitespace-nowrap cursor-pointer"
            >
              Halaman Utama
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="lg:hidden px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 whitespace-nowrap cursor-pointer"
            >
              Keluar
            </button>
          </div>
        </header>

        {/* Mobile Tab Strip */}
        <div className="lg:hidden bg-white border-b border-slate-200 px-4 py-2 flex items-center gap-1 overflow-x-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === item.id
                  ? 'bg-sky-700 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <main className="flex-1 p-4 sm:p-8 max-w-6xl w-full mx-auto space-y-6">
          {feedbackMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-800 flex items-center justify-between">
              <span>{feedbackMsg}</span>
              <button
                type="button"
                onClick={() => setFeedbackMsg('')}
                className="text-xs font-semibold underline cursor-pointer"
              >
                Tutup
              </button>
            </div>
          )}

          {/* TAB 1: EXAM PACKAGES & SHARE LINKS */}
          {activeTab === 'exams' && (
            <div className="space-y-6">
              {/* 4-column KPI summary */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  {
                    label: 'Paket Ujian Aktif',
                    value: exams.filter((e) => e.isActive).length,
                  },
                  {
                    label: 'Total Soal di Bank',
                    value: questions.length,
                  },
                  {
                    label: 'Jawaban Siswa Masuk',
                    value: submissions.length,
                  },
                  {
                    label: 'Menunggu Koreksi Uraian',
                    value: pendingEssayCount,
                  },
                ].map((kpi) => (
                  <div
                    key={kpi.label}
                    className="bg-white border border-slate-200 rounded-xl p-4"
                  >
                    <div className="text-xs font-medium text-slate-500">{kpi.label}</div>
                    <div className="mt-1 text-2xl font-bold text-slate-900 tabular-nums">
                      {kpi.value}
                    </div>
                  </div>
                ))}
              </div>

              {/* Public Share Link Banner & Config */}
              {(() => {
                const verifyFailed = Boolean(publicUrlFeedback && !publicUrlFeedback.ok);
                const isDevPreview = shareResolution.originKind === 'ai_studio_dev';
                const isVerifiedPublic =
                  shareResolution.originKind === 'public' && !verifyFailed;

                return (
                  <div
                    className={`rounded-xl p-5 border ${
                      isDevPreview || verifyFailed
                        ? 'bg-amber-50/70 border-amber-300'
                        : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div className="flex items-start gap-3 min-w-0">
                        {isDevPreview || verifyFailed ? (
                          <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                        ) : isVerifiedPublic ? (
                          <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                        ) : (
                          <Globe className="w-5 h-5 text-sky-700 shrink-0 mt-0.5" />
                        )}
                        <div className="min-w-0 space-y-1">
                          <h2 className="text-sm font-bold text-slate-900">
                            {isDevPreview
                              ? 'Atur Link Publik Agar Murid Tidak Perlu Login Google AI Studio'
                              : verifyFailed
                              ? 'Domain Tersimpan — Pastikan Aplikasi Sudah di-Deploy Publik'
                              : isVerifiedPublic
                              ? 'Link Publik Murid Aktif (Langsung Terbuka Tanpa Login AI Studio)'
                              : 'Pengaturan Domain Link Ujian Murid'}
                          </h2>
                      {shareResolution.originKind === 'ai_studio_dev' ? (
                        <div className="text-xs text-slate-700 space-y-1 leading-relaxed">
                          <p>
                            Saat ini Portal Guru dibuka di preview editor (<code className="font-mono text-amber-900">ais-dev-...</code>), sehingga link preview meminta murid masuk ke Google AI Studio terlebih dahulu. Agar murid bisa langsung membuka ujian dari WhatsApp/browser:
                          </p>
                          <ol className="list-decimal list-inside space-y-0.5 text-slate-800 font-medium">
                            <li>Klik tombol <strong>Deploy</strong> di kanan atas Google AI Studio (pastikan akses publik diaktifkan).</li>
                            <li>Tempel URL hasil Deploy di bawah ini, lalu klik <strong>Simpan &amp; Cek Akses</strong>.</li>
                            <li>Atau langsung buka Portal Guru dari URL hasil Deploy (<code className="font-mono">/guru</code>) — link otomatis sudah publik.</li>
                          </ol>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-600">
                          Semua link ujian murid &amp; QR Code menggunakan alamat:{' '}
                          <code className="font-mono font-semibold text-slate-900">
                            {shareResolution.baseUrl}
                          </code>
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => void copyGeneralStudentLink()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 bg-white hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-800 cursor-pointer"
                    >
                      {copiedId === 'catalog-student' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Link /mulai Tersalin</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Salin Link Daftar Ujian (/mulai)</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setQrModalTarget({
                          title: 'Daftar Paket Ujian Siswa (Semua Mapel)',
                          subtitle: `${schoolName} · Tanpa Portal Guru`,
                          shareUrl: buildStudentCatalogUrl(shareResolution.baseUrl),
                        })
                      }
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 bg-white hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-800 cursor-pointer"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>QR /mulai</span>
                    </button>
                    {shareResolution.originKind !== 'ai_studio_dev' && (
                      <>
                        <button
                          type="button"
                          disabled={savingPublicUrl}
                          onClick={() => void handleSaveAndVerifyPublicUrl(undefined, true)}
                          className="px-3 py-1.5 border border-slate-300 bg-white hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-800 cursor-pointer disabled:opacity-50"
                        >
                          {savingPublicUrl ? 'Mengecek...' : 'Cek Akses'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingPublicUrl((v) => !v)}
                          className="px-3 py-1.5 border border-slate-300 bg-white hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-700 cursor-pointer"
                        >
                          {editingPublicUrl ? 'Tutup' : 'Ubah URL'}
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {(shareResolution.originKind === 'ai_studio_dev' || editingPublicUrl) && (
                  <form
                    onSubmit={(e) => void handleSaveAndVerifyPublicUrl(e, false)}
                    className="mt-4 pt-3.5 border-t border-slate-200/80 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5"
                  >
                    <label htmlFor="public-url-input" className="sr-only">
                      URL Publik Aplikasi Hasil Deploy
                    </label>
                    <input
                      id="public-url-input"
                      type="text"
                      inputMode="url"
                      value={publicUrlDraft}
                      onChange={(e) => setPublicUrlDraft(e.target.value)}
                      placeholder="Tempel URL hasil Deploy, misal: https://tka-sd-xxxx.asia-southeast1.run.app"
                      className="flex-1 px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-600"
                    />
                    <button
                      type="submit"
                      disabled={savingPublicUrl}
                      className="px-4 py-2 bg-sky-700 hover:bg-sky-800 text-white text-xs font-semibold rounded-lg whitespace-nowrap cursor-pointer disabled:opacity-60"
                    >
                      {savingPublicUrl ? 'Memeriksa...' : 'Simpan & Cek Akses'}
                    </button>
                    {publicBaseUrl && (
                      <button
                        type="button"
                        disabled={savingPublicUrl}
                        onClick={() => {
                          setPublicUrlDraft('');
                          void (async () => {
                            setSavingPublicUrl(true);
                            try {
                              const res = await fetch('/api/teacher/settings', {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json', ...authHeaders },
                                body: JSON.stringify({ publicBaseUrl: '' }),
                              });
                              if (res.ok) {
                                setPublicBaseUrl('');
                                setSettingsPublicUrl('');
                                setEditingPublicUrl(false);
                                setPublicUrlFeedback(null);
                              }
                            } finally {
                              setSavingPublicUrl(false);
                            }
                          })();
                        }}
                        className="px-3 py-2 border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 rounded-lg cursor-pointer"
                      >
                        Reset
                      </button>
                    )}
                  </form>
                )}

                    {publicUrlFeedback && (
                      <div
                        role="status"
                        className={`mt-3 p-2.5 rounded-lg border text-xs font-medium ${
                          publicUrlFeedback.ok
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                            : 'bg-red-50 border-red-200 text-red-800'
                        }`}
                      >
                        {publicUrlFeedback.message}
                      </div>
                    )}
                  </div>
                );
              })()}

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Daftar Paket Ujian & Link Online Murid
                  </h2>
                  <p className="text-xs text-slate-500">
                    Bagikan tautan atau QR Code ujian kepada murid. Pada tampilan murid, Portal Guru tidak akan muncul.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEditingExam(null);
                    setExamModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-sky-700 hover:bg-sky-800 text-white text-sm font-semibold rounded-lg whitespace-nowrap cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Buat Paket Ujian Baru</span>
                </button>
              </div>

              {loadingData && exams.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-sm text-slate-500">
                  Memuat daftar paket ujian...
                </div>
              ) : exams.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
                  <p className="text-sm text-slate-600">Belum ada paket ujian.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {exams.map((exam) => {
                    const shareUrl = buildStudentExamUrl(
                      shareResolution.baseUrl,
                      exam.shareCode
                    );
                    const breakdown = (
                      Object.entries(exam.countsByType) as Array<[QuestionType, number]>
                    )
                      .filter(([, count]) => count > 0)
                      .map(([t, count]) => `${count} ${QUESTION_TYPE_LABELS[t]}`)
                      .join(' · ');

                    return (
                      <div
                        key={exam.id}
                        className="bg-white border border-slate-200 rounded-xl p-5 space-y-4"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 tabular-nums">
                              <span className="font-semibold text-sky-700">
                                {exam.assessmentType}
                              </span>
                              <span aria-hidden="true">·</span>
                              <span>{exam.subject}</span>
                              <span aria-hidden="true">·</span>
                              <span>{exam.questionIds.length} Soal</span>
                              <span aria-hidden="true">·</span>
                              <span>{exam.durationMinutes} Menit</span>
                              <span aria-hidden="true">·</span>
                              <span
                                className={
                                  exam.isActive
                                    ? 'font-semibold text-emerald-700'
                                    : 'font-semibold text-slate-500'
                                }
                              >
                                {exam.isActive ? 'Aktif' : 'Nonaktif'}
                              </span>
                            </div>
                            <h3 className="mt-1 text-base font-bold text-slate-900">
                              {exam.title}
                            </h3>
                            <p className="mt-1 text-xs text-slate-600 tabular-nums">
                              Komposisi: {breakdown || `${exam.questionIds.length} soal`}
                              {exam.token ? ` · Token: ${exam.token}` : ''}
                            </p>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleToggleExamActive(exam)}
                              className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                            >
                              {exam.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingExam(exam);
                                setExamModalOpen(true);
                              }}
                              className="inline-flex items-center gap-1 px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Kelola</span>
                            </button>
                            <button
                              type="button"
                              aria-label={`Hapus paket ${exam.title}`}
                              onClick={() => void handleDeleteExam(exam.id)}
                              className="p-1.5 border border-slate-200 rounded-lg text-red-600 hover:bg-red-50 cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Share Link Bar */}
                        <div className="pt-3 border-t border-slate-100 space-y-2">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                            <div className="flex items-center gap-2 min-w-0">
                              <Link2 className="w-4 h-4 text-slate-400 shrink-0" />
                              <code className="text-xs font-mono text-slate-700 truncate">
                                {shareUrl}
                              </code>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={() => void copyShareLink(exam, false)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 hover:bg-slate-100 cursor-pointer"
                              >
                                {copiedId === exam.id ? (
                                  <>
                                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>Link Tersalin</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3.5 h-3.5" />
                                    <span>Salin Link Murid</span>
                                  </>
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={() => void copyShareLink(exam, true)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold cursor-pointer"
                              >
                                {copiedId === `${exam.id}-wa` ? (
                                  <>
                                    <Check className="w-3.5 h-3.5" />
                                    <span>Pesan WA Tersalin</span>
                                  </>
                                ) : (
                                  <>
                                    <Share2 className="w-3.5 h-3.5" />
                                    <span>Salin Pesan WA</span>
                                  </>
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setQrModalTarget({
                                    title: exam.title,
                                    subtitle: `${exam.subject} · ${exam.questionIds.length} Soal · ${exam.durationMinutes} Menit`,
                                    shareCode: exam.shareCode,
                                    token: exam.token,
                                    shareUrl,
                                  })
                                }
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 hover:bg-slate-100 cursor-pointer"
                              >
                                <QrCode className="w-3.5 h-3.5" />
                                <span>QR Code</span>
                              </button>
                            </div>
                          </div>
                          {shareResolution.originKind === 'ai_studio_dev' && (
                            <p className="text-[11px] text-amber-800">
                              Catatan: Domain preview <code className="font-mono">ais-dev-...</code> meminta login Google AI Studio. Atur URL hasil Deploy di kotak atas agar link ini langsung terbuka untuk murid.
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: QUESTION BANK */}
          {activeTab === 'questions' && (
            <div className="space-y-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2.5">
                  <select
                    aria-label="Filter mata pelajaran"
                    value={subjectFilter}
                    onChange={(e) => setSubjectFilter(e.target.value)}
                    className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm"
                  >
                    {availableSubjects.map((s) => (
                      <option key={s} value={s}>
                        {s === 'Semua' ? 'Semua Mata Pelajaran' : s}
                      </option>
                    ))}
                  </select>

                  <select
                    aria-label="Filter bentuk soal"
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm"
                  >
                    <option value="Semua">Semua Bentuk Soal</option>
                    {(Object.keys(QUESTION_TYPE_LABELS) as QuestionType[]).map((t) => (
                      <option key={t} value={t}>
                        {QUESTION_TYPE_LABELS[t]}
                      </option>
                    ))}
                  </select>

                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Cari isi soal..."
                      className="pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-sm w-48 xl:w-56"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setWordImportOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-sky-700 bg-white hover:bg-sky-50 text-sky-800 text-sm font-semibold rounded-lg whitespace-nowrap cursor-pointer"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Upload Word (.docx)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingQuestion(null);
                      setQuestionModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-sky-700 hover:bg-sky-800 text-white text-sm font-semibold rounded-lg whitespace-nowrap cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Tambah Soal Baru</span>
                  </button>
                </div>
              </div>

              <div className="text-xs text-slate-500 tabular-nums">
                Menampilkan <strong>{filteredQuestions.length}</strong> dari {questions.length} soal
              </div>

              {filteredQuestions.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
                  <p className="text-sm text-slate-600">Tidak ada soal yang sesuai filter.</p>
                </div>
              ) : (
                <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-200">
                  {filteredQuestions.map((q, idx) => {
                    const keyLabel = Array.isArray(q.correctAnswer)
                      ? q.correctAnswer.join(', ')
                      : q.correctAnswer;
                    const qMax = getQuestionMaxScore(q);
                    const qWeight = getQuestionWeight(q);
                    const inlineDraft = inlineWeights[q.id];
                    const isDirty = Boolean(
                      inlineDraft &&
                        (inlineDraft.maxScore !== qMax || inlineDraft.weight !== qWeight)
                    );

                    return (
                      <div key={q.id} className="p-5 flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                        <div className="min-w-0 space-y-1.5 flex-1">
                          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 tabular-nums">
                            <span className="font-mono font-semibold text-slate-700">#{idx + 1}</span>
                            <span aria-hidden="true">·</span>
                            <span className="font-semibold text-sky-700">{q.subject}</span>
                            <span aria-hidden="true">·</span>
                            <span>{QUESTION_TYPE_LABELS[q.type]}</span>
                            <span aria-hidden="true">·</span>
                            <span className="text-slate-700 font-medium">
                              Skor {qMax} · Bobot {qWeight}
                            </span>
                            {q.sourceTag && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span>{q.sourceTag}</span>
                              </>
                            )}
                          </div>
                          <p className="text-sm font-medium text-slate-900 whitespace-pre-line">
                            {q.prompt}
                          </p>
                          <div className="text-xs text-emerald-800">
                            Kunci/Pedoman: <span className="font-semibold">{keyLabel}</span>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                          <div className="flex items-center gap-2 text-xs pr-1">
                            <label className="flex items-center gap-1 text-slate-600">
                              <span>Skor</span>
                              <input
                                type="number"
                                min={0.5}
                                step={0.5}
                                aria-label={`Skor soal nomor ${idx + 1}`}
                                value={inlineDraft ? inlineDraft.maxScore : qMax}
                                onChange={(e) =>
                                  setInlineWeights((prev) => ({
                                    ...prev,
                                    [q.id]: {
                                      maxScore: Number(e.target.value),
                                      weight: prev[q.id]?.weight ?? qWeight,
                                    },
                                  }))
                                }
                                className="w-13 px-1.5 py-1 bg-white border border-slate-300 rounded-md text-right font-mono tabular-nums text-slate-900"
                              />
                            </label>
                            <label className="flex items-center gap-1 text-slate-600">
                              <span>Bobot</span>
                              <input
                                type="number"
                                min={0.5}
                                step={0.5}
                                aria-label={`Bobot soal nomor ${idx + 1}`}
                                value={inlineDraft ? inlineDraft.weight : qWeight}
                                onChange={(e) =>
                                  setInlineWeights((prev) => ({
                                    ...prev,
                                    [q.id]: {
                                      maxScore: prev[q.id]?.maxScore ?? qMax,
                                      weight: Number(e.target.value),
                                    },
                                  }))
                                }
                                className="w-13 px-1.5 py-1 bg-white border border-slate-300 rounded-md text-right font-mono tabular-nums text-slate-900"
                              />
                            </label>
                            {isDirty && (
                              <button
                                type="button"
                                disabled={savingInlineId === q.id}
                                onClick={() => void handleSaveInlineWeight(q)}
                                className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-md font-semibold cursor-pointer"
                              >
                                {savingInlineId === q.id ? '...' : 'Simpan'}
                              </button>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              setEditingQuestion(q);
                              setQuestionModalOpen(true);
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            aria-label={`Hapus soal ${q.prompt.slice(0, 25)}`}
                            onClick={() => void handleDeleteQuestion(q.id)}
                            className="p-1.5 border border-slate-200 rounded-lg text-red-600 hover:bg-red-50 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: SUBMISSIONS & GRADING */}
          {activeTab === 'submissions' && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2.5">
                  <select
                    aria-label="Filter paket ujian"
                    value={submissionExamFilter}
                    onChange={(e) => setSubmissionExamFilter(e.target.value)}
                    className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm"
                  >
                    <option value="Semua">Semua Paket Ujian</option>
                    {exams.map((ex) => (
                      <option key={ex.id} value={ex.id}>
                        {ex.title}
                      </option>
                    ))}
                  </select>

                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={submissionSearch}
                      onChange={(e) => setSubmissionSearch(e.target.value)}
                      placeholder="Cari nama atau kelas siswa..."
                      className="pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-sm w-60"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (submissionExamFilter !== 'Semua') {
                        setAnalysisExamId(submissionExamFilter);
                      }
                      setActiveTab('analysis');
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-sky-700 bg-white hover:bg-sky-50 text-sky-800 text-sm font-semibold rounded-lg cursor-pointer"
                  >
                    <BarChart3 className="w-4 h-4" />
                    <span>Analisis Butir Soal</span>
                  </button>
                  <button
                    type="button"
                    disabled={filteredSubmissions.length === 0}
                    onClick={exportCsv}
                    className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-sm font-semibold rounded-lg disabled:opacity-40 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Unduh Nilai (CSV)</span>
                  </button>
                </div>
              </div>

              {filteredSubmissions.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
                  <FileSpreadsheet className="w-9 h-9 text-slate-400 mx-auto" />
                  <p className="mt-3 text-sm font-medium text-slate-700">
                    Belum ada jawaban murid yang masuk.
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Bagikan link ujian dari tab Paket Ujian & Link agar murid dapat mengerjakan secara online.
                  </p>
                </div>
              ) : (
                <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto">
                  <table className="w-full text-sm text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                        <th className="px-4 py-3">Peserta</th>
                        <th className="px-4 py-3">Paket Ujian</th>
                        <th className="px-4 py-3 text-right">Objektif</th>
                        <th className="px-4 py-3 text-right">Uraian</th>
                        <th className="px-4 py-3 text-right">Nilai Akhir</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {filteredSubmissions.map((sub) => (
                        <tr key={sub.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3">
                            <div className="font-semibold text-slate-900">{sub.studentName}</div>
                            <div className="text-xs text-slate-500">
                              {sub.studentClass} · Absen {sub.studentAbsen}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-medium text-slate-800">{sub.examTitle}</div>
                            <div className="text-xs text-slate-500 tabular-nums">
                              {new Date(sub.submittedAt).toLocaleString('id-ID')}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums font-mono">
                            {sub.objectiveScore !== null
                              ? `${sub.objectiveScore} (${sub.objectiveCorrectCount}/${sub.objectiveTotalCount})`
                              : '-'}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums font-mono">
                            {sub.essayScore !== null ? sub.essayScore : '-'}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums font-mono font-bold text-sky-700">
                            {sub.finalScore !== null ? sub.finalScore : '-'}
                          </td>
                          <td className="px-4 py-3 text-xs font-semibold">
                            {sub.gradingStatus === 'selesai' ? (
                              <span className="text-emerald-700">Selesai</span>
                            ) : (
                              <span className="text-amber-700">Perlu Koreksi Uraian</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              type="button"
                              onClick={() => setGradingSubmissionId(sub.id)}
                              className="px-3 py-1.5 bg-sky-700 hover:bg-sky-800 text-white text-xs font-semibold rounded-lg whitespace-nowrap cursor-pointer"
                            >
                              Koreksi & Detail
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: ITEM ANALYSIS MATRIX */}
          {activeTab === 'analysis' && (
            <TeacherItemAnalysisTab
              exams={exams}
              questions={questions}
              authToken={authToken}
              initialExamId={analysisExamId}
              onEditQuestion={(q) => {
                setEditingQuestion(q);
                setQuestionModalOpen(true);
              }}
              onOpenSubmission={(subId) => setGradingSubmissionId(subId)}
            />
          )}

          {/* TAB 5: SETTINGS */}
          {activeTab === 'settings' && (
            <div className="max-w-xl bg-white border border-slate-200 rounded-xl p-6">
              <h2 className="text-base font-bold text-slate-900">Pengaturan Identitas & Keamanan Portal</h2>
              <p className="mt-1 text-xs text-slate-500">
                Ubah nama sekolah, nama guru, atau kata sandi masuk Portal Guru.
              </p>

              {settingsStatus && (
                <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800">
                  {settingsStatus}
                </div>
              )}

              <form onSubmit={handleSaveSettings} className="mt-5 space-y-4">
                <div>
                  <label htmlFor="set-teacher-name" className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Guru
                  </label>
                  <input
                    id="set-teacher-name"
                    type="text"
                    value={settingsName}
                    onChange={(e) => setSettingsName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="set-school-name" className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Sekolah
                  </label>
                  <input
                    id="set-school-name"
                    type="text"
                    value={settingsSchool}
                    onChange={(e) => setSettingsSchool(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="set-public-url" className="block text-xs font-semibold text-slate-700 mb-1">
                    URL Publik Aplikasi untuk Link Murid (Opsional)
                  </label>
                  <input
                    id="set-public-url"
                    type="text"
                    inputMode="url"
                    value={settingsPublicUrl}
                    onChange={(e) => setSettingsPublicUrl(e.target.value)}
                    placeholder="Contoh: https://tka-sd-xxxx.asia-southeast1.run.app"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    Isi dengan URL hasil Deploy agar semua link ujian yang disalin bisa langsung dibuka murid tanpa login Google AI Studio.
                  </p>
                </div>
                <div className="pt-3 border-t border-slate-200 space-y-3">
                  <div className="text-xs font-bold text-slate-800">
                    Ganti Kata Sandi Portal Guru (Opsional)
                  </div>
                  <div>
                    <label htmlFor="set-old-pass" className="block text-xs font-semibold text-slate-700 mb-1">
                      Kata Sandi Lama
                    </label>
                    <input
                      id="set-old-pass"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="set-new-pass" className="block text-xs font-semibold text-slate-700 mb-1">
                      Kata Sandi Baru
                    </label>
                    <input
                      id="set-new-pass"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="px-5 py-2.5 bg-sky-700 hover:bg-sky-800 text-white text-sm font-semibold rounded-lg cursor-pointer"
                >
                  Simpan Pengaturan
                </button>
              </form>
            </div>
          )}
        </main>
      </div>

      {/* Modals */}
      {questionModalOpen && (
        <TeacherQuestionModal
          initialQuestion={editingQuestion}
          onClose={() => {
            setQuestionModalOpen(false);
            setEditingQuestion(null);
          }}
          onSave={handleSaveQuestion}
        />
      )}

      {examModalOpen && (
        <TeacherExamModal
          initialExam={editingExam}
          allQuestions={questions}
          onClose={() => {
            setExamModalOpen(false);
            setEditingExam(null);
          }}
          onSave={handleSaveExam}
        />
      )}

      {gradingSubmissionId && (
        <TeacherGradingModal
          submissionId={gradingSubmissionId}
          authToken={authToken}
          onClose={() => setGradingSubmissionId(null)}
          onUpdated={() => {
            void loadWorkspaceData();
            setFeedbackMsg('Nilai uraian berhasil disimpan.');
          }}
        />
      )}

      {wordImportOpen && (
        <TeacherWordImportModal
          authToken={authToken}
          onClose={() => setWordImportOpen(false)}
          onImported={({ insertedCount, examCreated }) => {
            void loadWorkspaceData();
            setFeedbackMsg(
              examCreated
                ? `${insertedCount} soal dari file Word berhasil masuk ke Bank Soal dan Paket Ujian baru telah dibuat.`
                : `${insertedCount} soal dari file Word berhasil ditambahkan ke Bank Soal.`
            );
          }}
        />
      )}

      {qrModalTarget && (
        <TeacherQrModal
          title={qrModalTarget.title}
          subtitle={qrModalTarget.subtitle}
          shareCode={qrModalTarget.shareCode}
          token={qrModalTarget.token}
          shareUrl={qrModalTarget.shareUrl}
          originKind={shareResolution.originKind}
          onClose={() => setQrModalTarget(null)}
        />
      )}
    </div>
  );
};
