import type { CheckpointId } from "./checkpoints";

export type RecognitionMode = "sample" | "reference" | "openai";
export type Attempt = { at: string; answer: number; correct: boolean };
export type Visit = {
  checkpointId: CheckpointId;
  recognizedAt: string;
  mode: RecognitionMode;
  completedAt: string | null;
  attempts: Attempt[];
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
