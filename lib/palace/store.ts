import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { getCheckpointQuestions, publicQuestion, type ScoredQuestion } from "./questions";
import { applyChallengeMove, createChallenge, CHALLENGE_VERSION, type ChallengeSession } from "./challenges";
import {
  checkpointIds,
  getCheckpoints,
  PALACE_XP,
  type CheckpointId,
} from "./checkpoints";
import type {
  Attempt,
  JourneyRun,
  PalaceState,
  RecognitionMode,
  Visit,
} from "./types";

let database: DatabaseSync | undefined;
function db() {
  if (database) return database;
  const directory =
    process.env.CULTURE_HUNT_DATA_DIR || join(process.cwd(), ".culture-hunt");
  mkdirSync(directory, { recursive: true });
  database = new DatabaseSync(join(directory, "palace.sqlite"));
  database.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    PRAGMA busy_timeout = 5000;
    CREATE TABLE IF NOT EXISTS runs (
      id TEXT PRIMARY KEY, owner TEXT NOT NULL, started_at TEXT NOT NULL,
      completed_at TEXT, status TEXT NOT NULL CHECK(status IN ('active','completed','abandoned'))
    );
    CREATE UNIQUE INDEX IF NOT EXISTS one_active_run ON runs(owner) WHERE status = 'active';
    CREATE TABLE IF NOT EXISTS visits (
      run_id TEXT NOT NULL REFERENCES runs(id), checkpoint_id TEXT NOT NULL,
      recognized_at TEXT NOT NULL, mode TEXT NOT NULL, completed_at TEXT,
      PRIMARY KEY(run_id, checkpoint_id)
    );
    CREATE TABLE IF NOT EXISTS attempts (
      id INTEGER PRIMARY KEY, run_id TEXT NOT NULL REFERENCES runs(id), checkpoint_id TEXT NOT NULL,
      at TEXT NOT NULL, answer INTEGER NOT NULL, correct INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS awards (
      owner TEXT NOT NULL, checkpoint_id TEXT NOT NULL, awarded_at TEXT NOT NULL,
      PRIMARY KEY(owner, checkpoint_id)
    );
    CREATE TABLE IF NOT EXISTS recognitions (
      id INTEGER PRIMARY KEY, run_id TEXT NOT NULL REFERENCES runs(id), checkpoint_id TEXT NOT NULL,
      at TEXT NOT NULL, mode TEXT NOT NULL, result TEXT NOT NULL, candidate TEXT
    );
    CREATE TABLE IF NOT EXISTS game_attempts (
      id INTEGER PRIMARY KEY, run_id TEXT NOT NULL REFERENCES runs(id), checkpoint_id TEXT NOT NULL,
      at TEXT NOT NULL, move_json TEXT NOT NULL, accepted INTEGER NOT NULL, solved INTEGER NOT NULL
    );
  `);
  // Additive migrations keep existing profiles and their one-question visits.
  const visitColumns = database.prepare("PRAGMA table_info(visits)").all();
  if (!visitColumns.some(column => column.name === "quiz_json"))
    database.exec("ALTER TABLE visits ADD COLUMN quiz_json TEXT");
  if (!visitColumns.some(column => column.name === "challenge_json"))
    database.exec("ALTER TABLE visits ADD COLUMN challenge_json TEXT");
  const attemptColumns = database.prepare("PRAGMA table_info(attempts)").all();
  if (!attemptColumns.some(column => column.name === "question_id"))
    database.exec("ALTER TABLE attempts ADD COLUMN question_id TEXT");
  return database;
}

function visitQuestions(checkpointId: CheckpointId, snapshot: unknown): ScoredQuestion[] {
  if (typeof snapshot === "string") return JSON.parse(snapshot) as ScoredQuestion[];
  // Legacy visits retain the old question and answer ordering, including retries.
  const vi = getCheckpoints("vi").find(c => c.id === checkpointId)!.mission;
  const en = getCheckpoints("en").find(c => c.id === checkpointId)!.mission;
  return [{ id: `${checkpointId}-legacy-1`, bankVersion: "legacy-v1", sourceId: "legacy-demo",
    question: { vi: vi.question, en: en.question }, answers: { vi: vi.answers, en: en.answers },
    correct: vi.correct, hint: { vi: vi.hint, en: en.hint }, explanation: { vi: vi.explanation, en: en.explanation },
  }];
}

export class GameError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
function transaction<T>(work: () => T): T {
  const database = db();
  database.exec("BEGIN IMMEDIATE");
  try {
    const result = work();
    database.exec("COMMIT");
    return result;
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }
}
function ownedRun(owner: string, runId: string) {
  const run = db()
    .prepare("SELECT * FROM runs WHERE id = ? AND owner = ?")
    .get(runId, owner);
  if (!run)
    throw new GameError("Không tìm thấy lượt chơi. / Run not found.", 404);
  return run;
}

export function readState(owner: string): PalaceState {
  const runs = db()
    .prepare(
      "SELECT * FROM runs WHERE owner = ? ORDER BY started_at DESC, rowid DESC",
    )
    .all(owner)
    .map((row) => {
      const visits: JourneyRun["visits"] = {};
      for (const v of db()
        .prepare("SELECT * FROM visits WHERE run_id = ?")
        .all(row.id)) {
        const checkpointId = v.checkpoint_id as CheckpointId;
        const quiz = visitQuestions(checkpointId, v.quiz_json);
        const attempts = db()
          .prepare(
            "SELECT at, answer, correct, question_id FROM attempts WHERE run_id = ? AND checkpoint_id = ? ORDER BY id",
          )
          .all(row.id, v.checkpoint_id)
          .map(
            (a) =>
              ({
                at: String(a.at),
                answer: Number(a.answer),
                correct: Boolean(a.correct),
                questionId: a.question_id ? String(a.question_id) : quiz[0].id,
              }) satisfies Attempt,
          );
        visits[checkpointId] = {
          checkpointId,
          recognizedAt: String(v.recognized_at),
          mode: v.mode as RecognitionMode,
          completedAt: v.completed_at ? String(v.completed_at) : null,
          attempts,
          quiz: quiz.map(publicQuestion),
          ...(typeof v.challenge_json === "string" ? { challenge: JSON.parse(v.challenge_json) as ChallengeSession } : {}),
        } satisfies Visit;
      }
      return {
        id: String(row.id),
        startedAt: String(row.started_at),
        completedAt: row.completed_at ? String(row.completed_at) : null,
        status: row.status as JourneyRun["status"],
        visits,
      } satisfies JourneyRun;
    });
  const discovered = db()
    .prepare(
      "SELECT checkpoint_id FROM awards WHERE owner = ? ORDER BY awarded_at, rowid",
    )
    .all(owner)
    .map((row) => row.checkpoint_id as CheckpointId);
  return {
    runs,
    activeRunId: runs.find((r) => r.status === "active")?.id || null,
    discovered,
    xp: discovered.length * PALACE_XP,
    aiAvailable: Boolean(process.env.OPENAI_API_KEY),
  };
}

export function startRun(owner: string, replay = false): PalaceState {
  transaction(() => {
    const active = db()
      .prepare("SELECT id FROM runs WHERE owner = ? AND status = 'active'")
      .get(owner);
    if (active && !replay) return;
    if (active)
      db()
        .prepare("UPDATE runs SET status = 'abandoned' WHERE id = ?")
        .run(active.id);
    db()
      .prepare(
        "INSERT INTO runs(id, owner, started_at, status) VALUES(?, ?, ?, 'active')",
      )
      .run(randomUUID(), owner, new Date().toISOString());
  });
  return readState(owner);
}

export function requireAvailable(
  owner: string,
  runId: string,
  checkpointId: CheckpointId,
) {
  const run = ownedRun(owner, runId);
  if (run.status !== "active")
    throw new GameError("Lượt chơi đã kết thúc. / This run has ended.", 409);
  const index = checkpointIds.indexOf(checkpointId);
  const previous = checkpointIds.slice(0, index);
  for (const id of previous) {
    if (
      !db()
        .prepare(
          "SELECT completed_at FROM visits WHERE run_id = ? AND checkpoint_id = ? AND completed_at IS NOT NULL",
        )
        .get(runId, id)
    ) {
      throw new GameError(
        "Hoàn thành điểm trước để mở điểm này. / Complete the previous checkpoint first.",
        409,
      );
    }
  }
}

export function recordRecognition(
  owner: string,
  runId: string,
  checkpointId: CheckpointId,
  mode: RecognitionMode,
  result: string,
  candidate: CheckpointId | null,
) {
  transaction(() => {
    requireAvailable(owner, runId, checkpointId);
    const at = new Date().toISOString();
    db()
      .prepare(
        "INSERT INTO recognitions(run_id, checkpoint_id, at, mode, result, candidate) VALUES(?, ?, ?, ?, ?, ?)",
      )
      .run(runId, checkpointId, at, mode, result, candidate);
    if (result === "matched" && candidate === checkpointId) {
      db()
        .prepare(
          "INSERT OR IGNORE INTO visits(run_id, checkpoint_id, recognized_at, mode, quiz_json, challenge_json) VALUES(?, ?, ?, ?, ?, ?)",
        )
        .run(runId, checkpointId, at, mode, JSON.stringify(getCheckpointQuestions(checkpointId)), JSON.stringify(createChallenge(checkpointId)));
    }
  });
  return readState(owner);
}

export function answerCheckpoint(
  owner: string,
  runId: string,
  checkpointId: CheckpointId,
  answer: number,
  questionId?: string,
) {
  const correct = transaction(() => {
    const run = ownedRun(owner, runId);
    const visit = db()
      .prepare("SELECT * FROM visits WHERE run_id = ? AND checkpoint_id = ?")
      .get(runId, checkpointId);
    if (!visit)
      throw new GameError(
        "Nhận diện địa điểm trước khi trả lời. / Identify the checkpoint first.",
        409,
      );
    // New journeys unlock stories through mini games. Their question bank is
    // optional afterwards; the legacy answer endpoint cannot bypass the game.
    if (visit.challenge_json && !visit.completed_at)
      throw new GameError("Hoàn thành mini game trước để mở câu chuyện. / Complete the mini game to unlock the story.", 409);
    const quiz = visitQuestions(checkpointId, visit.quiz_json);
    const submittedId = questionId || (visit.quiz_json ? undefined : quiz[0].id);
    const question = quiz.find(q => q.id === submittedId);
    if (!question || !Number.isInteger(answer) || answer < 0 || answer > 3)
      throw new GameError("Câu hỏi không hợp lệ. / Invalid question.", 409);
    const passed = new Set(db().prepare("SELECT question_id FROM attempts WHERE run_id = ? AND checkpoint_id = ? AND correct = 1").all(runId, checkpointId).map(a => a.question_id ? String(a.question_id) : quiz[0].id));
    // A duplicate passed question is idempotent, even after completing a run.
    if (passed.has(question.id)) return true;
    if (run.status !== "active" && !visit.challenge_json)
      throw new GameError("Lượt chơi đã kết thúc. / This run has ended.", 409);
    if (!visit.challenge_json) requireAvailable(owner, runId, checkpointId);
    if (quiz.find(q => !passed.has(q.id))?.id !== question.id)
      throw new GameError("Hoàn thành câu trước để tiếp tục. / Complete the previous question first.", 409);
    const success = answer === question.correct;
    const at = new Date().toISOString();
    db()
      .prepare(
        "INSERT INTO attempts(run_id, checkpoint_id, at, answer, correct, question_id) VALUES(?, ?, ?, ?, ?, ?)",
      )
      .run(runId, checkpointId, at, answer, success ? 1 : 0, question.id);
    if (success) passed.add(question.id);
    if (!visit.challenge_json && quiz.every(q => passed.has(q.id))) {
      db()
        .prepare(
          "UPDATE visits SET completed_at = ? WHERE run_id = ? AND checkpoint_id = ?",
        )
        .run(at, runId, checkpointId);
      db()
        .prepare(
          "INSERT OR IGNORE INTO awards(owner, checkpoint_id, awarded_at) VALUES(?, ?, ?)",
        )
        .run(owner, checkpointId, at);
      const count = db()
        .prepare(
          "SELECT COUNT(*) AS n FROM visits WHERE run_id = ? AND completed_at IS NOT NULL",
        )
        .get(runId)!;
      if (Number(count.n) === checkpointIds.length)
        db()
          .prepare(
            "UPDATE runs SET status = 'completed', completed_at = ? WHERE id = ?",
          )
          .run(at, runId);
    }
    return success;
  });
  return { correct, state: readState(owner) };
}

export function startChallenge(owner: string, runId: string, checkpointId: CheckpointId) {
  transaction(() => {
    requireAvailable(owner, runId, checkpointId);
    const visit = db().prepare("SELECT * FROM visits WHERE run_id = ? AND checkpoint_id = ?").get(runId, checkpointId);
    if (!visit) throw new GameError("Nhận diện địa điểm trước. / Identify the checkpoint first.", 409);
    if (!visit.challenge_json && !visit.completed_at)
      db().prepare("UPDATE visits SET challenge_json = ? WHERE run_id = ? AND checkpoint_id = ?")
        .run(JSON.stringify(createChallenge(checkpointId)), runId, checkpointId);
  });
  return { state: readState(owner) };
}

export function moveChallenge(owner: string, runId: string, checkpointId: CheckpointId, version: string, move: unknown) {
  const result = transaction(() => {
    ownedRun(owner, runId);
    const visit = db().prepare("SELECT * FROM visits WHERE run_id = ? AND checkpoint_id = ?").get(runId, checkpointId);
    if (!visit || typeof visit.challenge_json !== "string")
      throw new GameError("Nhận diện địa điểm và bắt đầu mini game trước. / Identify the checkpoint and start its mini game first.", 409);
    const challenge = JSON.parse(visit.challenge_json) as ChallengeSession;
    if (version !== challenge.definition.version || version !== CHALLENGE_VERSION)
      throw new GameError("Phiên bản thử thách đã thay đổi. Tải lại trang. / Challenge version changed. Reload the page.", 409);
    if (visit.completed_at) return { accepted: true, solved: true };
    requireAvailable(owner, runId, checkpointId);
    let next: ReturnType<typeof applyChallengeMove>;
    try { next = applyChallengeMove(challenge, move); }
    catch { throw new GameError("Thao tác mini game không hợp lệ. / Invalid mini game move."); }
    const at = new Date().toISOString();
    db().prepare("UPDATE visits SET challenge_json = ? WHERE run_id = ? AND checkpoint_id = ?")
      .run(JSON.stringify(next.session), runId, checkpointId);
    db().prepare("INSERT INTO game_attempts(run_id, checkpoint_id, at, move_json, accepted, solved) VALUES(?, ?, ?, ?, ?, ?)")
      .run(runId, checkpointId, at, JSON.stringify(move), Number(next.accepted), Number(next.session.progress.solved));
    if (next.session.progress.solved) {
      db().prepare("UPDATE visits SET completed_at = ? WHERE run_id = ? AND checkpoint_id = ?").run(at, runId, checkpointId);
      db().prepare("INSERT OR IGNORE INTO awards(owner, checkpoint_id, awarded_at) VALUES(?, ?, ?)").run(owner, checkpointId, at);
      const count = db().prepare("SELECT COUNT(*) AS n FROM visits WHERE run_id = ? AND completed_at IS NOT NULL").get(runId)!;
      if (Number(count.n) === checkpointIds.length)
        db().prepare("UPDATE runs SET status = 'completed', completed_at = ? WHERE id = ?").run(at, runId);
    }
    return { accepted: next.accepted, solved: next.session.progress.solved };
  });
  return { ...result, state: readState(owner) };
}
