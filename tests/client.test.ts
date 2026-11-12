import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import type { Session } from "@supabase/supabase-js";
import { getSupabaseBrowser } from "../lib/supabase-browser.ts";
import { answerMission, completeGoogleSignIn, ensurePlayerSession, startGoogleSignIn, uploadCheckinPhoto } from "../lib/data/client.ts";

const memory = () => {
  const values = new Map<string, string>();
  return { getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); }, removeItem: (key: string) => { values.delete(key); } };
};
const transferKey = "culture-hunt-guest-transfer-v1";
const localStorage = memory();
const sessionStorage = memory();
const location = { href: "http://localhost/?play=1", origin: "http://localhost" };
const session = (guest: boolean): Session => ({
  access_token: guest ? "guest-access" : "account-access", refresh_token: guest ? "guest-refresh" : "account-refresh",
  token_type: "bearer", expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600,
  user: { id: guest ? "guest" : "account", is_anonymous: guest, app_metadata: {}, user_metadata: {}, aud: "authenticated", created_at: "2026-11-12" },
});
before(async () => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "http://localhost:54321";
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "test-public-key";
  Object.defineProperty(globalThis, "window", { configurable: true, value: {
    localStorage, sessionStorage, location, addEventListener() {}, removeEventListener() {},
    history: { replaceState(_data: unknown, _unused: string, url: string) { location.href = new URL(url, location.origin).href; } },
  } });
  Object.defineProperty(globalThis, "document", { configurable: true, value: { visibilityState: "visible" } });
  await getSupabaseBrowser().auth.initialize();
});
after(async () => { await getSupabaseBrowser().auth.dispose(); });

test("parallel mounts create only one anonymous session", async (t) => {
  const auth = getSupabaseBrowser().auth;
  t.mock.method(auth, "getSession", async () => ({ data: { session: null }, error: null }));
  let creations = 0;
  t.mock.method(auth, "signInAnonymously", async () => {
    creations++; await Promise.resolve(); return { data: { session: session(true), user: session(true).user }, error: null };
  });
  const [first, second] = await Promise.all([ensurePlayerSession(), ensurePlayerSession()]);
  assert.equal(creations, 1);
  assert.equal(first.access_token, second.access_token);
});
test("returning guest reuses the saved session", async (t) => {
  t.mock.method(getSupabaseBrowser().auth, "getSession", async () => ({ data: { session: session(true) }, error: null }));
  assert.equal((await ensurePlayerSession()).access_token, "guest-access");
});
test("Google handoff keeps guest credentials and retries a failed merge", async (t) => {
  const auth = getSupabaseBrowser().auth;
  const get = t.mock.method(auth, "getSession", async () => ({ data: { session: session(true) }, error: null }));
  t.mock.method(auth, "signInWithOAuth", async () => ({ data: { provider: "google", url: "https://accounts.google.com/test" }, error: null }));
  await startGoogleSignIn();
  assert.equal(JSON.parse(sessionStorage.getItem(transferKey)!).accessToken, "guest-access");
  get.mock.mockImplementation(async () => ({ data: { session: session(false) }, error: null }));
  let attempts = 0;
  t.mock.method(globalThis, "fetch", async (_input: unknown, init: RequestInit) => {
    assert.match(JSON.stringify(init.headers), /account-access/);
    assert.equal(JSON.parse(String(init.body)).guestAccessToken, "guest-access");
    attempts++;
    return Response.json(attempts === 1 ? { error: "Retry", code: "TEMPORARY" } : { player: { total_points: 400 } }, { status: attempts === 1 ? 503 : 200 });
  });
  await assert.rejects(completeGoogleSignIn());
  assert.ok(sessionStorage.getItem(transferKey));
  const [a, b] = await Promise.all([completeGoogleSignIn(), completeGoogleSignIn()]);
  assert.equal(a?.player.total_points, 400);
  assert.equal(b?.player.total_points, 400);
  assert.equal(attempts, 2);
  assert.equal(sessionStorage.getItem(transferKey), null);
});
test("OAuth exchange runs once and guest creation waits for it", async (t) => {
  const auth = getSupabaseBrowser().auth;
  location.href = "http://localhost/?play=1&code=one-time-code";
  await assert.rejects(ensurePlayerSession(), { code: "OAUTH_PENDING" });
  t.mock.method(auth, "getSession", async () => ({ data: { session: session(false) }, error: null }));
  let exchanges = 0;
  t.mock.method(auth, "exchangeCodeForSession", async () => {
    exchanges++; return { data: { session: session(false), user: session(false).user, redirectType: null }, error: null };
  });
  t.mock.method(globalThis, "fetch", async () => Response.json({ player: { total_points: 0 } }));
  await Promise.all([completeGoogleSignIn(), completeGoogleSignIn()]);
  assert.equal(exchanges, 1);
  assert.equal(new URL(location.href).searchParams.has("code"), false);
});
test("answer adapter sends only choice identifiers and propagates storage failure", async (t) => {
  t.mock.method(getSupabaseBrowser().auth, "getSession", async () => ({ data: { session: session(true) }, error: null }));
  t.mock.method(globalThis, "fetch", async (_url: unknown, init: RequestInit) => {
    assert.deepEqual(JSON.parse(String(init.body)), { placeId: "palace", missionId: "mission-1", choice: 2 });
    return Response.json({ code: "STORAGE_UNAVAILABLE", error: "Retry" }, { status: 503 });
  });
  await assert.rejects(answerMission("palace", "mission-1", 2), { code: "STORAGE_UNAVAILABLE" });
});
test("photo adapter returns a warning instead of undoing the game action", async (t) => {
  t.mock.method(getSupabaseBrowser().auth, "getSession", async () => ({ data: { session: session(true) }, error: null }));
  t.mock.method(globalThis, "fetch", async () => { throw new Error("Network offline"); });
  const result = await uploadCheckinPhoto("palace", new File(["image"], "photo.jpg", { type: "image/jpeg" }));
  assert.equal(result.saved, false);
  assert.match(result.error!, /Network offline/);
});
