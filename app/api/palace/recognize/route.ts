import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { getCheckpoints, isCheckpointId } from "@/lib/palace/checkpoints";
import {
  playerId,
  checkOrigin,
  gameResponse,
  gameError,
} from "@/lib/palace/http";
import {
  GameError,
  requireAvailable,
  recordRecognition,
} from "@/lib/palace/store";
import { identifyPhoto } from "@/lib/palace/recognition";
import type { RecognitionResult } from "@/lib/palace/types";

const limits = new Map<string, { count: number; until: number }>();
const MAX_BODY = 6 * 1024 * 1024;
async function boundedForm(request: Request) {
  if (!request.headers.get("content-type")?.startsWith("multipart/form-data"))
    throw new GameError("Gửi ảnh bằng biểu mẫu. / Use a multipart photo form.");
  const reader = request.body?.getReader();
  if (!reader) throw new GameError("Thiếu ảnh. / Missing photo.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_BODY) {
      await reader.cancel();
      throw new GameError(
        "Ảnh tối đa 5 MB. / Maximum photo size is 5 MB.",
        413,
      );
    }
    chunks.push(value);
  }
  try {
    return await new Response(Buffer.concat(chunks), {
      headers: { "Content-Type": request.headers.get("content-type")! },
    }).formData();
  } catch {
    throw new GameError("Biểu mẫu không hợp lệ. / Invalid photo form.");
  }
}
export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const owner = await playerId();
    const now = Date.now();
    // Bound this process-local demo throttle. A deployed multi-replica service needs shared rate limiting.
    for (const [key, entry] of limits)
      if (entry.until < now) limits.delete(key);
    const limit = limits.get(owner) || { count: 0, until: now + 60_000 };
    if (limit.count >= 20)
      throw new GameError(
        "Bạn quét hơi nhanh. Thử lại sau một phút. / Please wait a minute before scanning again.",
        429,
      );
    limit.count++;
    limits.set(owner, limit);
    const form = await boundedForm(request);
    const runId = form.get("runId"),
      checkpointId = form.get("checkpointId");
    if (typeof runId !== "string" || !isCheckpointId(checkpointId))
      throw new GameError("Checkpoint không hợp lệ. / Invalid checkpoint.");
    requireAvailable(owner, runId, checkpointId);
    let recognition: RecognitionResult;
    const sampleId = form.get("sampleId");
    if (sampleId !== null) {
      if (!isCheckpointId(sampleId))
        throw new GameError("Ảnh mẫu không hợp lệ. / Invalid sample.");
      // Explicit, labeled reference mode. This request is never presented as an AI inference.
      await readFile(
        join(
          process.cwd(),
          "public",
          getCheckpoints().find((c) => c.id === sampleId)!.photo,
        ),
      );
      recognition = {
        status: "matched",
        checkpointId: sampleId,
        mode: "sample",
        reason:
          "Đã đối chiếu ảnh mẫu của checkpoint. / Bundled checkpoint reference selected.",
      };
    } else {
      const photo = form.get("photo");
      if (
        !(photo instanceof File) ||
        !photo.size ||
        photo.size > 5 * 1024 * 1024
      )
        throw new GameError(
          "Chọn ảnh tối đa 5 MB. / Select a photo up to 5 MB.",
        );
      recognition = await identifyPhoto(Buffer.from(await photo.arrayBuffer()));
    }
    if (
      recognition.status === "matched" &&
      recognition.checkpointId !== checkpointId
    )
      recognition = {
        ...recognition,
        status: "mismatch",
        reason:
          "Ảnh thuộc một checkpoint khác. Hãy kiểm tra gợi ý của điểm hiện tại. / This is another checkpoint. Check the current clue.",
      };
    const state = recordRecognition(
      owner,
      runId,
      checkpointId,
      recognition.mode,
      recognition.status,
      recognition.checkpointId,
    );
    return gameResponse({ recognition, state });
  } catch (error) {
    return gameError(error);
  }
}
