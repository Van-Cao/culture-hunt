import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import {
  answerCheckpoint,
  readState,
  recordRecognition,
  requireAvailable,
  startRun,
  GameError,
} from "../lib/palace/store";
import { checkpointIds, getCheckpoints } from "../lib/palace/checkpoints";
import { identifyPhoto } from "../lib/palace/recognition";

process.env.CULTURE_HUNT_DATA_DIR = mkdtempSync(
  join(tmpdir(), "culture-hunt-test-"),
);
// Unit tests are deterministic and never make paid model requests.
delete process.env.OPENAI_API_KEY;

test("new profiles are isolated and starting an active run is idempotent", () => {
  const owner = randomUUID();
  assert.equal(readState(owner).runs.length, 0);
  const first = startRun(owner);
  assert.equal(first.runs.length, 1);
  assert.equal(startRun(owner).activeRunId, first.activeRunId);
  assert.equal(readState(randomUUID()).runs.length, 0);
});

test("locked checkpoints, cross-profile access, and quiz without recognition are rejected", () => {
  const owner = randomUUID(),
    runId = startRun(owner).activeRunId!;
  assert.throws(() => requireAvailable(owner, runId, "cabinet"), GameError);
  assert.throws(
    () => requireAvailable(randomUUID(), runId, "facade"),
    GameError,
  );
  assert.throws(() => answerCheckpoint(owner, runId, "facade", 0), GameError);
  assert.equal(readState(owner).xp, 0);
});

test("a mismatched reference never opens the selected checkpoint", () => {
  const owner = randomUUID(),
    runId = startRun(owner).activeRunId!;
  const state = recordRecognition(
    owner,
    runId,
    "facade",
    "sample",
    "mismatch",
    "rooftop",
  );
  assert.equal(state.runs[0].visits.facade, undefined);
  assert.throws(() => answerCheckpoint(owner, runId, "facade", 0), GameError);
});

test("wrong answers retain attempts, correct answers unlock once, duplicate submissions are idempotent", () => {
  const owner = randomUUID(),
    runId = startRun(owner).activeRunId!;
  recordRecognition(owner, runId, "facade", "sample", "matched", "facade");
  const wrong = answerCheckpoint(owner, runId, "facade", 1);
  assert.equal(wrong.correct, false);
  assert.equal(wrong.state.xp, 0);
  assert.equal(wrong.state.runs[0].visits.facade!.attempts.length, 1);
  assert.equal(wrong.state.runs[0].visits.facade!.completedAt, null);
  assert.throws(() => requireAvailable(owner, runId, "reception"), GameError);
  const correct = answerCheckpoint(owner, runId, "facade", 0);
  assert.equal(correct.state.xp, 150);
  assert.equal(correct.state.runs[0].visits.facade!.attempts.length, 2);
  const duplicate = answerCheckpoint(owner, runId, "facade", 0);
  assert.equal(duplicate.state.xp, 150);
  assert.equal(duplicate.state.runs[0].visits.facade!.attempts.length, 2);
  requireAvailable(owner, runId, "reception");
});

test("all five checkpoints complete the run; replay retains visits and cannot farm XP", () => {
  const owner = randomUUID();
  let firstRunId = "";
  for (let round = 0; round < 2; round++) {
    const runId = startRun(owner).activeRunId!;
    if (!round) firstRunId = runId;
    for (const checkpoint of getCheckpoints()) {
      requireAvailable(owner, runId, checkpoint.id);
      recordRecognition(
        owner,
        runId,
        checkpoint.id,
        "reference",
        "matched",
        checkpoint.id,
      );
      answerCheckpoint(owner, runId, checkpoint.id, checkpoint.mission.correct);
    }
    const state = readState(owner);
    assert.equal(state.activeRunId, null);
    assert.equal(state.runs[0].status, "completed");
    assert.ok(state.runs[0].completedAt);
    assert.equal(state.discovered.length, 5);
    assert.equal(state.xp, 750);
  }
  const state = readState(owner);
  assert.equal(state.runs.length, 2);
  assert.ok(state.runs.some((run) => run.id === firstRunId));
  for (const run of state.runs)
    for (const id of checkpointIds) {
      assert.ok(run.visits[id]?.recognizedAt);
      assert.ok(run.visits[id]?.completedAt);
      assert.equal(run.visits[id]?.attempts.length, 1);
    }
});

test("starting over preserves an unfinished run", () => {
  const owner = randomUUID(),
    runId = startRun(owner).activeRunId!;
  recordRecognition(owner, runId, "facade", "sample", "matched", "facade");
  const next = startRun(owner, true);
  assert.equal(next.runs.length, 2);
  assert.notEqual(next.activeRunId, runId);
  assert.equal(next.runs.find((run) => run.id === runId)?.status, "abandoned");
  assert.ok(next.runs.find((run) => run.id === runId)?.visits.facade);
});

test("all five real reference photographs can be uploaded and identified without a model", async () => {
  for (const checkpoint of getCheckpoints()) {
    const photo = await readFile(
      join(process.cwd(), "public", checkpoint.photo),
    );
    const result = await identifyPhoto(photo);
    assert.equal(result.checkpointId, checkpoint.id);
    assert.equal(result.status, "matched");
    assert.equal(result.mode, "reference");
  }
});

test("resized and re-encoded reference remains identifiable; unrelated or broken uploads do not unlock", async () => {
  const source = await readFile("public/images/palace/cabinet.webp");
  const jpeg = await sharp(source).resize(720).jpeg({ quality: 75 }).toBuffer();
  assert.equal((await identifyPhoto(jpeg)).checkpointId, "cabinet");
  const unrelated = await identifyPhoto(
    await readFile("public/images/hcmus-campus.webp"),
  );
  assert.equal(unrelated.status, "unknown");
  assert.equal(unrelated.checkpointId, null);
  await assert.rejects(
    () => identifyPhoto(Buffer.from("not an image")),
    GameError,
  );
});
