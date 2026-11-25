import bank from "@/content/palace/question-bank-v3.json";
import answerKey from "@/content/palace/question-bank-v3.answers.json";
import type { CheckpointId } from "./checkpoints";
import type { ScoredQuestion } from "./question-types";
export type { PalaceQuestion, ScoredQuestion, QuestionAnswer } from "./question-types";

export const QUESTION_BANK_VERSION = bank.version;
export const QUESTION_BANK_SOURCE = bank.source;
export const questionReview = bank.review;

export function getCheckpointQuestions(checkpointId: CheckpointId): ScoredQuestion[] {
  return bank.questions.filter(question => question.checkpointId === checkpointId).map(question => ({
    ...question, ...answerKey[question.id as keyof typeof answerKey],
  })) as ScoredQuestion[];
}

export function publicQuestion({ correct: _correct, solution: _solution, ...question }: ScoredQuestion) {
  void _correct;
  void _solution;
  return question;
}
