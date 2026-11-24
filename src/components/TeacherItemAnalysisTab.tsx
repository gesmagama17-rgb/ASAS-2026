import React, { useEffect, useState } from 'react';
import { BarChart3, Check, Download, Edit3, Minus, X } from 'lucide-react';
import type { ExamItemAnalysis, ExamPackage, Question } from '../types/exam';
import { QUESTION_TYPE_LABELS } from '../utils/examScoring';

interface TeacherItemAnalysisTabProps {
  exams: ExamPackage[];
  questions: Question[];
  authToken: string;
  initialExamId?: string;
  onEditQuestion: (question: Question) => void;
  onOpenSubmission: (submissionId: string) => void;
}

export const TeacherItemAnalysisTab: React.FC<TeacherItemAnalysisTabProps> = ({
  exams,
  questions,
  authToken,
  initialExamId,
  onEditQuestion,
  onOpenSubmission,
}) => {
  const [selectedExamId, setSelectedExamId] = useState<string>(
    initialExamId || exams[0]?.id || ''
  );
  const [analysis, setAnalysis] = useState<ExamItemAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialExamId) {
      setSelectedExamId(initialExamId);
    } else if (!selectedExamId && exams.length > 0) {
      setSelectedExamId(exams[0].id);
    }
  }, [initialExamId, exams, selectedExamId]);

  useEffect(() => {
    if (!selectedExamId) {
      setAnalysis(null);
      return;
    }
    let active = true;
    async function loadAnalysis() {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(
          `/api/teacher/item-analysis/${encodeURIComponent(selectedExamId)}`,
          {
            headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
          }
        );
        const data = await res.json();
        if (!active) return;
        if (!res.ok) {
          setError(data.error || 'Gagal memuat analisis butir soal.');
          setAnalysis(null);
          return;
        }
        setAnalysis(data.analysis);
      } catch {
        if (active) setError('Gagal menghubungi server untuk memuat analisis butir soal.');
      } finally {
        if (active) setLoading(false);
      }
    }
    void loadAnalysis();
    return () => {
      active = false;
    };
  }, [selectedExamId, authToken, questions]);

  const exportAnalysisCsv = () => {
    if (!analysis) return;
    const headers = [
      'No',
      'Nama Siswa',
      'Kelas',
      ...analysis.questions.map((q) => `S${q.questionNumber}`),
      'Total Poin',
      'Nilai Akhir',
    ];
    const rows = analysis.studentRows.map((row, idx) => [
      String(idx + 1),
      row.studentName,
      row.studentClass,
      ...analysis.questions.map((q) => {
        const cell = row.cellDetails[q.questionId];
        if (!cell) return '-';
        const label =
          cell.status === 'correct'
            ? 'BENAR'
            : cell.status === 'wrong'
              ? 'SALAH'
              : 'MENUNGGU';
        return `${label} (${cell.studentAnswerText})`;
      }),
      `${row.totalEarnedPoints}/${row.totalMaxPoints}`,
      row.finalScore !== null ? String(row.finalScore) : row.objectiveScore !== null ? String(row.objectiveScore) : '-',
    ]);

    const csv =
      '\uFEFF' +
      [headers, ...rows]
        .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
        .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analisis-butir-${analysis.exam.shareCode}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (exams.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-10 text-center text-sm text-slate-600">
        Belum ada paket ujian untuk dianalisis.
      </div>
    );
  }

  const questionMap = new Map(questions.map((q) => [q.id, q]));

  return (
    <div className="space-y-6">
      {/* Selector & Legend Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="flex-1 min-w-0">
            <label htmlFor="analysis-exam-select" className="block text-xs font-semibold text-slate-600 mb-1">
              Pilih Paket Ujian untuk Dianalisis
            </label>
            <select
              id="analysis-exam-select"
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(e.target.value)}
              className="w-full sm:w-auto sm:min-w-[320px] px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-900"
            >
              {exams.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.title} ({ex.subject})
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            disabled={!analysis || analysis.studentRows.length === 0}
            onClick={exportAnalysisCsv}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold rounded-lg disabled:opacity-40 cursor-pointer whitespace-nowrap shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Unduh Tabel (CSV)</span>
          </button>
        </div>

        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-700">
          <span className="font-semibold text-slate-500">Keterangan Warna Sel:</span>
          <span className="inline-flex items-center gap-1.5 font-medium">
            <span className="w-4 h-4 rounded bg-emerald-100 border border-emerald-300 inline-flex items-center justify-center text-emerald-800">
              <Check className="w-3 h-3" />
            </span>
            <span>Hijau = Jawaban Benar (atau Uraian ≥ 60%)</span>
          </span>
          <span className="inline-flex items-center gap-1.5 font-medium">
            <span className="w-4 h-4 rounded bg-red-100 border border-red-300 inline-flex items-center justify-center text-red-800">
              <X className="w-3 h-3" />
            </span>
            <span>Merah = Jawaban Salah</span>
          </span>
          <span className="inline-flex items-center gap-1.5 font-medium">
            <span className="w-4 h-4 rounded bg-amber-50 border border-amber-300 inline-flex items-center justify-center text-amber-800">
              <Minus className="w-3 h-3" />
            </span>
            <span>Kuning = Uraian Belum Dinilai</span>
          </span>
        </div>
      </div>

      {loading && (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center text-sm text-slate-500">
          Menyusun tabel analisis butir soal...
        </div>
      )}

      {error && (
        <div role="alert" className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          {error}
        </div>
      )}

      {!loading && analysis && (
        <>
          {/* Summary KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <div className="text-xs font-medium text-slate-500">Jumlah Peserta</div>
              <div className="mt-1 text-2xl font-bold text-slate-900 tabular-nums">
                {analysis.summary.participantCount} Siswa
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <div className="text-xs font-medium text-slate-500">Rata-Rata Nilai</div>
              <div className="mt-1 text-2xl font-bold text-sky-700 tabular-nums">
                {analysis.summary.averageScore !== null ? analysis.summary.averageScore : '-'}
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <div className="text-xs font-medium text-slate-500">Nilai Tertinggi</div>
              <div className="mt-1 text-2xl font-bold text-emerald-700 tabular-nums">
                {analysis.summary.highestScore !== null ? analysis.summary.highestScore : '-'}
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <div className="text-xs font-medium text-slate-500">Nilai Terendah</div>
              <div className="mt-1 text-2xl font-bold text-red-700 tabular-nums">
                {analysis.summary.lowestScore !== null ? analysis.summary.lowestScore : '-'}
              </div>
            </div>
          </div>

          {/* Matrix Table: Student Answers per Item (Green = Correct, Red = Wrong) */}
          <section aria-label="Tabel Matriks Analisis Butir Soal" className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Tabel Matriks Jawaban Siswa per Butir Soal
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Sel berwarna hijau menandakan jawaban benar (atau skor uraian ≥ 60%), sel merah menandakan jawaban salah.
                </p>
              </div>
            </div>

            {analysis.studentRows.length === 0 ? (
              <div className="p-10 text-center">
                <BarChart3 className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="mt-2 text-sm font-medium text-slate-700">
                  Belum ada siswa yang mengumpulkan paket ujian ini.
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Setelah siswa mengerjakan via tautan ujian, matriks jawaban hijau/merah akan tampil otomatis di sini.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse text-left">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
                      <th className="px-3 py-2.5 border-r border-slate-200 sticky left-0 bg-slate-50 z-10 w-10 text-center">
                        No
                      </th>
                      <th className="px-3 py-2.5 border-r border-slate-200 sticky left-10 bg-slate-50 z-10 min-w-[160px]">
                        Nama Siswa
                      </th>
                      <th className="px-3 py-2.5 border-r border-slate-200 min-w-[72px]">
                        Kelas
                      </th>
                      {analysis.questions.map((q) => (
                        <th
                          key={q.questionId}
                          title={`Soal ${q.questionNumber}: ${q.prompt}`}
                          className="px-2 py-2.5 border-r border-slate-200 text-center min-w-[58px] tabular-nums font-mono"
                        >
                          S{q.questionNumber}
                        </th>
                      ))}
                      <th className="px-3 py-2.5 border-r border-slate-200 text-right min-w-[80px] tabular-nums">
                        Poin
                      </th>
                      <th className="px-3 py-2.5 text-right min-w-[78px] tabular-nums">
                        Nilai
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-200">
                    {analysis.studentRows.map((row, idx) => (
                      <tr key={row.submissionId} className="hover:bg-slate-50/70">
                        <td className="px-3 py-2.5 border-r border-slate-200 sticky left-0 bg-white z-10 text-center tabular-nums font-mono text-slate-500">
                          {idx + 1}
                        </td>
                        <td className="px-3 py-2.5 border-r border-slate-200 sticky left-10 bg-white z-10">
                          <button
                            type="button"
                            onClick={() => onOpenSubmission(row.submissionId)}
                            className="font-semibold text-slate-900 hover:text-sky-700 hover:underline text-left cursor-pointer"
                          >
                            {row.studentName}
                          </button>
                        </td>
                        <td className="px-3 py-2.5 border-r border-slate-200 text-slate-600">
                          {row.studentClass}
                        </td>
                        {analysis.questions.map((q) => {
                          const cell = row.cellDetails[q.questionId];
                          if (!cell) {
                            return (
                              <td
                                key={q.questionId}
                                className="px-2 py-2 border-r border-slate-200 text-center text-slate-400"
                              >
                                -
                              </td>
                            );
                          }

                          const cellColorClass =
                            cell.status === 'correct'
                              ? 'bg-emerald-100 text-emerald-950'
                              : cell.status === 'wrong'
                                ? 'bg-red-100 text-red-950'
                                : 'bg-amber-50 text-amber-900';

                          return (
                            <td
                              key={q.questionId}
                              title={`Soal ${q.questionNumber} · Jawaban: ${cell.studentAnswerText}`}
                              className={`px-1.5 py-2 border-r border-slate-200 text-center font-mono tabular-nums ${cellColorClass}`}
                            >
                              <div className="inline-flex items-center justify-center gap-1 font-semibold">
                                {cell.status === 'correct' ? (
                                  <Check className="w-3 h-3 shrink-0 text-emerald-700" aria-label="Benar" />
                                ) : cell.status === 'wrong' ? (
                                  <X className="w-3 h-3 shrink-0 text-red-700" aria-label="Salah" />
                                ) : (
                                  <Minus className="w-3 h-3 shrink-0 text-amber-700" aria-label="Menunggu" />
                                )}
                                <span className="truncate max-w-[44px]">{cell.studentAnswerText}</span>
                              </div>
                            </td>
                          );
                        })}
                        <td className="px-3 py-2.5 border-r border-slate-200 text-right font-mono tabular-nums text-slate-700">
                          {row.totalEarnedPoints}/{row.totalMaxPoints}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono font-bold tabular-nums text-sky-800">
                          {row.finalScore ?? row.objectiveScore ?? '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>

                  <tfoot className="bg-slate-50 border-t-2 border-slate-300 font-semibold text-slate-800">
                    <tr className="border-b border-slate-200">
                      <td colSpan={3} className="px-3 py-2 border-r border-slate-200">
                        Jumlah Siswa Benar
                      </td>
                      {analysis.questions.map((q) => (
                        <td
                          key={q.questionId}
                          className="px-2 py-2 border-r border-slate-200 text-center font-mono tabular-nums text-emerald-800"
                        >
                          {q.correctCount}
                        </td>
                      ))}
                      <td colSpan={2} className="px-3 py-2" />
                    </tr>
                    <tr className="border-b border-slate-200">
                      <td colSpan={3} className="px-3 py-2 border-r border-slate-200">
                        Jumlah Siswa Salah
                      </td>
                      {analysis.questions.map((q) => (
                        <td
                          key={q.questionId}
                          className="px-2 py-2 border-r border-slate-200 text-center font-mono tabular-nums text-red-800"
                        >
                          {q.wrongCount}
                        </td>
                      ))}
                      <td colSpan={2} className="px-3 py-2" />
                    </tr>
                    <tr>
                      <td colSpan={3} className="px-3 py-2 border-r border-slate-200">
                        Persentase Benar (%)
                      </td>
                      {analysis.questions.map((q) => (
                        <td
                          key={q.questionId}
                          className="px-2 py-2 border-r border-slate-200 text-center font-mono tabular-nums"
                        >
                          {q.totalAttempted > 0 ? `${q.percentCorrect}%` : '-'}
                        </td>
                      ))}
                      <td colSpan={2} className="px-3 py-2" />
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </section>

          {/* Table 2: Item Difficulty & Weight Breakdown */}
          <section aria-label="Rincian Butir Soal" className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200">
              <h2 className="text-base font-bold text-slate-900">
                Rincian Statistik, Kunci & Bobot Per Butir Soal
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                    <th className="px-3 py-2.5 text-center w-12">No</th>
                    <th className="px-3 py-2.5">Butir Pertanyaan</th>
                    <th className="px-3 py-2.5">Bentuk</th>
                    <th className="px-3 py-2.5">Kunci / Pedoman</th>
                    <th className="px-3 py-2.5 text-right tabular-nums">Skor × Bobot</th>
                    <th className="px-3 py-2.5 text-right tabular-nums text-emerald-700">Benar</th>
                    <th className="px-3 py-2.5 text-right tabular-nums text-red-700">Salah</th>
                    <th className="px-3 py-2.5 text-right tabular-nums">% Benar</th>
                    <th className="px-3 py-2.5">Kesukaran</th>
                    <th className="px-3 py-2.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {analysis.questions.map((q) => {
                    const rawQ = questionMap.get(q.questionId);
                    return (
                      <tr key={q.questionId} className="hover:bg-slate-50">
                        <td className="px-3 py-2.5 text-center font-mono font-bold tabular-nums text-slate-700">
                          {q.questionNumber}
                        </td>
                        <td className="px-3 py-2.5 max-w-xs">
                          <div className="text-slate-900 line-clamp-2">{q.prompt}</div>
                        </td>
                        <td className="px-3 py-2.5 whitespace-nowrap text-slate-600">
                          {QUESTION_TYPE_LABELS[q.type]}
                        </td>
                        <td className="px-3 py-2.5 max-w-[140px]">
                          <div className="truncate font-semibold text-emerald-800">
                            {q.correctAnswerText}
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono tabular-nums whitespace-nowrap">
                          {q.maxScore} × {q.weight} ={' '}
                          <strong>{Math.round(q.maxScore * q.weight * 100) / 100}</strong>
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono font-semibold tabular-nums text-emerald-700">
                          {q.correctCount}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono font-semibold tabular-nums text-red-700">
                          {q.wrongCount}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono tabular-nums">
                          {q.totalAttempted > 0 ? `${q.percentCorrect}%` : '-'}
                        </td>
                        <td className="px-3 py-2.5 whitespace-nowrap font-semibold">
                          <span
                            className={
                              q.difficultyLabel === 'Mudah'
                                ? 'text-emerald-700'
                                : q.difficultyLabel === 'Sedang'
                                  ? 'text-sky-700'
                                  : q.difficultyLabel === 'Sukar'
                                    ? 'text-red-700'
                                    : 'text-slate-500'
                            }
                          >
                            {q.difficultyLabel}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          {rawQ && (
                            <button
                              type="button"
                              onClick={() => onEditQuestion(rawQ)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 border border-slate-300 rounded-md text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                            >
                              <Edit3 className="w-3 h-3" />
                              <span>Edit</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
};
