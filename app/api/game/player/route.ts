import { gameFailure, gameResponse, readGameJson } from "../../../../lib/data/http.ts";
import { getPlayerSnapshot, requestToken } from "../../../../lib/data/server.ts";

export async function GET(request: Request) {
  try { return gameResponse(await getPlayerSnapshot(requestToken(request))); }
  catch (error) { return gameFailure(error); }
}
export async function PATCH(request: Request) {
  try {
    const token = requestToken(request);
    const input = await readGameJson(request);
    // Missing nickname must not silently turn an invalid PATCH into a GET.
    if (!("nickname" in input)) return gameResponse({ code: "INVALID_NICKNAME", error: "Thiếu nickname." }, 400);
    return gameResponse(await getPlayerSnapshot(token, input.nickname));
  } catch (error) { return gameFailure(error); }
}
