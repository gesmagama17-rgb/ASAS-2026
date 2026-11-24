import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, BookOpen, Clock, FileText } from 'lucide-react';
import type { StudentExamSummary } from '../types/exam';
import { QUESTION_TYPE_LABELS } from '../utils/examScoring';
import { PWAInstallButton } from './PWAInstallButton';

interface LandingViewProps {
  onStartExamByCode: (code: string) => void;
  onOpenTeacherPortal?: () => void;
  hideTeacherPortal?: boolean;
}

export const LandingView: React.FC<LandingViewProps> = ({
  onStartExamByCode,
  onOpenTeacherPortal,
  hideTeacherPortal = false,
}) => {
  const [exams, setExams] = useState<StudentExamSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [codeInput, setCodeInput] = useState('');
  const [codeError, setCodeError] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('Semua');

  useEffect(() => {
    let active = true;
    async function loadExams() {
      setLoading(true);
      try {
        const res = await fetch('/api/student/exams');
        const data = await res.json();
        if (active && res.ok) {
          setExams(data.exams || []);
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    loadExams();
    return () => {
      active = false;
    };
  }, []);

  const subjects = useMemo(() => {
    const set = new Set(exams.map((e) => e.subject));
    return ['Semua', ...Array.from(set)];
  }, [exams]);

  const filteredExams = useMemo(() => {
    if (subjectFilter === 'Semua') return exams;
    return exams.filter((e) => e.subject === subjectFilter);
  }, [exams, subjectFilter]);

  const handleCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCodeError('');
    const cleaned = codeInput.trim().toUpperCase();
    if (!cleaned) {
      setCodeError('Masukkan kode ujian dari gurumu terlebih dahulu.');
      return;
    }
    onStartExamByCode(cleaned);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Bar Contract: 3 zones separated by gap-8 */}
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-8">
          <a
            href={hideTeacherPortal ? '/mulai' : '/'}
            className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
          >
            TKA ASAS SD
          </a>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <a
              href="#latihan"
              className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
            >
              Daftar Latihan
            </a>
            <a
              href="#masuk-kode"
              className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
            >
              Masuk Kode
            </a>
            <a
              href="#petunjuk"
              className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
            >
              Cara Mengerjakan
            </a>
          </nav>

          <div className="flex items-center gap-2.5 shrink-0">
            <PWAInstallButton compact={true} />
            {!hideTeacherPortal && onOpenTeacherPortal ? (
              <button
                type="button"
                onClick={onOpenTeacherPortal}
                className="px-4 py-2 text-xs font-semibold text-white bg-sky-700 hover:bg-sky-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Portal Guru
              </button>
            ) : (
              <div className="text-xs font-semibold text-sky-700 whitespace-nowrap shrink-0">
                Portal Latihan Murid
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Split */}
        <section id="masuk-kode" className="max-w-6xl mx-auto px-6 py-10 lg:py-14">
          <div className="grid grid-cols-1 lg:grid-cols-[1.35fr_1fr] gap-8 items-stretch">
            <div className="flex flex-col justify-center">
              <div className="text-xs font-semibold text-sky-700">
                UPT SDN 2 Makale Selatan · Kelas V / Fase C · Tahun Ajaran 2026/2027
              </div>
              <h1 className="mt-2.5 text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight text-balance">
                Latihan Asesmen Sumatif Akhir Semester Ganjil
              </h1>
              <p className="mt-3 text-base text-slate-600 leading-relaxed max-w-2xl">
                Platform latihan berbasis komputer untuk membiasakan murid mengakses, membaca,
                dan menjawab soal-soal ASAS Ganjil secara mandiri dan terstruktur.
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-600 tabular-nums">
                <span className="inline-flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-sky-700" />
                  <span>7 Mata Pelajaran Standar</span>
                </span>
                <span className="inline-flex items-center gap-2">
                  <FileText className="w-4 h-4 text-sky-700" />
                  <span>PG, PG Kompleks, Isian & Uraian</span>
                </span>
                <span className="inline-flex items-center gap-2">
                  <Clock className="w-4 h-4 text-sky-700" />
                  <span>Timer & Navigasi Soal TKA</span>
                </span>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-center">
              <h2 className="text-lg font-bold text-slate-900">Masuk dengan Kode Ujian</h2>
              <p className="mt-1 text-sm text-slate-600">
                Masukkan kode ujian dari gurumu atau buka langsung tautan yang dibagikan guru.
              </p>

              {codeError && (
                <div role="alert" className="mt-3 text-xs font-medium text-red-700">
                  {codeError}
                </div>
              )}

              <form onSubmit={handleCodeSubmit} className="mt-4 space-y-3">
                <div>
                  <label htmlFor="landing-exam-code" className="block text-xs font-semibold text-slate-700 mb-1">
                    Kode Ujian
                  </label>
                  <input
                    id="landing-exam-code"
                    type="text"
                    value={codeInput}
                    onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                    placeholder="Contoh: ASAS-IPAS-V"
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm font-mono uppercase text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-600"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 px-4 bg-sky-700 hover:bg-sky-800 text-white text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Buka Lembar Ujian</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        </section>

        {/* Active Practice Packages */}
        <section id="latihan" className="max-w-6xl mx-auto px-6 py-8 border-t border-slate-200">
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Paket Latihan ASAS Ganjil</h2>
              <p className="text-sm text-slate-600 mt-0.5">
                Pilih mata pelajaran di bawah ini untuk mulai berlatih tampilan ujian TKA.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-200/70 rounded-lg w-fit max-w-full">
              {subjects.map((sub) => (
                <button
                  key={sub}
                  type="button"
                  onClick={() => setSubjectFilter(sub)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    subjectFilter === sub
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {sub}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-44 bg-white border border-slate-200 rounded-xl animate-pulse"
                />
              ))}
            </div>
          ) : filteredExams.length === 0 ? (
            <div className="mt-6 bg-white border border-slate-200 rounded-xl p-10 text-center text-sm text-slate-600">
              Belum ada paket latihan aktif untuk mata pelajaran ini.
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredExams.map((exam) => {
                const breakdown = (
                  Object.entries(exam.countsByType) as Array<
                    [keyof typeof QUESTION_TYPE_LABELS, number]
                  >
                )
                  .filter(([, count]) => count > 0)
                  .map(([t, count]) => `${count} ${QUESTION_TYPE_LABELS[t]}`)
                  .join(' · ');

                return (
                  <div
                    key={exam.id}
                    className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between gap-4"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 tabular-nums">
                        <span className="font-semibold text-sky-700">{exam.assessmentType}</span>
                        <span aria-hidden="true">·</span>
                        <span>{exam.questionCount} Soal</span>
                        <span aria-hidden="true">·</span>
                        <span>{exam.durationMinutes} Menit</span>
                      </div>
                      <h3 className="mt-1.5 text-base font-bold text-slate-900">
                        {exam.title}
                      </h3>
                      <p className="mt-1 text-xs text-slate-600 tabular-nums">
                        {breakdown}
                      </p>
                      <div className="mt-2 text-xs text-slate-500 font-mono">
                        Kode: {exam.shareCode}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onStartExamByCode(exam.shareCode)}
                      className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>Mulai Kerjakan</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* How it works */}
        <section id="petunjuk" className="max-w-6xl mx-auto px-6 py-10 border-t border-slate-200">
          <h2 className="text-lg font-bold text-slate-900">Alur Latihan Siswa</h2>
          <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                step: '01. Buka Paket atau Link Guru',
                desc: 'Pilih mata pelajaran di daftar latihan atau langsung klik link ujian online yang dibagikan guru.',
              },
              {
                step: '02. Isi Identitas & Kerjakan Soal',
                desc: 'Tuliskan nama lengkap dan kelas. Gunakan daftar nomor soal, tombol Ragu-Ragu, dan pengatur ukuran huruf.',
              },
              {
                step: '03. Kumpulkan & Pelajari Hasil',
                desc: 'Tekan Selesai & Kumpulkan saat selesai. Nilai pilihan ganda tampil otomatis dan soal uraian dikoreksi guru.',
              },
            ].map((item) => (
              <div key={item.step} className="bg-white border border-slate-200 rounded-xl p-5">
                <h3 className="text-sm font-bold text-slate-900">{item.step}</h3>
                <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="bg-white border-t border-slate-200 px-6 py-5">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <span>UPT SDN 2 Makale Selatan · Aplikasi Latihan TKA & ASAS Ganjil Kelas V</span>
          <span>Tahun Ajaran 2026/2027</span>
        </div>
      </footer>
    </div>
  );
};
