import React, { useMemo, useState } from 'react';
import { X } from 'lucide-react';
import type {
  AssessmentType,
  CountsByType,
  ExamPackage,
  Question,
  QuestionType,
  ScoringMode,
} from '../types/exam';
import { QUESTION_TYPE_LABELS } from '../utils/examScoring';
import { STANDARD_SUBJECTS } from '../data/subjects';

interface TeacherExamModalProps {
  initialExam?: ExamPackage | null;
  allQuestions: Question[];
  onClose: () => void;
  onSave: (payload: Partial<ExamPackage>, editId?: string) => Promise<void>;
}

const ASSESSMENT_TYPES: AssessmentType[] = [
  'ASAS Ganjil',
  'Simulasi TKA',
  'Latihan Harian',
  'Tryout Terpadu',
];

export const TeacherExamModal: React.FC<TeacherExamModalProps> = ({
  initialExam,
  allQuestions,
  onClose,
  onSave,
}) => {
  const [title, setTitle] = useState(initialExam?.title || '');
  const [subject, setSubject] = useState<string>(initialExam?.subject || 'IPAS');
  const [assessmentType, setAssessmentType] = useState<AssessmentType>(
    initialExam?.assessmentType || 'Latihan Harian'
  );
  const [durationMinutes, setDurationMinutes] = useState(
    initialExam?.durationMinutes ?? 60
  );
  const [token, setToken] = useState(initialExam?.token || '');
  const [selectionMode, setSelectionMode] = useState<'auto' | 'manual'>(
    initialExam?.selectionMode || 'auto'
  );
  const [countsByType, setCountsByType] = useState<CountsByType>(
    initialExam?.countsByType || {
      pg: 10,
      pg_kompleks: 0,
      benar_salah: 0,
      isian_singkat: 0,
      uraian: 2,
    }
  );
  const [manualIds, setManualIds] = useState<string[]>(initialExam?.questionIds || []);
  const [shuffleQuestions, setShuffleQuestions] = useState(
    initialExam?.shuffleQuestions ?? false
  );
  const [shuffleOptions, setShuffleOptions] = useState(
    initialExam?.shuffleOptions ?? false
  );
  const [showResultsToStudent, setShowResultsToStudent] = useState(
    initialExam?.showResultsToStudent ?? true
  );
  const [isActive, setIsActive] = useState(initialExam?.isActive ?? true);
  const [scoringMode, setScoringMode] = useState<ScoringMode>(
    initialExam?.scoringMode || 'weighted_split'
  );
  const [objectiveWeightPercent, setObjectiveWeightPercent] = useState<number>(
    initialExam?.objectiveWeightPercent ?? 60
  );
  const [essayWeightPercent, setEssayWeightPercent] = useState<number>(
    initialExam?.essayWeightPercent ?? 40
  );
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const availableSubjects = useMemo(() => {
    const set = new Set([...STANDARD_SUBJECTS, ...allQuestions.map((q) => q.subject)]);
    return ['Campuran', ...Array.from(set)];
  }, [allQuestions]);

  const subjectQuestions = useMemo(() => {
    return subject === 'Campuran'
      ? allQuestions
      : allQuestions.filter((q) => q.subject === subject);
  }, [allQuestions, subject]);

  const availableCounts = useMemo(() => {
    const map: CountsByType = {
      pg: 0,
      pg_kompleks: 0,
      benar_salah: 0,
      isian_singkat: 0,
      uraian: 0,
    };
    for (const q of subjectQuestions) {
      map[q.type] = (map[q.type] || 0) + 1;
    }
    return map;
  }, [subjectQuestions]);

  const totalAutoSelected = useMemo(() => {
    return (Object.keys(countsByType) as QuestionType[]).reduce(
      (sum, t) => sum + Math.min(countsByType[t] || 0, availableCounts[t] || 0),
      0
    );
  }, [countsByType, availableCounts]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!title.trim()) {
      setError('Judul paket ujian wajib diisi.');
      return;
    }
    if (selectionMode === 'auto' && totalAutoSelected === 0) {
      setError('Pilih minimal 1 soal dari bentuk soal yang tersedia.');
      return;
    }
    if (selectionMode === 'manual' && manualIds.length === 0) {
      setError('Centang minimal 1 soal pada mode pilih manual.');
      return;
    }

    setSaving(true);
    try {
      await onSave(
        {
          title: title.trim(),
          subject,
          assessmentType,
          durationMinutes: Number(durationMinutes) || 60,
          token: token.trim().toUpperCase(),
          selectionMode,
          countsByType,
          questionIds: manualIds,
          shuffleQuestions,
          shuffleOptions,
          showResultsToStudent,
          isActive,
          scoringMode,
          objectiveWeightPercent,
          essayWeightPercent,
        },
        initialExam?.id
      );
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan paket ujian.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="exam-modal-title"
      className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4 overflow-y-auto"
    >
      <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-xl p-6 my-8 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <h2 id="exam-modal-title" className="text-lg font-bold text-slate-900">
            {initialExam ? 'Kelola Paket Ujian' : 'Buat Paket Ujian & Link Siswa'}
          </h2>
          <button
            type="button"
            aria-label="Tutup modal paket ujian"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div role="alert" className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label htmlFor="exam-title" className="block text-xs font-semibold text-slate-700 mb-1">
              Judul Paket Ujian / Latihan
            </label>
            <input
              id="exam-title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Latihan Persiapan ASAS IPAS Kelas V"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="exam-subject" className="block text-xs font-semibold text-slate-700 mb-1">
                Mata Pelajaran
              </label>
              <select
                id="exam-subject"
                value={subject}
                onChange={(e) => {
                  setSubject(e.target.value);
                  setManualIds([]);
                }}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
              >
                {availableSubjects.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="exam-kind" className="block text-xs font-semibold text-slate-700 mb-1">
                Jenis Asesmen
              </label>
              <select
                id="exam-kind"
                value={assessmentType}
                onChange={(e) => setAssessmentType(e.target.value as AssessmentType)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
              >
                {ASSESSMENT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="exam-duration" className="block text-xs font-semibold text-slate-700 mb-1">
                Durasi Pengerjaan (Menit)
              </label>
              <input
                id="exam-duration"
                type="number"
                min={5}
                max={180}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm tabular-nums"
              />
            </div>
            <div>
              <label htmlFor="exam-token" className="block text-xs font-semibold text-slate-700 mb-1">
                Token Masuk (Opsional — kosongkan jika tanpa token)
              </label>
              <input
                id="exam-token"
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value.toUpperCase())}
                placeholder="Contoh: SD2026"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono uppercase"
              />
            </div>
          </div>

          {/* Question Form & Count Configuration */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-900">
                Pengaturan Bentuk & Jumlah Soal
              </span>
              <div className="flex items-center gap-1 p-0.5 bg-slate-200 rounded-lg">
                <button
                  type="button"
                  onClick={() => setSelectionMode('auto')}
                  className={`px-3 py-1 text-xs font-semibold rounded-md cursor-pointer ${
                    selectionMode === 'auto'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600'
                  }`}
                >
                  Atur Jumlah Otomatis
                </button>
                <button
                  type="button"
                  onClick={() => setSelectionMode('manual')}
                  className={`px-3 py-1 text-xs font-semibold rounded-md cursor-pointer ${
                    selectionMode === 'manual'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600'
                  }`}
                >
                  Pilih Soal Manual
                </button>
              </div>
            </div>

            {selectionMode === 'auto' ? (
              <div className="space-y-2.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(Object.keys(QUESTION_TYPE_LABELS) as QuestionType[]).map((qType) => (
                    <div
                      key={qType}
                      className="flex items-center justify-between gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2"
                    >
                      <div className="min-w-0">
                        <label
                          htmlFor={`count-${qType}`}
                          className="block text-xs font-semibold text-slate-800 truncate"
                        >
                          {QUESTION_TYPE_LABELS[qType]}
                        </label>
                        <span className="text-[11px] text-slate-500 tabular-nums">
                          Tersedia: {availableCounts[qType]} soal
                        </span>
                      </div>
                      <input
                        id={`count-${qType}`}
                        type="number"
                        min={0}
                        max={availableCounts[qType]}
                        value={countsByType[qType] || 0}
                        onChange={(e) =>
                          setCountsByType((prev) => ({
                            ...prev,
                            [qType]: Math.max(0, Number(e.target.value)),
                          }))
                        }
                        className="w-16 px-2 py-1 border border-slate-300 rounded-md text-sm text-right tabular-nums"
                      />
                    </div>
                  ))}
                </div>
                <div className="text-xs font-semibold text-sky-800 tabular-nums">
                  Total soal terpilih: {totalAutoSelected} soal
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="text-xs text-slate-600 tabular-nums">
                  Terpilih: <strong>{manualIds.length}</strong> dari {subjectQuestions.length} soal tersedia
                </div>
                <div className="max-h-52 overflow-y-auto bg-white border border-slate-200 rounded-lg divide-y divide-slate-100">
                  {subjectQuestions.map((q) => {
                    const checked = manualIds.includes(q.id);
                    return (
                      <label
                        key={q.id}
                        className="flex items-start gap-2.5 px-3 py-2 text-xs hover:bg-slate-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() =>
                            setManualIds((prev) =>
                              prev.includes(q.id)
                                ? prev.filter((id) => id !== q.id)
                                : [...prev, q.id]
                            )
                          }
                          className="mt-0.5 accent-sky-700"
                        />
                        <div className="min-w-0">
                          <div className="font-semibold text-slate-500">
                            {q.subject} · {QUESTION_TYPE_LABELS[q.type]}
                          </div>
                          <div className="text-slate-800 line-clamp-2">{q.prompt}</div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Scoring Weight Configuration */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-900">
                Pengaturan Bobot Nilai Akhir Paket
              </span>
              <div className="flex items-center gap-1 p-0.5 bg-slate-200 rounded-lg">
                <button
                  type="button"
                  onClick={() => setScoringMode('weighted_split')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md cursor-pointer ${
                    scoringMode === 'weighted_split'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600'
                  }`}
                >
                  Persentase Bagian
                </button>
                <button
                  type="button"
                  onClick={() => setScoringMode('total_points')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md cursor-pointer ${
                    scoringMode === 'total_points'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600'
                  }`}
                >
                  Total Skor × Bobot Soal
                </button>
              </div>
            </div>

            {scoringMode === 'weighted_split' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="obj-weight-pct" className="block text-xs font-semibold text-slate-700 mb-1">
                    Bobot Soal Objektif (%)
                  </label>
                  <input
                    id="obj-weight-pct"
                    type="number"
                    min={0}
                    max={100}
                    value={objectiveWeightPercent}
                    onChange={(e) => {
                      const val = Math.max(0, Math.min(100, Number(e.target.value)));
                      setObjectiveWeightPercent(val);
                      setEssayWeightPercent(100 - val);
                    }}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm tabular-nums"
                  />
                </div>
                <div>
                  <label htmlFor="essay-weight-pct" className="block text-xs font-semibold text-slate-700 mb-1">
                    Bobot Soal Uraian (%)
                  </label>
                  <input
                    id="essay-weight-pct"
                    type="number"
                    min={0}
                    max={100}
                    value={essayWeightPercent}
                    onChange={(e) => {
                      const val = Math.max(0, Math.min(100, Number(e.target.value)));
                      setEssayWeightPercent(val);
                      setObjectiveWeightPercent(100 - val);
                    }}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm tabular-nums"
                  />
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-600">
                Nilai akhir dihitung langsung dari jumlah (Skor Diperoleh × Bobot Soal) dibagi total poin maksimal seluruh butir soal.
              </p>
            )}
          </div>

          {/* Behavioral Toggles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={shuffleQuestions}
                onChange={(e) => setShuffleQuestions(e.target.checked)}
                className="accent-sky-700"
              />
              <span className="text-slate-700">Acak urutan soal</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={shuffleOptions}
                onChange={(e) => setShuffleOptions(e.target.checked)}
                className="accent-sky-700"
              />
              <span className="text-slate-700">Acak opsi pilihan ganda</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showResultsToStudent}
                onChange={(e) => setShowResultsToStudent(e.target.checked)}
                className="accent-sky-700"
              />
              <span className="text-slate-700">Tampilkan nilai & pembahasan ke murid</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="accent-sky-700"
              />
              <span className="text-slate-700">Aktif (dapat diakses murid)</span>
            </label>
          </div>

          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-sky-700 hover:bg-sky-800 text-white rounded-lg text-sm font-semibold disabled:opacity-60 cursor-pointer"
            >
              {saving ? 'Menyimpan...' : 'Simpan Paket Ujian'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
