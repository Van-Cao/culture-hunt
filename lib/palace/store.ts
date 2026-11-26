import { randomUUID } from "node:crypto";
import { hcmusCheckpointIds } from "../hcmus/checkpoints";
import { all, one, execute, transaction } from "../database";
import { getCheckpointQuestions, publicQuestion, QUESTION_BANK_VERSION, type ScoredQuestion } from "./questions";
import { isCorrectQuestionAnswer, isValidQuestionAnswer } from "./question-response";
import type { QuestionAnswer } from "./question-types";
import { checkpointIds, PALACE_XP, type CheckpointId } from "./checkpoints";
import type { Attempt, JourneyRun, PalaceState, RecognitionMode, Visit } from "./types";

export class GameError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}
function visitQuestions(snapshot: unknown): ScoredQuestion[] {
  return typeof snapshot === "string" ? JSON.parse(snapshot) as ScoredQuestion[] : [];
}
async function ownedRun(owner: string, runId: string) {
  const run = await one("SELECT * FROM runs WHERE id = ? AND owner = ?", [runId, owner]);
  if (!run) throw new GameError("Không tìm thấy lượt chơi. / Run not found.", 404);
  return run;
}
async function loadState(owner: string): Promise<PalaceState> {
  const runs: JourneyRun[] = [];
  const [storedRuns, storedVisits, storedAttempts, storedAwards] = await Promise.all([
    all("SELECT * FROM runs WHERE owner = ? ORDER BY started_at DESC, rowid DESC", [owner]),
    all("SELECT v.* FROM visits v JOIN runs r ON r.id=v.run_id WHERE r.owner = ?", [owner]),
    all("SELECT a.* FROM attempts a JOIN runs r ON r.id=a.run_id WHERE r.owner = ? ORDER BY a.id", [owner]),
    all("SELECT checkpoint_id FROM awards WHERE owner = ? ORDER BY awarded_at, rowid", [owner]),
  ]);
  for (const row of storedRuns) {
    const visits: JourneyRun["visits"] = {};
    for (const v of storedVisits.filter(visit => visit.run_id === row.id)) {
      const id = v.checkpoint_id as CheckpointId;
      let quiz = visitQuestions(v.quiz_json);
      if (row.status === "active" && !v.completed_at && (!quiz.length || quiz.some(q => q.bankVersion !== QUESTION_BANK_VERSION))) {
        quiz = getCheckpointQuestions(id);
        await execute("UPDATE visits SET quiz_json = ? WHERE run_id = ? AND checkpoint_id = ?", [JSON.stringify(quiz), row.id, id]);
      }
      const attempts = storedAttempts.filter(attempt => attempt.run_id === row.id && attempt.checkpoint_id === id).map(a => ({
        at: String(a.at), answer: typeof a.answer_json === "string" ? JSON.parse(a.answer_json) as QuestionAnswer : Number(a.answer),
        correct: Boolean(a.correct), questionId: a.question_id ? String(a.question_id) : `${id}-legacy-1`,
      }) satisfies Attempt);
      visits[id] = {
        checkpointId: id, recognizedAt: String(v.recognized_at), mode: v.mode as RecognitionMode,
        completedAt: v.completed_at ? String(v.completed_at) : null, attempts, quiz: quiz.map(publicQuestion),
        ...(v.completed_at && typeof v.challenge_json === "string" ? { legacyGameMoves: Number(JSON.parse(v.challenge_json).progress?.moves) || 0 } : {}),
      } satisfies Visit;
    }
    runs.push({ id: String(row.id), startedAt: String(row.started_at), completedAt: row.completed_at ? String(row.completed_at) : null, status: row.status as JourneyRun["status"], visits });
  }
  const discovered = storedAwards.map(row => row.checkpoint_id as CheckpointId);
  return { runs, activeRunId: runs.find(r => r.status === "active")?.id || null, discovered, xp: discovered.length * PALACE_XP, aiAvailable: Boolean(process.env.OPENAI_API_KEY) };
}
export async function readState(owner: string) { return transaction(owner, () => loadState(owner)); }
export async function startRun(owner: string, replay = false) {
  return transaction(owner, async () => {
    const active = await one("SELECT id FROM runs WHERE owner = ? AND status = 'active'", [owner]);
    if (!active || replay) {
      if (active) await execute("UPDATE runs SET status = 'abandoned' WHERE id = ?", [active.id]);
      await execute("INSERT INTO runs(id, owner, started_at, status) VALUES(?, ?, ?, 'active')", [randomUUID(), owner, new Date().toISOString()]);
    }
    return loadState(owner);
  });
}
export async function requireAvailable(owner: string, runId: string, checkpointId: CheckpointId) {
  const run = await ownedRun(owner, runId);
  if (run.status !== "active") throw new GameError("Lượt chơi đã kết thúc. / This run has ended.", 409);
  for (const id of checkpointIds.slice(0, checkpointIds.indexOf(checkpointId))) {
    if (!await one("SELECT completed_at FROM visits WHERE run_id = ? AND checkpoint_id = ? AND completed_at IS NOT NULL", [runId, id]))
      throw new GameError("Hoàn thành điểm trước để mở điểm này. / Complete the previous checkpoint first.", 409);
  }
}
export async function recordRecognition(owner: string, runId: string, checkpointId: CheckpointId, mode: RecognitionMode, result: string, candidate: CheckpointId | null) {
  return transaction(owner, async () => {
    await requireAvailable(owner, runId, checkpointId);
    const at = new Date().toISOString();
    await execute("INSERT INTO recognitions(run_id, checkpoint_id, at, mode, result, candidate) VALUES(?, ?, ?, ?, ?, ?)", [runId, checkpointId, at, mode, result, candidate]);
    if (result === "matched" && candidate === checkpointId)
      await execute("INSERT OR IGNORE INTO visits(run_id, checkpoint_id, recognized_at, mode, quiz_json) VALUES(?, ?, ?, ?, ?)", [runId, checkpointId, at, mode, JSON.stringify(getCheckpointQuestions(checkpointId))]);
    return loadState(owner);
  });
}
export async function answerCheckpoint(owner: string, runId: string, checkpointId: CheckpointId, answer: QuestionAnswer, questionId?: string) {
  return transaction(owner, async () => {
    const run = await ownedRun(owner, runId);
    const visit = await one("SELECT * FROM visits WHERE run_id = ? AND checkpoint_id = ?", [runId, checkpointId]);
    if (!visit) throw new GameError("Nhận diện địa điểm trước khi trả lời. / Identify the checkpoint first.", 409);
    const quiz = visitQuestions(visit.quiz_json), question = quiz.find(q => q.id === questionId);
    if (!question || !isValidQuestionAnswer(question, answer)) throw new GameError("Câu hỏi không hợp lệ. / Invalid question.", 409);
    if (question.bankVersion !== QUESTION_BANK_VERSION) throw new GameError("Bộ câu hỏi cũ đã ngừng sử dụng. Bắt đầu lượt mới. / The old question bank has been retired. Start a new run.", 409);
    const passed = new Set((await all("SELECT question_id FROM attempts WHERE run_id = ? AND checkpoint_id = ? AND correct = 1", [runId, checkpointId])).map(a => String(a.question_id)));
    if (passed.has(question.id)) return { correct: true, state: await loadState(owner) };
    if (run.status !== "active" || visit.completed_at) throw new GameError("Lượt chơi đã kết thúc. / This run has ended.", 409);
    await requireAvailable(owner, runId, checkpointId);
    if (quiz.find(q => !passed.has(q.id))?.id !== question.id) throw new GameError("Hoàn thành câu trước để tiếp tục. / Complete the previous question first.", 409);
    const correct = isCorrectQuestionAnswer(question, answer), at = new Date().toISOString();
    await execute("INSERT INTO attempts(run_id, checkpoint_id, at, answer, answer_json, correct, question_id) VALUES(?, ?, ?, ?, ?, ?, ?)", [runId, checkpointId, at, typeof answer === "number" ? answer : -1, JSON.stringify(answer), correct ? 1 : 0, question.id]);
    if (correct) passed.add(question.id);
    if (quiz.every(q => passed.has(q.id))) {
      await execute("UPDATE visits SET completed_at = ? WHERE run_id = ? AND checkpoint_id = ?", [at, runId, checkpointId]);
      await execute("INSERT OR IGNORE INTO awards(owner, checkpoint_id, awarded_at) VALUES(?, ?, ?)", [owner, checkpointId, at]);
      const count = await one("SELECT COUNT(*) AS n FROM visits WHERE run_id = ? AND completed_at IS NOT NULL", [runId]);
      if (Number(count!.n) === checkpointIds.length) await execute("UPDATE runs SET status = 'completed', completed_at = ? WHERE id = ?", [at, runId]);
    }
    return { correct, state: await loadState(owner) };
  });
}

export type ExplorerProgress = { hcmus: number; saved: ("palace" | "hcmus")[]; bookmarks: string[] };
type LegacyProgress = Omit<ExplorerProgress, "bookmarks"> & { bookmarks?: string[] };
const bookmarkKeys = new Set([...checkpointIds.map(id => `palace:${id}`), ...hcmusCheckpointIds.map(id => `hcmus:${id}`)]);
async function loadExplorer(owner: string): Promise<ExplorerProgress> {
  const row = await one("SELECT * FROM explorer_progress WHERE owner = ?", [owner]);
  return row ? { hcmus: Number(row.hcmus), saved: JSON.parse(String(row.saved_json)), bookmarks: JSON.parse(String(row.bookmarks_json || "[]")) } : { hcmus: 0, saved: [], bookmarks: [] };
}
async function putExplorer(owner: string, progress: ExplorerProgress) {
  await execute("INSERT INTO explorer_progress(owner,hcmus,saved_json,bookmarks_json,updated_at) VALUES(?,?,?,?,?) ON CONFLICT(owner) DO UPDATE SET hcmus=excluded.hcmus,saved_json=excluded.saved_json,bookmarks_json=excluded.bookmarks_json,updated_at=excluded.updated_at", [owner, progress.hcmus, JSON.stringify(progress.saved), JSON.stringify(progress.bookmarks), new Date().toISOString()]);
  return progress;
}
export async function readExplorer(owner: string) { return transaction(owner, () => loadExplorer(owner)); }
export async function updateExplorer(owner: string, change: { favorite?: "palace" | "hcmus"; bookmark?: string; saved?: boolean; campusIndex?: number; campusAnswer?: number; legacy?: LegacyProgress }) {
  return transaction(owner, async () => {
    const current = await loadExplorer(owner);
    if (change.legacy && !owner.startsWith("user:")) {
      current.hcmus = Math.max(current.hcmus, Math.min(4, Math.max(0, Math.trunc(change.legacy.hcmus || 0))));
      current.saved = [...new Set([...current.saved, ...change.legacy.saved.filter(id => id === "palace" || id === "hcmus")])];
      current.bookmarks = [...new Set([...current.bookmarks, ...(change.legacy.bookmarks || []).filter(id => bookmarkKeys.has(id))])];
    }
    if (change.favorite) current.saved = change.saved ? [...new Set([...current.saved, change.favorite])] : current.saved.filter(id => id !== change.favorite);
    if (change.bookmark !== undefined) {
      if (!bookmarkKeys.has(change.bookmark)) throw new GameError("Câu chuyện không hợp lệ. / Invalid story.");
      current.bookmarks = change.saved ? [...new Set([...current.bookmarks, change.bookmark])] : current.bookmarks.filter(id => id !== change.bookmark);
    }
    if (change.campusIndex !== undefined) {
      // The campus quiz is graded here as well; a client cannot submit an XP total.
      const { getPlaces } = await import("../../components/UI/game-data");
      const missions = getPlaces("vi").find(place => place.id === "hcmus")!.missions;
      const index = change.campusIndex;
      if (!Number.isInteger(index) || index < 0 || index >= missions.length || change.campusAnswer !== missions[index].correct)
        throw new GameError("Đáp án chưa đúng. / Incorrect answer.", 409);
      if (index > current.hcmus) throw new GameError("Hoàn thành điểm trước. / Complete the previous checkpoint.", 409);
      if (index === current.hcmus) current.hcmus++;
    }
    return putExplorer(owner, current);
  });
}
export async function saveProfile(id: string, name: string) {
  const displayName = name.trim().slice(0, 80) || "Nhà thám hiểm";
  await execute("INSERT INTO profiles(id,display_name,updated_at) VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET display_name=excluded.display_name,updated_at=excluded.updated_at", [id, displayName, new Date().toISOString()]);
}
export async function hasGuestProgress(owner: string) {
  return Boolean(await one("SELECT id FROM runs WHERE owner = ? UNION ALL SELECT owner AS id FROM explorer_progress WHERE owner = ? LIMIT 1", [owner, owner]));
}
export async function claimGuest(guest: string, user: string) {
  if (guest === user || guest.startsWith("user:")) return;
  // Lock both profiles in a stable order. Preserve all runs and choose the further active run.
  return transaction([guest, user], async () => {
    const guestState = await loadState(guest), userState = await loadState(user);
    const activeGuest = guestState.runs.find(run => run.id === guestState.activeRunId);
    const activeUser = userState.runs.find(run => run.id === userState.activeRunId);
    const score = (run?: JourneyRun) => run ? Object.values(run.visits).reduce((total, visit) => total + (visit.completedAt ? 1000 : 0) + visit.attempts.filter(a => a.correct).length, 0) : -1;
    if (activeGuest && activeUser) {
      const archive = score(activeGuest) > score(activeUser) ? activeUser : activeGuest;
      await execute("UPDATE runs SET status = 'abandoned' WHERE id = ?", [archive.id]);
    }
    await execute("UPDATE runs SET owner = ? WHERE owner = ?", [user, guest]);
    await execute("INSERT OR IGNORE INTO awards(owner,checkpoint_id,awarded_at) SELECT ?,checkpoint_id,awarded_at FROM awards WHERE owner = ?", [user, guest]);
    await execute("DELETE FROM awards WHERE owner = ?", [guest]);
    const before = await loadExplorer(user), incoming = await loadExplorer(guest);
    await putExplorer(user, { hcmus: Math.max(before.hcmus, incoming.hcmus), saved: [...new Set([...before.saved, ...incoming.saved])], bookmarks: [...new Set([...before.bookmarks, ...incoming.bookmarks])] });
    await execute("DELETE FROM explorer_progress WHERE owner = ?", [guest]);
  });
}
