import type {
  ExamItemAnalysis,
  ExamPackage,
  ItemAnalysisCell,
  ItemAnalysisQuestionStat,
  ItemAnalysisStudentRow,
  ItemCellStatus,
  Question,
  StudentAnswerValue,
  StudentSubmission,
} from '../types/exam';
import {
  getQuestionMaxScore,
  getQuestionWeight,
  isObjectiveAnswerCorrect,
  isObjectiveType,
} from './examScoring';

function formatStudentAnswer(val: StudentAnswerValue | undefined): string {
  if (val === undefined || val === null) return '-';
  if (Array.isArray(val)) {
    return val.length > 0 ? val.join(', ') : '-';
  }
  const trimmed = val.trim();
  if (!trimmed) return '-';
  if (trimmed === 'BENAR') return 'Benar';
  if (trimmed === 'SALAH') return 'Salah';
  return trimmed.length > 24 ? `${trimmed.slice(0, 22)}...` : trimmed;
}

function getDifficultyLabel(
  percentCorrect: number,
  totalAttempted: number
): 'Mudah' | 'Sedang' | 'Sukar' | 'Belum Dinilai' {
  if (totalAttempted === 0) return 'Belum Dinilai';
  if (percentCorrect >= 70) return 'Mudah';
  if (percentCorrect >= 30) return 'Sedang';
  return 'Sukar';
}

export function buildExamItemAnalysis(params: {
  exam: ExamPackage;
  questions: Question[];
  submissions: StudentSubmission[];
}): ExamItemAnalysis {
  const { exam, questions, submissions } = params;
  const examSubmissions = submissions.filter((s) => s.examId === exam.id);

  const studentRows: ItemAnalysisStudentRow[] = examSubmissions.map((sub) => {
    const cellDetails: Record<string, ItemAnalysisCell> = {};
    let totalEarnedPoints = 0;
    let totalMaxPoints = 0;

    for (const q of questions) {
      const qMax = getQuestionMaxScore(q);
      const qWeight = getQuestionWeight(q);
      const maxPoints = qMax * qWeight;
      totalMaxPoints += maxPoints;

      const rawAnswer = sub.answers[q.id];

      if (isObjectiveType(q.type)) {
        const isCorrect = isObjectiveAnswerCorrect(q, rawAnswer);
        const earnedPoints = isCorrect ? maxPoints : 0;
        totalEarnedPoints += earnedPoints;
        cellDetails[q.id] = {
          questionId: q.id,
          status: isCorrect ? 'correct' : 'wrong',
          studentAnswerText: formatStudentAnswer(rawAnswer),
          earnedPoints,
          maxPoints,
        };
      } else {
        const gradedScore = sub.essayScores?.[q.id];
        if (typeof gradedScore !== 'number' || Number.isNaN(gradedScore)) {
          cellDetails[q.id] = {
            questionId: q.id,
            status: 'ungraded',
            studentAnswerText: formatStudentAnswer(rawAnswer),
            earnedPoints: 0,
            maxPoints,
          };
        } else {
          const clamped = Math.max(0, Math.min(qMax, gradedScore));
          const earnedPoints = clamped * qWeight;
          totalEarnedPoints += earnedPoints;
          const status: ItemCellStatus = clamped >= qMax * 0.6 ? 'correct' : 'wrong';
          cellDetails[q.id] = {
            questionId: q.id,
            status,
            studentAnswerText: `${clamped}/${qMax}`,
            earnedPoints,
            maxPoints,
          };
        }
      }
    }

    return {
      submissionId: sub.id,
      studentName: sub.studentName,
      studentClass: sub.studentClass,
      studentAbsen: sub.studentAbsen,
      submittedAt: sub.submittedAt,
      objectiveScore: sub.objectiveScore,
      essayScore: sub.essayScore,
      finalScore: sub.finalScore,
      gradingStatus: sub.gradingStatus,
      totalEarnedPoints: Math.round(totalEarnedPoints * 100) / 100,
      totalMaxPoints: Math.round(totalMaxPoints * 100) / 100,
      cellDetails,
    };
  });

  const questionStats: ItemAnalysisQuestionStat[] = questions.map((q, idx) => {
    let correctCount = 0;
    let wrongCount = 0;
    let ungradedCount = 0;

    for (const row of studentRows) {
      const cell = row.cellDetails[q.id];
      if (!cell) continue;
      if (cell.status === 'correct') correctCount += 1;
      else if (cell.status === 'wrong') wrongCount += 1;
      else ungradedCount += 1;
    }

    const totalAttempted = correctCount + wrongCount;
    const percentCorrect =
      totalAttempted > 0 ? Math.round((correctCount / totalAttempted) * 1000) / 10 : 0;

    const correctAnswerText = Array.isArray(q.correctAnswer)
      ? q.correctAnswer.join(', ')
      : q.correctAnswer;

    return {
      questionNumber: idx + 1,
      questionId: q.id,
      subject: q.subject,
      type: q.type,
      prompt: q.prompt,
      correctAnswerText,
      maxScore: getQuestionMaxScore(q),
      weight: getQuestionWeight(q),
      correctCount,
      wrongCount,
      ungradedCount,
      totalAttempted,
      percentCorrect,
      difficultyLabel: getDifficultyLabel(percentCorrect, totalAttempted),
    };
  });

  const numericScores = examSubmissions
    .map((s) => s.finalScore ?? s.objectiveScore)
    .filter((n): n is number => typeof n === 'number' && !Number.isNaN(n));

  const averageScore =
    numericScores.length > 0
      ? Math.round((numericScores.reduce((a, b) => a + b, 0) / numericScores.length) * 10) / 10
      : null;

  const highestScore = numericScores.length > 0 ? Math.max(...numericScores) : null;
  const lowestScore = numericScores.length > 0 ? Math.min(...numericScores) : null;

  return {
    exam,
    questions: questionStats,
    studentRows,
    summary: {
      participantCount: examSubmissions.length,
      questionCount: questions.length,
      averageScore,
      highestScore,
      lowestScore,
    },
  };
}
