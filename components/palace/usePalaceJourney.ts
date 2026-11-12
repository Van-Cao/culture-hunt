"use client";
import { useCallback, useEffect, useState } from "react";
import type { CheckpointId } from "@/lib/palace/checkpoints";
import type { PalaceState, RecognitionResult } from "@/lib/palace/types";

async function json<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, { cache: "no-store", ...options });
  const data = await response.json();
  if (!response.ok)
    throw new Error(
      data.error || "Không kết nối được. / Connection unavailable.",
    );
  return data;
}
export function usePalaceJourney() {
  const [state, setState] = useState<PalaceState | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const reload = useCallback(async () => {
    try {
      setState(await json<PalaceState>("/api/palace"));
      setError("");
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Connection unavailable",
      );
    }
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    json<PalaceState>("/api/palace", { signal: controller.signal })
      .then(setState)
      .catch((cause) => {
        if (!controller.signal.aborted) setError(cause.message);
      });
    return () => controller.abort();
  }, []);
  async function run<T>(action: () => Promise<T & { state: PalaceState }>) {
    setBusy(true);
    setError("");
    try {
      const result = await action();
      setState(result.state);
      return result;
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Connection unavailable",
      );
      return null;
    } finally {
      setBusy(false);
    }
  }
  function start(replay = false) {
    return run(() =>
      json<{ state: PalaceState }>("/api/palace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start", replay }),
      }),
    );
  }
  function recognize(
    runId: string,
    checkpointId: CheckpointId,
    photo: File | CheckpointId,
  ) {
    const body = new FormData();
    body.set("runId", runId);
    body.set("checkpointId", checkpointId);
    if (typeof photo === "string") body.set("sampleId", photo);
    else body.set("photo", photo);
    return run(() =>
      json<{ state: PalaceState; recognition: RecognitionResult }>(
        "/api/palace/recognize",
        { method: "POST", body },
      ),
    );
  }
  function answer(runId: string, checkpointId: CheckpointId, answer: number, questionId: string) {
    return run(() =>
      json<{ state: PalaceState; correct: boolean }>("/api/palace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "answer", runId, checkpointId, answer, questionId }),
      }),
    );
  }
  return { state, busy, error, reload, start, recognize, answer };
}
export type PalaceGame = ReturnType<typeof usePalaceJourney>;
