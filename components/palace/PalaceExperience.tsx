"use client";
import { useState } from "react";
import Image from "next/image";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  Clock3,
  Compass,
  Flag,
  History,
  LoaderCircle,
  LockKeyhole,
  MapPin,
  RotateCcw,
  ScanLine,
  Sparkles,
  Trophy,
  X,
  Zap,
} from "lucide-react";
import {
  getCheckpoints,
  checkpointIds,
  PALACE_XP,
  type CheckpointId,
} from "@/lib/palace/checkpoints";
import type { JourneyRun, RecognitionResult } from "@/lib/palace/types";
import { useLanguage } from "@/components/UI/LanguageProvider";
import JourneyHeader from "@/components/UI/JourneyHeader";
import GameDialog from "@/components/UI/GameDialog";
import CheckpointStory from "./CheckpointStory";
import PalaceMiniGame from "./PalaceMiniGame";
import type { ChallengeMove } from "@/lib/palace/challenges";
import Fireworks from "@/components/UI/Fireworks";
import PalaceMap from "./PalaceMap";
import PalaceRoomStudy from "./PalaceRoomStudy";
import PalaceCapture from "./PalaceCapture";
import type { PalaceGame } from "./usePalaceJourney";
import "./palace.css";

type Stage =
  | "brief"
  | "capture"
  | "minigame"
  | "story"
  | "quiz"
  | "success"
  | "visit"
  | "restart"
  | null;
function doneIds(run: JourneyRun | undefined) {
  return checkpointIds.filter((id) => run?.visits[id]?.completedAt);
}

export default function PalaceExperience({
  game,
  mode = "map",
  onJournal,
  onMap,
  sound = true,
}: {
  game: PalaceGame;
  mode?: "map" | "scan" | "journal";
  onJournal: () => void;
  onMap?: () => void;
  sound?: boolean;
}) {
  const { locale, t } = useLanguage();
  const [picked, setPicked] = useState<CheckpointId | null>(null);
  const [stage, setStage] = useState<Stage>(null);
  const [notice, setNotice] = useState("");
  const [recognition, setRecognition] = useState<RecognitionResult | null>(
    null,
  );
  const [choice, setChoice] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<boolean | null>(null);
  const [hint, setHint] = useState(false);
  const [quizQuestionId, setQuizQuestionId] = useState<string | null>(null);
  const [journalRunId, setJournalRunId] = useState("all");
  const [storyReward, setStoryReward] = useState<number | null>(null);
  const checkpoints = getCheckpoints(locale);
  const state = game.state;
  const currentRun =
    state?.runs.find((run) => run.id === state.activeRunId) || state?.runs[0];
  const completed = doneIds(currentRun);
  const nextId = checkpointIds.find((id) => !completed.includes(id));
  const selectedId = picked || nextId || "facade";
  const checkpoint = checkpoints.find((cp) => cp.id === selectedId)!;
  const journalRun = state?.runs.find((run) => run.id === journalRunId);
  const mapCompleted =
    mode === "journal"
      ? journalRunId === "all"
        ? state?.discovered || []
        : doneIds(journalRun)
      : completed;
  const actor = completed.at(-1) || "facade";
  const visit = currentRun?.visits[selectedId];
  const quiz = visit?.quiz || checkpoint.questions;
  const pendingQuestion = quiz.find(q => !visit?.attempts.some(a => a.correct && a.questionId === q.id));
  const question = quiz.find(q => q.id === quizQuestionId) || pendingQuestion || quiz[quiz.length - 1];
  const questionIndex = quiz.indexOf(question);
  const isDone = Boolean(visit?.completedAt);
  const index = checkpointIds.indexOf(selectedId);
  const unlocked =
    index === 0 ||
    checkpointIds.slice(0, index).every((id) => completed.includes(id));
  const localMessage = (message: string) => {
    const parts = message.split(" / ");
    return parts.length > 1 ? parts[locale === "vi" ? 0 : 1] : message;
  };
  const formatDate = (date: string) =>
    new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  function select(id: CheckpointId) {
    const position = checkpointIds.indexOf(id);
    if (
      mode !== "journal" &&
      checkpointIds
        .slice(0, position)
        .some((previous) => !completed.includes(previous))
    ) {
      setNotice(
        t(
          "Hoàn thành checkpoint trước để mở điểm này.",
          "Complete the previous checkpoint to unlock this one.",
        ),
      );
      return;
    }
    setPicked(id);
    setStoryReward(null);
    setRecognition(null);
    setNotice("");
    setChoice(null);
    setFeedback(null);
    setHint(false);
    setQuizQuestionId(null);
    setStage(
      mode === "journal" || currentRun?.visits[id]?.completedAt
        ? "visit"
        : "brief",
    );
  }
  async function begin() {
    if (!unlocked || game.busy) return;
    setPicked(selectedId);
    setStoryReward(null);
    let activeRun = currentRun;
    if (!state?.activeRunId) {
      const response = await game.start();
      if (!response) return;
      activeRun = response.state.runs.find(run => run.id === response.state.activeRunId);
    }
    setRecognition(null);
    const activeVisit = activeRun?.visits[selectedId];
    if (activeVisit?.recognizedAt && !activeVisit.completedAt) {
      if (!activeVisit.challenge) {
        const response = await game.startChallenge(activeRun!.id, selectedId);
        if (!response) return;
      }
      setStage("minigame");
    } else setStage("capture");
  }
  async function analyze(photo: File | CheckpointId) {
    if (!currentRun) return;
    const response = await game.recognize(currentRun.id, selectedId, photo);
    if (!response) return;
    setRecognition(response.recognition);
    if (response.recognition.status === "matched") setStage("minigame");
  }
  async function moveChallenge(move: ChallengeMove) {
    if (!currentRun || !visit?.challenge) return null;
    const response = await game.moveChallenge(currentRun.id, selectedId, visit.challenge.definition.version, move);
    if (response?.solved) { setStoryReward(state?.discovered.includes(selectedId) ? 0 : PALACE_XP); setStage("story"); }
    return response;
  }
  function finishStory() {
    setStage(null);
    setStoryReward(null);
    if (mode !== "journal" && completed.length === 5) onJournal();
    else if (mode !== "journal") { setPicked(nextId || selectedId); setFeedback(null); setChoice(null); }
  }
  async function submit() {
    if (!currentRun || choice === null || game.busy) return;
    const response = await game.answer(currentRun.id, selectedId, choice, question.id);
    if (response) setFeedback(response.correct);
  }
  async function replay() {
    const response = await game.start(true);
    if (response) {
      if (mode === "journal") onMap?.();
      setPicked("facade");
      setStage(null);
      setRecognition(null);
      setChoice(null);
      setFeedback(null);
      setNotice(
        t(
          "Lượt mới đã bắt đầu. Dấu ấn và lượt cũ vẫn được giữ.",
          "A new run has started. Your previous visits and discoveries are preserved.",
        ),
      );
    }
  }
  function close() {
    if (!game.busy) {
      setStage(null);
      setRecognition(null);
      setStoryReward(null);
    }
  }

  if (!state)
    return (
      <section
        className="palace-loading"
        role={game.error ? "alert" : "status"}
      >
        <Compass size={32} />
        <h2>{t("Đang mở sa bàn di sản…", "Opening your heritage atlas…")}</h2>
        {game.error ? (
          <>
            <p>{localMessage(game.error)}</p>
            <button className="palace-button" onClick={game.reload}>
              {t("Thử kết nối lại", "Reconnect")}
            </button>
          </>
        ) : (
          <LoaderCircle className="spin" size={20} />
        )}
      </section>
    );

  const records = state.runs
    .filter(
      (run) =>
        journalRunId === "all" || mode !== "journal" || run.id === journalRunId,
    )
    .flatMap((run) => {
      const entry = run.visits[selectedId];
      return entry ? [{ run, entry }] : [];
    });
  const allComplete = state.discovered.length === checkpointIds.length;
  return (
    <section
      className="palace-experience"
      aria-label={t("Hành trình Dinh Độc Lập", "Independence Palace journey")}
    >
      <JourneyHeader
        chapter={mode === "journal" ? "CULTURE HUNT / MY HERITAGE ATLAS" : "CHAPTER 01 / THE INDEPENDENCE PALACE"}
        edition="01"
        heading={mode === "journal" ? "h2" : "h1"}
        title={mode === "journal" ? t("Bản đồ những dấu ấn.", "An atlas of your discoveries.") : <>{t("Giải mã ", "Decoding ")}<em>{t("Dinh Độc Lập.", "the Palace.")}</em></>}
        description={mode === "journal" ? t("Mỗi điểm sáng là một câu chuyện bạn đã chạm tới.", "Every illuminated stop holds a story you discovered.") : t("Năm điểm dừng. Một chuyến đi từ tò mò đến khám phá.", "Five stops. One journey from curiosity to discovery.")}
      >
        <span>
          <Flag size={16} />
          <strong>
            {mode === "journal" ? state.discovered.length : completed.length}
            <small>/5</small>
          </strong>
          {t("đã khai mở", "uncovered")}
        </span>
        <span>
          <Zap size={16} />
          <strong>{state.xp}</strong>XP
        </span>
        <span>
          <History size={16} />
          <strong>{state.runs.length}</strong>
          {t("lượt chơi", "runs")}
        </span>
        <span className="palace-save-label">
          <span />
          {t(
            "Lưu trên máy chủ · Hồ sơ trình duyệt này",
            "Server saved · This browser profile",
          )}
        </span>
      </JourneyHeader>
      {game.error && (
        <div className="palace-alert" role="alert">
          <span>{localMessage(game.error)}</span>
          <button onClick={game.reload} disabled={game.busy}>
            {t("Thử lại", "Retry")}
          </button>
        </div>
      )}
      {notice && (
        <p className="palace-notice" role="status">
          {notice}
        </p>
      )}

      {mode === "journal" && (
        <div className="palace-journal-toolbar">
          <label htmlFor="palace-run">
            <History size={16} />
            {t("Xem lịch sử", "View history")}
          </label>
          <select
            id="palace-run"
            value={journalRunId}
            onChange={(event) => {
              setJournalRunId(event.target.value);
              setPicked(null);
            }}
          >
            <option value="all">{t("Tất cả dấu ấn", "All discoveries")}</option>
            {state.runs.map((run, i) => (
              <option key={run.id} value={run.id}>
                {t("Lượt", "Run")} {state.runs.length - i} ·{" "}
                {formatDate(run.startedAt)} ·{" "}
                {run.status === "completed"
                  ? t("Hoàn thành", "Completed")
                  : run.status === "active"
                    ? t("Đang chơi", "In progress")
                    : t("Đã lưu", "Saved")}
              </option>
            ))}
          </select>
        </div>
      )}

      <div
        className={`palace-play-layout ${mode === "journal" ? "palace-journal-layout" : ""}`}
      >
        <PalaceMap
          completed={mapCompleted}
          recognized={
            mode === "journal"
              ? []
              : checkpointIds.filter((id) => Boolean(currentRun?.visits[id]))
          }
          available={mode === "journal" ? undefined : nextId}
          selected={selectedId}
          actor={actor}
          paused={stage !== null}
          journal={mode === "journal"}
          onSelect={select}
        />
        {mode !== "journal" && (
          <aside className="palace-quest-panel">
            <div className="palace-quest-photo">
              <Image
                src={checkpoint.photo}
                alt={checkpoint.name}
                fill
                sizes="(max-width: 800px) 100vw, 320px"
                loading="eager"
              />
              <span>CHECKPOINT {String(index + 1).padStart(2, "0")} / 05</span>
            </div>
            <div className="palace-quest-copy">
              <span className="palace-overline">
                <MapPin size={12} />
                {checkpoint.floor}
              </span>
              <h3>{checkpoint.name}</h3>
              <p>{checkpoint.clue}</p>
              <div className="palace-quest-reward">
                <span>
                  <Zap size={14} />
                  {state.discovered.includes(selectedId)
                    ? t("XP đã ghi nhận", "XP already earned")
                    : `+${PALACE_XP} XP`}
                </span>
                <span>
                  <Clock3 size={13} />
                  {t("Mini game · 30–60 giây", "Mini game · 30–60 sec")}
                </span>
              </div>
              <button
                className="palace-button"
                disabled={game.busy || !unlocked}
                onClick={() => (isDone ? setStage("visit") : begin())}
              >
                {game.busy ? (
                  <LoaderCircle className="spin" size={17} />
                ) : isDone ? (
                  <BookOpen size={17} />
                ) : (
                  <ScanLine size={17} />
                )}
                {isDone
                  ? t("Xem dấu ấn", "View discovery")
                  : visit
                    ? t("Tiếp tục thử thách", "Continue challenge")
                    : t("Khám phá điểm này", "Explore this checkpoint")}
                <ArrowRight size={16} />
              </button>
              <button
                className="palace-text-button"
                onClick={() => {
                  setPicked(selectedId);
                  setStage("capture");
                  setRecognition(null);
                }}
                disabled={!currentRun || !unlocked || isDone || game.busy}
              >
                {t("Mở bộ ảnh tham chiếu", "Open reference photo kit")}
              </button>
            </div>
          </aside>
        )}
      </div>

      <div className="palace-legend">
        <span>
          <i className="legend-locked" />
          {t("Chưa mở", "Locked")}
        </span>
        <span>
          <i className="legend-available" />
          {t("Đang khám phá", "Available")}
        </span>
        <span>
          <i className="legend-done" />
          {t("Đã khai mở", "Completed")}
        </span>
        <span>
          {t(
            "Nhân vật thể hiện tiến độ trong game",
            "The explorer represents game progress",
          )}
        </span>
      </div>
      {mode === "scan" && (
        <div className="palace-scan-prompt">
          <ScanLine size={22} />
          <div>
            <strong>
              {t(
                "Bạn đã sẵn sàng nhận diện?",
                "Ready to identify a discovery?",
              )}
            </strong>
            <p>
              {t(
                "Chọn điểm đang mở trên sa bàn hoặc dùng nút Khám phá điểm này.",
                "Choose an available map checkpoint or use Explore this checkpoint.",
              )}
            </p>
          </div>
        </div>
      )}

      {mode !== "journal" ? (
        <>
          <div
            className="palace-route-list"
            aria-label={t("Danh sách checkpoint", "Checkpoint list")}
          >
            {checkpoints.map((cp, i) => {
              const done = completed.includes(cp.id),
                locked = checkpointIds
                  .slice(0, i)
                  .some((id) => !completed.includes(id));
              return (
                <button
                  key={cp.id}
                  onClick={() => select(cp.id)}
                  aria-disabled={locked}
                  className={`${done ? "route-done" : ""} ${cp.id === selectedId ? "route-selected" : ""}`}
                >
                  <span>
                    {done ? (
                      <Check size={17} />
                    ) : locked ? (
                      <LockKeyhole size={15} />
                    ) : (
                      String(i + 1).padStart(2, "0")
                    )}
                  </span>
                  <strong>{cp.name}</strong>
                  <small>
                    {done
                      ? t("Đã ghi nhận", "Recorded")
                      : locked
                        ? t("Chưa mở", "Locked")
                        : t("Đang mở", "Available")}
                  </small>
                </button>
              );
            })}
          </div>
          <div className="palace-bottom-actions">
            <p>
              <Sparkles size={16} />
              {t(
                "Hoàn thành 5 điểm để nhận huy hiệu Nhà thám hiểm Dinh.",
                "Complete all five stops to earn your Palace Explorer badge.",
              )}
            </p>
            {state.runs.length > 0 && (
              <button
                className="palace-text-button"
                onClick={() => setStage("restart")}
                disabled={game.busy}
              >
                <RotateCcw size={14} />
                {t("Bắt đầu lượt mới", "Start a new run")}
              </button>
            )}
          </div>
        </>
      ) : (
        <>
          {allComplete && (
            <div className="palace-completion-banner">
              <span className="palace-medal">
                <Trophy size={33} strokeWidth={1.3} />
              </span>
              <div>
                <span className="palace-overline">
                  HERITAGE EXPLORER / COMPLETE
                </span>
                <h3>{t("Nhà thám hiểm Dinh", "Palace Explorer")}</h3>
                <p>
                  {t(
                    "Năm dấu ấn đã kết nối. Bản đồ này là câu chuyện của bạn.",
                    "Five discoveries connected. This atlas tells your story.",
                  )}
                </p>
              </div>
              <Check size={25} />
            </div>
          )}
          <div className="palace-journal-heading">
            <h3>
              {t("Những nơi bạn đã chạm tới", "Places you have discovered")}
            </h3>
            <span>{mapCompleted.length}/5</span>
          </div>
          <div className="palace-journal-cards">
            {checkpoints.map((cp) => (
              <button
                key={cp.id}
                onClick={() => select(cp.id)}
                className={mapCompleted.includes(cp.id) ? "is-recorded" : ""}
              >
                <Image src={cp.photo} alt={cp.name} width={150} height={110} />
                <span>
                  <strong>{cp.name}</strong>
                  <small>
                    {mapCompleted.includes(cp.id)
                      ? t(
                          "Đã khai mở · Xem lượt ghé",
                          "Discovered · View visits",
                        )
                      : t("Câu chuyện còn chờ bạn", "A story waiting for you")}
                  </small>
                </span>
                {mapCompleted.includes(cp.id) ? (
                  <Check size={18} />
                ) : (
                  <LockKeyhole size={16} />
                )}
              </button>
            ))}
          </div>
          <div className="palace-journal-heading">
            <h3>{t("Nhật ký hành trình", "Journey log")}</h3>
            <History size={18} />
          </div>
          {state.runs.length ? (
            <div className="palace-run-list">
              {state.runs.map((run, i) => (
                <button
                  key={run.id}
                  onClick={() => setJournalRunId(run.id)}
                  aria-pressed={journalRunId === run.id}
                >
                  <span className="palace-run-icon">
                    {run.status === "completed" ? (
                      <Trophy size={20} />
                    ) : (
                      <Flag size={20} />
                    )}
                  </span>
                  <span>
                    <strong>
                      {t("Lượt khám phá", "Discovery run")}{" "}
                      {state.runs.length - i}
                    </strong>
                    <small>{formatDate(run.startedAt)}</small>
                  </span>
                  <span>
                    {doneIds(run).length}/5
                    <small>
                      {run.status === "completed"
                        ? t("Hoàn thành", "Completed")
                        : run.status === "active"
                          ? t("Đang chơi", "In progress")
                          : t("Đã lưu", "Saved")}
                    </small>
                  </span>
                  <ArrowUpRight size={18} />
                </button>
              ))}
            </div>
          ) : (
            <p className="palace-empty">
              {t(
                "Hành trình đầu tiên đang chờ. Mỗi checkpoint hoàn thành sẽ xuất hiện ở đây.",
                "Your first journey awaits. Completed checkpoints will appear here.",
              )}
            </p>
          )}
          <div className="palace-bottom-actions">
            <p>
              {t(
                "Lượt chơi được lưu riêng; XP chỉ nhận một lần cho mỗi checkpoint.",
                "Each run is saved separately. XP is awarded once per checkpoint.",
              )}
            </p>
            <button
              className="palace-text-button"
              onClick={() => setStage("restart")}
              disabled={game.busy}
            >
              <RotateCcw size={14} />
              {t("Chơi lượt mới", "Play a new run")}
            </button>
          </div>
        </>
      )}
      <p className="palace-credit">
        {t(
          "Ảnh tham chiếu: Di tích Dinh Độc Lập. Chế độ demo không xác thực có mặt tại địa điểm.",
          "Reference photos: Independence Palace. This demo does not verify physical attendance.",
        )}{" "}
        <a href={checkpoint.source} target="_blank" rel="noreferrer">
          {t("Xem nguồn", "View source")}
          <ArrowUpRight size={12} />
        </a>
      </p>

      {stage && (
        <GameDialog
          onClose={close}
          label={
            stage === "restart"
              ? t("Bắt đầu lượt mới", "Start a new run")
              : checkpoint.name
          }
          wide={stage === "capture" || stage === "story" || stage === "brief" || stage === "visit" || stage === "minigame"}
        >
          <div className="palace-modal">
            {game.error && (
              <p className="palace-alert" role="alert">
                {localMessage(game.error)}
              </p>
            )}
            {stage === "brief" && (
              <div className="palace-brief">
                <PalaceRoomStudy checkpoint={checkpoint} />
                <span className="palace-overline">
                  CHECKPOINT {index + 1} / 05
                </span>
                <h2>{checkpoint.name}</h2>
                <p>{checkpoint.clue}</p>
                <ul className="palace-room-features">{checkpoint.features.map(feature => <li key={feature}>{feature}</li>)}</ul>
                <div className="palace-brief-steps">
                  <span>
                    <ScanLine size={17} />
                    {t("Nhận diện", "Identify")}
                  </span>
                  <ArrowRight size={13} />
                  <span>
                    <Trophy size={17} />
                    {t("Mini game", "Mini game")}
                  </span>
                  <ArrowRight size={13} />
                  <span>
                    <BookOpen size={17} />
                    {t("Mở câu chuyện", "Unlock story")}
                  </span>
                </div>
                <button
                  className="palace-button"
                  onClick={begin}
                  disabled={game.busy}
                >
                  {game.busy ? (
                    <LoaderCircle className="spin" size={17} />
                  ) : (
                    <Compass size={17} />
                  )}
                  {t("Bắt đầu nhiệm vụ", "Start this mission")}
                </button>
              </div>
            )}
            {stage === "capture" && (
              <>
                <PalaceCapture
                  key={selectedId}
                  checkpoint={checkpoint}
                  busy={game.busy}
                  aiAvailable={state.aiAvailable}
                  onAnalyze={analyze}
                />
                {recognition && recognition.status !== "matched" && (
                  <div className="palace-recognition-result" role="status">
                    <X size={20} />
                    <div>
                      <strong>
                        {recognition.status === "mismatch"
                          ? t("Chưa đúng checkpoint", "A different checkpoint")
                          : recognition.status === "ambiguous"
                            ? t(
                                "Cần thêm một góc nhìn",
                                "Another angle would help",
                              )
                            : t("Chưa nhận diện được", "Not identified yet")}
                      </strong>
                      <p>{localMessage(recognition.reason)}</p>
                      {recognition.checkpointId && (
                        <span>
                          {t("Ảnh có thể thuộc: ", "Possible location: ")}
                          {
                            checkpoints.find(
                              (cp) => cp.id === recognition.checkpointId,
                            )?.name
                          }
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
            {stage === "minigame" && visit?.challenge && <>
              <p className="palace-recognition-success"><Check size={16} />{t("Đã nhận diện địa điểm", "Location identified")}<span>{visit.mode === "openai" ? "AI" : visit.mode === "sample" ? t("Ảnh mẫu", "Sample photo") : t("Ảnh tham chiếu", "Reference match")}</span></p>
              <PalaceMiniGame key={`${currentRun?.id}-${selectedId}`} session={visit.challenge} busy={game.busy} onMove={moveChallenge} />
            </>}
            {stage === "story" && <CheckpointStory
              key={`${selectedId}-${locale}`} checkpointId={selectedId}
              unlocked={isDone || state.discovered.includes(selectedId)} sound={sound}
              reviewing={mode === "journal"} onContinue={finishStory}
              reward={storyReward}
              bonusComplete={!pendingQuestion}
              onBonus={visit?.completedAt ? () => { setStage("quiz"); setChoice(null); setFeedback(null); setHint(false); setQuizQuestionId(pendingQuestion?.id || null); } : undefined}
            />}
            {stage === "quiz" && (
              <div className="palace-quiz">
                <span className="palace-medal">
                  <Sparkles size={28} />
                </span>
                <span className="palace-overline">
                  {isDone ? t("KHÁM PHÁ THÊM", "EXPLORE MORE") : t("THỬ THÁCH TRI THỨC", "KNOWLEDGE CHALLENGE")} · {t("CÂU", "QUESTION")} {questionIndex + 1}/{quiz.length}
                </span>
                <div className="palace-question-progress" aria-label={`${questionIndex + 1} / ${quiz.length}`}>
                  {quiz.map((q, i) => <span key={q.id} className={visit?.attempts.some(a => a.correct && a.questionId === q.id) ? "is-passed" : q.id === question.id ? "is-current" : ""}>{i + 1}</span>)}
                </div>
                <h2>{question.question[locale]}</h2>
                <p>
                  {t(
                    "Một chút kiến thức mở rộng từ ngân hàng câu hỏi. Dấu ấn của bạn đã được lưu sau mini game.",
                    "Optional questions from the question bank. Your discovery was saved after the mini game.",
                  )}
                </p>
                <div
                  className="palace-answer-list"
                  role="group"
                  aria-label={t("Chọn một đáp án", "Choose an answer")}
                >
                  {question.answers[locale].map((answer, i) => (
                    <button
                      key={answer}
                      className={`${choice === i ? "is-selected" : ""} ${feedback !== null && choice === i ? (feedback ? "is-correct" : "is-wrong") : ""}`}
                      aria-pressed={choice === i}
                      disabled={feedback !== null || game.busy}
                      onClick={() => setChoice(i)}
                    >
                      <span>{"ABCD"[i]}</span>
                      {answer}
                      {feedback !== null &&
                        choice === i &&
                        (feedback ? <Check size={18} /> : <X size={18} />)}
                    </button>
                  ))}
                </div>
                <div aria-live="polite">
                  {feedback !== null ? (
                    <p
                      className={`palace-quiz-feedback ${feedback ? "is-correct" : "is-wrong"}`}
                    >
                      <strong>
                        {feedback
                          ? t(
                              !pendingQuestion ? "Chính xác! Bạn đã giải trọn bộ câu hỏi." : "Chính xác! Tiếp tục giải mã câu tiếp theo.",
                              !pendingQuestion ? "Correct! All questions are complete." : "Correct! Continue to the next question.",
                            )
                          : t(
                              "Chưa đúng. Thử thêm một lần nhé!",
                              "Not quite. Give it another try!",
                            )}
                      </strong>
                      {feedback
                        ? question.explanation[locale]
                        : question.hint[locale]}
                    </p>
                  ) : hint ? (
                    <p className="palace-inline-notice">
                      {question.hint[locale]}
                    </p>
                  ) : null}
                </div>
                {feedback === true ? (
                  <button
                    className="palace-button"
                    onClick={() => {
                      if (!pendingQuestion) setStage("story");
                      else {
                        setQuizQuestionId(pendingQuestion?.id || null);
                        setChoice(null); setFeedback(null); setHint(false);
                      }
                    }}
                  >
                    {!pendingQuestion ? t("Trở lại câu chuyện", "Back to story") : t("Câu tiếp theo", "Next question")}
                    <ArrowRight size={17} />
                  </button>
                ) : feedback === false ? (
                  <button
                    className="palace-button"
                    onClick={() => {
                      setFeedback(null);
                      setChoice(null);
                    }}
                  >
                    <RotateCcw size={17} />
                    {t("Thử lại", "Try again")}
                  </button>
                ) : (
                  <>
                    <button
                      className="palace-button"
                      disabled={choice === null || game.busy}
                      onClick={submit}
                    >
                      {game.busy ? (
                        <LoaderCircle className="spin" size={17} />
                      ) : (
                        <Check size={17} />
                      )}
                      {t("Chốt đáp án", "Lock in answer")}
                    </button>
                    <button
                      className="palace-text-button"
                      onClick={() => setHint(!hint)}
                      aria-expanded={hint}
                    >
                      {t("Một chút gợi ý", "A little hint")}
                    </button>
                  </>
                )}
              </div>
            )}
            {stage === "success" && (
              <div className="palace-success">
                <Fireworks />
                <span className="palace-medal palace-medal-large">
                  <Trophy size={44} strokeWidth={1.2} />
                </span>
                <span className="palace-overline">
                  {completed.length === 5
                    ? "HERITAGE EXPLORER / COMPLETE"
                    : "A NEW STORY, A NEW DISCOVERY"}
                </span>
                <h2>
                  {completed.length === 5
                    ? t(
                        "Bạn đã nối trọn hành trình.",
                        "Your journey is complete.",
                      )
                    : t(
                        "Một dấu ấn vừa sáng lên.",
                        "A discovery comes to light.",
                      )}
                </h2>
                <p>
                  {checkpoint.name} · {completed.length}/5{" "}
                  {t("điểm đã khai mở", "stops uncovered")}
                </p>
                <strong className="palace-success-xp">
                  {state.xp} XP{" "}
                  <span>{t("thành tích đã lưu", "saved to your profile")}</span>
                </strong>
                <button
                  className="palace-button"
                  onClick={() => {
                    setStage(null);
                    if (completed.length === 5) onJournal();
                    else {
                      setPicked(nextId || "facade");
                      setFeedback(null);
                      setChoice(null);
                    }
                  }}
                >
                  {completed.length === 5
                    ? t("Xem bản đồ dấu ấn", "View my discovery atlas")
                    : t(
                        "Trở về bản đồ · Điểm tiếp theo",
                        "Back to map · Next checkpoint",
                      )}
                  <ArrowRight size={17} />
                </button>
              </div>
            )}
            {stage === "visit" && (
              <div className="palace-visit">
                <PalaceRoomStudy checkpoint={checkpoint} />
                <span className="palace-overline">
                  MY HERITAGE ATLAS / CHECKPOINT {index + 1}
                </span>
                <h2>{checkpoint.name}</h2>
                <p>{checkpoint.detail}</p>
                {records.length ? (
                  <div className="palace-visit-records">
                    {records.map(({ run, entry }) => (
                      <article key={run.id}>
                        <span>
                          <Check size={16} />
                          {entry.completedAt
                            ? t("Đã khai mở", "Completed")
                            : t(
                                "Đã nhận diện · Chưa hoàn thành",
                                "Identified · Not completed",
                              )}
                        </span>
                        <strong>
                          {formatDate(entry.completedAt || entry.recognizedAt)}
                        </strong>
                        <small>
                          {t("Nhận diện: ", "Identified: ")}
                          {formatDate(entry.recognizedAt)} ·{" "}
                          {entry.challenge ? `${entry.challenge.progress.moves} ${t("thao tác mini game", "mini game moves")} · ` : ""}{entry.attempts.length} {t("lần trả lời", "answers")}
                        </small>
                        <small>{new Set(entry.attempts.filter(a => a.correct).map(a => a.questionId)).size}/{entry.quiz.length} {entry.challenge ? t("câu mở rộng · tùy chọn", "bonus questions · optional") : t("câu đã giải", "questions solved")}</small>
                        <small>
                          {entry.mode === "openai"
                            ? t("Nhận diện bằng AI", "AI recognition")
                            : entry.mode === "sample"
                              ? t(
                                  "Chơi bằng ảnh mẫu",
                                  "Played with a sample photo",
                                )
                              : t(
                                  "Ảnh tải lên khớp tham chiếu",
                                  "Uploaded photo matched a reference",
                                )}
                        </small>
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className="palace-empty">
                    {t(
                      "Điểm này chưa có lượt ghé. Bắt đầu hành trình để ghi dấu ấn đầu tiên.",
                      "No visits here yet. Begin a journey to record your first discovery.",
                    )}
                  </p>
                )}
                <button
                  className="palace-button"
                  onClick={() => setStage("story")}
                >
                  <BookOpen size={17} />
                  {t(
                    "Đọc câu chuyện của điểm này",
                    "Read this checkpoint’s story",
                  )}
                </button>
              </div>
            )}
            {stage === "restart" && (
              <div className="palace-restart">
                <RotateCcw size={34} />
                <h2>{t("Một góc nhìn mới?", "A fresh perspective?")}</h2>
                <p>
                  {t(
                    "Lượt mới bắt đầu từ điểm đầu tiên. Các lượt chơi cũ và dấu ấn đã có vẫn được giữ; checkpoint đã nhận XP sẽ không cộng lại.",
                    "A new run begins at the first checkpoint. Earlier runs and discoveries stay saved; previously earned checkpoint XP is not awarded again.",
                  )}
                </p>
                <button
                  className="palace-button"
                  onClick={replay}
                  disabled={game.busy}
                >
                  {game.busy ? (
                    <LoaderCircle className="spin" size={17} />
                  ) : (
                    <Flag size={17} />
                  )}
                  {t("Bắt đầu lượt mới", "Start a new run")}
                </button>
                <button
                  className="palace-text-button"
                  onClick={close}
                  disabled={game.busy}
                >
                  {t("Giữ lượt hiện tại", "Keep my current run")}
                </button>
              </div>
            )}
          </div>
        </GameDialog>
      )}
    </section>
  );
}
