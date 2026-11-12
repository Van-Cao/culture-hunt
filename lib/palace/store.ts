import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
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
  `);
  return database;
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
        const attempts = db()
          .prepare(
            "SELECT at, answer, correct FROM attempts WHERE run_id = ? AND checkpoint_id = ? ORDER BY id",
          )
          .all(row.id, v.checkpoint_id)
          .map(
            (a) =>
              ({
                at: String(a.at),
                answer: Number(a.answer),
                correct: Boolean(a.correct),
              }) satisfies Attempt,
          );
        const checkpointId = v.checkpoint_id as CheckpointId;
        visits[checkpointId] = {
          checkpointId,
          recognizedAt: String(v.recognized_at),
          mode: v.mode as RecognitionMode,
          completedAt: v.completed_at ? String(v.completed_at) : null,
          attempts,
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
          "INSERT OR IGNORE INTO visits(run_id, checkpoint_id, recognized_at, mode) VALUES(?, ?, ?, ?)",
        )
        .run(runId, checkpointId, at, mode);
    }
  });
  return readState(owner);
}

export function answerCheckpoint(
  owner: string,
  runId: string,
  checkpointId: CheckpointId,
  answer: number,
) {
  const correct = transaction(() => {
    const run = ownedRun(owner, runId);
    const visit = db()
      .prepare("SELECT * FROM visits WHERE run_id = ? AND checkpoint_id = ?")
      .get(runId, checkpointId);
    // A repeated successful submission is idempotent, including after the final checkpoint.
    if (visit?.completed_at) return true;
    if (run.status !== "active")
      throw new GameError("Lượt chơi đã kết thúc. / This run has ended.", 409);
    requireAvailable(owner, runId, checkpointId);
    if (!visit)
      throw new GameError(
        "Nhận diện địa điểm trước khi trả lời. / Identify the checkpoint first.",
        409,
      );
    const checkpoint = getCheckpoints().find((c) => c.id === checkpointId)!;
    const success = answer === checkpoint.mission.correct;
    const at = new Date().toISOString();
    db()
      .prepare(
        "INSERT INTO attempts(run_id, checkpoint_id, at, answer, correct) VALUES(?, ?, ?, ?, ?)",
      )
      .run(runId, checkpointId, at, answer, success ? 1 : 0);
    if (success) {
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
