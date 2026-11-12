"use client";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { GameError } from "./data/rules.ts";

let browserClient: SupabaseClient | undefined;
export function supabasePublicConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new GameError(503, "SUPABASE_NOT_CONFIGURED", "Phần lưu trữ chưa được cấu hình.");
  return { url, key };
}
/** The stored session identifies a returning guest; it is not device tracking. */
export function getSupabaseBrowser() {
  if (typeof window === "undefined") throw new Error("getSupabaseBrowser must run in the browser");
  if (!browserClient) {
    const { url, key } = supabasePublicConfig();
    browserClient = createClient(url, key, {
      auth: { flowType: "pkce", persistSession: true, autoRefreshToken: true,
        detectSessionInUrl: false, storage: window.localStorage },
    });
  }
  return browserClient;
}
