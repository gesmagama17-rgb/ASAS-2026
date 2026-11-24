import type {
  CountsByType,
  ExamPackage,
  Question,
  QuestionReviewItem,
  QuestionType,
  StudentAnswerValue,
  StudentExamSummary,
  StudentQuestion,
  StudentSubmission,
} from '../types/exam';

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  pg: 'Pilihan Ganda',
  pg_kompleks: 'Pilihan Ganda Kompleks',
  benar_salah: 'Benar / Salah',
  isian_singkat: 'Isian Singkat',
  uraian: 'Uraian / Essay',
};

export function isObjectiveType(type: QuestionType): boolean {
  return type !== 'uraian';
}

export function normalizeTextAnswer(val: string): string {
  return val
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[.,!?;:]+$/g, '');
}

export function isObjectiveAnswerCorrect(
  question: Question,
  answer: StudentAnswerValue | undefined
): boolean {
  if (answer === undefined || answer === null) return false;

  if (question.type === 'pg' || question.type === 'benar_salah') {
    if (typeof answer !== 'string') return false;
    const expected = Array.isArray(question.correctAnswer)
      ? question.correctAnswer[0] ?? ''
      : question.correctAnswer;
    return answer.trim().toUpperCase() === expected.trim().toUpperCase();
  }

  if (question.type === 'pg_kompleks') {
    const selected = Array.isArray(answer)
      ? answer.map((x) => x.trim().toUpperCase()).filter(Boolean)
      : typeof answer === 'string' && answer.trim()
        ? [answer.trim().toUpperCase()]
        : [];
    const expected = Array.isArray(question.correctAnswer)
      ? question.correctAnswer.map((x) => x.trim().toUpperCase()).filter(Boolean)
      : [String(question.correctAnswer).trim().toUpperCase()];

    if (selected.length === 0 || selected.length !== expected.length) return false;
    const setSelected = new Set(selected);
    return expected.every((item) => setSelected.has(item));
  }

  if (question.type === 'isian_singkat') {
    if (typeof answer !== 'string') return false;
    const normalizedInput = normalizeTextAnswer(answer);
    if (!normalizedInput) return false;
    const rawExpected = Array.isArray(question.correctAnswer)
      ? question.correctAnswer
      : String(question.correctAnswer).split('|');
    return rawExpected.some(
      (candidate) => normalizeTextAnswer(candidate) === normalizedInput
    );
  }

  return false;
}

export interface ExamScoringConfig {
  scoringMode?: 'weighted_split' | 'total_points';
  objectiveWeightPercent?: number;
  essayWeightPercent?: number;
}

export function getQuestionWeight(q: Pick<Question, 'weight'>): number {
  return typeof q.weight === 'number' && Number.isFinite(q.weight) && q.weight > 0
    ? q.weight
    : 1;
}

export function getQuestionMaxScore(q: Pick<Question, 'type' | 'maxScore'>): number {
  if (typeof q.maxScore === 'number' && Number.isFinite(q.maxScore) && q.maxScore > 0) {
    return q.maxScore;
  }
  return q.type === 'uraian' ? 4 : 1;
}

export function computeSubmissionScores(params: {
  questions: Question[];
  answers: Record<string, StudentAnswerValue>;
  essayScores?: Record<string, number>;
  scoringConfig?: ExamScoringConfig;
}): {
  objectiveCorrectCount: number;
  objectiveTotalCount: number;
  objectiveScore: number | null;
  essayTotalCount: number;
  essayScore: number | null;
  finalScore: number | null;
  gradingStatus: 'selesai' | 'menunggu_koreksi_uraian';
} {
  const { questions, answers, essayScores = {}, scoringConfig } = params;

  const objectiveQuestions = questions.filter((q) => isObjectiveType(q.type));
  const essayQuestions = questions.filter((q) => q.type === 'uraian');

  let objectiveCorrectCount = 0;
  let earnedObjectivePoints = 0;
  let maxObjectivePoints = 0;

  for (const q of objectiveQuestions) {
    const qMax = getQuestionMaxScore(q);
    const qWeight = getQuestionWeight(q);
    const weightedMax = qMax * qWeight;
    maxObjectivePoints += weightedMax;
    if (isObjectiveAnswerCorrect(q, answers[q.id])) {
      objectiveCorrectCount += 1;
      earnedObjectivePoints += weightedMax;
    }
  }

  const objectiveTotalCount = objectiveQuestions.length;
  const objectiveScore =
    objectiveTotalCount > 0 && maxObjectivePoints > 0
      ? Math.round((earnedObjectivePoints / maxObjectivePoints) * 1000) / 10
      : null;

  const essayTotalCount = essayQuestions.length;
  let essayScore: number | null = null;
  let earnedEssayPoints = 0;
  let maxEssayPoints = 0;
  let allEssaysGraded = true;

  if (essayTotalCount > 0) {
    for (const q of essayQuestions) {
      const qMax = getQuestionMaxScore(q);
      const qWeight = getQuestionWeight(q);
      maxEssayPoints += qMax * qWeight;
      const graded = essayScores[q.id];
      if (typeof graded !== 'number' || Number.isNaN(graded)) {
        allEssaysGraded = false;
      } else {
        earnedEssayPoints += Math.max(0, Math.min(qMax, graded)) * qWeight;
      }
    }
    if (allEssaysGraded && maxEssayPoints > 0) {
      essayScore = Math.round((earnedEssayPoints / maxEssayPoints) * 1000) / 10;
    }
  }

  let finalScore: number | null = null;
  const scoringMode = scoringConfig?.scoringMode || 'weighted_split';

  if (scoringMode === 'total_points') {
    const totalMax = maxObjectivePoints + maxEssayPoints;
    if ((essayTotalCount === 0 || allEssaysGraded) && totalMax > 0) {
      finalScore =
        Math.round(((earnedObjectivePoints + earnedEssayPoints) / totalMax) * 1000) / 10;
    }
  } else {
    if (objectiveScore !== null && essayTotalCount === 0) {
      finalScore = Math.round(objectiveScore * 10) / 10;
    } else if (objectiveScore === null && essayScore !== null) {
      finalScore = Math.round(essayScore * 10) / 10;
    } else if (objectiveScore !== null && essayScore !== null) {
      const rawObjPct =
        typeof scoringConfig?.objectiveWeightPercent === 'number'
          ? Math.max(0, scoringConfig.objectiveWeightPercent)
          : 60;
      const rawEssayPct =
        typeof scoringConfig?.essayWeightPercent === 'number'
          ? Math.max(0, scoringConfig.essayWeightPercent)
          : 40;
      const totalPct = rawObjPct + rawEssayPct;
      const objRatio = totalPct > 0 ? rawObjPct / totalPct : 0.6;
      const essayRatio = totalPct > 0 ? rawEssayPct / totalPct : 0.4;
      finalScore = Math.round((objectiveScore * objRatio + essayScore * essayRatio) * 10) / 10;
    }
  }

  const gradingStatus: 'selesai' | 'menunggu_koreksi_uraian' =
    essayTotalCount > 0 && !allEssaysGraded
      ? 'menunggu_koreksi_uraian'
      : 'selesai';

  return {
    objectiveCorrectCount,
    objectiveTotalCount,
    objectiveScore,
    essayTotalCount,
    essayScore,
    finalScore,
    gradingStatus,
  };
}

export function selectQuestionsForExam(params: {
  allQuestions: Question[];
  subject: string;
  selectionMode: 'auto' | 'manual';
  countsByType: CountsByType;
  manualQuestionIds?: string[];
  shuffle?: boolean;
}): string[] {
  const {
    allQuestions,
    subject,
    selectionMode,
    countsByType,
    manualQuestionIds = [],
    shuffle = false,
  } = params;

  if (selectionMode === 'manual') {
    const validIds = new Set(allQuestions.map((q) => q.id));
    return manualQuestionIds.filter((id) => validIds.has(id));
  }

  const pool =
    subject === 'Campuran'
      ? allQuestions
      : allQuestions.filter((q) => q.subject === subject);

  const typesOrder: QuestionType[] = [
    'pg',
    'pg_kompleks',
    'benar_salah',
    'isian_singkat',
    'uraian',
  ];

  const selectedIds: string[] = [];
  for (const qType of typesOrder) {
    const requested = Math.max(0, countsByType[qType] || 0);
    if (requested === 0) continue;

    let candidates = pool.filter((q) => q.type === qType);
    if (shuffle) {
      candidates = [...candidates].sort(() => Math.random() - 0.5);
    }
    selectedIds.push(...candidates.slice(0, requested).map((q) => q.id));
  }

  return selectedIds;
}

export function computeCountsFromQuestions(questions: Question[]): CountsByType {
  const counts: CountsByType = {
    pg: 0,
    pg_kompleks: 0,
    benar_salah: 0,
    isian_singkat: 0,
    uraian: 0,
  };
  for (const q of questions) {
    counts[q.type] = (counts[q.type] || 0) + 1;
  }
  return counts;
}

export function sanitizeQuestionsForStudent(
  questions: Question[],
  shuffleOptions: boolean
): StudentQuestion[] {
  return questions.map((q) => {
    let options = q.options ? q.options.map((o) => ({ ...o })) : undefined;
    if (options && shuffleOptions && q.type === 'pg') {
      // Preserve option IDs A/B/C/D order? No, keep original IDs so A/B/C/D labels stay sequential, or keep options intact for diagram-letter questions
      if (!q.diagramId) {
        const texts = options.map((o) => o.text).sort(() => Math.random() - 0.5);
        options = options.map((o, idx) => ({ id: o.id, text: texts[idx] }));
      }
    }
    return {
      id: q.id,
      subject: q.subject,
      type: q.type,
      prompt: q.prompt,
      passage: q.passage,
      tableData: q.tableData,
      diagramId: q.diagramId,
      options,
      maxScore: q.maxScore,
    };
  });
}

export function buildStudentExamSummary(
  exam: ExamPackage,
  questions: Question[]
): StudentExamSummary {
  return {
    id: exam.id,
    shareCode: exam.shareCode,
    title: exam.title,
    subject: exam.subject,
    assessmentType: exam.assessmentType,
    gradeLevel: exam.gradeLevel,
    academicYear: exam.academicYear,
    schoolName: exam.schoolName,
    durationMinutes: exam.durationMinutes,
    requiresToken: Boolean(exam.token && exam.token.trim().length > 0),
    questionCount: questions.length,
    countsByType: computeCountsFromQuestions(questions),
    showResultsToStudent: exam.showResultsToStudent,
    instructions: exam.instructions,
  };
}

export function buildReviewItems(
  questions: Question[],
  submission: StudentSubmission,
  includeAnswerKeys: boolean
): QuestionReviewItem[] {
  return questions.map((q) => {
    const studentAnswer = submission.answers[q.id];
    const objective = isObjectiveType(q.type);
    const isCorrect = objective ? isObjectiveAnswerCorrect(q, studentAnswer) : null;
    const item: QuestionReviewItem = {
      questionId: q.id,
      prompt: q.prompt,
      type: q.type,
      studentAnswer,
      isObjective: objective,
      isCorrect,
      maxScore: getQuestionMaxScore(q),
      weight: getQuestionWeight(q),
      essayScore: !objective ? submission.essayScores[q.id] : undefined,
    };
    if (includeAnswerKeys) {
      item.correctAnswer = q.correctAnswer;
      item.rubric = q.rubric;
    }
    return item;
  });
}
