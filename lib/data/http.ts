import { GameError, objectInput } from "./rules.ts";

export function gameResponse(data: unknown, status = 200): Response {
  return Response.json(data, {
    status, headers: { "Cache-Control": "private, no-store", Vary: "Authorization" },
  });
}
export function gameFailure(error: unknown): Response {
  if (error instanceof GameError) return gameResponse({ error: error.message, code: error.code }, error.status);
  console.error("Unexpected game handler failure");
  return gameResponse({ error: "Chưa xử lý được yêu cầu. Vui lòng thử lại.", code: "INTERNAL_ERROR" }, 500);
}
export async function readGameJson(request: Request): Promise<Record<string, unknown>> {
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    throw new GameError(415, "JSON_REQUIRED", "Yêu cầu phải dùng JSON.");
  }
  // The merge request may include a JWT, but game JSON never contains photos.
  const limit = 24 * 1024;
  if (Number(request.headers.get("content-length")) > limit) {
    throw new GameError(413, "BODY_TOO_LARGE", "Yêu cầu quá lớn.");
  }
  const reader = request.body?.getReader();
  if (!reader) throw new GameError(400, "INVALID_JSON", "Thiếu nội dung JSON.");
  let size = 0;
  const decoder = new TextDecoder();
  let body = "";
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      size += chunk.value.byteLength;
      if (size > limit) {
        await reader.cancel();
        throw new GameError(413, "BODY_TOO_LARGE", "Yêu cầu quá lớn.");
      }
      body += decoder.decode(chunk.value, { stream: true });
    }
    body += decoder.decode();
    return objectInput(JSON.parse(body));
  } catch (error) {
    if (error instanceof GameError) throw error;
    throw new GameError(400, "INVALID_JSON", "Nội dung JSON không hợp lệ.");
  } finally { reader.releaseLock(); }
}
