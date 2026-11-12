/** Explicitly opt in; refuses any project with existing Auth/application users.
 * Creates only disposable test identities and removes its own photos/users.
 * Run: CULTURE_HUNT_CLOUD_SMOKE=yes node --env-file=.env.local
 *   --conditions=react-server --experimental-strip-types scripts/cloud-smoke.ts
 */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseAdmin } from "../lib/supabase.ts";
import { getPlayerSnapshot, mergeGuestProgress, recordVerifiedScan, submitAnswer } from "../lib/data/server.ts";
import { saveCheckinPhoto } from "../lib/data/photos.ts";

async function main() {
  assert.equal(process.env.CULTURE_HUNT_CLOUD_SMOKE, "yes", "Cloud smoke needs an explicit opt-in");
  const admin = getSupabaseAdmin();
  const existing = await admin.auth.admin.listUsers({ page: 1, perPage: 1 });
  assert.ifError(existing.error);
  assert.equal(existing.data.users.length, 0, "Refusing to run in a project with existing users");
  for (const table of ["users", "checkins"]) {
    const { count, error } = await admin.from(table).select("id", { count: "exact", head: true });
    assert.ifError(error); assert.equal(count, 0, "Refusing a database with existing game data");
  }
  const config = { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } };
  const guestClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, config);
  const accountClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, config);
  const created: string[] = [];
  const scan = { placeId: "smoke-test-palace", placeName: "Disposable test destination", quizzes: [
    { id: "mission-1", question: "Q1", options: ["A", "B", "C", "D"], correctIndex: 1 },
    { id: "mission-2", question: "Q2", options: ["A", "B", "C", "D"], correctIndex: 2 },
    { id: "mission-3", question: "Q3", options: ["A", "B", "C", "D"], correctIndex: 0 },
  ] };
  try {
    const guest = await guestClient.auth.signInAnonymously();
    assert.ifError(guest.error); assert.ok(guest.data.session);
    created.push(guest.data.user!.id);
    const guestToken = guest.data.session.access_token;
    const first = await recordVerifiedScan(guestToken, scan);
    assert.equal((await recordVerifiedScan(guestToken, scan)).id, first.id);
    await submitAnswer(guestToken, { placeId: scan.placeId, missionId: "mission-1", choice: 0 });
    await submitAnswer(guestToken, { placeId: scan.placeId, missionId: "mission-2", choice: 0 });
    assert.equal((await submitAnswer(guestToken, { placeId: scan.placeId, missionId: "mission-3", choice: 1 })).totalPoints, 100);
    assert.equal((await submitAnswer(guestToken, { placeId: scan.placeId, missionId: "mission-1", choice: 1 })).pointsAwarded, 150);
    assert.equal((await submitAnswer(guestToken, { placeId: scan.placeId, missionId: "mission-1", choice: 1 })).pointsAwarded, 0);
    const saved = await getPlayerSnapshot(guestToken);
    assert.equal(saved.player.total_points, 250);
    assert.equal(saved.checkins[0].nextMissionId, null);
    assert.equal(JSON.stringify(saved).includes("correctIndex"), false);
    console.log("Cloud guest, check-in, wrong-answer progress, replay and XP: PASS");

    const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jWZkAAAAASUVORK5CYII=", "base64");
    const uploaded = await saveCheckinPhoto(guestToken, scan.placeId, new File([png], "test.png", { type: "image/png" }));
    assert.equal(uploaded.saved, true); assert.ok(uploaded.photoUrl);
    assert.equal((await fetch(uploaded.photoUrl)).status, 200);
    console.log("Cloud private photo upload and signed access: PASS");

    // Use a disposable email/password account to verify permanent-user merge.
    // No mail is sent; this does not claim that Google OAuth is configured.
    const email = `culture-hunt-test-${randomUUID()}@example.com`;
    const password = randomUUID() + randomUUID();
    const account = await admin.auth.admin.createUser({ email, password, email_confirm: true });
    assert.ifError(account.error); assert.ok(account.data.user); created.push(account.data.user.id);
    const login = await accountClient.auth.signInWithPassword({ email, password });
    assert.ifError(login.error); assert.ok(login.data.session);
    const accountToken = login.data.session.access_token;
    await recordVerifiedScan(accountToken, scan);
    await submitAnswer(accountToken, { placeId: scan.placeId, missionId: "mission-1", choice: 1 });
    await submitAnswer(accountToken, { placeId: scan.placeId, missionId: "mission-2", choice: 2 });
    assert.equal((await mergeGuestProgress(accountToken, guestToken)).player.total_points, 400);
    assert.equal((await mergeGuestProgress(accountToken, guestToken)).player.total_points, 400);
    assert.equal((await submitAnswer(accountToken, { placeId: scan.placeId, missionId: "mission-3", choice: 0 })).totalPoints, 550);
    await assert.rejects(getPlayerSnapshot(guestToken), { code: "PLAYER_MERGED" });
    console.log("Cloud guest-to-account merge and duplicate-reward protection: PASS");

    const own = await accountClient.from("users").select("id,nickname,total_points");
    assert.ifError(own.error); assert.equal(own.data?.length, 1);
    assert.equal(own.data?.[0].id, account.data.user.id);
    assert.ok((await accountClient.from("checkins").select("quizzes")).error);
    assert.ok((await accountClient.from("users").update({ total_points: 999999 }).eq("id", account.data.user.id)).error);
    assert.ok((await accountClient.rpc("game_record_answer", {
      p_user_id: account.data.user.id, p_place_id: scan.placeId, p_mission_id: "mission-1", p_choice: 1,
    })).error);
    console.log("Cloud RLS, answer-key isolation and denied browser score writes: PASS");
  } finally {
    // These UUIDs were created above in a project verified empty at entry.
    for (const id of created) {
      const folders = await admin.storage.from("checkin-photos").list(id);
      for (const folder of folders.data || []) {
        const files = await admin.storage.from("checkin-photos").list(`${id}/${folder.name}`);
        const paths = (files.data || []).map((f) => `${id}/${folder.name}/${f.name}`);
        if (paths.length) assert.ifError((await admin.storage.from("checkin-photos").remove(paths)).error);
      }
    }
    await guestClient.auth.signOut({ scope: "global" });
    await accountClient.auth.signOut({ scope: "global" });
    for (const id of created) assert.ifError((await admin.auth.admin.deleteUser(id)).error);
    await guestClient.auth.dispose(); await accountClient.auth.dispose();
    const remaining = await admin.from("users").select("id", { count: "exact", head: true });
    assert.ifError(remaining.error); assert.equal(remaining.count, 0);
    console.log("Disposable cloud test users/photos cleaned up: PASS");
  }
}
main().catch((error: unknown) => { console.error(error instanceof Error ? error.message : "Cloud smoke failed"); process.exitCode = 1; });
