import { hcmusCheckpointIds } from "./checkpoints";

// New catalog: do not treat completion of the old three story chapters as visits
// to buildings. The old storage entry is retained but never mapped to new stops.
export const HCMUS_PROGRESS_STORAGE_KEY = "culture-hunt-hcmus-checkpoints-v1";

export function readHcmusProgress(serialized: string | null): number {
  try {
    const value: unknown = JSON.parse(serialized ?? "null");
    return typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= hcmusCheckpointIds.length
      ? value : 0;
  } catch {
    return 0;
  }
}
