import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import source from "../content/palace/question-bank.source.json";
import { getCheckpointQuestions, questionReview } from "../lib/palace/questions";
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

// Start from the old database shape to exercise the additive migration.
const legacyOwner = randomUUID(), legacyRun = randomUUID();
const oldDatabase = new DatabaseSync(join(process.env.CULTURE_HUNT_DATA_DIR, "palace.sqlite"));
oldDatabase.exec(`
  CREATE TABLE runs (id TEXT PRIMARY KEY, owner TEXT NOT NULL, started_at TEXT NOT NULL, completed_at TEXT, status TEXT NOT NULL);
  CREATE TABLE visits (run_id TEXT NOT NULL REFERENCES runs(id), checkpoint_id TEXT NOT NULL, recognized_at TEXT NOT NULL, mode TEXT NOT NULL, completed_at TEXT, PRIMARY KEY(run_id, checkpoint_id));
  CREATE TABLE attempts (id INTEGER PRIMARY KEY, run_id TEXT NOT NULL REFERENCES runs(id), checkpoint_id TEXT NOT NULL, at TEXT NOT NULL, answer INTEGER NOT NULL, correct INTEGER NOT NULL);
`);
oldDatabase.prepare("INSERT INTO runs VALUES(?, ?, ?, NULL, 'active')").run(legacyRun, legacyOwner, new Date().toISOString());
oldDatabase.prepare("INSERT INTO visits VALUES(?, 'facade', ?, 'sample', NULL)").run(legacyRun, new Date().toISOString());
oldDatabase.prepare("INSERT INTO attempts(run_id, checkpoint_id, at, answer, correct) VALUES(?, 'facade', ?, 1, 0)").run(legacyRun, new Date().toISOString());
oldDatabase.close();

test("the supplied ten-question bank is preserved and nine reviewed questions are bilingual and playable", () => {
  assert.equal(source.questions.length, 10);
  const active = checkpointIds.flatMap(id => getCheckpointQuestions(id));
  assert.equal(active.length, 9);
  assert.deepEqual(checkpointIds.map(id => getCheckpointQuestions(id).length), [2, 2, 1, 2, 2]);
  assert.deepEqual([...active.map(q => q.sourceId), ...questionReview.map(q => q.sourceId)].sort(), source.questions.map(q => q.id).sort());
  for (const q of active) {
    assert.equal(q.answers.vi.length, 4); assert.equal(q.answers.en.length, 4);
    assert.ok(q.question.vi && q.question.en && q.hint.vi && q.hint.en);
    assert.ok(q.correct >= 0 && q.correct <= 3);
  }
});

test("migration preserves an unfinished legacy quiz and its old attempts", () => {
  const visit = readState(legacyOwner).runs[0].visits.facade!;
  assert.equal(visit.quiz.length, 1);
  assert.equal(visit.quiz[0].bankVersion, "legacy-v1");
  assert.equal(visit.attempts[0].questionId, "facade-legacy-1");
  const completed = answerCheckpoint(legacyOwner, legacyRun, "facade", 0);
  assert.equal(completed.state.xp, 150);
  assert.equal(completed.state.runs[0].visits.facade!.attempts.length, 2);
  const next = recordRecognition(legacyOwner, legacyRun, "reception", "sample", "matched", "reception");
  assert.equal(next.runs[0].visits.reception!.quiz.length, 2);
});

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
  const [first, second] = getCheckpointQuestions("facade");
  const wrong = answerCheckpoint(owner, runId, "facade", 1, first.id);
  assert.equal(wrong.correct, false);
  assert.equal(wrong.state.xp, 0);
  assert.equal(wrong.state.runs[0].visits.facade!.attempts.length, 1);
  assert.equal(wrong.state.runs[0].visits.facade!.completedAt, null);
  assert.throws(() => requireAvailable(owner, runId, "reception"), GameError);
  const partial = answerCheckpoint(owner, runId, "facade", first.correct, first.id);
  assert.equal(partial.state.xp, 0);
  assert.equal(partial.state.runs[0].visits.facade!.completedAt, null);
  assert.throws(() => requireAvailable(owner, runId, "reception"), GameError);
  assert.equal(answerCheckpoint(owner, runId, "facade", 0, first.id).state.runs[0].visits.facade!.attempts.length, 2);
  const correct = answerCheckpoint(owner, runId, "facade", second.correct, second.id);
  assert.equal(correct.state.xp, 150);
  assert.equal(correct.state.runs[0].visits.facade!.attempts.length, 3);
  const duplicate = answerCheckpoint(owner, runId, "facade", second.correct, second.id);
  assert.equal(duplicate.state.xp, 150);
  assert.equal(duplicate.state.runs[0].visits.facade!.attempts.length, 3);
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
      for (const q of getCheckpointQuestions(checkpoint.id)) answerCheckpoint(owner, runId, checkpoint.id, q.correct, q.id);
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
      assert.equal(run.visits[id]?.attempts.length, getCheckpointQuestions(id).length);
    }
});

test("new quizzes reject missing, forged and future question IDs, and resume after a partial answer", () => {
  const owner = randomUUID(), runId = startRun(owner).activeRunId!;
  recordRecognition(owner, runId, "facade", "sample", "matched", "facade");
  const [first, second] = getCheckpointQuestions("facade");
  assert.throws(() => answerCheckpoint(owner, runId, "facade", 0), GameError);
  assert.throws(() => answerCheckpoint(owner, runId, "facade", 0, "forged"), GameError);
  assert.throws(() => answerCheckpoint(owner, runId, "facade", second.correct, second.id), GameError);
  answerCheckpoint(owner, runId, "facade", first.correct, first.id);
  const resumed = readState(owner).runs[0].visits.facade!;
  assert.equal(resumed.attempts.filter(a => a.correct).length, 1);
  assert.equal(resumed.quiz[1].id, second.id);
  assert.equal("correct" in resumed.quiz[0], false);
  recordRecognition(owner, runId, "facade", "reference", "matched", "facade");
  assert.deepEqual(readState(owner).runs[0].visits.facade!.quiz, resumed.quiz);
  assert.equal(answerCheckpoint(owner, runId, "facade", second.correct, second.id).state.xp, 150);
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
