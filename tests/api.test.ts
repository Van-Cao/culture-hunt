import test, { after, before } from "node:test";
import assert from "node:assert/strict";
import { createServer, type Server } from "node:http";
import { once } from "node:events";
import { GET, PATCH } from "../app/api/game/player/route.ts";
import { POST as answer } from "../app/api/game/answers/route.ts";
import { POST as merge } from "../app/api/game/merge/route.ts";
import { POST as photo } from "../app/api/game/checkins/[placeId]/photo/route.ts";
import { recordVerifiedScan } from "../lib/data/server.ts";

const accountId = "00000000-0000-4000-8000-000000000002";
const guestId = "00000000-0000-4000-8000-000000000001";
const player = { id: accountId, nickname: "Phong", total_points: 0, merged_into: null, created_at: "2026-11-12T00:00:00Z" };
const checkin = {
  id: "checkin-1", user_id: accountId, place_id: "palace", place_name: "Dinh Độc Lập", status: "checked_in",
  quizzes: [{ id: "mission-1", question: "Q?", options: ["A", "B", "C", "D"], correctIndex: 1 }],
  progress: {}, photo_path: null, completed_at: null, created_at: player.created_at, updated_at: player.created_at,
};
let server: Server;
const calls: { path: string; body: Record<string, unknown> }[] = [];
before(async () => {
  server = createServer(async (req, res) => {
    const url = new URL(req.url!, "http://localhost");
    const chunks: Buffer[] = [];
    for await (const chunk of req) chunks.push(Buffer.from(chunk));
    const bytes = Buffer.concat(chunks);
    const body = req.headers["content-type"]?.startsWith("application/json") && bytes.length
      ? JSON.parse(bytes.toString()) : {};
    calls.push({ path: url.pathname, body });
    res.setHeader("Content-Type", "application/json");
    let data: unknown;
    if (url.pathname === "/auth/v1/user") {
      const token = req.headers.authorization?.replace("Bearer ", "");
      if (!["account-token", "guest-token"].includes(token || "")) {
        res.statusCode = 401; res.end(JSON.stringify({ message: "Invalid JWT" })); return;
      }
      data = { id: token === "guest-token" ? guestId : accountId, is_anonymous: token === "guest-token" };
    } else if (url.pathname.endsWith("/rpc/game_ensure_player")) data = { ...player, id: body.p_user_id };
    else if (url.pathname.endsWith("/rpc/game_record_scan")) data = checkin;
    else if (url.pathname.endsWith("/rpc/game_record_answer")) data = { correct: false, pointsAwarded: 0, totalPoints: 0, checkin };
    else if (url.pathname.endsWith("/rpc/game_merge_guest")) data = 0;
    else if (url.pathname === "/rest/v1/checkins") data = [checkin];
    else if (url.pathname === "/rest/v1/users") data = [{ id: guestId }];
    else if (url.pathname.startsWith("/storage/v1/object/")) {
      res.statusCode = 503; data = { message: "Storage test unavailable" };
    } else { res.statusCode = 404; data = { message: "Unexpected test URL" }; }
    res.end(JSON.stringify(data));
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  process.env.NEXT_PUBLIC_SUPABASE_URL = `http://127.0.0.1:${address.port}`;
  process.env.SUPABASE_SECRET_KEY = "test-server-secret-never-a-real-key";
});
after(async () => { server.closeAllConnections(); await new Promise<void>((resolve) => server.close(() => resolve())); });

function request(body?: unknown, token = "account-token", method = "POST") {
  return new Request("http://localhost/api/game/test", {
    method, headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}
test("unauthenticated requests fail before accessing storage", async () => {
  const count = calls.length;
  const response = await GET(new Request("http://localhost/api/game/player"));
  assert.equal(response.status, 401);
  assert.equal(calls.length, count);
});
test("missing environment is a controlled 503 and invalid token is 401", async () => {
  const savedKey = process.env.SUPABASE_SECRET_KEY;
  delete process.env.SUPABASE_SECRET_KEY;
  try { assert.equal((await GET(request(undefined, "account-token", "GET"))).status, 503); }
  finally { process.env.SUPABASE_SECRET_KEY = savedKey; }
  assert.equal((await GET(request(undefined, "expired", "GET"))).status, 401);
});
test("snapshot responses are private, resumable, and hide answer keys", async () => {
  const response = await GET(request(undefined, "account-token", "GET"));
  assert.equal(response.status, 200);
  assert.match(response.headers.get("cache-control")!, /no-store/);
  const body = await response.json();
  assert.equal(body.checkins[0].nextMissionId, "mission-1");
  assert.equal(JSON.stringify(body).includes("correctIndex"), false);
});
test("browser cannot forge user, correctness or points", async () => {
  const response = await answer(request({
    placeId: "palace", missionId: "mission-1", choice: 0,
    userId: guestId, isCorrect: true, points: 99999,
  }));
  assert.equal(response.status, 200);
  const call = calls.findLast((c) => c.path.endsWith("/rpc/game_record_answer"));
  assert.deepEqual(call?.body, { p_user_id: accountId, p_place_id: "palace", p_mission_id: "mission-1", p_choice: 0 });
  const result = await response.json();
  assert.equal(result.correct, false);
  assert.equal(result.pointsAwarded, 0);
  assert.equal(JSON.stringify(result).includes("correctIndex"), false);
});
test("invalid input and oversized JSON fail without awarding points", async () => {
  assert.equal((await answer(request({ placeId: "palace", missionId: "mission-1", choice: true }))).status, 400);
  assert.equal((await answer(request({ text: "x".repeat(25000) }))).status, 413);
  assert.equal((await PATCH(request({}, "account-token", "PATCH"))).status, 400);
});
test("merge proves both identities and rejects account-to-account or guest targets", async () => {
  assert.equal((await merge(request({ guestAccessToken: "account-token" }))).status, 400);
  assert.equal((await merge(request({ guestAccessToken: "guest-token" }, "guest-token"))).status, 400);
  assert.equal((await merge(request({ guestAccessToken: "expired" }))).status, 401);
  const response = await merge(request({ guestAccessToken: "guest-token" }));
  assert.equal(response.status, 200);
  assert.deepEqual(calls.findLast((c) => c.path.endsWith("/rpc/game_merge_guest"))?.body,
    { p_guest_id: guestId, p_target_id: accountId });
});
test("trusted scan helper uses verified identity and strips returned answer keys", async () => {
  const result = await recordVerifiedScan("account-token", {
    placeId: "palace", placeName: "Dinh Độc Lập", quizzes: checkin.quizzes,
  });
  assert.equal(JSON.stringify(result).includes("correctIndex"), false);
  assert.equal(calls.findLast((c) => c.path.endsWith("/rpc/game_record_scan"))?.body.p_user_id, accountId);
});
test("optional photo upload failure does not mutate score or progress", async () => {
  const before = calls.filter((c) => /game_record_answer|game_set_photo/.test(c.path)).length;
  const form = new FormData();
  form.append("photo", new File([new Uint8Array([137,80,78,71,13,10,26,10,0,0,0,0])], "photo.png", { type: "image/png" }));
  const response = await photo(new Request("http://localhost/api/game/checkins/palace/photo", {
    method: "POST", headers: { Authorization: "Bearer account-token" }, body: form,
  }), { params: Promise.resolve({ placeId: "palace" }) });
  assert.equal(response.status, 503);
  assert.equal((await response.json()).code, "PHOTO_UPLOAD_FAILED");
  assert.equal(calls.filter((c) => /game_record_answer|game_set_photo/.test(c.path)).length, before);
});
