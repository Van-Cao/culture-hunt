"use client";
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { HCMUS_PROGRESS_STORAGE_KEY, readHcmusProgress } from "@/lib/hcmus/progress";

type AccountUser = { id: string; name: string; email: string };
type Session = { user: AccountUser } | null;
type AccountContext = {
  data: Session; ready: boolean; configured: boolean; error: string;
  authenticate: (action: "signin" | "signup", email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
};
const Context = createContext<AccountContext | null>(null);
async function request(body?: unknown) {
  const response = await fetch("/api/account", body ? { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), cache: "no-store" } : { cache: "no-store" });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Không kết nối được tài khoản. / Account unavailable.");
  return result;
}
export function AccountProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<Session>(null);
  const [ready, setReady] = useState(false), [configured, setConfigured] = useState(false), [error, setError] = useState("");
  const revision = useRef(0);
  const refresh = useCallback(async () => {
    const current = ++revision.current;
    try { const result = await request(); if (revision.current === current) { setData(result.user ? { user: result.user } : null); setConfigured(result.configured); setError(""); } }
    catch (cause) { if (revision.current === current) setError(cause instanceof Error ? cause.message : "Account unavailable"); }
    finally { if (revision.current === current) setReady(true); }
  }, []);
  useEffect(() => {
    queueMicrotask(() => { void refresh(); });
    const channel = new BroadcastChannel("culture-hunt-account");
    channel.onmessage = () => { void refresh(); };
    const focus = () => { void refresh(); };
    window.addEventListener("focus", focus);
    return () => { channel.close(); window.removeEventListener("focus", focus); };
  }, [refresh]);
  function broadcast() { const channel = new BroadcastChannel("culture-hunt-account"); channel.postMessage("changed"); channel.close(); }
  async function authenticate(action: "signin" | "signup", email: string, password: string, name: string) {
    if (!data?.user) {
      // Import browser-only campus/favorites once, before claiming the guest profile.
      let legacy: { hcmus: number; saved: string[]; bookmarks: string[] } | undefined;
      try {
        const hcmus = readHcmusProgress(localStorage.getItem(HCMUS_PROGRESS_STORAGE_KEY));
        const parsed = JSON.parse(localStorage.getItem("culture-hunt-saved-v1") || "[]");
        const saved = Array.isArray(parsed) ? [...new Set(parsed.filter(id => id === "palace" || id === "hcmus"))] : [];
        const oldStories = JSON.parse(localStorage.getItem("culture-hunt-atlas-favorites-v1") || "[]");
        const bookmarks = Array.isArray(oldStories) ? oldStories.filter((id): id is string => typeof id === "string" && /^(palace|hcmus):[a-z0-9-]+$/.test(id) && id.length <= 80).slice(0,50) : [];
        if (hcmus || saved.length || bookmarks.length) legacy = { hcmus, saved, bookmarks };
      } catch { /* Optional browser storage. Network failures below must preserve progress. */ }
      if (legacy) {
        const response = await fetch("/api/progress", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "import", ...legacy }) });
        if (!response.ok) throw new Error("Chưa đồng bộ được tiến độ khách. / Could not sync guest progress.");
      }
    }
    const result = await request({ action, email, password, name });
    try { localStorage.removeItem(HCMUS_PROGRESS_STORAGE_KEY); localStorage.removeItem("culture-hunt-saved-v1"); localStorage.removeItem("culture-hunt-atlas-favorites-v1"); } catch { /* Optional legacy storage. */ }
    revision.current++; setData({ user: result.user }); setError(""); broadcast();
  }
  async function signOut() { await request({ action: "signout" }); revision.current++; setData(null); broadcast(); }
  return <Context.Provider value={{ data, ready, configured, error, authenticate, signOut }}>{children}</Context.Provider>;
}
export function useAccount() {
  const context = useContext(Context);
  if (!context) throw new Error("AccountProvider is missing");
  return context;
}
