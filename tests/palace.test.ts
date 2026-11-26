import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import sharp from "sharp";
import workbook from "../content/palace/question-bank-v2.source.json";
import retiredBank from "../content/palace/question-bank-v2.json";
import publicBank from "../content/palace/question-bank-v3.json";
import learningAssets from "../content/palace/learning-assets.json";
import { getCheckpointQuestions, questionReview } from "../lib/palace/questions";
import { isCorrectQuestionAnswer, isValidQuestionAnswer } from "../lib/palace/question-response";
import { answerCheckpoint, readState, recordRecognition, requireAvailable, startRun, GameError } from "../lib/palace/store";
import { checkpointIds, getCheckpoints } from "../lib/palace/checkpoints";
import { identifyPhoto } from "../lib/palace/recognition";

process.env.CULTURE_HUNT_STORAGE = "sqlite";
process.env.CULTURE_HUNT_DATA_DIR = mkdtempSync(join(tmpdir(), "culture-hunt-quiz-only-"));
delete process.env.OPENAI_API_KEY;
const legacyOwner = randomUUID(), legacyRun = randomUUID();
const completedOwner = randomUUID(), completedRun = randomUUID();
const workbookOwner = randomUUID(), workbookRun = randomUUID();
const old = new DatabaseSync(join(process.env.CULTURE_HUNT_DATA_DIR, "palace.sqlite"));
old.exec(`
 CREATE TABLE runs (id TEXT PRIMARY KEY, owner TEXT NOT NULL, started_at TEXT NOT NULL, completed_at TEXT, status TEXT NOT NULL);
 CREATE TABLE visits (run_id TEXT NOT NULL, checkpoint_id TEXT NOT NULL, recognized_at TEXT NOT NULL, mode TEXT NOT NULL, completed_at TEXT, quiz_json TEXT, challenge_json TEXT, PRIMARY KEY(run_id, checkpoint_id));
 CREATE TABLE attempts (id INTEGER PRIMARY KEY, run_id TEXT NOT NULL, checkpoint_id TEXT NOT NULL, at TEXT NOT NULL, answer INTEGER NOT NULL, correct INTEGER NOT NULL);
 CREATE TABLE awards (owner TEXT NOT NULL, checkpoint_id TEXT NOT NULL, awarded_at TEXT NOT NULL, PRIMARY KEY(owner, checkpoint_id));
`);
old.prepare("INSERT INTO runs VALUES (?, ?, '2026-11-01', NULL, 'active')").run(legacyRun, legacyOwner);
old.prepare("INSERT INTO visits VALUES (?, 'facade', '2026-11-01', 'sample', NULL, NULL, ?)").run(legacyRun, JSON.stringify({progress:{moves:3}}));
old.prepare("INSERT INTO attempts(run_id,checkpoint_id,at,answer,correct) VALUES (?, 'facade', '2026-11-01', 1, 0)").run(legacyRun);
const retiredSnapshot = [{id:"retired-question",bankVersion:"retired-v1",sourceId:"archived",question:{vi:"Archived",en:"Archived"},answers:{vi:["A","B"],en:["A","B"]},correct:0,hint:{vi:"",en:""},explanation:{vi:"",en:""}}];
old.prepare("INSERT INTO runs VALUES (?, ?, '2026-11-01', '2026-11-01', 'completed')").run(completedRun, completedOwner);
old.prepare("INSERT INTO visits VALUES (?, 'facade', '2026-11-01', 'sample', '2026-11-01', ?, ?)").run(completedRun, JSON.stringify(retiredSnapshot), JSON.stringify({progress:{moves:7}}));
old.prepare("INSERT INTO awards VALUES (?, 'facade', '2026-11-01')").run(completedOwner);
old.prepare("INSERT INTO runs VALUES (?, ?, '2026-11-02', NULL, 'active')").run(workbookRun, workbookOwner);
old.prepare("INSERT INTO visits VALUES (?, 'facade', '2026-11-02', 'reference', NULL, ?, NULL)").run(workbookRun, JSON.stringify(retiredBank.questions.filter(q => q.checkpointId === "facade")));
old.close();

const answerFor = (id: typeof checkpointIds[number]) => getCheckpointQuestions(id).map(q => ({id:q.id, answer:q.solution ?? q.correct}));
async function solve(owner: string, runId: string, id: typeof checkpointIds[number]) {
  for (const q of answerFor(id)) (await answerCheckpoint(owner,runId,id,q.answer,q.id));
}

test("unfinished legacy visits immediately use the workbook while old attempts and recognition survive", async () => {
  const state=(await readState(legacyOwner)), visit=state.runs[0].visits.facade!;
  assert.equal(visit.quiz.length,4);
  assert.ok(visit.quiz.every(q=>q.bankVersion==="palace-learning-v3"));
  assert.equal(visit.recognizedAt,"2026-11-01");
  assert.equal(visit.attempts.length,1);
  assert.equal(visit.attempts[0].questionId,"facade-legacy-1");
  assert.equal("challenge" in visit,false);
  assert.equal(state.xp,0);
  (await solve(legacyOwner,legacyRun,"facade"));
  assert.equal((await readState(legacyOwner)).xp,150);
});

test("completed visits preserve their historical bank, old game record and lifetime awards; the retired bank cannot be played", async () => {
  const state=(await readState(completedOwner)), visit=state.runs[0].visits.facade!;
  assert.equal(state.xp,150);
  assert.equal(visit.completedAt,"2026-11-01");
  assert.equal(visit.quiz[0].bankVersion,"retired-v1");
  assert.equal(visit.legacyGameMoves,7);
  await assert.rejects(async ()=>(await answerCheckpoint(completedOwner,completedRun,"facade",0,"retired-question")),GameError);
});

test("unfinished workbook visits migrate to the new four-task script without losing recognition", async () => {
  const before = (await readState(workbookOwner)).runs[0].visits.facade!;
  assert.equal(before.quiz.length, 4);
  assert.equal(before.recognizedAt, "2026-11-02");
  assert.equal(before.mode, "reference");
  await assert.rejects(async () => (await answerCheckpoint(workbookOwner, workbookRun, "facade", [0], retiredBank.questions[0].id)), GameError);
  (await solve(workbookOwner, workbookRun, "facade"));
  assert.equal((await readState(workbookOwner)).xp, 150);
});

test("profiles, order and recognition gate every quiz", async () => {
  const owner=randomUUID(), runId=(await startRun(owner)).activeRunId!;
  assert.equal((await startRun(owner)).activeRunId,runId);
  assert.equal((await readState(randomUUID())).runs.length,0);
  await assert.rejects(async ()=>(await requireAvailable(owner,runId,"reception")),GameError);
  await assert.rejects(async ()=>(await requireAvailable(randomUUID(),runId,"facade")),GameError);
  await assert.rejects(async ()=>(await answerCheckpoint(owner,runId,"facade",[0],"facade-xlsx-3")),GameError);
  (await recordRecognition(owner,runId,"facade","sample","mismatch","reception"));
  assert.equal((await readState(owner)).runs[0].visits.facade,undefined);
});

test("new recognition opens only the new quiz, wrong attempts persist, and only the final correct answer unlocks the checkpoint", async () => {
  const owner=randomUUID(), runId=(await startRun(owner)).activeRunId!;
  (await recordRecognition(owner,runId,"facade","sample","matched","facade"));
  const questions=answerFor("facade"), first=questions[0];
  assert.equal("challenge" in (await readState(owner)).runs[0].visits.facade!,false);
  for(const bad of [-1,[0,0],[8],[],"0"])
    await assert.rejects(async ()=>(await answerCheckpoint(owner,runId,"facade",bad,first.id)),GameError);
  await assert.rejects(async ()=>(await answerCheckpoint(owner,runId,"facade",questions[1].answer,questions[1].id)),GameError);
  await assert.rejects(async ()=>(await answerCheckpoint(owner,runId,"facade",[0],"forged")),GameError);
  await assert.rejects(async ()=>(await answerCheckpoint(randomUUID(),runId,"facade",first.answer,first.id)),GameError);
  assert.equal((await answerCheckpoint(owner,runId,"facade",0,first.id)).correct,false);
  assert.deepEqual((await readState(owner)).runs[0].visits.facade!.attempts[0].answer,0);
  for(const q of questions.slice(0,-1)) {
    (await answerCheckpoint(owner,runId,"facade",q.answer,q.id));
    assert.equal((await readState(owner)).xp,0);
    assert.equal((await readState(owner)).runs[0].visits.facade!.completedAt,null);
    await assert.rejects(async ()=>(await requireAvailable(owner,runId,"reception")),GameError);
  }
  const last=questions.at(-1)!;
  const done=(await answerCheckpoint(owner,runId,"facade",last.answer,last.id));
  assert.equal(done.state.xp,150);
  assert.ok(done.state.runs[0].visits.facade!.completedAt);
  (await answerCheckpoint(owner,runId,"facade",last.answer,last.id));
  assert.equal((await readState(owner)).runs[0].visits.facade!.attempts.length,5);
  (await requireAvailable(owner,runId,"reception"));
});

test("partial quizzes resume and recognition does not replace answers; new runs retain history without XP farming", async () => {
  const owner=randomUUID();
  let firstRun="";
  for(let round=0;round<2;round++) {
    const runId=(await startRun(owner)).activeRunId!;
    if(!round) firstRun=runId;
    for(const id of checkpointIds) {
      (await recordRecognition(owner,runId,id,"sample","matched",id));
      const first=answerFor(id)[0];
      (await answerCheckpoint(owner,runId,id,first.answer,first.id));
      const partial=(await readState(owner)).runs[0].visits[id]!;
      assert.equal("correct" in partial.quiz[0],false);
      assert.equal("solution" in partial.quiz[0],false);
      (await recordRecognition(owner,runId,id,"reference","matched",id));
      assert.deepEqual((await readState(owner)).runs[0].visits[id]!.attempts,partial.attempts);
      (await solve(owner,runId,id));
    }
    const done=(await readState(owner));
    assert.equal(done.xp,750);assert.equal(done.discovered.length,5);
    assert.equal(done.activeRunId,null);assert.equal(done.runs[0].status,"completed");
  }
  const state=(await readState(owner));
  assert.equal(state.runs.length,2);
  assert.ok(state.runs.find(run=>run.id===firstRun));
  for(const run of state.runs) for(const id of checkpointIds)
    assert.equal(run.visits[id]!.attempts.length,getCheckpointQuestions(id).length);
});

test("starting over archives an unfinished run rather than deleting it", async () => {
  const owner=randomUUID(), runId=(await startRun(owner)).activeRunId!;
  (await recordRecognition(owner,runId,"facade","sample","matched","facade"));
  const next=(await startRun(owner,true));
  assert.equal(next.runs.length,2);
  assert.equal(next.runs.find(run=>run.id===runId)!.status,"abandoned");
  assert.ok(next.runs.find(run=>run.id===runId)!.visits.facade);
});

test("the reviewed journey retains provenance and publishes four bilingual tasks and one reveal per checkpoint", async () => {
  assert.equal(workbook.questions.length, 30);
  assert.equal(workbook.scripts.length, 5);
  const active = checkpointIds.flatMap(id => getCheckpointQuestions(id));
  const accounted = new Set([...active.flatMap(q => q.sourceIds || [q.sourceId]), ...questionReview.map(q => q.sourceId)]);
  for (const source of [...workbook.questions, ...workbook.scripts]) assert.ok(accounted.has(source.id), source.id);
  for (const q of publicBank.questions) {
    assert.equal("correct" in q, false);
    assert.equal("solution" in q, false);
  }
  assert.deepEqual(checkpointIds.map(id => getCheckpointQuestions(id).length), [4,4,4,4,4]);
  const mapped = new Set([...active.flatMap(q => q.sourceIds || [q.sourceId]), ...questionReview.map(q => q.sourceId)]);
  for (const row of workbook.questions) assert.ok(mapped.has(row.id), `Unaccounted workbook task ${row.id}`);
  assert.deepEqual([...new Set(active.map(q => q.kind))].sort(), ["match","multi","order","single"]);
  for (const id of checkpointIds) assert.equal(getCheckpointQuestions(id).filter(q => q.learning?.reveal).length, 1);
  for (const q of active) {
    assert.equal(q.answers.vi.length,q.answers.en.length);
    for (const locale of ["vi", "en"] as const) {
      assert.ok(q.answers[locale].every(answer => typeof answer === "string" && answer.trim().length > 0), `${q.id}: empty ${locale} answer`);
      assert.ok(q.prompts?.[locale].every(prompt => typeof prompt === "string" && prompt.trim().length > 0) ?? true, `${q.id}: empty ${locale} prompt`);
    }
    assert.ok(q.question.vi && q.question.en && q.hint.vi && q.hint.en && q.explanation.vi && q.explanation.en);
    assert.ok(q.learning?.context.vi && q.learning.context.en && q.learning.asset);
    for(const card of q.learning?.cards || []) assert.ok(card.title.vi && card.title.en && card.text.vi && card.text.en);
    assert.ok(isValidQuestionAnswer(q,q.solution ?? q.correct),q.id);
  }
});

test("every learning photograph exists, matches its credited manifest and has adequate source resolution", async () => {
  const used = new Set(checkpointIds.flatMap(id => getCheckpointQuestions(id)).flatMap(q => [q.learning!.asset, ...(q.learning?.choiceAssets || []), ...(q.learning?.cards || []).flatMap(c => c.asset ? [c.asset] : [])]).filter(Boolean));
  for (const id of used) {
    const asset = learningAssets[id as keyof typeof learningAssets];
    assert.ok(asset?.source && asset.credit, String(id));
    const meta = await sharp(join(process.cwd(), "public", asset.src)).metadata();
    assert.equal(meta.width, asset.width);
    assert.equal(meta.height, asset.height);
    assert.ok(asset.width >= 1600, String(id));
  }
});

test("learning tasks validate complete selections, sequences and pairs; legacy numeric parsing remains strict", async () => {
  const multi=getCheckpointQuestions("cabinet")[0], order=getCheckpointQuestions("cabinet")[2], pairs=getCheckpointQuestions("facade")[3];
  assert.equal(isCorrectQuestionAnswer(multi,[2,0]),true);
  assert.equal(isCorrectQuestionAnswer(multi,[0]),false);
  assert.equal(isCorrectQuestionAnswer(multi,[0,1,2]),false);
  assert.equal(isValidQuestionAnswer(multi,[0,0]),false);
  assert.equal(isValidQuestionAnswer(multi,0),false);
  assert.equal(isValidQuestionAnswer(multi,[99]),false);
  assert.equal(isCorrectQuestionAnswer(order,[1,2,0]),true);
  assert.equal(isCorrectQuestionAnswer(order,[0,1,2]),false);
  assert.equal(isValidQuestionAnswer(order,[1,2]),false);
  assert.equal(isCorrectQuestionAnswer(pairs,[1,0]),true);
  assert.equal(isCorrectQuestionAnswer(pairs,[0,1]),false);
  assert.equal(isValidQuestionAnswer(pairs,[1,-1]),false);
  const number={...multi,kind:"number" as const,solution:"10"};
  assert.equal(isCorrectQuestionAnswer(number,"010"),true);
  assert.equal(isCorrectQuestionAnswer(number,"11"),false);
  assert.equal(isValidQuestionAnswer(number,10),false);
  assert.equal(isValidQuestionAnswer(number,"10 cats"),false);
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
