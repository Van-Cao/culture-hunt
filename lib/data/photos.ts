import "server-only";
import { randomUUID } from "node:crypto";
import { getSupabaseAdmin } from "../supabase.ts";
import { GameError, MAX_PHOTO_BYTES, parseId, photoExtension, PHOTO_BUCKET } from "./rules.ts";
import { authenticateToken, databaseResult, ensurePlayer } from "./server.ts";

/** Runs separately from scoring. Failure here cannot roll back a check-in. */
export async function saveCheckinPhoto(token: string, place: unknown, file: File) {
  const placeId = parseId(place);
  if (file.size > MAX_PHOTO_BYTES) throw new GameError(400, "INVALID_PHOTO", "Ảnh tối đa 4 MB.");
  const user = await authenticateToken(token);
  await ensurePlayer(user.id);
  const checkin = await databaseResult<{ id: string } | null>(getSupabaseAdmin().from("checkins")
    .select("id").eq("user_id", user.id).eq("place_id", placeId).maybeSingle());
  if (!checkin) throw new GameError(404, "CHECKIN_NOT_FOUND", "Cần check-in thành công trước khi lưu ảnh.");
  const bytes = new Uint8Array(await file.arrayBuffer());
  const extension = photoExtension(bytes, file.type);
  const path = `${user.id}/${checkin.id}/${randomUUID()}.${extension}`;
  const storage = getSupabaseAdmin().storage.from(PHOTO_BUCKET);
  const { error } = await storage.upload(path, bytes, { contentType: file.type, upsert: false });
  if (error) throw new GameError(503, "PHOTO_UPLOAD_FAILED", "Chưa tải được ảnh. Thành tích vẫn được giữ nguyên.");
  let previous: string | null;
  try {
    previous = await databaseResult<string | null>(getSupabaseAdmin().rpc("game_set_photo", {
      p_user_id: user.id, p_place_id: placeId, p_photo_path: path,
    }));
  } catch (failure) {
    await storage.remove([path]).catch(() => undefined);
    throw failure;
  }
  // Only remove the path actually replaced by this transaction, not a stale read.
  if (previous) await storage.remove([previous]).catch(() => undefined);
  const { data } = await storage.createSignedUrl(path, 300);
  return { saved: true, photoUrl: data?.signedUrl ?? null };
}
