"use client";
import { createClient, type Session } from "@supabase/supabase-js";
import { getSupabaseBrowser, supabasePublicConfig } from "../supabase-browser.ts";
import { GameError, MAX_PHOTO_BYTES, parseChoice, parseId, parseNickname } from "./rules.ts";
import type { AnswerResult, ChoiceIndex, PlayerSnapshot } from "./types.ts";

const transferKey = "culture-hunt-guest-transfer-v1";
let creatingGuest: Promise<Session> | undefined;
let completingGoogle: Promise<PlayerSnapshot | null> | undefined;

export async function ensurePlayerSession(): Promise<Session> {
  const client = getSupabaseBrowser();
  if (new URL(window.location.href).searchParams.has("code")) {
    throw new GameError(409, "OAUTH_PENDING", "Cần hoàn tất đăng nhập Google trước.");
  }
  const { data, error } = await client.auth.getSession();
  if (error) throw error;
  if (data.session) return data.session;
  // Multiple components mounting simultaneously must create only one guest.
  if (!creatingGuest) creatingGuest = (async () => {
    const { data: guest, error: failure } = await client.auth.signInAnonymously();
    if (failure || !guest.session) throw failure || new Error("Không tạo được phiên khách.");
    return guest.session;
  })().finally(() => { creatingGuest = undefined; });
  return creatingGuest;
}

async function requestGame<T>(path: string, method = "GET", body?: unknown, token?: string): Promise<T> {
  const accessToken = token || (await ensurePlayerSession()).access_token;
  const response = await fetch(`/api/game/${path}`, {
    method, cache: "no-store", credentials: "omit",
    headers: { Authorization: `Bearer ${accessToken}`, ...(body === undefined ? {} : { "Content-Type": "application/json" }) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const result = await response.json();
  if (!response.ok) throw new GameError(response.status, result.code || "REQUEST_FAILED", result.error || "Chưa lưu được dữ liệu.");
  return result as T;
}

export function loadPlayer(): Promise<PlayerSnapshot> { return requestGame("player"); }
export function updateNickname(nickname: string): Promise<PlayerSnapshot> {
  return requestGame("player", "PATCH", { nickname: parseNickname(nickname) });
}
export function answerMission(placeId: string, missionId: string, choice: ChoiceIndex): Promise<AnswerResult> {
  return requestGame("answers", "POST", { placeId: parseId(placeId), missionId: parseId(missionId), choice: parseChoice(choice) });
}

/** UI team calls this instead of starting a second, unrelated Auth.js session. */
export async function startGoogleSignIn(): Promise<void> {
  const client = getSupabaseBrowser();
  const { data, error } = await client.auth.getSession();
  if (error) throw error;
  if (data.session?.user.is_anonymous) {
    window.sessionStorage.setItem(transferKey, JSON.stringify({
      accessToken: data.session.access_token, refreshToken: data.session.refresh_token,
      expiresAt: data.session.expires_at ?? 0,
    }));
  }
  const { error: failure } = await client.auth.signInWithOAuth({
    provider: "google", options: { redirectTo: `${window.location.origin}/?play=1` },
  });
  if (failure) throw failure;
}

/** Call on app entry BEFORE loadPlayer/ensurePlayerSession when returning from OAuth.
 * A failed transfer stays queued in this tab and can safely be retried.
 */
export function completeGoogleSignIn(): Promise<PlayerSnapshot | null> {
  if (!completingGoogle) completingGoogle = finishGoogleSignIn().finally(() => { completingGoogle = undefined; });
  return completingGoogle;
}

async function finishGoogleSignIn(): Promise<PlayerSnapshot | null> {
  const client = getSupabaseBrowser();
  const url = new URL(window.location.href);
  const oauthError = url.searchParams.get("error");
  if (oauthError) throw new GameError(400, "OAUTH_FAILED", "Đăng nhập Google chưa hoàn tất. Bạn có thể thử lại.");
  const code = url.searchParams.get("code");
  if (code) {
    const { error } = await client.auth.exchangeCodeForSession(code);
    if (error) throw error;
    url.searchParams.delete("code");
    window.history.replaceState(null, "", url.pathname + url.search + url.hash);
  }
  const { data, error } = await client.auth.getSession();
  if (error) throw error;
  const account = data.session;
  if (!account || account.user.is_anonymous) return null;
  const saved = window.sessionStorage.getItem(transferKey);
  if (!saved) return requestGame("player", "GET", undefined, account.access_token);
  let pending: { accessToken: string; refreshToken: string; expiresAt: number };
  try {
    pending = JSON.parse(saved);
    if (typeof pending.accessToken !== "string" || typeof pending.refreshToken !== "string"
      || typeof pending.expiresAt !== "number") throw new Error("Invalid guest transfer");
  } catch { throw new GameError(409, "GUEST_TRANSFER_INVALID", "Không đọc được phiên khách cần chuyển."); }
  if (pending.expiresAt * 1000 < Date.now() + 30000) {
    const { url: projectUrl, key } = supabasePublicConfig();
    const guestClient = createClient(projectUrl, key, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
    const { data: guest, error: failure } = await guestClient.auth.refreshSession({ refresh_token: pending.refreshToken });
    if (failure || !guest.session) throw new GameError(409, "GUEST_TRANSFER_EXPIRED", "Chưa xác nhận được phiên khách để chuyển tiến độ.");
    pending = { accessToken: guest.session.access_token, refreshToken: guest.session.refresh_token, expiresAt: guest.session.expires_at ?? 0 };
    // Persist rotated credentials before the network merge, so a retry survives.
    window.sessionStorage.setItem(transferKey, JSON.stringify(pending));
  }
  const snapshot = await requestGame<PlayerSnapshot>("merge", "POST", { guestAccessToken: pending.accessToken }, account.access_token);
  window.sessionStorage.removeItem(transferKey);
  return snapshot;
}

/** Best effort: callers show the warning without undoing the successful game action. */
export async function uploadCheckinPhoto(placeId: string, photo: File): Promise<{
  saved: boolean; photoUrl?: string | null; error?: string;
}> {
  try {
    parseId(placeId);
    if (photo.size > MAX_PHOTO_BYTES) throw new Error("Ảnh tối đa 4 MB. Hãy giảm kích thước trước khi tải.");
    const session = await ensurePlayerSession();
    const form = new FormData();
    form.append("photo", photo);
    const response = await fetch(`/api/game/checkins/${placeId}/photo`, {
      method: "POST", cache: "no-store", credentials: "omit",
      headers: { Authorization: `Bearer ${session.access_token}` }, body: form,
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Chưa tải được ảnh.");
    return result;
  } catch (error) {
    return { saved: false, error: error instanceof Error ? error.message : "Chưa tải được ảnh. Thành tích vẫn được lưu." };
  }
}
