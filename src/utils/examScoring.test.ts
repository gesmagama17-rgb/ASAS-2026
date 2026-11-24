import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeSubmissionScores,
  isObjectiveAnswerCorrect,
  sanitizeQuestionsForStudent,
  selectQuestionsForExam,
} from './examScoring';
import type { Question } from '../types/exam';

const sampleQuestions: Question[] = [
  {
    id: 'q1',
    subject: 'IPAS',
    type: 'pg',
    prompt: 'Benda penghasil cahaya sendiri adalah...',
    options: [
      { id: 'A', text: 'Bulan' },
      { id: 'B', text: 'Cermin' },
      { id: 'C', text: 'Matahari' },
      { id: 'D', text: 'Meja' },
    ],
    correctAnswer: 'C',
    maxScore: 1,
    createdAt: '2026-11-01T00:00:00.000Z',
  },
  {
    id: 'q2',
    subject: 'IPAS',
    type: 'pg_kompleks',
    prompt: 'Pilih dua sumber bunyi...',
    options: [
      { id: 'A', text: 'Gitar dipetik' },
      { id: 'B', text: 'Batu diam' },
      { id: 'C', text: 'Gendang dipukul' },
      { id: 'D', text: 'Kertas terlipat' },
    ],
    correctAnswer: ['A', 'C'],
    maxScore: 1,
    createdAt: '2026-11-01T00:00:00.000Z',
  },
  {
    id: 'q3',
    subject: 'IPAS',
    type: 'benar_salah',
    prompt: 'Bunyi dapat merambat melalui ruang hampa.',
    options: [
      { id: 'BENAR', text: 'Benar' },
      { id: 'SALAH', text: 'Salah' },
    ],
    correctAnswer: 'SALAH',
    maxScore: 1,
    createdAt: '2026-11-01T00:00:00.000Z',
  },
  {
    id: 'q4',
    subject: 'IPAS',
    type: 'isian_singkat',
    prompt: 'Organisme penghasil makanan sendiri disebut...',
    correctAnswer: 'produsen|Produsen',
    maxScore: 1,
    createdAt: '2026-11-01T00:00:00.000Z',
  },
  {
    id: 'q5',
    subject: 'IPAS',
    type: 'uraian',
    prompt: 'Tuliskan 4 sifat cahaya!',
    correctAnswer: 'Merambat lurus, dipantulkan, dibiaskan, menembus benda bening.',
    rubric: 'Skor 4 jika menyebutkan 4 sifat dengan benar.',
    maxScore: 4,
    createdAt: '2026-11-01T00:00:00.000Z',
  },
];

test('isObjectiveAnswerCorrect handles pg, pg_kompleks, benar_salah, and isian_singkat', () => {
  assert.equal(isObjectiveAnswerCorrect(sampleQuestions[0], 'C'), true);
  assert.equal(isObjectiveAnswerCorrect(sampleQuestions[0], 'A'), false);

  assert.equal(isObjectiveAnswerCorrect(sampleQuestions[1], ['C', 'A']), true);
  assert.equal(isObjectiveAnswerCorrect(sampleQuestions[1], ['A']), false);

  assert.equal(isObjectiveAnswerCorrect(sampleQuestions[2], 'SALAH'), true);
  assert.equal(isObjectiveAnswerCorrect(sampleQuestions[2], 'BENAR'), false);

  assert.equal(isObjectiveAnswerCorrect(sampleQuestions[3], '  Produsen. '), true);
  assert.equal(isObjectiveAnswerCorrect(sampleQuestions[3], 'Konsumen'), false);
});

test('computeSubmissionScores calculates 60% objective + 40% essay when graded', () => {
  const ungraded = computeSubmissionScores({
    questions: sampleQuestions,
    answers: {
      q1: 'C',
      q2: ['A', 'C'],
      q3: 'SALAH',
      q4: 'produsen',
      q5: 'Merambat lurus dan dibiaskan.',
    },
  });

  assert.equal(ungraded.objectiveCorrectCount, 4);
  assert.equal(ungraded.objectiveTotalCount, 4);
  assert.equal(ungraded.objectiveScore, 100);
  assert.equal(ungraded.essayScore, null);
  assert.equal(ungraded.finalScore, null);
  assert.equal(ungraded.gradingStatus, 'menunggu_koreksi_uraian');

  const graded = computeSubmissionScores({
    questions: sampleQuestions,
    answers: {
      q1: 'C',
      q2: ['A', 'C'],
      q3: 'SALAH',
      q4: 'konsumen',
      q5: 'Merambat lurus, dipantulkan, dibiaskan, menembus benda bening.',
    },
    essayScores: { q5: 3 },
  });

  // 3/4 objective = 75, essay 3/4 = 75, final = 75*0.6 + 75*0.4 = 75
  assert.equal(graded.objectiveScore, 75);
  assert.equal(graded.essayScore, 75);
  assert.equal(graded.finalScore, 75);
  assert.equal(graded.gradingStatus, 'selesai');
});

test('computeSubmissionScores handles essay-only exams like Bahasa Toraja', () => {
  const essayOnly = [sampleQuestions[4]];
  const res = computeSubmissionScores({
    questions: essayOnly,
    answers: { q5: 'Jawaban siswa' },
    essayScores: { q5: 4 },
  });
  assert.equal(res.objectiveScore, null);
  assert.equal(res.essayScore, 100);
  assert.equal(res.finalScore, 100);
  assert.equal(res.gradingStatus, 'selesai');
});

test('selectQuestionsForExam picks exact counts by question type', () => {
  const selected = selectQuestionsForExam({
    allQuestions: sampleQuestions,
    subject: 'IPAS',
    selectionMode: 'auto',
    countsByType: {
      pg: 1,
      pg_kompleks: 1,
      benar_salah: 0,
      isian_singkat: 1,
      uraian: 1,
    },
    shuffle: false,
  });
  assert.deepEqual(selected, ['q1', 'q2', 'q4', 'q5']);
});

test('sanitizeQuestionsForStudent strips correctAnswer and rubric', () => {
  const sanitized = sanitizeQuestionsForStudent(sampleQuestions, false);
  for (const item of sanitized) {
    assert.equal('correctAnswer' in item, false);
    assert.equal('rubric' in item, false);
  }
});

test('computeSubmissionScores respects custom question weights, maxScore, and scoringConfig', () => {
  const weightedQuestions: Question[] = [
    { ...sampleQuestions[0], maxScore: 2, weight: 3 }, // max 6
    { ...sampleQuestions[3], maxScore: 2, weight: 1 }, // max 2
    { ...sampleQuestions[4], maxScore: 4, weight: 2 }, // max 8
  ];

  // Student gets q1 right (6/8 objective = 75%), q4 wrong, and q5 gets 4/4 (100% essay)
  const splitCustom = computeSubmissionScores({
    questions: weightedQuestions,
    answers: { q1: 'C', q4: 'Salah', q5: 'Lengkap' },
    essayScores: { q5: 4 },
    scoringConfig: {
      scoringMode: 'weighted_split',
      objectiveWeightPercent: 50,
      essayWeightPercent: 50,
    },
  });
  assert.equal(splitCustom.objectiveScore, 75);
  assert.equal(splitCustom.essayScore, 100);
  // 75*0.5 + 100*0.5 = 87.5
  assert.equal(splitCustom.finalScore, 87.5);

  // Total points mode: (6 + 8) / (6 + 2 + 8) = 14 / 16 = 87.5
  const totalPoints = computeSubmissionScores({
    questions: weightedQuestions,
    answers: { q1: 'C', q4: 'Salah', q5: 'Lengkap' },
    essayScores: { q5: 4 },
    scoringConfig: {
      scoringMode: 'total_points',
    },
  });
  assert.equal(totalPoints.finalScore, 87.5);
});
