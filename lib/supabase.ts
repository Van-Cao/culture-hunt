import "server-only";
import { createClient } from "@supabase/supabase-js";
import { GameError } from "./data/rules.ts";

/** Server only. No client component may import this module. */
export function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new GameError(503, "SUPABASE_NOT_CONFIGURED", "Phần lưu trữ chưa được cấu hình.");
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
