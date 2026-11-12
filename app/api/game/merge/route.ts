import { gameFailure, gameResponse, readGameJson } from "../../../../lib/data/http.ts";
import { mergeGuestProgress, requestToken } from "../../../../lib/data/server.ts";

export async function POST(request: Request) {
  try {
    const token = requestToken(request);
    const input = await readGameJson(request);
    return gameResponse(await mergeGuestProgress(token, input.guestAccessToken));
  } catch (error) { return gameFailure(error); }
}
