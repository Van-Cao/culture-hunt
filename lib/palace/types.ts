import type { CheckpointId } from "./checkpoints";
import type { PalaceQuestion } from "./questions";
import type { QuestionAnswer } from "./question-types";

export type RecognitionMode = "sample" | "reference" | "openai";
export type Attempt = { at: string; answer: QuestionAnswer; correct: boolean; questionId: string };
export type Visit = {
  checkpointId: CheckpointId;
  recognizedAt: string;
  mode: RecognitionMode;
  completedAt: string | null;
  attempts: Attempt[];
  quiz: PalaceQuestion[];
  legacyGameMoves?: number;
};
export type JourneyRun = {
  id: string;
  startedAt: string;
  completedAt: string | null;
  status: "active" | "completed" | "abandoned";
  visits: Partial<Record<CheckpointId, Visit>>;
};
export type PalaceState = {
  runs: JourneyRun[];
  activeRunId: string | null;
  discovered: CheckpointId[];
  xp: number;
  aiAvailable: boolean;
};
export type RecognitionResult = {
  status: "matched" | "mismatch" | "ambiguous" | "unknown";
  checkpointId: CheckpointId | null;
  mode: RecognitionMode;
  reason: string;
};
