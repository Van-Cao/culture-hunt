import { test, after } from "node:test";
import assert from "node:assert/strict";
import { loadEnvConfig } from "@next/env";
import { randomUUID } from "node:crypto";
import { postgresPool, closeDatabase } from "../lib/database";
import { startRun, recordRecognition, answerCheckpoint, claimGuest, readState, readExplorer, updateExplorer, GameError } from "../lib/palace/store";
import { getCheckpointQuestions } from "../lib/palace/questions";

loadEnvConfig(process.cwd());
const guest = `qa:${randomUUID()}`, user = `qa:${randomUUID()}`, other = `qa:${randomUUID()}`;
after(async () => {
  const sql = postgresPool();
  await sql.begin(async tx => {
    for (const table of ["attempts", "visits", "recognitions", "game_attempts"]) await tx.unsafe(`DELETE FROM culture_hunt.${table} WHERE run_id IN (SELECT id FROM culture_hunt.runs WHERE owner IN ($1,$2,$3))`, [guest,user,other]);
    await tx`DELETE FROM culture_hunt.runs WHERE owner IN (${guest},${user},${other})`;
    await tx`DELETE FROM culture_hunt.awards WHERE owner IN (${guest},${user},${other})`;
    await tx`DELETE FROM culture_hunt.explorer_progress WHERE owner IN (${guest},${user},${other})`;
  });
  await closeDatabase();
});
test("Supabase PostgreSQL persists progress, serializes retries, isolates owners and merges guest history", async () => {
  const run = (await startRun(guest)).activeRunId!;
  await recordRecognition(guest, run, "facade", "sample", "matched", "facade");
  const quiz = getCheckpointQuestions("facade");
  for (const q of quiz.slice(0,-1)) await answerCheckpoint(guest, run, "facade", q.solution ?? q.correct, q.id);
  const last = quiz.at(-1)!;
  await Promise.all([answerCheckpoint(guest,run,"facade",last.solution ?? last.correct,last.id), answerCheckpoint(guest,run,"facade",last.solution ?? last.correct,last.id)]);
  assert.equal((await readState(guest)).xp,150);
  assert.equal((await readState(guest)).runs[0].visits.facade!.attempts.length,4);
  await assert.rejects(() => answerCheckpoint(other,run,"facade",last.solution ?? last.correct,last.id),GameError);
  const prior = (await startRun(user)).activeRunId!;
  await updateExplorer(guest,{ favorite:"palace",saved:true });
  await claimGuest(guest,user);
  const state = await readState(user);
  assert.equal(state.xp,150);
  assert.equal(state.activeRunId,run);
  assert.equal(state.runs.find(item=>item.id===prior)!.status,"abandoned");
  assert.equal((await readState(guest)).runs.length,0);
  assert.deepEqual((await readExplorer(user)).saved,["palace"]);
  assert.equal((await readState(other)).xp,0);
});
