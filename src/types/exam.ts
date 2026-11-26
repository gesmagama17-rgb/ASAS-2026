export type QuestionType =
  | 'pg'
  | 'pg_kompleks'
  | 'benar_salah'
  | 'isian_singkat'
  | 'uraian';

export type SubjectName =
  | 'IPAS'
  | 'Matematika'
  | 'Bahasa Indonesia'
  | 'Pendidikan Pancasila'
  | 'Seni Musik'
  | 'Seni Rupa'
  | 'Bahasa Toraja'
  | string;

export const STANDARD_SUBJECTS: string[] = [
  'IPAS',
  'Matematika',
  'Bahasa Indonesia',
  'Pendidikan Pancasila',
  'Seni Musik',
  'Seni Rupa',
  'Bahasa Toraja',
];

export interface QuestionOption {
  id: string; // e.g. 'A', 'B', 'C', 'D' or 'BENAR', 'SALAH'
  text: string;
}

export interface TableData {
  headers: string[];
  rows: string[][];
}

export interface Question {
  id: string;
  subject: SubjectName;
  type: QuestionType;
  prompt: string;
  passage?: string;
  tableData?: TableData;
  diagramId?: string;
  options?: QuestionOption[];
  /**
   * For 'pg' | 'benar_salah': single string ('A', 'B', 'C', 'D', 'BENAR', 'SALAH')
   * For 'pg_kompleks': string[] (e.g. ['A', 'C'])
   * For 'isian_singkat': string (pipe-separated acceptable answers, e.g. "matahari|Matahari")
   * For 'uraian': string (model answer / pedoman jawaban)
   */
  correctAnswer: string | string[];
  rubric?: string;
  maxScore: number; // 1 for objective, 4 for uraian (editable)
  weight?: number; // multiplier weight for the question, default 1
  sourceTag?: string; // e.g. 'Rujukan ASAS PDF', 'Upload Word', or 'Soal Guru'
  createdAt: string;
}

export interface StudentQuestion {
  id: string;
  subject: SubjectName;
  type: QuestionType;
  prompt: string;
  passage?: string;
  tableData?: TableData;
  diagramId?: string;
  options?: QuestionOption[];
  maxScore: number;
}

export type AssessmentType =
  | 'ASAS Ganjil'
  | 'Simulasi TKA'
  | 'Latihan Harian'
  | 'Tryout Terpadu';

export type ScoringMode = 'weighted_split' | 'total_points';

export interface CountsByType {
  pg: number;
  pg_kompleks: number;
  benar_salah: number;
  isian_singkat: number;
  uraian: number;
}

export interface ExamPackage {
  id: string;
  shareCode: string;
  title: string;
  subject: SubjectName | 'Campuran';
  assessmentType: AssessmentType;
  gradeLevel: string;
  academicYear: string;
  schoolName: string;
  durationMinutes: number;
  token: string;
  isActive: boolean;
  showResultsToStudent: boolean;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  selectionMode: 'auto' | 'manual';
  countsByType: CountsByType;
  questionIds: string[];
  scoringMode?: ScoringMode;
  objectiveWeightPercent?: number;
  essayWeightPercent?: number;
  instructions: string[];
  createdAt: string;
  updatedAt: string;
}

export interface StudentExamSummary {
  id: string;
  shareCode: string;
  title: string;
  subject: SubjectName | 'Campuran';
  assessmentType: AssessmentType;
  gradeLevel: string;
  academicYear: string;
  schoolName: string;
  durationMinutes: number;
  requiresToken: boolean;
  questionCount: number;
  countsByType: CountsByType;
  showResultsToStudent: boolean;
  instructions: string[];
}

export interface StudentExamPayload {
  exam: StudentExamSummary;
  questions: StudentQuestion[];
}

export type StudentAnswerValue = string | string[];

export interface StudentSubmission {
  id: string;
  examId: string;
  examCode: string;
  examTitle: string;
  subject: string;
  studentName: string;
  studentClass: string;
  studentAbsen: string;
  answers: Record<string, StudentAnswerValue>;
  flaggedQuestionIds: string[];
  startedAt: string;
  submittedAt: string;
  durationUsedSeconds: number;
  objectiveCorrectCount: number;
  objectiveTotalCount: number;
  objectiveScore: number | null;
  essayScores: Record<string, number>;
  essayTotalCount: number;
  essayScore: number | null;
  finalScore: number | null;
  gradingStatus: 'selesai' | 'menunggu_koreksi_uraian';
  teacherNote?: string;
}

export interface QuestionReviewItem {
  questionId: string;
  prompt: string;
  type: QuestionType;
  studentAnswer: StudentAnswerValue | undefined;
  isObjective: boolean;
  isCorrect: boolean | null;
  correctAnswer?: string | string[];
  rubric?: string;
  essayScore?: number;
  maxScore: number;
  weight?: number;
}

export interface SubmissionResultSummary {
  submission: StudentSubmission;
  showResults: boolean;
  reviews?: QuestionReviewItem[];
}

export interface ParsedWordQuestion {
  tempId: string;
  subject?: string;
  type: QuestionType;
  prompt: string;
  passage?: string;
  tableData?: TableData;
  options?: QuestionOption[];
  correctAnswer: string | string[];
  rubric?: string;
  maxScore: number;
  weight: number;
  warning?: string;
}

export type ItemCellStatus = 'correct' | 'wrong' | 'ungraded';

export interface ItemAnalysisCell {
  questionId: string;
  status: ItemCellStatus;
  studentAnswerText: string;
  earnedPoints: number;
  maxPoints: number;
}

export interface ItemAnalysisStudentRow {
  submissionId: string;
  studentName: string;
  studentClass: string;
  studentAbsen: string;
  submittedAt: string;
  objectiveScore: number | null;
  essayScore: number | null;
  finalScore: number | null;
  gradingStatus: 'selesai' | 'menunggu_koreksi_uraian';
  totalEarnedPoints: number;
  totalMaxPoints: number;
  cellDetails: Record<string, ItemAnalysisCell>;
}

export interface ItemAnalysisQuestionStat {
  questionNumber: number;
  questionId: string;
  subject: string;
  type: QuestionType;
  prompt: string;
  correctAnswerText: string;
  maxScore: number;
  weight: number;
  correctCount: number;
  wrongCount: number;
  ungradedCount: number;
  totalAttempted: number;
  percentCorrect: number;
  difficultyLabel: 'Mudah' | 'Sedang' | 'Sukar' | 'Belum Dinilai';
}

export interface ExamItemAnalysis {
  exam: ExamPackage;
  questions: ItemAnalysisQuestionStat[];
  studentRows: ItemAnalysisStudentRow[];
  summary: {
    participantCount: number;
    questionCount: number;
    averageScore: number | null;
    highestScore: number | null;
    lowestScore: number | null;
  };
}

export interface BitlyShortLinkRecord {
  targetKey: string;
  shortUrl: string;
  longUrl: string;
  bitlinkId: string;
  customSlug?: string;
  createdAt: string;
}

export interface BitlyStatus {
  connected: boolean;
  login?: string;
  name?: string;
  domain?: string;
  authMethod?: 'token' | 'oauth' | 'env';
  connectedAt?: string;
  oauthConfigured: boolean;
  callbackUrl: string;
  envTokenActive: boolean;
}

