import "server-only";
import type { User } from "@supabase/supabase-js";
import { getSupabaseAdmin } from "../supabase.ts";
import { achievementsFor, GameError, objectInput, parseChoice, parseId, parseNickname, parseVerifiedScan, publicCheckin } from "./rules.ts";
import type { AnswerResult, CheckinRow, PlayerRow, PlayerSnapshot, PublicCheckin } from "./types.ts";

const databaseErrors: Record<string, [number, string]> = {
  PLAYER_MERGED: [409, "Tiến độ khách đã chuyển vào tài khoản. Vui lòng dùng tài khoản đã đăng nhập."],
  PLAYER_NOT_FOUND: [404, "Không tìm thấy người chơi."],
  CHECKIN_NOT_FOUND: [404, "Bạn cần quét thành công địa điểm này trước."],
  MISSION_NOT_FOUND: [404, "Không tìm thấy nhiệm vụ trong bộ câu hỏi đã lưu."],
  INVALID_MERGE: [400, "Không thể gộp hai tài khoản này."],
  INVALID_NICKNAME: [400, "Nickname phải có từ 1 đến 40 ký tự."],
  INVALID_CHOICE: [400, "Đáp án không hợp lệ."],
  INVALID_QUIZZES: [400, "Bộ câu hỏi không hợp lệ."],
};
export async function databaseResult<T>(operation: PromiseLike<{
  data: unknown; error: { message: string; code?: string } | null;
}>): Promise<T> {
  const { data, error } = await operation;
  if (error) {
    for (const [code, [status, message]] of Object.entries(databaseErrors)) {
      if (error.message === code) throw new GameError(status, code, message);
    }
    // Do not log tokens, queries, images or an upstream response containing secrets.
    console.error("Game storage request failed", error.code ?? "unknown");
    throw new GameError(503, "STORAGE_UNAVAILABLE", "Chưa lưu được dữ liệu. Vui lòng thử lại.");
  }
  return data as T;
}

export async function authenticateToken(token: string): Promise<User> {
  if (!token || token.length > 16384) throw new GameError(401, "UNAUTHORIZED", "Phiên chơi không hợp lệ.");
  const { data, error } = await getSupabaseAdmin().auth.getUser(token);
  if (error || !data.user) throw new GameError(401, "UNAUTHORIZED", "Phiên chơi đã hết hạn. Vui lòng đăng nhập lại.");
  return data.user;
}
export function requestToken(request: Request): string {
  const token = request.headers.get("authorization")?.match(/^Bearer ([^\s]+)$/i)?.[1];
  if (!token) throw new GameError(401, "UNAUTHORIZED", "Cần phiên chơi để lưu thành tích.");
  return token;
}
export async function ensurePlayer(userId: string, nickname: string | null = null): Promise<PlayerRow> {
  return databaseResult<PlayerRow>(getSupabaseAdmin().rpc("game_ensure_player", {
    p_user_id: userId, p_nickname: nickname,
  }));
}

export async function getPlayerSnapshot(token: string, nickname?: unknown): Promise<PlayerSnapshot> {
  const user = await authenticateToken(token);
  const player = await ensurePlayer(user.id, nickname === undefined ? null : parseNickname(nickname));
  const rows = await databaseResult<CheckinRow[]>(getSupabaseAdmin().from("checkins")
    .select("*").eq("user_id", user.id).order("created_at", { ascending: false }));
  const checkins = await Promise.all(rows.map(async (row) => {
    let photoUrl: string | null = null;
    if (row.photo_path) {
      const { data } = await getSupabaseAdmin().storage.from("checkin-photos").createSignedUrl(row.photo_path, 300);
      photoUrl = data?.signedUrl ?? null;
    }
    return publicCheckin(row, photoUrl);
  }));
  return {
    player: { id: player.id, nickname: player.nickname, total_points: player.total_points, created_at: player.created_at },
    checkins, achievements: achievementsFor(player.total_points, checkins),
  };
}

/** Call only INSIDE the vision backend AFTER recognizing a valid destination.
 * Do not pass an unverified request body to this function. No public scan RPC.
 */
export async function recordVerifiedScan(token: string, trustedScan: unknown): Promise<PublicCheckin> {
  const user = await authenticateToken(token);
  const scan = parseVerifiedScan(trustedScan);
  await ensurePlayer(user.id);
  const row = await databaseResult<CheckinRow>(getSupabaseAdmin().rpc("game_record_scan", {
    p_user_id: user.id, p_place_id: scan.placeId, p_place_name: scan.placeName, p_quizzes: scan.quizzes,
  }));
  return publicCheckin(row);
}

export async function submitAnswer(token: string, value: unknown): Promise<AnswerResult> {
  const input = objectInput(value);
  const placeId = parseId(input.placeId);
  const missionId = parseId(input.missionId);
  const choice = parseChoice(input.choice);
  const user = await authenticateToken(token);
  await ensurePlayer(user.id);
  const result = await databaseResult<{
    correct: boolean; pointsAwarded: number; totalPoints: number; checkin: CheckinRow;
  }>(getSupabaseAdmin().rpc("game_record_answer", {
    p_user_id: user.id, p_place_id: placeId, p_mission_id: missionId, p_choice: choice,
  }));
  return { ...result, checkin: publicCheckin(result.checkin) };
}

export async function mergeGuestProgress(accountToken: string, guestToken: unknown): Promise<PlayerSnapshot> {
  if (typeof guestToken !== "string") throw new GameError(400, "INVALID_MERGE", "Thiếu phiên khách cần chuyển.");
  const [account, guest] = await Promise.all([authenticateToken(accountToken), authenticateToken(guestToken)]);
  if (account.is_anonymous !== false || guest.is_anonymous !== true || account.id === guest.id) {
    throw new GameError(400, "INVALID_MERGE", "Chỉ chuyển tiến độ từ khách vào tài khoản đã đăng nhập.");
  }
  await ensurePlayer(account.id);
  // A retry after a successful merge must reach the idempotent SQL function.
  const existing = await databaseResult<{ id: string } | null>(getSupabaseAdmin().from("users")
    .select("id").eq("id", guest.id).maybeSingle());
  if (!existing) await ensurePlayer(guest.id);
  await databaseResult<number>(getSupabaseAdmin().rpc("game_merge_guest", {
    p_guest_id: guest.id, p_target_id: account.id,
  }));
  return getPlayerSnapshot(accountToken);
}
