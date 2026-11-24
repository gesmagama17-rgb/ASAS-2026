import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileText,
  Upload,
  X,
} from 'lucide-react';
import type { ParsedWordQuestion, Question, QuestionType } from '../types/exam';
import { QUESTION_TYPE_LABELS } from '../utils/examScoring';
import { STANDARD_SUBJECTS } from '../data/subjects';

interface TeacherWordImportModalProps {
  authToken: string;
  onClose: () => void;
  onImported: (result: { insertedCount: number; examCreated?: boolean }) => void;
}

interface EditableWordItem extends ParsedWordQuestion {
  selected: boolean;
}

export const TeacherWordImportModal: React.FC<TeacherWordImportModalProps> = ({
  authToken,
  onClose,
  onImported,
}) => {
  const [subject, setSubject] = useState<string>('IPAS');
  const [customSubject, setCustomSubject] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState('');
  const [items, setItems] = useState<EditableWordItem[]>([]);
  const [createExamToo, setCreateExamToo] = useState(false);
  const [newExamTitle, setNewExamTitle] = useState('');
  const [newExamDuration, setNewExamDuration] = useState(60);
  const [saving, setSaving] = useState(false);

  const resolvedSubject = subject === '__CUSTOM__' ? customSubject.trim() || 'Umum' : subject;

  const handleDownloadTemplate = async () => {
    try {
      const res = await fetch('/api/teacher/questions/word-template', {
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
      });
      if (!res.ok) return;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'template-bank-soal-tka-sd.docx';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setParseError('Gagal mengunduh template Word.');
    }
  };

  const handleFilePick = async (file: File | null) => {
    if (!file) return;
    setSelectedFile(file);
    setParseError('');
    setParsing(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('subject', resolvedSubject);

      const res = await fetch('/api/teacher/questions/parse-word', {
        method: 'POST',
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setParseError(data.error || 'Gagal membaca file Word.');
        setItems([]);
        return;
      }

      const parsed: ParsedWordQuestion[] = data.questions || [];
      setItems(parsed.map((q) => ({ ...q, subject: resolvedSubject, selected: true })));
      if (!newExamTitle) {
        const cleanFileName = file.name.replace(/\.docx?$/i, '').replace(/[_-]+/g, ' ');
        setNewExamTitle(`Latihan ${cleanFileName}`);
      }
    } catch {
      setParseError('Terjadi kesalahan saat mengunggah dan memproses file Word.');
    } finally {
      setParsing(false);
    }
  };

  const updateItem = (tempId: string, patch: Partial<EditableWordItem>) => {
    setItems((prev) => prev.map((it) => (it.tempId === tempId ? { ...it, ...patch } : it)));
  };

  const selectedItems = items.filter((i) => i.selected && i.prompt.trim().length > 0);

  const handleConfirmImport = async () => {
    if (selectedItems.length === 0) {
      setParseError('Pilih minimal 1 soal untuk dimasukkan ke Bank Soal.');
      return;
    }
    setSaving(true);
    setParseError('');
    try {
      const payloadQuestions: Array<Partial<Question>> = selectedItems.map((it) => ({
        subject: resolvedSubject,
        type: it.type,
        prompt: it.prompt.trim(),
        passage: it.passage?.trim() || undefined,
        tableData: it.tableData,
        options: it.options,
        correctAnswer: it.correctAnswer,
        rubric: it.rubric?.trim() || undefined,
        maxScore: Number(it.maxScore) > 0 ? Number(it.maxScore) : it.type === 'uraian' ? 4 : 1,
        weight: Number(it.weight) > 0 ? Number(it.weight) : 1,
      }));

      const bulkRes = await fetch('/api/teacher/questions/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({
          subject: resolvedSubject,
          questions: payloadQuestions,
        }),
      });
      const bulkData = await bulkRes.json();
      if (!bulkRes.ok) {
        setParseError(bulkData.error || 'Gagal menyimpan soal ke Bank Soal.');
        return;
      }

      let examCreated = false;
      if (createExamToo && Array.isArray(bulkData.questions) && bulkData.questions.length > 0) {
        const createdIds = (bulkData.questions as Question[]).map((q) => q.id);
        const examRes = await fetch('/api/teacher/exams', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
          },
          body: JSON.stringify({
            title: newExamTitle.trim() || `Latihan ${resolvedSubject} (Word)`,
            subject: resolvedSubject,
            assessmentType: 'Latihan Harian',
            durationMinutes: Number(newExamDuration) || 60,
            selectionMode: 'manual',
            questionIds: createdIds,
            isActive: true,
            showResultsToStudent: true,
          }),
        });
        examCreated = examRes.ok;
      }

      onImported({ insertedCount: bulkData.insertedCount, examCreated });
      onClose();
    } catch {
      setParseError('Terjadi kesalahan jaringan saat menyimpan soal.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="word-import-title"
      className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4"
    >
      <div className="w-full max-w-4xl bg-white border border-slate-200 rounded-xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-slate-200 shrink-0">
          <div>
            <h2 id="word-import-title" className="text-lg font-bold text-slate-900">
              Upload Soal dari File Microsoft Word (.docx)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Unggah naskah soal Word yang sudah jadi. Aplikasi akan membaca nomor soal, opsi A–D, kunci jawaban, skor, dan bobot secara otomatis.
            </p>
          </div>
          <button
            type="button"
            aria-label="Tutup modal upload Word"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">

        {/* Step 1: Subject & File Picker */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-[240px_1fr] gap-4">
          <div className="space-y-3">
            <div>
              <label htmlFor="word-subject" className="block text-xs font-semibold text-slate-700 mb-1">
                Mata Pelajaran Tujuan
              </label>
              <select
                id="word-subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm"
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

            <button
              type="button"
              onClick={() => void handleDownloadTemplate()}
              className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh Contoh Template (.docx)</span>
            </button>
          </div>

          <div className="border border-dashed border-slate-300 rounded-xl p-5 bg-slate-50 flex flex-col items-center justify-center text-center">
            <Upload className="w-7 h-7 text-sky-700 mb-2" />
            <div className="text-sm font-semibold text-slate-900">
              {selectedFile ? selectedFile.name : 'Pilih File Word (.docx) Soal Anda'}
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-md">
              Mendukung soal bernomor (1., 2., ...), opsi A–D, bagian PG / PG Kompleks / Benar-Salah / Isian / Uraian, serta Kunci, Skor, dan Bobot.
            </p>
            <label className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 bg-sky-700 hover:bg-sky-800 text-white text-xs font-semibold rounded-lg cursor-pointer">
              <FileText className="w-3.5 h-3.5" />
              <span>{parsing ? 'Membaca File Word...' : 'Pilih File .docx'}</span>
              <input
                type="file"
                accept=".docx,.doc"
                disabled={parsing}
                onChange={(e) => void handleFilePick(e.target.files?.[0] || null)}
                className="sr-only"
              />
            </label>
          </div>
        </div>

        {parseError && (
          <div
            role="alert"
            className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-start gap-2"
          >
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{parseError}</span>
          </div>
        )}

        {/* Step 2: Editable Parsed Preview */}
        {items.length > 0 && (
          <div className="mt-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900 tabular-nums">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>
                  Terdeteksi {items.length} Butir Soal ({selectedItems.length} dipilih untuk masuk Bank Soal)
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setItems((prev) => prev.map((it) => ({ ...it, selected: true })))}
                  className="px-2.5 py-1 border border-slate-300 rounded-md font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Pilih Semua
                </button>
                <button
                  type="button"
                  onClick={() => setItems((prev) => prev.map((it) => ({ ...it, selected: false })))}
                  className="px-2.5 py-1 border border-slate-300 rounded-md font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Kosongkan
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {items.map((item, idx) => (
                <div
                  key={item.tempId}
                  className={`border rounded-xl p-4 space-y-3 ${
                    item.selected
                      ? 'bg-white border-slate-200'
                      : 'bg-slate-50 border-slate-200 opacity-60'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label className="inline-flex items-center gap-2 text-xs font-bold text-slate-900 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={item.selected}
                        onChange={(e) => updateItem(item.tempId, { selected: e.target.checked })}
                        className="w-4 h-4 accent-sky-700"
                      />
                      <span className="tabular-nums">Soal #{idx + 1}</span>
                    </label>

                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        aria-label={`Bentuk soal nomor ${idx + 1}`}
                        value={item.type}
                        onChange={(e) => {
                          const nextType = e.target.value as QuestionType;
                          updateItem(item.tempId, {
                            type: nextType,
                            maxScore: nextType === 'uraian' ? 4 : 1,
                          });
                        }}
                        className="px-2.5 py-1 bg-white border border-slate-300 rounded-md text-xs font-semibold"
                      >
                        {(Object.keys(QUESTION_TYPE_LABELS) as QuestionType[]).map((t) => (
                          <option key={t} value={t}>
                            {QUESTION_TYPE_LABELS[t]}
                          </option>
                        ))}
                      </select>

                      <label className="inline-flex items-center gap-1 text-xs text-slate-700">
                        <span>Skor:</span>
                        <input
                          type="number"
                          min={0.5}
                          step={0.5}
                          aria-label={`Skor soal nomor ${idx + 1}`}
                          value={item.maxScore}
                          onChange={(e) =>
                            updateItem(item.tempId, { maxScore: Number(e.target.value) || 1 })
                          }
                          className="w-14 px-2 py-1 border border-slate-300 rounded-md text-xs text-right tabular-nums"
                        />
                      </label>

                      <label className="inline-flex items-center gap-1 text-xs text-slate-700">
                        <span>Bobot:</span>
                        <input
                          type="number"
                          min={0.5}
                          step={0.5}
                          aria-label={`Bobot soal nomor ${idx + 1}`}
                          value={item.weight}
                          onChange={(e) =>
                            updateItem(item.tempId, { weight: Number(e.target.value) || 1 })
                          }
                          className="w-14 px-2 py-1 border border-slate-300 rounded-md text-xs text-right tabular-nums"
                        />
                      </label>
                    </div>
                  </div>

                  {item.warning && (
                    <div className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-2.5 py-1.5">
                      {item.warning}
                    </div>
                  )}

                  <textarea
                    rows={2}
                    aria-label={`Isi pertanyaan nomor ${idx + 1}`}
                    value={item.prompt}
                    onChange={(e) => updateItem(item.tempId, { prompt: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900"
                  />

                  {item.options && item.options.length > 0 && (item.type === 'pg' || item.type === 'pg_kompleks') && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {item.options.map((opt, optIdx) => (
                        <div key={opt.id} className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-700 w-4">{opt.id}.</span>
                          <input
                            type="text"
                            value={opt.text}
                            onChange={(e) => {
                              const nextOpts = [...(item.options || [])];
                              nextOpts[optIdx] = { ...opt, text: e.target.value };
                              updateItem(item.tempId, { options: nextOpts });
                            }}
                            className="flex-1 px-2.5 py-1 border border-slate-300 rounded-md text-xs"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-3 text-xs">
                    <label className="font-semibold text-emerald-800 flex items-center gap-1.5 flex-1 min-w-[200px]">
                      <span className="shrink-0">Kunci Jawaban:</span>
                      <input
                        type="text"
                        aria-label={`Kunci jawaban soal nomor ${idx + 1}`}
                        value={
                          Array.isArray(item.correctAnswer)
                            ? item.correctAnswer.join(', ')
                            : item.correctAnswer
                        }
                        onChange={(e) => {
                          const raw = e.target.value;
                          if (item.type === 'pg_kompleks') {
                            const arr = raw
                              .toUpperCase()
                              .split(/[\s,;]+/)
                              .filter(Boolean);
                            updateItem(item.tempId, { correctAnswer: arr });
                          } else if (item.type === 'pg') {
                            updateItem(item.tempId, { correctAnswer: raw.trim().toUpperCase() });
                          } else {
                            updateItem(item.tempId, { correctAnswer: raw });
                          }
                        }}
                        className="flex-1 px-2.5 py-1 border border-slate-300 rounded-md text-xs font-semibold text-slate-900"
                      />
                    </label>
                  </div>
                </div>
              ))}
            </div>

            {/* Optional Auto-Create Exam Package */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
              <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={createExamToo}
                  onChange={(e) => setCreateExamToo(e.target.checked)}
                  className="accent-sky-700"
                />
                <span>Sekaligus buat Paket Ujian baru dari soal ini (siap dibagikan ke murid)</span>
              </label>

              {createExamToo && (
                <div className="grid grid-cols-1 sm:grid-cols-[1fr_140px] gap-3">
                  <input
                    type="text"
                    value={newExamTitle}
                    onChange={(e) => setNewExamTitle(e.target.value)}
                    placeholder="Judul paket ujian"
                    className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm"
                  />
                  <input
                    type="number"
                    min={5}
                    max={180}
                    value={newExamDuration}
                    onChange={(e) => setNewExamDuration(Number(e.target.value))}
                    placeholder="Menit"
                    className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm tabular-nums"
                  />
                </div>
              )}
            </div>
          </div>
        )}
        </div>

        <div className="px-6 py-4 border-t border-slate-200 bg-white flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            disabled={saving || selectedItems.length === 0}
            onClick={() => void handleConfirmImport()}
            className="px-5 py-2 bg-sky-700 hover:bg-sky-800 text-white rounded-lg text-sm font-semibold disabled:opacity-50 cursor-pointer"
          >
            {saving
              ? 'Menyimpan...'
              : `Simpan ke Bank Soal (${selectedItems.length} Soal)`}
          </button>
        </div>
      </div>
    </div>
  );
};
