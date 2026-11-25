export type QuestionText = { vi: string; en: string };
export type QuestionAnswer = number | number[] | string;
export type QuestionKind = "single" | "multi" | "order" | "number" | "match";
export type LearningCard = { title: QuestionText; text: QuestionText; asset?: string };
export type LearningReveal = { kind: "tam" | "painting" | "compare" | "roof" | "signal"; title: QuestionText; text: QuestionText };
export type LearningScene = {
  title: QuestionText;
  context: QuestionText;
  asset: string;
  caption: QuestionText;
  crop?: [number, number, number, number];
  cards?: LearningCard[];
  choiceAssets?: (string | null)[];
  reveal?: LearningReveal;
  sourceUrl: string;
};
export type PalaceQuestion = {
  id: string;
  bankVersion: string;
  sourceId: string;
  sourceIds?: string[];
  learning?: LearningScene;
  kind?: QuestionKind;
  question: QuestionText;
  answers: { vi: readonly string[]; en: readonly string[] };
  prompts?: { vi: readonly string[]; en: readonly string[] };
  hint: QuestionText;
  explanation: QuestionText;
};
export type ScoredQuestion = PalaceQuestion & {
  correct: number;
  solution?: QuestionAnswer;
};
