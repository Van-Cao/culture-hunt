import { playerId, checkOrigin, gameResponse, gameError } from "@/lib/palace/http";
import { readExplorer, updateExplorer, GameError, type ExplorerProgress } from "@/lib/palace/store";

export async function GET() {
  try { return gameResponse(await readExplorer(await playerId())); }
  catch (error) { return gameError(error); }
}
export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const raw = await request.text();
    if (raw.length > 2000) throw new GameError("Yêu cầu quá lớn. / Request too large.", 413);
    const body = JSON.parse(raw);
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new GameError("Yêu cầu không hợp lệ. / Invalid request.");
    const owner = await playerId();
    if (body.action === "favorite" && (body.place === "palace" || body.place === "hcmus") && typeof body.saved === "boolean")
      return gameResponse(await updateExplorer(owner, { favorite: body.place, saved: body.saved }));
    if (body.action === "bookmark" && typeof body.key === "string" && body.key.length <= 80 && typeof body.saved === "boolean")
      return gameResponse(await updateExplorer(owner, { bookmark: body.key, saved: body.saved }));
    if (body.action === "campus" && Number.isInteger(body.index) && Number.isInteger(body.answer))
      return gameResponse(await updateExplorer(owner, { campusIndex: body.index, campusAnswer: body.answer }));
    if (body.action === "import" && Number.isInteger(body.hcmus) && body.hcmus >= 0 && body.hcmus <= 4 && Array.isArray(body.saved) && body.saved.length <= 2 && body.saved.every((id: unknown) => id === "palace" || id === "hcmus"))
      return gameResponse(await updateExplorer(owner, { legacy: { hcmus: body.hcmus, saved: body.saved, bookmarks: Array.isArray(body.bookmarks) ? body.bookmarks.filter((id: unknown) => typeof id === "string").slice(0, 50) : [] } as ExplorerProgress }));
    throw new GameError("Yêu cầu không hợp lệ. / Invalid progress request.");
  } catch (error) { return gameError(error); }
}
