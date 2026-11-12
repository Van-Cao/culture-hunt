import { isCheckpointId } from "@/lib/palace/checkpoints";
import {
  playerId,
  gameResponse,
  gameError,
  checkOrigin,
} from "@/lib/palace/http";
import {
  answerCheckpoint,
  readState,
  startRun,
  GameError,
} from "@/lib/palace/store";

export async function GET() {
  try {
    return gameResponse(readState(await playerId()));
  } catch (error) {
    return gameError(error);
  }
}
export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const raw = await request.text();
    if (raw.length > 2000)
      throw new GameError("Yêu cầu quá lớn. / Request too large.", 413);
    const body = JSON.parse(raw);
    if (!body || typeof body !== "object")
      throw new GameError("Dữ liệu không hợp lệ. / Invalid request.");
    const owner = await playerId();
    if (body.action === "start")
      return gameResponse({ state: startRun(owner, body.replay === true) });
    if (
      body.action === "answer" &&
      typeof body.runId === "string" &&
      isCheckpointId(body.checkpointId) &&
      Number.isInteger(body.answer) &&
      body.answer >= 0 &&
      body.answer <= 3
      && (body.questionId === undefined || (typeof body.questionId === "string" && body.questionId.length <= 100))
    ) {
      return gameResponse(
        answerCheckpoint(owner, body.runId, body.checkpointId, body.answer, body.questionId),
      );
    }
    throw new GameError("Hành động không hợp lệ. / Invalid action.");
  } catch (error) {
    return gameError(error);
  }
}
