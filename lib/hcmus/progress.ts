import { hcmusCheckpointIds } from "./checkpoints";

// The four-stop catalog changes the order of visits. Retain older storage entries
// without mapping seven-stop or three-story progress onto this new journey.
export const HCMUS_PROGRESS_STORAGE_KEY = "culture-hunt-hcmus-checkpoints-v2";

export function readHcmusProgress(serialized: string | null): number {
  try {
    const value: unknown = JSON.parse(serialized ?? "null");
    return typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= hcmusCheckpointIds.length
      ? value : 0;
  } catch {
    return 0;
  }
}
