import { gameFailure, gameResponse, readGameJson } from "../../../../lib/data/http.ts";
import { requestToken, submitAnswer } from "../../../../lib/data/server.ts";

export async function POST(request: Request) {
  try {
    const token = requestToken(request);
    return gameResponse(await submitAnswer(token, await readGameJson(request)));
  } catch (error) { return gameFailure(error); }
}
