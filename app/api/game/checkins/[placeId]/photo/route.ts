import { gameFailure, gameResponse } from "../../../../../../lib/data/http.ts";
import { saveCheckinPhoto } from "../../../../../../lib/data/photos.ts";
import { GameError, MAX_PHOTO_BYTES } from "../../../../../../lib/data/rules.ts";
import { requestToken } from "../../../../../../lib/data/server.ts";

export async function POST(request: Request, context: { params: Promise<{ placeId: string }> }) {
  try {
    const token = requestToken(request);
    if (Number(request.headers.get("content-length")) > MAX_PHOTO_BYTES + 64 * 1024) {
      throw new GameError(413, "BODY_TOO_LARGE", "Ảnh tối đa 4 MB.");
    }
    // Enforce a byte limit even for a chunked request with no Content-Length.
    const reader = request.body?.getReader();
    if (!reader) throw new GameError(400, "INVALID_PHOTO", "Thiếu ảnh check-in.");
    const chunks: Uint8Array<ArrayBuffer>[] = [];
    let size = 0;
    try {
      while (true) {
        const chunk = await reader.read();
        if (chunk.done) break;
        size += chunk.value.byteLength;
        if (size > MAX_PHOTO_BYTES + 64 * 1024) {
          await reader.cancel();
          throw new GameError(413, "BODY_TOO_LARGE", "Ảnh tối đa 4 MB.");
        }
        chunks.push(new Uint8Array(chunk.value));
      }
    } finally { reader.releaseLock(); }
    let form: FormData;
    try {
      const body = new Blob(chunks);
      form = await new Response(body, { headers: { "Content-Type": request.headers.get("content-type") || "" } }).formData();
    } catch { throw new GameError(400, "INVALID_PHOTO", "Nội dung ảnh không hợp lệ."); }
    const photo = form.get("photo");
    if (!(photo instanceof File)) throw new GameError(400, "INVALID_PHOTO", "Thiếu ảnh check-in.");
    const { placeId } = await context.params;
    return gameResponse(await saveCheckinPhoto(token, placeId, photo));
  } catch (error) { return gameFailure(error); }
}
