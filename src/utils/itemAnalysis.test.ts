import test from 'node:test';
import assert from 'node:assert/strict';
import { buildExamItemAnalysis } from './itemAnalysis';
import type { ExamPackage, Question, StudentSubmission } from '../types/exam';

const exam: ExamPackage = {
  id: 'exam-1',
  shareCode: 'TEST-1',
  title: 'Latihan IPAS',
  subject: 'IPAS',
  assessmentType: 'Latihan Harian',
  gradeLevel: 'V',
  academicYear: '2026/2027',
  schoolName: 'SDN 2 Makale Selatan',
  durationMinutes: 60,
  token: '',
  isActive: true,
  showResultsToStudent: true,
  shuffleQuestions: false,
  shuffleOptions: false,
  selectionMode: 'manual',
  countsByType: { pg: 2, pg_kompleks: 0, benar_salah: 0, isian_singkat: 0, uraian: 1 },
  questionIds: ['q1', 'q2', 'q3'],
  instructions: [],
  createdAt: '2026-11-01T00:00:00.000Z',
  updatedAt: '2026-11-01T00:00:00.000Z',
};

const questions: Question[] = [
  {
    id: 'q1',
    subject: 'IPAS',
    type: 'pg',
    prompt: 'Soal 1',
    options: [
      { id: 'A', text: 'Satu' },
      { id: 'B', text: 'Dua' },
    ],
    correctAnswer: 'A',
    maxScore: 1,
    weight: 1,
    createdAt: '2026-11-01T00:00:00.000Z',
  },
  {
    id: 'q2',
    subject: 'IPAS',
    type: 'pg',
    prompt: 'Soal 2',
    options: [
      { id: 'A', text: 'Benar' },
      { id: 'B', text: 'Salah' },
    ],
    correctAnswer: 'B',
    maxScore: 2,
    weight: 2,
    createdAt: '2026-11-01T00:00:00.000Z',
  },
  {
    id: 'q3',
    subject: 'IPAS',
    type: 'uraian',
    prompt: 'Soal Uraian',
    correctAnswer: 'Penjelasan',
    maxScore: 4,
    weight: 1,
    createdAt: '2026-11-01T00:00:00.000Z',
  },
];

const submissions: StudentSubmission[] = [
  {
    id: 'sub-1',
    examId: 'exam-1',
    examCode: 'TEST-1',
    examTitle: 'Latihan IPAS',
    subject: 'IPAS',
    studentName: 'Budi',
    studentClass: 'V-A',
    studentAbsen: '1',
    answers: { q1: 'A', q2: 'B', q3: 'Jawaban lengkap' },
    flaggedQuestionIds: [],
    startedAt: '2026-11-01T01:00:00.000Z',
    submittedAt: '2026-11-01T01:10:00.000Z',
    durationUsedSeconds: 600,
    objectiveCorrectCount: 2,
    objectiveTotalCount: 2,
    objectiveScore: 100,
    essayScores: { q3: 4 },
    essayTotalCount: 1,
    essayScore: 100,
    finalScore: 100,
    gradingStatus: 'selesai',
  },
  {
    id: 'sub-2',
    examId: 'exam-1',
    examCode: 'TEST-1',
    examTitle: 'Latihan IPAS',
    subject: 'IPAS',
    studentName: 'Siti',
    studentClass: 'V-A',
    studentAbsen: '2',
    answers: { q1: 'A', q2: 'A', q3: 'Kurang tepat' },
    flaggedQuestionIds: [],
    startedAt: '2026-11-01T01:00:00.000Z',
    submittedAt: '2026-11-01T01:15:00.000Z',
    durationUsedSeconds: 900,
    objectiveCorrectCount: 1,
    objectiveTotalCount: 2,
    objectiveScore: 20,
    essayScores: { q3: 1 },
    essayTotalCount: 1,
    essayScore: 25,
    finalScore: 22,
    gradingStatus: 'selesai',
  },
];

test('buildExamItemAnalysis builds per-student correct/wrong matrix and question difficulty stats', () => {
  const analysis = buildExamItemAnalysis({ exam, questions, submissions });

  assert.equal(analysis.summary.participantCount, 2);
  assert.equal(analysis.summary.questionCount, 3);
  assert.equal(analysis.summary.averageScore, 61);

  assert.equal(analysis.studentRows[0].cellDetails.q1.status, 'correct');
  assert.equal(analysis.studentRows[0].cellDetails.q2.status, 'correct');
  assert.equal(analysis.studentRows[0].cellDetails.q3.status, 'correct');

  assert.equal(analysis.studentRows[1].cellDetails.q1.status, 'correct');
  assert.equal(analysis.studentRows[1].cellDetails.q2.status, 'wrong');
  assert.equal(analysis.studentRows[1].cellDetails.q3.status, 'wrong');

  assert.equal(analysis.questions[0].percentCorrect, 100);
  assert.equal(analysis.questions[0].difficultyLabel, 'Mudah');
  assert.equal(analysis.questions[1].percentCorrect, 50);
  assert.equal(analysis.questions[1].difficultyLabel, 'Sedang');
});
