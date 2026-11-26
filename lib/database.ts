import { AsyncLocalStorage } from "node:async_hooks";
import { DatabaseSync, type SQLInputValue } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import postgres from "postgres";

export type DbRow = Record<string, string | number | bigint | null>;
type Executor = { query: (text: string, values?: SQLInputValue[]) => Promise<DbRow[]> };
const scope = new AsyncLocalStorage<Executor>();
let sqlite: DatabaseSync | undefined;
let pool: ReturnType<typeof postgres> | undefined;
let sqliteQueue = Promise.resolve();

export function usesPostgres() {
  if (process.env.VERCEL && (!process.env.DATABASE_URL || process.env.CULTURE_HUNT_STORAGE === "sqlite")) throw new Error("Vercel requires the PostgreSQL backend");
  return Boolean(process.env.DATABASE_URL) && process.env.CULTURE_HUNT_STORAGE !== "sqlite";
}
export function postgresPool(url = process.env.DATABASE_URL) {
  if (!url) throw new Error("DATABASE_URL is missing");
  if (url !== process.env.DATABASE_URL) return postgres(url, { prepare: false, max: 1, connect_timeout: 10, ssl: "require" });
  return pool ||= postgres(url, { prepare: false, max: 4, idle_timeout: 20, connect_timeout: 10, ssl: "require" });
}

const tables = ["runs", "visits", "attempts", "awards", "recognitions", "game_attempts", "profiles", "explorer_progress"];
export function postgresQuery(text: string) {
  let index = 0;
  const ignored = /INSERT OR IGNORE/i.test(text);
  let query = text.replace(/INSERT OR IGNORE/gi, "INSERT").replace(/\?/g, () => `$${++index}`)
    .replace(/\browid\b/g, "_order");
  for (const table of tables) query = query.replace(new RegExp(`\\b${table}\\b`, "g"), `culture_hunt.${table}`);
  if (ignored) query += " ON CONFLICT DO NOTHING";
  return query;
}

function sqliteDatabase() {
  if (sqlite) return sqlite;
  const directory = process.env.CULTURE_HUNT_DATA_DIR || join(process.cwd(), ".culture-hunt");
  mkdirSync(directory, { recursive: true });
  sqlite = new DatabaseSync(join(directory, "palace.sqlite"));
  sqlite.exec(`
    PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;
    CREATE TABLE IF NOT EXISTS runs(id TEXT PRIMARY KEY, owner TEXT NOT NULL, started_at TEXT NOT NULL, completed_at TEXT, status TEXT NOT NULL);
    CREATE UNIQUE INDEX IF NOT EXISTS one_active_run ON runs(owner) WHERE status='active';
    CREATE TABLE IF NOT EXISTS visits(run_id TEXT NOT NULL REFERENCES runs(id), checkpoint_id TEXT NOT NULL, recognized_at TEXT NOT NULL, mode TEXT NOT NULL, completed_at TEXT, PRIMARY KEY(run_id,checkpoint_id));
    CREATE TABLE IF NOT EXISTS attempts(id INTEGER PRIMARY KEY, run_id TEXT NOT NULL REFERENCES runs(id), checkpoint_id TEXT NOT NULL, at TEXT NOT NULL, answer INTEGER NOT NULL, correct INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS awards(owner TEXT NOT NULL, checkpoint_id TEXT NOT NULL, awarded_at TEXT NOT NULL, PRIMARY KEY(owner,checkpoint_id));
    CREATE TABLE IF NOT EXISTS recognitions(id INTEGER PRIMARY KEY, run_id TEXT NOT NULL REFERENCES runs(id), checkpoint_id TEXT NOT NULL, at TEXT NOT NULL, mode TEXT NOT NULL, result TEXT NOT NULL, candidate TEXT);
    CREATE TABLE IF NOT EXISTS game_attempts(id INTEGER PRIMARY KEY, run_id TEXT NOT NULL REFERENCES runs(id), checkpoint_id TEXT NOT NULL, at TEXT NOT NULL, move_json TEXT NOT NULL, accepted INTEGER NOT NULL, solved INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS profiles(id TEXT PRIMARY KEY, display_name TEXT NOT NULL, updated_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS explorer_progress(owner TEXT PRIMARY KEY, hcmus INTEGER NOT NULL DEFAULT 0, saved_json TEXT NOT NULL DEFAULT '[]', updated_at TEXT NOT NULL);
  `);
  for (const [table, column] of [["visits", "quiz_json"], ["visits", "challenge_json"], ["attempts", "question_id"], ["attempts", "answer_json"], ["explorer_progress", "bookmarks_json"]]) {
    if (!sqlite.prepare(`PRAGMA table_info(${table})`).all().some(row => row.name === column)) sqlite.exec(`ALTER TABLE ${table} ADD COLUMN ${column} TEXT`);
  }
  return sqlite;
}

const localExecutor: Executor = {
  async query(text, values = []) {
    const statement = sqliteDatabase().prepare(text);
    return statement.columns().length ? statement.all(...values) as DbRow[] : (statement.run(...values), []);
  },
};
function remoteExecutor(sql: ReturnType<typeof postgres> | postgres.TransactionSql): Executor {
  return { async query(text, values = []) { return await sql.unsafe(postgresQuery(text), values as never[]) as unknown as DbRow[]; } };
}
export async function all(text: string, values: SQLInputValue[] = []) {
  const executor = scope.getStore() || (usesPostgres() ? remoteExecutor(postgresPool()) : localExecutor);
  return executor.query(text, values);
}
export async function one(text: string, values: SQLInputValue[] = []) { return (await all(text, values))[0]; }
export async function execute(text: string, values: SQLInputValue[] = []) { await all(text, values); }

// Every write to a player's journey shares a transaction lock, across Vercel instances too.
export async function transaction<T>(owners: string | string[], work: () => Promise<T>): Promise<T> {
  if (scope.getStore()) return work();
  if (usesPostgres()) {
    return postgresPool().begin(async sql => {
      for (const owner of [...new Set(Array.isArray(owners) ? owners : [owners])].sort()) await sql`SELECT pg_advisory_xact_lock(hashtextextended(${owner}, 0))`;
      return scope.run(remoteExecutor(sql), work);
    }) as Promise<T>;
  }
  const previous = sqliteQueue;
  let unlock!: () => void;
  sqliteQueue = new Promise<void>(resolve => { unlock = resolve; });
  await previous;
  const database = sqliteDatabase();
  database.exec("BEGIN IMMEDIATE");
  try { const value = await scope.run(localExecutor, work); database.exec("COMMIT"); return value; }
  catch (error) { database.exec("ROLLBACK"); throw error; }
  finally { unlock(); }
}

export async function closeDatabase() { if (pool) { await pool.end({ timeout: 3 }); pool = undefined; } }
