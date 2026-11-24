import React, { useEffect, useState } from 'react';
import { CheckCircle2, X } from 'lucide-react';
import type { QuestionReviewItem, StudentSubmission } from '../types/exam';
import { QUESTION_TYPE_LABELS } from '../utils/examScoring';

interface TeacherGradingModalProps {
  submissionId: string;
  authToken: string;
  onClose: () => void;
  onUpdated: (submission: StudentSubmission) => void;
}

export const TeacherGradingModal: React.FC<TeacherGradingModalProps> = ({
  submissionId,
  authToken,
  onClose,
  onUpdated,
}) => {
  const [loading, setLoading] = useState(true);
  const [submission, setSubmission] = useState<StudentSubmission | null>(null);
  const [reviews, setReviews] = useState<QuestionReviewItem[]>([]);
  const [essayScores, setEssayScores] = useState<Record<string, number>>({});
  const [teacherNote, setTeacherNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/teacher/submissions/${submissionId}`, {
          headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
        });
        const data = await res.json();
        if (!active) return;
        if (!res.ok) {
          setError(data.error || 'Gagal memuat detail jawaban.');
          return;
        }
        setSubmission(data.submission);
        setReviews(data.reviews || []);
        setEssayScores(data.submission.essayScores || {});
        setTeacherNote(data.submission.teacherNote || '');
      } catch {
        if (active) setError('Terjadi kesalahan jaringan.');
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [submissionId, authToken]);

  const handleSaveGrade = async () => {
    if (!submission) return;
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/teacher/submissions/${submission.id}/grade`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({ essayScores, teacherNote }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Gagal menyimpan penilaian.');
        return;
      }
      setSubmission(data.submission);
      setReviews(data.reviews || []);
      onUpdated(data.submission);
      onClose();
    } catch {
      setError('Gagal menghubungi server.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="grading-modal-title"
      className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4 overflow-y-auto"
    >
      <div className="w-full max-w-3xl bg-white border border-slate-200 rounded-xl p-6 my-8 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div>
            <h2 id="grading-modal-title" className="text-lg font-bold text-slate-900">
              Lembar Koreksi & Penilaian Siswa
            </h2>
            {submission && (
              <p className="text-xs text-slate-500 mt-0.5">
                {submission.studentName} · {submission.studentClass} · {submission.examTitle}
              </p>
            )}
          </div>
          <button
            type="button"
            aria-label="Tutup lembar koreksi"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading && <div className="py-10 text-center text-sm text-slate-600">Memuat jawaban siswa...</div>}

        {error && (
          <div role="alert" className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        {!loading && submission && (
          <div className="mt-4 space-y-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50 border border-slate-200 rounded-lg text-sm tabular-nums">
              <div>
                <div className="text-xs text-slate-500">Objektif Benar</div>
                <div className="font-bold text-slate-900">
                  {submission.objectiveCorrectCount} / {submission.objectiveTotalCount}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Nilai Objektif</div>
                <div className="font-bold text-slate-900">
                  {submission.objectiveScore ?? '-'}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Nilai Uraian</div>
                <div className="font-bold text-slate-900">{submission.essayScore ?? '-'}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Nilai Akhir</div>
                <div className="font-bold text-sky-700 text-lg">
                  {submission.finalScore ?? '-'}
                </div>
              </div>
            </div>

            <div className="divide-y divide-slate-200">
              {reviews.map((item, idx) => {
                const ansText = Array.isArray(item.studentAnswer)
                  ? item.studentAnswer.join(', ')
                  : item.studentAnswer || '(Tidak dijawab)';
                const keyText = Array.isArray(item.correctAnswer)
                  ? item.correctAnswer.join(', ')
                  : item.correctAnswer || '-';

                return (
                  <div key={item.questionId} className="py-4 first:pt-0">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold">
                      <span className="text-slate-600 tabular-nums">
                        No. {idx + 1} · {QUESTION_TYPE_LABELS[item.type]}
                      </span>
                      {item.isObjective ? (
                        <span
                          className={
                            item.isCorrect ? 'text-emerald-700' : 'text-red-700'
                          }
                        >
                          {item.isCorrect
                            ? `Benar (Skor ${item.maxScore} · Bobot ${item.weight ?? 1})`
                            : `Salah (0 · Bobot ${item.weight ?? 1})`}
                        </span>
                      ) : (
                        <span className="text-sky-700 tabular-nums">
                          Skor Maks Uraian: {item.maxScore} · Bobot {item.weight ?? 1}
                        </span>
                      )}
                    </div>

                    <p className="mt-1.5 text-sm font-medium text-slate-900 whitespace-pre-line">
                      {item.prompt}
                    </p>

                    <div className="mt-2.5 p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm space-y-1.5">
                      <div>
                        <span className="text-xs font-semibold text-slate-500 block">
                          Jawaban Siswa:
                        </span>
                        <div className="text-slate-900 whitespace-pre-line">{ansText}</div>
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-slate-500 block">
                          {item.isObjective ? 'Kunci Jawaban:' : 'Pedoman Jawaban:'}
                        </span>
                        <div className="text-emerald-800 whitespace-pre-line">{keyText}</div>
                      </div>
                      {item.rubric && (
                        <div className="text-xs text-slate-600 pt-1 border-t border-slate-200">
                          <strong>Rubrik:</strong> {item.rubric}
                        </div>
                      )}
                    </div>

                    {!item.isObjective && (
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span className="text-xs font-semibold text-slate-700 mr-1">
                          Beri Skor Uraian:
                        </span>
                        {Array.from({ length: item.maxScore + 1 }, (_, scoreVal) => {
                          const selected = essayScores[item.questionId] === scoreVal;
                          return (
                            <button
                              key={scoreVal}
                              type="button"
                              onClick={() =>
                                setEssayScores((prev) => ({
                                  ...prev,
                                  [item.questionId]: scoreVal,
                                }))
                              }
                              className={`w-9 h-9 rounded-lg border text-sm font-mono font-bold tabular-nums cursor-pointer transition-colors ${
                                selected
                                  ? 'bg-sky-700 border-sky-700 text-white'
                                  : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              {scoreVal}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div>
              <label htmlFor="teacher-note" className="block text-xs font-semibold text-slate-700 mb-1">
                Catatan Guru untuk Siswa (Opsional)
              </label>
              <input
                id="teacher-note"
                type="text"
                value={teacherNote}
                onChange={(e) => setTeacherNote(e.target.value)}
                placeholder="Contoh: Langkah perhitungan sudah rapi, pertahankan!"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>

            <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Tutup
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={handleSaveGrade}
                className="inline-flex items-center gap-1.5 px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-sm font-semibold disabled:opacity-60 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{saving ? 'Menyimpan...' : 'Simpan Nilai & Hitung Akhir'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
