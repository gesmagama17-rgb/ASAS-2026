import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Flag,
  LayoutGrid,
  Send,
  X,
} from 'lucide-react';
import type {
  StudentAnswerValue,
  StudentExamSummary,
  StudentQuestion,
  SubmissionResultSummary,
} from '../types/exam';
import { QUESTION_TYPE_LABELS } from '../utils/examScoring';
import { DiagramRenderer } from './DiagramRenderer';

interface StudentExamPortalProps {
  initialExamCode?: string;
  isLockedStudentLink: boolean;
  onExitToList?: () => void;
}

type Stage = 'loading' | 'error' | 'login' | 'confirm' | 'exam' | 'result';
type FontScale = 'sm' | 'md' | 'lg';

function formatTimer(totalSeconds: number): string {
  const clamped = Math.max(0, totalSeconds);
  const hrs = Math.floor(clamped / 3600);
  const mins = Math.floor((clamped % 3600) / 60);
  const secs = clamped % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  if (hrs > 0) {
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  }
  return `${pad(mins)}:${pad(secs)}`;
}

function isAnswered(val: StudentAnswerValue | undefined): boolean {
  if (val === undefined || val === null) return false;
  if (Array.isArray(val)) return val.length > 0;
  return val.trim().length > 0;
}

export const StudentExamPortal: React.FC<StudentExamPortalProps> = ({
  initialExamCode,
  isLockedStudentLink,
  onExitToList,
}) => {
  const [stage, setStage] = useState<Stage>('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const [examCode, setExamCode] = useState(initialExamCode || '');
  const [examSummary, setExamSummary] = useState<StudentExamSummary | null>(null);

  // Student identity form
  const [studentName, setStudentName] = useState('');
  const [studentClass, setStudentClass] = useState('V-A');
  const [studentAbsen, setStudentAbsen] = useState('');
  const [tokenInput, setTokenInput] = useState('');
  const [formError, setFormError] = useState('');
  const [isStarting, setIsStarting] = useState(false);

  // Active exam state
  const [questions, setQuestions] = useState<StudentQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, StudentAnswerValue>>({});
  const [flaggedIds, setFlaggedIds] = useState<string[]>([]);
  const [startedAt, setStartedAt] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [fontScale, setFontScale] = useState<FontScale>('md');
  const [showNavDrawer, setShowNavDrawer] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Result state
  const [result, setResult] = useState<SubmissionResultSummary | null>(null);

  const answersRef = useRef(answers);
  answersRef.current = answers;
  const flaggedRef = useRef(flaggedIds);
  flaggedRef.current = flaggedIds;
  const autoSubmittedRef = useRef(false);

  useEffect(() => {
    let active = true;
    async function loadExam() {
      if (!initialExamCode) {
        setStage('error');
        setErrorMsg('Kode ujian tidak ditemukan pada tautan ini.');
        return;
      }
      setStage('loading');
      setErrorMsg('');
      try {
        const res = await fetch(`/api/student/exams/${encodeURIComponent(initialExamCode)}`);
        const data = await res.json();
        if (!active) return;
        if (!res.ok) {
          setStage('error');
          setErrorMsg(data.error || 'Paket ujian tidak tersedia.');
          return;
        }
        setExamSummary(data.exam);
        setExamCode(data.exam.shareCode);
        setStage('login');
      } catch {
        if (!active) return;
        setStage('error');
        setErrorMsg('Gagal terhubung ke server ujian. Periksa koneksi internet Anda.');
      }
    }
    loadExam();
    return () => {
      active = false;
    };
  }, [initialExamCode]);

  // Scroll to top when stage or current question changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [stage, currentIndex]);

  // Countdown timer during active exam
  useEffect(() => {
    if (stage !== 'exam') return;
    const interval = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(interval);
          if (!autoSubmittedRef.current) {
            autoSubmittedRef.current = true;
            void handleFinalSubmit(true);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  const handleLoginNext = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!studentName.trim()) {
      setFormError('Silakan masukkan nama lengkap kamu terlebih dahulu.');
      return;
    }
    if (!studentClass.trim()) {
      setFormError('Silakan masukkan kelas kamu (contoh: V-A).');
      return;
    }
    if (examSummary?.requiresToken && !tokenInput.trim()) {
      setFormError('Paket ujian ini memerlukan Token dari guru.');
      return;
    }
    setStage('confirm');
  };

  const handleStartExam = async () => {
    if (!examSummary) return;
    setIsStarting(true);
    setFormError('');
    try {
      const res = await fetch(
        `/api/student/exams/${encodeURIComponent(examSummary.shareCode)}/start`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            studentName: studentName.trim(),
            studentClass: studentClass.trim(),
            studentAbsen: studentAbsen.trim(),
            token: tokenInput.trim(),
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || 'Tidak dapat memulai ujian.');
        setStage('login');
        return;
      }
      setExamSummary(data.exam);
      setQuestions(data.questions);
      setAnswers({});
      setFlaggedIds([]);
      setCurrentIndex(0);
      setStartedAt(data.startedAt);
      setSecondsLeft(data.exam.durationMinutes * 60);
      autoSubmittedRef.current = false;
      setStage('exam');
    } catch {
      setFormError('Terjadi gangguan jaringan saat memulai ujian.');
      setStage('login');
    } finally {
      setIsStarting(false);
    }
  };

  const handleFinalSubmit = async (isTimeout = false) => {
    if (!examSummary || isSubmitting) return;
    setIsSubmitting(true);
    setShowSubmitConfirm(false);
    const totalSeconds = examSummary.durationMinutes * 60;
    const usedSeconds = isTimeout ? totalSeconds : Math.max(0, totalSeconds - secondsLeft);

    try {
      const res = await fetch('/api/student/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          examCode: examSummary.shareCode,
          studentName: studentName.trim(),
          studentClass: studentClass.trim(),
          studentAbsen: studentAbsen.trim(),
          answers: answersRef.current,
          flaggedQuestionIds: flaggedRef.current,
          questionOrderIds: questions.map((q) => q.id),
          startedAt,
          durationUsedSeconds: usedSeconds,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Gagal menyimpan jawaban.');
        setIsSubmitting(false);
        return;
      }
      setResult(data);
      setStage('result');
    } catch {
      setErrorMsg('Gagal mengirim jawaban. Periksa koneksi lalu coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentQuestion = questions[currentIndex];

  const stats = useMemo(() => {
    let answered = 0;
    for (const q of questions) {
      if (isAnswered(answers[q.id])) answered += 1;
    }
    const flagged = flaggedIds.length;
    const unanswered = Math.max(0, questions.length - answered);
    return { answered, flagged, unanswered };
  }, [questions, answers, flaggedIds]);

  const toggleFlag = (qid: string) => {
    setFlaggedIds((prev) =>
      prev.includes(qid) ? prev.filter((id) => id !== qid) : [...prev, qid]
    );
  };

  const setSingleAnswer = (qid: string, val: string) => {
    setAnswers((prev) => ({ ...prev, [qid]: val }));
  };

  const toggleComplexAnswer = (qid: string, optId: string) => {
    setAnswers((prev) => {
      const current = Array.isArray(prev[qid]) ? (prev[qid] as string[]) : [];
      const next = current.includes(optId)
        ? current.filter((x) => x !== optId)
        : [...current, optId];
      return { ...prev, [qid]: next };
    });
  };

  const textSizeClass =
    fontScale === 'sm'
      ? 'text-[14px] leading-relaxed'
      : fontScale === 'lg'
        ? 'text-[18px] leading-relaxed'
        : 'text-[16px] leading-relaxed';

  // --- LOADING ---
  if (stage === 'loading') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-xl p-8 text-center">
          <div className="w-10 h-10 border-3 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-sm font-medium text-slate-700">Memuat paket soal ASAS...</p>
        </div>
      </div>
    );
  }

  // --- ERROR ---
  if (stage === 'error') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-xl p-8 text-center">
          <AlertTriangle className="w-10 h-10 text-amber-600 mx-auto" />
          <h1 className="mt-4 text-xl font-bold text-slate-900">Tautan Ujian Tidak Tersedia</h1>
          <p className="mt-2 text-sm text-slate-600">{errorMsg}</p>
          {!isLockedStudentLink && onExitToList && (
            <button
              type="button"
              onClick={onExitToList}
              className="mt-6 px-4 py-2.5 bg-sky-700 text-white text-sm font-semibold rounded-lg hover:bg-sky-800 transition-colors"
            >
              Kembali ke Daftar Latihan
            </button>
          )}
        </div>
      </div>
    );
  }

  // --- STEP 1: STUDENT LOGIN ---
  if (stage === 'login' && examSummary) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <header className="bg-white border-b border-slate-200 px-6 py-4">
          <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-sky-700 text-white flex items-center justify-center shrink-0">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <div className="text-base font-bold text-slate-900 whitespace-nowrap">
                  TKA ASAS SD
                </div>
                <div className="text-xs text-slate-500 whitespace-nowrap">
                  {examSummary.schoolName}
                </div>
              </div>
            </div>
            {!isLockedStudentLink && onExitToList && (
              <button
                type="button"
                onClick={onExitToList}
                className="text-sm font-medium text-slate-600 hover:text-slate-900 whitespace-nowrap shrink-0"
              >
                Pilih Paket Lain
              </button>
            )}
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-xl p-6 sm:p-8">
            <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-sky-700">
              <span>{examSummary.assessmentType}</span>
              <span aria-hidden="true">·</span>
              <span>{examSummary.subject}</span>
              <span aria-hidden="true">·</span>
              <span>{examSummary.gradeLevel}</span>
            </div>
            <h1 className="mt-2 text-2xl font-bold text-slate-900">{examSummary.title}</h1>
            <p className="mt-1.5 text-sm text-slate-600">
              Silakan isi identitas peserta dengan benar sebelum memulai ujian.
            </p>

            <div className="mt-4 py-3 px-4 bg-slate-50 border border-slate-200 rounded-lg flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-slate-600 tabular-nums">
              <span>
                Kode: <strong className="font-mono text-slate-900">{examSummary.shareCode}</strong>
              </span>
              <span>
                Jumlah Soal: <strong className="text-slate-900">{examSummary.questionCount}</strong>
              </span>
              <span>
                Waktu: <strong className="text-slate-900">{examSummary.durationMinutes} Menit</strong>
              </span>
            </div>

            {formError && (
              <div
                role="alert"
                className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700 flex items-start gap-2"
              >
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleLoginNext} className="mt-5 space-y-4">
              <div>
                <label htmlFor="student-name" className="block text-sm font-semibold text-slate-800 mb-1.5">
                  Nama Lengkap Peserta
                </label>
                <input
                  id="student-name"
                  type="text"
                  required
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="Contoh: Raka Pratama"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-600 focus:border-sky-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="student-class" className="block text-sm font-semibold text-slate-800 mb-1.5">
                    Kelas
                  </label>
                  <input
                    id="student-class"
                    type="text"
                    required
                    value={studentClass}
                    onChange={(e) => setStudentClass(e.target.value)}
                    placeholder="Contoh: V-A"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-600 focus:border-sky-600"
                  />
                </div>
                <div>
                  <label htmlFor="student-absen" className="block text-sm font-semibold text-slate-800 mb-1.5">
                    No. Absen / NISN (Opsional)
                  </label>
                  <input
                    id="student-absen"
                    type="text"
                    value={studentAbsen}
                    onChange={(e) => setStudentAbsen(e.target.value)}
                    placeholder="Contoh: 12"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-600 focus:border-sky-600"
                  />
                </div>
              </div>

              {examSummary.requiresToken && (
                <div>
                  <label htmlFor="exam-token" className="block text-sm font-semibold text-slate-800 mb-1.5">
                    Token Ujian (dari Guru)
                  </label>
                  <input
                    id="exam-token"
                    type="text"
                    required
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value.toUpperCase())}
                    placeholder="Masukkan token ujian"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm font-mono uppercase text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-600 focus:border-sky-600"
                  />
                </div>
              )}

              <button
                type="submit"
                className="w-full mt-2 py-3 px-4 bg-sky-700 hover:bg-sky-800 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Lanjutkan ke Konfirmasi Data
              </button>
            </form>
          </div>
        </main>
      </div>
    );
  }

  // --- STEP 2: CONFIRMATION & PETUNJUK ---
  if (stage === 'confirm' && examSummary) {
    const activeBreakdown = (
      Object.entries(examSummary.countsByType) as Array<[keyof typeof QUESTION_TYPE_LABELS, number]>
    ).filter(([, count]) => count > 0);

    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <header className="bg-white border-b border-slate-200 px-6 py-4">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="text-base font-bold text-slate-900">Konfirmasi Data Peserta</div>
            <div className="text-xs text-slate-500">{examSummary.schoolName}</div>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
          <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-xl p-6 sm:p-8">
            <h1 className="text-xl font-bold text-slate-900">{examSummary.title}</h1>
            <p className="mt-1 text-sm text-slate-600">
              Periksa data diri dan petunjuk pengerjaan sebelum menekan tombol mulai.
            </p>

            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 border border-slate-200 rounded-lg text-sm">
              <div>
                <div className="text-xs text-slate-500">Nama Peserta</div>
                <div className="font-semibold text-slate-900">{studentName}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Kelas / No. Absen</div>
                <div className="font-semibold text-slate-900">
                  {studentClass} · {studentAbsen.trim() || '-'}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Mata Pelajaran</div>
                <div className="font-semibold text-slate-900">{examSummary.subject}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Alokasi Waktu</div>
                <div className="font-semibold text-slate-900 tabular-nums">
                  {examSummary.durationMinutes} Menit
                </div>
              </div>
              <div className="sm:col-span-2">
                <div className="text-xs text-slate-500">Komposisi Bentuk Soal</div>
                <div className="font-medium text-slate-800 mt-0.5 tabular-nums">
                  {activeBreakdown
                    .map(([type, count]) => `${count} ${QUESTION_TYPE_LABELS[type]}`)
                    .join(' · ')}
                </div>
              </div>
            </div>

            <div className="mt-6">
              <h2 className="text-sm font-bold text-slate-900">Petunjuk Umum Pengerjaan</h2>
              <ul className="mt-2.5 space-y-2 text-sm text-slate-700 list-disc pl-5">
                {examSummary.instructions.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>

            <div className="mt-8 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 pt-5 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setStage('login')}
                className="px-4 py-2.5 border border-slate-300 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Ubah Data Peserta
              </button>
              <button
                type="button"
                disabled={isStarting}
                onClick={handleStartExam}
                className="px-6 py-2.5 bg-sky-700 hover:bg-sky-800 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
              >
                {isStarting ? 'Menyiapkan Soal...' : 'Mulai Ujian Sekarang'}
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // --- STEP 3: ACTIVE TKA CBT INTERFACE ---
  if (stage === 'exam' && examSummary && currentQuestion) {
    const isLowTime = secondsLeft <= 300;
    const isCurrentFlagged = flaggedIds.includes(currentQuestion.id);
    const currentAnswer = answers[currentQuestion.id];

    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        {/* CBT Sticky Header — Zero Teacher Portal links */}
        <header className="sticky top-0 z-20 bg-white border-b border-slate-200 px-4 sm:px-6 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="text-sm sm:text-base font-bold text-slate-900 truncate">
                {examSummary.title}
              </div>
              <div className="text-xs text-slate-500 truncate">
                {studentName} · {studentClass}
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {/* Font size controls */}
              <div
                className="hidden sm:flex items-center border border-slate-200 rounded-lg p-0.5 bg-slate-50"
                role="group"
                aria-label="Ukuran huruf soal"
              >
                {(['sm', 'md', 'lg'] as FontScale[]).map((scale, i) => (
                  <button
                    key={scale}
                    type="button"
                    onClick={() => setFontScale(scale)}
                    aria-label={`Ukuran huruf ${scale === 'sm' ? 'kecil' : scale === 'md' ? 'sedang' : 'besar'}`}
                    className={`px-2 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                      fontScale === scale
                        ? 'bg-white text-sky-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {i === 0 ? 'A-' : i === 1 ? 'A' : 'A+'}
                  </button>
                ))}
              </div>

              {/* Countdown timer */}
              <div
                aria-live="polite"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-mono font-semibold tabular-nums ${
                  isLowTime
                    ? 'bg-red-50 border-red-200 text-red-700'
                    : 'bg-slate-50 border-slate-200 text-slate-900'
                }`}
              >
                <Clock className="w-4 h-4 shrink-0" />
                <span>{formatTimer(secondsLeft)}</span>
              </div>

              {/* Mobile Question Grid Drawer button */}
              <button
                type="button"
                onClick={() => setShowNavDrawer(true)}
                className="lg:hidden flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 bg-white rounded-lg text-xs font-semibold text-slate-800 hover:bg-slate-50 cursor-pointer"
              >
                <LayoutGrid className="w-4 h-4" />
                <span>Daftar Soal</span>
              </button>
            </div>
          </div>
        </header>

        {/* Main CBT Body */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 grid grid-cols-1 lg:grid-cols-[1fr_290px] gap-6 items-start">
          {/* Question Card */}
          <section
            aria-label={`Soal nomor ${currentIndex + 1}`}
            className="bg-white border border-slate-200 rounded-xl p-5 sm:p-7"
          >
            {/* Clean unboxed question metadata */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-100">
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-600 tabular-nums">
                <span className="text-sky-700 font-bold text-sm">
                  Soal Nomor {currentIndex + 1} dari {questions.length}
                </span>
                <span aria-hidden="true">·</span>
                <span>{currentQuestion.subject}</span>
                <span aria-hidden="true">·</span>
                <span>{QUESTION_TYPE_LABELS[currentQuestion.type]}</span>
              </div>
              {isCurrentFlagged && (
                <div className="flex items-center gap-1 text-xs font-semibold text-amber-700">
                  <Flag className="w-3.5 h-3.5" />
                  <span>Ditandai Ragu-Ragu</span>
                </div>
              )}
            </div>

            {/* Optional Reading Passage */}
            {currentQuestion.passage && (
              <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 whitespace-pre-line leading-relaxed">
                {currentQuestion.passage}
              </div>
            )}

            {/* Optional Table Data */}
            {currentQuestion.tableData && (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-sm border-collapse border border-slate-200">
                  <thead>
                    <tr className="bg-slate-100">
                      {currentQuestion.tableData.headers.map((h, i) => (
                        <th
                          key={i}
                          className="border border-slate-200 px-3 py-2 text-left font-semibold text-slate-800"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {currentQuestion.tableData.rows.map((row, rIdx) => (
                      <tr key={rIdx} className="bg-white">
                        {row.map((cell, cIdx) => (
                          <td
                            key={cIdx}
                            className="border border-slate-200 px-3 py-2 text-slate-700"
                          >
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Optional SVG Diagram */}
            <DiagramRenderer diagramId={currentQuestion.diagramId} />

            {/* Prompt */}
            <div className={`mt-5 font-medium text-slate-900 whitespace-pre-line ${textSizeClass}`}>
              {currentQuestion.prompt}
            </div>

            {/* Answer Controls by Question Type */}
            <div className="mt-6">
              {currentQuestion.type === 'pg' && currentQuestion.options && (
                <div className="space-y-3" role="radiogroup" aria-label="Pilihan jawaban">
                  {currentQuestion.options.map((opt) => {
                    const selected = currentAnswer === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() => setSingleAnswer(currentQuestion.id, opt.id)}
                        className={`w-full min-h-[52px] text-left px-4 py-3 rounded-xl border transition-colors flex items-center gap-3.5 cursor-pointer ${
                          selected
                            ? 'bg-sky-50 border-sky-600 text-slate-900'
                            : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-800'
                        }`}
                      >
                        <span
                          className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 ${
                            selected
                              ? 'bg-sky-700 text-white'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {opt.id}
                        </span>
                        <span className={textSizeClass}>{opt.text}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {currentQuestion.type === 'pg_kompleks' && currentQuestion.options && (
                <div className="space-y-3">
                  <p className="text-xs font-medium text-slate-500">
                    Pilih lebih dari satu jawaban yang benar (centang semua yang sesuai).
                  </p>
                  {currentQuestion.options.map((opt) => {
                    const selectedArr = Array.isArray(currentAnswer) ? currentAnswer : [];
                    const selected = selectedArr.includes(opt.id);
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        role="checkbox"
                        aria-checked={selected}
                        onClick={() => toggleComplexAnswer(currentQuestion.id, opt.id)}
                        className={`w-full min-h-[52px] text-left px-4 py-3 rounded-xl border transition-colors flex items-center gap-3.5 cursor-pointer ${
                          selected
                            ? 'bg-sky-50 border-sky-600 text-slate-900'
                            : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-800'
                        }`}
                      >
                        <span
                          className={`w-6 h-6 rounded-md border flex items-center justify-center shrink-0 ${
                            selected
                              ? 'bg-sky-700 border-sky-700 text-white'
                              : 'bg-white border-slate-300'
                          }`}
                        >
                          {selected && <Check className="w-4 h-4" />}
                        </span>
                        <span className="text-sm font-bold text-slate-700 w-5 shrink-0">
                          {opt.id}.
                        </span>
                        <span className={textSizeClass}>{opt.text}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {currentQuestion.type === 'benar_salah' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" role="radiogroup">
                  {[
                    { id: 'BENAR', label: 'Benar' },
                    { id: 'SALAH', label: 'Salah' },
                  ].map((opt) => {
                    const selected = currentAnswer === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() => setSingleAnswer(currentQuestion.id, opt.id)}
                        className={`min-h-[56px] px-5 py-3.5 rounded-xl border font-semibold text-base transition-colors flex items-center justify-center gap-2 cursor-pointer ${
                          selected
                            ? 'bg-sky-50 border-sky-600 text-sky-900'
                            : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-800'
                        }`}
                      >
                        {selected && <CheckCircle2 className="w-5 h-5 text-sky-700" />}
                        <span>{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {currentQuestion.type === 'isian_singkat' && (
                <div>
                  <label
                    htmlFor={`isian-${currentQuestion.id}`}
                    className="block text-sm font-semibold text-slate-700 mb-2"
                  >
                    Ketik Jawaban Singkat:
                  </label>
                  <input
                    id={`isian-${currentQuestion.id}`}
                    type="text"
                    value={typeof currentAnswer === 'string' ? currentAnswer : ''}
                    onChange={(e) => setSingleAnswer(currentQuestion.id, e.target.value)}
                    placeholder="Tulis jawabanmu di sini..."
                    className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-600 focus:border-sky-600"
                  />
                </div>
              )}

              {currentQuestion.type === 'uraian' && (
                <div>
                  <label
                    htmlFor={`uraian-${currentQuestion.id}`}
                    className="block text-sm font-semibold text-slate-700 mb-2"
                  >
                    Jawaban Uraian / Langkah Penyelesaian:
                  </label>
                  <textarea
                    id={`uraian-${currentQuestion.id}`}
                    rows={6}
                    value={typeof currentAnswer === 'string' ? currentAnswer : ''}
                    onChange={(e) => setSingleAnswer(currentQuestion.id, e.target.value)}
                    placeholder="Tuliskan jawaban lengkap beserta langkah atau penjelasanmu di sini..."
                    className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-600 focus:border-sky-600"
                  />
                  <div className="mt-1.5 text-xs text-slate-500 tabular-nums">
                    Jumlah karakter: {typeof currentAnswer === 'string' ? currentAnswer.length : 0}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Navigation Controls */}
            <div className="mt-8 pt-5 border-t border-slate-200 flex items-center justify-between gap-1.5 sm:gap-3">
              <button
                type="button"
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
                className="inline-flex items-center justify-center gap-1 sm:gap-1.5 px-2.5 sm:px-4 py-2.5 border border-slate-300 bg-white text-slate-800 text-xs sm:text-sm font-semibold rounded-lg hover:bg-slate-50 disabled:opacity-40 whitespace-nowrap cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                <span>Sebelumnya</span>
              </button>

              <button
                type="button"
                onClick={() => toggleFlag(currentQuestion.id)}
                className={`inline-flex items-center justify-center gap-1 sm:gap-1.5 px-2.5 sm:px-4 py-2.5 border text-xs sm:text-sm font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                  isCurrentFlagged
                    ? 'bg-amber-50 border-amber-400 text-amber-800'
                    : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Flag className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                <span>{isCurrentFlagged ? 'Hapus Ragu' : 'Ragu-Ragu'}</span>
              </button>

              {currentIndex < questions.length - 1 ? (
                <button
                  type="button"
                  onClick={() =>
                    setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))
                  }
                  className="inline-flex items-center justify-center gap-1 sm:gap-1.5 px-3 sm:px-5 py-2.5 bg-sky-700 hover:bg-sky-800 text-white text-xs sm:text-sm font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                >
                  <span>Selanjutnya</span>
                  <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowSubmitConfirm(true)}
                  className="inline-flex items-center justify-center gap-1 sm:gap-1.5 px-3 sm:px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                  <span>Selesai</span>
                </button>
              )}
            </div>
          </section>

          {/* Desktop Question Grid Navigator */}
          <aside
            aria-label="Daftar nomor soal"
            className="hidden lg:block bg-white border border-slate-200 rounded-xl p-5 sticky top-20"
          >
            <h2 className="text-sm font-bold text-slate-900">Daftar Nomor Soal</h2>
            <div className="mt-2 flex items-center gap-3 text-xs text-slate-600 tabular-nums">
              <span>Dijawab: <strong className="text-emerald-700">{stats.answered}</strong></span>
              <span>·</span>
              <span>Ragu: <strong className="text-amber-700">{stats.flagged}</strong></span>
              <span>·</span>
              <span>Kosong: <strong className="text-slate-800">{stats.unanswered}</strong></span>
            </div>

            <div className="mt-4 grid grid-cols-5 gap-2">
              {questions.map((q, idx) => {
                const answered = isAnswered(answers[q.id]);
                const flagged = flaggedIds.includes(q.id);
                const active = idx === currentIndex;
                let btnClass = 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50';
                let statusText = 'belum dijawab';
                if (flagged) {
                  btnClass = 'bg-amber-50 border-amber-500 text-amber-900';
                  statusText = 'ditandai ragu-ragu';
                } else if (answered) {
                  btnClass = 'bg-sky-700 border-sky-700 text-white';
                  statusText = 'sudah dijawab';
                }

                return (
                  <button
                    key={q.id}
                    type="button"
                    aria-label={`Soal ${idx + 1}, ${statusText}`}
                    aria-current={active ? 'step' : undefined}
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-10 rounded-lg border text-xs font-mono font-semibold tabular-nums transition-all cursor-pointer ${btnClass} ${
                      active ? 'ring-2 ring-slate-900 ring-offset-1' : ''
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setShowSubmitConfirm(true)}
              className="mt-5 w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Kumpulkan Ujian</span>
            </button>
          </aside>
        </main>

        {/* Mobile Question Drawer */}
        {showNavDrawer && (
          <div className="fixed inset-0 z-40 bg-slate-900/50 flex justify-end lg:hidden">
            <div className="w-80 max-w-full bg-white h-full p-5 flex flex-col overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <h2 className="text-base font-bold text-slate-900">Daftar Nomor Soal</h2>
                <button
                  type="button"
                  aria-label="Tutup daftar soal"
                  onClick={() => setShowNavDrawer(false)}
                  className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="mt-3 text-xs text-slate-600 flex gap-3 tabular-nums">
                <span>Dijawab: {stats.answered}</span>
                <span>·</span>
                <span>Ragu: {stats.flagged}</span>
                <span>·</span>
                <span>Kosong: {stats.unanswered}</span>
              </div>
              <div className="mt-4 grid grid-cols-5 gap-2">
                {questions.map((q, idx) => {
                  const answered = isAnswered(answers[q.id]);
                  const flagged = flaggedIds.includes(q.id);
                  const active = idx === currentIndex;
                  let btnClass = 'bg-white border-slate-300 text-slate-700';
                  if (flagged) btnClass = 'bg-amber-50 border-amber-500 text-amber-900';
                  else if (answered) btnClass = 'bg-sky-700 border-sky-700 text-white';

                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => {
                        setCurrentIndex(idx);
                        setShowNavDrawer(false);
                      }}
                      className={`h-11 rounded-lg border text-xs font-mono font-semibold tabular-nums ${btnClass} ${
                        active ? 'ring-2 ring-slate-900' : ''
                      }`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowNavDrawer(false);
                  setShowSubmitConfirm(true);
                }}
                className="mt-auto w-full py-3 bg-emerald-700 text-white text-sm font-semibold rounded-lg"
              >
                Kumpulkan Ujian
              </button>
            </div>
          </div>
        )}

        {/* Submit Confirmation Modal */}
        {showSubmitConfirm && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="submit-confirm-title"
            className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4"
          >
            <div className="w-full max-w-md bg-white border border-slate-200 rounded-xl p-6">
              <h2 id="submit-confirm-title" className="text-lg font-bold text-slate-900">
                Konfirmasi Pengumpulan Ujian
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Apakah kamu yakin ingin menyelesaikan dan mengumpulkan jawaban sekarang?
              </p>

              <div className="mt-4 p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5 text-sm tabular-nums">
                <div className="flex justify-between">
                  <span className="text-slate-600">Soal sudah dijawab</span>
                  <strong className="text-emerald-700">{stats.answered} soal</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Ditandai ragu-ragu</span>
                  <strong className="text-amber-700">{stats.flagged} soal</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Belum dijawab</span>
                  <strong className="text-slate-900">{stats.unanswered} soal</strong>
                </div>
              </div>

              {(stats.unanswered > 0 || stats.flagged > 0) && (
                <p className="mt-3 text-xs text-amber-700 font-medium">
                  Catatan: Masih ada soal yang kosong atau ditandai ragu-ragu. Kamu boleh memeriksa kembali sebelum mengumpulkan.
                </p>
              )}

              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowSubmitConfirm(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  Periksa Kembali
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => void handleFinalSubmit(false)}
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold rounded-lg disabled:opacity-60 cursor-pointer"
                >
                  {isSubmitting ? 'Mengirim...' : 'Ya, Kumpulkan'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // --- STEP 4: SUBMISSION RECEIPT & OPTIONAL REVIEW ---
  if (stage === 'result' && result) {
    const { submission, showResults, reviews } = result;
    return (
      <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-semibold text-emerald-700">
                  Jawaban Terkirim · {submission.examCode}
                </div>
                <h1 className="mt-1 text-2xl font-bold text-slate-900">
                  Ujian Berhasil Dikumpulkan
                </h1>
                <p className="mt-1 text-sm text-slate-600">
                  Terima kasih, <strong>{submission.studentName}</strong> ({submission.studentClass}).
                  Jawaban kamu sudah tersimpan untuk diperiksa guru.
                </p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 border border-slate-200 rounded-lg text-sm tabular-nums">
              <div>
                <div className="text-xs text-slate-500">Mata Pelajaran</div>
                <div className="font-semibold text-slate-900">{submission.subject}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Durasi Pengerjaan</div>
                <div className="font-semibold text-slate-900">
                  {Math.max(1, Math.round(submission.durationUsedSeconds / 60))} Menit
                </div>
              </div>
              {showResults && submission.objectiveTotalCount > 0 && (
                <div>
                  <div className="text-xs text-slate-500">Jawaban Objektif Benar</div>
                  <div className="font-semibold text-emerald-700">
                    {submission.objectiveCorrectCount} / {submission.objectiveTotalCount}
                  </div>
                </div>
              )}
              {showResults && (
                <div>
                  <div className="text-xs text-slate-500">
                    {submission.essayTotalCount > 0 ? 'Nilai Objektif (Sementara)' : 'Nilai Akhir'}
                  </div>
                  <div className="font-bold text-lg text-sky-700">
                    {submission.finalScore ?? submission.objectiveScore ?? '-'}
                  </div>
                </div>
              )}
            </div>

            {submission.essayTotalCount > 0 && (
              <div className="mt-4 p-3.5 bg-sky-50 border border-sky-200 rounded-lg text-sm text-sky-900">
                Paket ini memiliki <strong>{submission.essayTotalCount} soal uraian</strong>. Nilai
                akhir akan dihitung setelah guru memeriksa jawaban uraian kamu.
              </div>
            )}

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setResult(null);
                  setAnswers({});
                  setFlaggedIds([]);
                  setStage('login');
                }}
                className="px-4 py-2.5 bg-sky-700 hover:bg-sky-800 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Latihan Ulang
              </button>
              {!isLockedStudentLink && onExitToList && (
                <button
                  type="button"
                  onClick={onExitToList}
                  className="px-4 py-2.5 border border-slate-300 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Pilih Paket Ujian Lain
                </button>
              )}
            </div>
          </div>

          {showResults && reviews && reviews.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8">
              <h2 className="text-lg font-bold text-slate-900">Pembahasan & Ringkasan Jawaban</h2>
              <div className="mt-4 divide-y divide-slate-200">
                {reviews.map((item, idx) => {
                  const ansDisplay = Array.isArray(item.studentAnswer)
                    ? item.studentAnswer.join(', ')
                    : item.studentAnswer || '(Kosong)';
                  const keyDisplay = Array.isArray(item.correctAnswer)
                    ? item.correctAnswer.join(', ')
                    : item.correctAnswer;

                  return (
                    <div key={item.questionId} className="py-4 first:pt-0 last:pb-0">
                      <div className="flex items-center justify-between gap-2 text-xs font-semibold">
                        <span className="text-slate-600 tabular-nums">
                          Nomor {idx + 1} · {QUESTION_TYPE_LABELS[item.type]}
                        </span>
                        {item.isObjective ? (
                          <span
                            className={
                              item.isCorrect ? 'text-emerald-700' : 'text-red-700'
                            }
                          >
                            {item.isCorrect ? 'Benar' : 'Kurang Tepat'}
                          </span>
                        ) : (
                          <span className="text-sky-700">Menunggu Koreksi Guru</span>
                        )}
                      </div>
                      <p className="mt-1.5 text-sm font-medium text-slate-900 whitespace-pre-line">
                        {item.prompt}
                      </p>
                      <div className="mt-2 text-xs text-slate-700 space-y-1">
                        <div>
                          <span className="text-slate-500">Jawaban kamu: </span>
                          <span className="font-semibold">{ansDisplay}</span>
                        </div>
                        {keyDisplay && (
                          <div>
                            <span className="text-slate-500">
                              {item.isObjective ? 'Kunci jawaban: ' : 'Pedoman jawaban: '}
                            </span>
                            <span className="font-semibold text-emerald-800">{keyDisplay}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
};
