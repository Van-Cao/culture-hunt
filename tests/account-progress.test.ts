import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { readState, startRun, recordRecognition, answerCheckpoint, claimGuest, readExplorer, updateExplorer, GameError } from "../lib/palace/store";
import { getCheckpointQuestions } from "../lib/palace/questions";
import { getPlaces } from "../components/UI/game-data";

process.env.CULTURE_HUNT_STORAGE = "sqlite";
process.env.CULTURE_HUNT_DATA_DIR = mkdtempSync(join(tmpdir(), "culture-hunt-accounts-"));
async function checkpoint(owner: string, run: string) {
  await recordRecognition(owner, run, "facade", "sample", "matched", "facade");
  for (const q of getCheckpointQuestions("facade")) await answerCheckpoint(owner, run, "facade", q.solution ?? q.correct, q.id);
}
test("claiming guest progress preserves both histories, picks the further active run and never awards XP twice", async () => {
  const guest = randomUUID(), user = `user:${randomUUID()}`;
  const guestRun = (await startRun(guest)).activeRunId!;
  const userRun = (await startRun(user)).activeRunId!;
  await checkpoint(guest, guestRun);
  await updateExplorer(guest, { legacy: { hcmus: 2, saved: ["palace"] } });
  await updateExplorer(user, { favorite: "hcmus", saved: true });
  await claimGuest(guest, user);
  const state = await readState(user);
  assert.equal(state.activeRunId, guestRun);
  assert.equal(state.runs.find(run => run.id === userRun)!.status, "abandoned");
  assert.equal(state.runs.length, 2);
  assert.equal(state.xp, 150);
  assert.equal((await readState(guest)).runs.length, 0);
  assert.deepEqual(await readExplorer(user), { hcmus: 2, saved: ["hcmus", "palace"], bookmarks: [] });
  await claimGuest(guest, user);
  assert.equal((await readState(user)).xp, 150);
  assert.deepEqual(await readExplorer(guest), { hcmus: 0, saved: [], bookmarks: [] });
  const other = `user:${randomUUID()}`;
  assert.equal((await readState(other)).runs.length, 0);
  await assert.rejects(() => answerCheckpoint(other, guestRun, "facade", 0, getCheckpointQuestions("facade")[0].id), GameError);
});
test("account campus progress is graded in order, survives retries and cannot be overwritten by legacy browser values", async () => {
  const user = `user:${randomUUID()}`;
  const missions = getPlaces("vi").find(place => place.id === "hcmus")!.missions;
  await assert.rejects(() => updateExplorer(user, { campusIndex: 1, campusAnswer: missions[1].correct }), GameError);
  await assert.rejects(() => updateExplorer(user, { campusIndex: 0, campusAnswer: -1 }), GameError);
  for (let index = 0; index < 4; index++) {
    await Promise.all([updateExplorer(user, { campusIndex: index, campusAnswer: missions[index].correct }), updateExplorer(user, { campusIndex: index, campusAnswer: missions[index].correct })]);
    assert.equal((await readExplorer(user)).hcmus, index + 1);
  }
  await updateExplorer(user, { legacy: { hcmus: 0, saved: ["palace"] } });
  assert.deepEqual(await readExplorer(user), { hcmus: 4, saved: [], bookmarks: [] });
});
test("concurrent final answers and guest merges keep a single lifetime reward and one active run", async () => {
  const guest = randomUUID(), user = `user:${randomUUID()}`;
  const runId = (await startRun(guest)).activeRunId!;
  await recordRecognition(guest, runId, "facade", "sample", "matched", "facade");
  const questions = getCheckpointQuestions("facade");
  for (const q of questions.slice(0,-1)) await answerCheckpoint(guest, runId, "facade", q.solution ?? q.correct, q.id);
  const final = questions.at(-1)!;
  await Promise.all([answerCheckpoint(guest, runId, "facade", final.solution ?? final.correct, final.id), answerCheckpoint(guest, runId, "facade", final.solution ?? final.correct, final.id)]);
  await Promise.all([claimGuest(guest,user), claimGuest(guest,user)]);
  const state = await readState(user);
  assert.equal(state.xp, 150);
  assert.equal(state.runs[0].visits.facade!.attempts.length, 4);
  assert.equal(state.runs.filter(run => run.status === "active").length, 1);
});
test("merging two explorers who already earned the same checkpoint preserves one reward and both visits", async () => {
  const guest = randomUUID(), user = `user:${randomUUID()}`;
  const guestRun = (await startRun(guest)).activeRunId!;
  const userRun = (await startRun(user)).activeRunId!;
  await checkpoint(guest, guestRun);
  await checkpoint(user, userRun);
  await claimGuest(guest, user);
  const state = await readState(user);
  assert.equal(state.xp, 150);
  assert.equal(state.runs.length, 2);
  assert.equal(state.runs.filter(run => run.status === "active").length, 1);
  assert.equal(state.activeRunId, userRun);
  assert.ok(state.runs.every(run => run.visits.facade?.completedAt));
});
test("story bookmarks belong to the profile, merge idempotently and reject unknown checkpoint keys", async () => {
  const guest = randomUUID(), user = `user:${randomUUID()}`;
  await updateExplorer(guest, { bookmark: "palace:facade", saved: true });
  await updateExplorer(guest, { bookmark: "palace:facade", saved: true });
  assert.deepEqual((await readExplorer(guest)).bookmarks, ["palace:facade"]);
  assert.deepEqual((await readExplorer(user)).bookmarks, []);
  await assert.rejects(() => updateExplorer(guest, { bookmark: "palace:unknown", saved: true }), GameError);
  await claimGuest(guest, user);
  assert.deepEqual((await readExplorer(user)).bookmarks, ["palace:facade"]);
  await updateExplorer(user, { bookmark: "palace:facade", saved: false });
  assert.deepEqual((await readExplorer(user)).bookmarks, []);
});
