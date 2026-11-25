import type { PalaceQuestion, QuestionAnswer, ScoredQuestion } from "./question-types";

export function isAnswerEnvelope(value: unknown): value is QuestionAnswer {
  return (Number.isInteger(value) && Number(value) >= 0 && Number(value) < 12)
    || (typeof value === "string" && /^\d{1,6}$/.test(value))
    || (Array.isArray(value) && value.length > 0 && value.length <= 12
      && value.every(item => Number.isInteger(item) && item >= 0 && item < 12));
}

export function isValidQuestionAnswer(question: PalaceQuestion, answer: unknown): answer is QuestionAnswer {
  if (!isAnswerEnvelope(answer)) return false;
  const kind = question.kind || "single";
  const size = question.answers.vi.length;
  if (kind === "number") return typeof answer === "string";
  if (kind === "single") return typeof answer === "number" && answer < size;
  if (!Array.isArray(answer) || answer.some(index => index >= size)) return false;
  if (kind === "match") return answer.length === question.prompts?.vi.length;
  if (new Set(answer).size !== answer.length) return false;
  return kind === "multi" || (kind === "order" && answer.length === size);
}

export function isCorrectQuestionAnswer(question: ScoredQuestion, answer: QuestionAnswer) {
  const solution = question.solution ?? question.correct;
  if (question.kind === "number") return Number(answer) === Number(solution);
  if (Array.isArray(answer) && Array.isArray(solution)) {
    const ordered = question.kind !== "multi";
    const a = ordered ? answer : [...answer].sort((x, y) => x - y);
    const b = ordered ? solution : [...solution].sort((x, y) => x - y);
    return a.length === b.length && a.every((item, index) => item === b[index]);
  }
  return answer === solution;
}
