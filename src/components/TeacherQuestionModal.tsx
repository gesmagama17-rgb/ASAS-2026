import React, { useState } from 'react';
import { X } from 'lucide-react';
import type { Question, QuestionOption, QuestionType } from '../types/exam';
import { QUESTION_TYPE_LABELS } from '../utils/examScoring';
import { STANDARD_SUBJECTS } from '../data/subjects';

interface TeacherQuestionModalProps {
  initialQuestion?: Question | null;
  onClose: () => void;
  onSave: (payload: Partial<Question>, editId?: string) => Promise<void>;
}

const DEFAULT_OPTIONS: QuestionOption[] = [
  { id: 'A', text: '' },
  { id: 'B', text: '' },
  { id: 'C', text: '' },
  { id: 'D', text: '' },
];

export const TeacherQuestionModal: React.FC<TeacherQuestionModalProps> = ({
  initialQuestion,
  onClose,
  onSave,
}) => {
  const [subject, setSubject] = useState(initialQuestion?.subject || 'IPAS');
  const [customSubject, setCustomSubject] = useState(
    initialQuestion?.subject && !STANDARD_SUBJECTS.includes(initialQuestion.subject)
      ? initialQuestion.subject
      : ''
  );
  const [type, setType] = useState<QuestionType>(initialQuestion?.type || 'pg');
  const [prompt, setPrompt] = useState(initialQuestion?.prompt || '');
  const [passage, setPassage] = useState(initialQuestion?.passage || '');
  const [options, setOptions] = useState<QuestionOption[]>(
    initialQuestion?.options && initialQuestion.options.length > 0
      ? initialQuestion.options
      : DEFAULT_OPTIONS
  );
  const [singleKey, setSingleKey] = useState<string>(
    typeof initialQuestion?.correctAnswer === 'string'
      ? initialQuestion.correctAnswer
      : 'A'
  );
  const [complexKeys, setComplexKeys] = useState<string[]>(
    Array.isArray(initialQuestion?.correctAnswer)
      ? initialQuestion.correctAnswer
      : ['A', 'B']
  );
  const [rubric, setRubric] = useState(initialQuestion?.rubric || '');
  const [maxScore, setMaxScore] = useState<number>(
    initialQuestion?.maxScore ?? (initialQuestion?.type === 'uraian' ? 4 : 1)
  );
  const [weight, setWeight] = useState<number>(initialQuestion?.weight ?? 1);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleTypeChange = (nextType: QuestionType) => {
    setType(nextType);
    if (nextType === 'pg') {
      setOptions(options.length >= 4 ? options : DEFAULT_OPTIONS);
      setSingleKey('A');
      setMaxScore(1);
    } else if (nextType === 'pg_kompleks') {
      setOptions(options.length >= 4 ? options : DEFAULT_OPTIONS);
      setComplexKeys(['A', 'B']);
      setMaxScore(1);
    } else if (nextType === 'benar_salah') {
      setOptions([
        { id: 'BENAR', text: 'Benar' },
        { id: 'SALAH', text: 'Salah' },
      ]);
      setSingleKey('BENAR');
      setMaxScore(1);
    } else if (nextType === 'isian_singkat') {
      setSingleKey('');
      setMaxScore(1);
    } else if (nextType === 'uraian') {
      setSingleKey('');
      setMaxScore(4);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const resolvedSubject = subject === '__CUSTOM__' ? customSubject.trim() : subject;
    if (!resolvedSubject) {
      setError('Mata pelajaran wajib diisi.');
      return;
    }
    if (!prompt.trim()) {
      setError('Teks pertanyaan wajib diisi.');
      return;
    }

    if (!Number.isFinite(maxScore) || maxScore <= 0) {
      setError('Skor maksimal soal harus lebih besar dari 0.');
      return;
    }
    if (!Number.isFinite(weight) || weight <= 0) {
      setError('Bobot soal harus lebih besar dari 0.');
      return;
    }

    let finalCorrectAnswer: string | string[] = singleKey;
    let finalOptions: QuestionOption[] | undefined = undefined;

    if (type === 'pg' || type === 'pg_kompleks') {
      if (options.some((o) => !o.text.trim())) {
        setError('Semua pilihan jawaban A, B, C, dan D harus diisi.');
        return;
      }
      finalOptions = options.map((o) => ({ id: o.id, text: o.text.trim() }));
      if (type === 'pg_kompleks') {
        if (complexKeys.length === 0) {
          setError('Pilih minimal satu kunci jawaban untuk Pilihan Ganda Kompleks.');
          return;
        }
        finalCorrectAnswer = complexKeys;
      } else {
        finalCorrectAnswer = singleKey || 'A';
      }
    } else if (type === 'benar_salah') {
      finalOptions = [
        { id: 'BENAR', text: 'Benar' },
        { id: 'SALAH', text: 'Salah' },
      ];
      finalCorrectAnswer = singleKey === 'SALAH' ? 'SALAH' : 'BENAR';
    } else if (type === 'isian_singkat') {
      if (!singleKey.trim()) {
        setError('Kunci jawaban isian singkat wajib diisi.');
        return;
      }
      finalCorrectAnswer = singleKey.trim();
    } else if (type === 'uraian') {
      finalCorrectAnswer = singleKey.trim() || 'Sesuai pedoman rubrik guru.';
    }

    setSaving(true);
    try {
      await onSave(
        {
          subject: resolvedSubject,
          type,
          prompt: prompt.trim(),
          passage: passage.trim() || undefined,
          options: finalOptions,
          correctAnswer: finalCorrectAnswer,
          rubric: rubric.trim() || undefined,
          maxScore: Number(maxScore) || (type === 'uraian' ? 4 : 1),
          weight: Number(weight) || 1,
        },
        initialQuestion?.id
      );
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan soal.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="question-modal-title"
      className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4 overflow-y-auto"
    >
      <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-xl p-6 my-8 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <h2 id="question-modal-title" className="text-lg font-bold text-slate-900">
            {initialQuestion ? 'Edit Soal Bank' : 'Tambah Soal Baru'}
          </h2>
          <button
            type="button"
            aria-label="Tutup modal soal"
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="q-subject" className="block text-xs font-semibold text-slate-700 mb-1">
                Mata Pelajaran
              </label>
              <select
                id="q-subject"
                value={STANDARD_SUBJECTS.includes(subject) ? subject : '__CUSTOM__'}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
              >
                {STANDARD_SUBJECTS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
                <option value="__CUSTOM__">Mata Pelajaran Lainnya...</option>
              </select>
              {subject === '__CUSTOM__' && (
                <input
                  type="text"
                  value={customSubject}
                  onChange={(e) => setCustomSubject(e.target.value)}
                  placeholder="Nama mata pelajaran"
                  className="mt-2 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              )}
            </div>

            <div>
              <label htmlFor="q-type" className="block text-xs font-semibold text-slate-700 mb-1">
                Bentuk Soal
              </label>
              <select
                id="q-type"
                value={type}
                onChange={(e) => handleTypeChange(e.target.value as QuestionType)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
              >
                {(Object.keys(QUESTION_TYPE_LABELS) as QuestionType[]).map((t) => (
                  <option key={t} value={t}>
                    {QUESTION_TYPE_LABELS[t]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="q-passage" className="block text-xs font-semibold text-slate-700 mb-1">
              Teks Bacaan / Kutipan Pendukung (Opsional)
            </label>
            <textarea
              id="q-passage"
              rows={2}
              value={passage}
              onChange={(e) => setPassage(e.target.value)}
              placeholder="Tempel kutipan cerita, kasus, atau pernyataan jika ada..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>

          <div>
            <label htmlFor="q-prompt" className="block text-xs font-semibold text-slate-700 mb-1">
              Pertanyaan
            </label>
            <textarea
              id="q-prompt"
              rows={3}
              required
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Tuliskan pertanyaan untuk siswa..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>

          {(type === 'pg' || type === 'pg_kompleks') && (
            <div className="space-y-2.5">
              <div className="text-xs font-semibold text-slate-700">
                Pilihan Jawaban & Kunci ({type === 'pg_kompleks' ? 'centang semua yang benar' : 'pilih satu yang benar'})
              </div>
              {options.map((opt, idx) => {
                const isChecked =
                  type === 'pg'
                    ? singleKey === opt.id
                    : complexKeys.includes(opt.id);
                return (
                  <div key={opt.id} className="flex items-center gap-2.5">
                    <input
                      type={type === 'pg' ? 'radio' : 'checkbox'}
                      name="pg-key"
                      checked={isChecked}
                      aria-label={`Tandai opsi ${opt.id} sebagai kunci jawaban`}
                      onChange={() => {
                        if (type === 'pg') {
                          setSingleKey(opt.id);
                        } else {
                          setComplexKeys((prev) =>
                            prev.includes(opt.id)
                              ? prev.filter((x) => x !== opt.id)
                              : [...prev, opt.id]
                          );
                        }
                      }}
                      className="w-4 h-4 accent-sky-700 shrink-0"
                    />
                    <span className="text-xs font-bold text-slate-700 w-5">{opt.id}.</span>
                    <input
                      type="text"
                      value={opt.text}
                      onChange={(e) => {
                        const next = [...options];
                        next[idx] = { ...opt, text: e.target.value };
                        setOptions(next);
                      }}
                      placeholder={`Isi pilihan ${opt.id}`}
                      className="flex-1 px-3 py-1.5 border border-slate-300 rounded-lg text-sm"
                    />
                  </div>
                );
              })}
            </div>
          )}

          {type === 'benar_salah' && (
            <div>
              <span className="block text-xs font-semibold text-slate-700 mb-1.5">
                Kunci Jawaban Benar / Salah
              </span>
              <div className="flex items-center gap-4">
                {['BENAR', 'SALAH'].map((val) => (
                  <label key={val} className="inline-flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="radio"
                      name="bs-key"
                      checked={singleKey === val}
                      onChange={() => setSingleKey(val)}
                      className="accent-sky-700"
                    />
                    <span>{val === 'BENAR' ? 'Benar' : 'Salah'}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {type === 'isian_singkat' && (
            <div>
              <label htmlFor="q-short-key" className="block text-xs font-semibold text-slate-700 mb-1">
                Kunci Jawaban Singkat (pisahkan variasi dengan tanda |, misal: matahari|Matahari)
              </label>
              <input
                id="q-short-key"
                type="text"
                value={singleKey}
                onChange={(e) => setSingleKey(e.target.value)}
                placeholder="Contoh: produsen|Produsen"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>
          )}

          {type === 'uraian' && (
            <div>
              <label htmlFor="q-essay-key" className="block text-xs font-semibold text-slate-700 mb-1">
                Kunci / Contoh Jawaban Uraian
              </label>
              <textarea
                id="q-essay-key"
                rows={2}
                value={singleKey}
                onChange={(e) => setSingleKey(e.target.value)}
                placeholder="Tuliskan pedoman jawaban benar..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>
          )}

          {/* Score & Weight Configuration for ALL Question Types */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
            <div className="text-xs font-bold text-slate-800">
              Pengaturan Skor, Bobot & Pembahasan Soal
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label htmlFor="q-maxscore" className="block text-xs font-semibold text-slate-700 mb-1">
                  Skor Maksimal
                </label>
                <input
                  id="q-maxscore"
                  type="number"
                  min={0.5}
                  max={100}
                  step={0.5}
                  value={maxScore}
                  onChange={(e) => setMaxScore(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm tabular-nums"
                />
              </div>
              <div>
                <label htmlFor="q-weight" className="block text-xs font-semibold text-slate-700 mb-1">
                  Bobot Soal (Pengali)
                </label>
                <input
                  id="q-weight"
                  type="number"
                  min={0.5}
                  max={20}
                  step={0.5}
                  value={weight}
                  onChange={(e) => setWeight(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm tabular-nums"
                />
              </div>
              <div className="flex flex-col justify-end">
                <div className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-600 tabular-nums">
                  Poin Penuh:{' '}
                  <strong className="text-slate-900 font-mono">
                    {Math.round(maxScore * weight * 100) / 100}
                  </strong>
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="q-rubric" className="block text-xs font-semibold text-slate-700 mb-1">
                Rubrik Penskoran / Pembahasan (Opsional)
              </label>
              <input
                id="q-rubric"
                type="text"
                value={rubric}
                onChange={(e) => setRubric(e.target.value)}
                placeholder="Contoh: Skor 4 jika lengkap, 2 jika sebagian"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm"
              />
            </div>
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
              {saving ? 'Menyimpan...' : 'Simpan Soal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
