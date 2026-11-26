"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ExplorerProgress } from "@/lib/palace/store";
import { HCMUS_PROGRESS_STORAGE_KEY, readHcmusProgress } from "@/lib/hcmus/progress";
import { useAccount } from "./AccountProvider";

async function request(body?: unknown, signal?: AbortSignal): Promise<ExplorerProgress> {
  const response = await fetch("/api/progress", { cache: "no-store", signal, ...(body ? { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) } : {}) });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Chưa lưu được tiến độ. / Could not save progress.");
  return data;
}
export function useExplorerProgress() {
  const { data: session } = useAccount();
  const [progress, setProgress] = useState<ExplorerProgress>({ hcmus: 0, saved: [], bookmarks: [] });
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  const pending = useRef(false);
  const userId = session?.user.id;
  const reload = useCallback(async (signal?: AbortSignal) => {
    try {
      let legacy: ExplorerProgress | undefined;
      if (!userId) {
        try {
          const hcmus = readHcmusProgress(localStorage.getItem(HCMUS_PROGRESS_STORAGE_KEY));
          const items = JSON.parse(localStorage.getItem("culture-hunt-saved-v1") || "[]");
          const saved = Array.isArray(items) ? [...new Set(items.filter((id): id is "palace" | "hcmus" => id === "palace" || id === "hcmus"))] : [];
          const oldStories = JSON.parse(localStorage.getItem("culture-hunt-atlas-favorites-v1") || "[]");
          const bookmarks = Array.isArray(oldStories) ? oldStories.filter((id): id is string => typeof id === "string" && /^(palace|hcmus):[a-z0-9-]+$/.test(id) && id.length <= 80).slice(0,50) : [];
          if (hcmus || saved.length || bookmarks.length) legacy = { hcmus, saved, bookmarks };
        } catch { /* Optional legacy browser storage. */ }
      }
      const data = await request(legacy ? { action: "import", ...legacy } : undefined, signal);
      if (!signal?.aborted) { setProgress(data); setError(""); setReady(true); }
      if (legacy) { try { localStorage.removeItem(HCMUS_PROGRESS_STORAGE_KEY); localStorage.removeItem("culture-hunt-saved-v1"); localStorage.removeItem("culture-hunt-atlas-favorites-v1"); } catch { /* Already persisted. */ } }
    } catch (cause) { if (!signal?.aborted) setError(cause instanceof Error ? cause.message : "Connection unavailable"); }
  }, [userId]);
  useEffect(() => { const controller = new AbortController(); queueMicrotask(() => { if (!controller.signal.aborted) void reload(controller.signal); }); return () => controller.abort(); }, [reload]);
  async function mutate(body: unknown) {
    if (pending.current || !ready) return false;
    pending.current = true;
    try { const data = await request(body); setProgress(data); setError(""); return true; }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Connection unavailable"); return false; }
    finally { pending.current = false; }
  }
  return { ...progress, ready, error, reload: () => reload(), toggleSaved: (place: "palace" | "hcmus") => mutate({ action: "favorite", place, saved: !progress.saved.includes(place) }), toggleBookmark: (key: string) => mutate({ action: "bookmark", key, saved: !progress.bookmarks.includes(key) }), completeCampus: (index: number, answer: number) => mutate({ action: "campus", index, answer }) };
}
