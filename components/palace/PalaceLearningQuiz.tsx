"use client";

import { useRef, useState } from "react";
import { ArrowRight, BookOpen, Check, ChevronLeft, Lightbulb, LoaderCircle, RotateCcw, ScanLine, Sparkles } from "lucide-react";
import { useLanguage } from "@/components/UI/LanguageProvider";
import type { CheckpointId } from "@/lib/palace/checkpoints";
import type { Visit } from "@/lib/palace/types";
import type { PalaceQuestion, QuestionAnswer } from "@/lib/palace/question-types";
import { isValidQuestionAnswer } from "@/lib/palace/question-response";
import { learningChapters } from "@/lib/palace/learning-content";
import PalaceQuestionInput from "./PalaceQuestionInput";
import LearningPhoto from "./LearningPhoto";
import "./learning.css";

function SignalReveal() {
  const { t } = useLanguage();
  return <div className="learning-signal" aria-label={t("Chuỗi thông tin minh họa", "Illustrative information flow")}>
    {[t("Báo cáo đến", "Report arrives"), t("Tiếp nhận, chuyển tin", "Receive and relay"), t("Xem xét tình hình", "Review situation"), t("Truyền chỉ đạo", "Relay instructions")].map((step, i) => <div key={step} style={{ animationDelay: `${i * 230}ms` }}><span>{i + 1}</span><strong>{step}</strong>{i < 3 && <ArrowRight size={18} />}</div>)}
    <small>{t("Minh họa chức năng · Không phải mặt bằng hoặc tuyến dây thực tế", "Functional illustration · Not a floor plan or actual wiring")}</small>
  </div>;
}

export default function PalaceLearningQuiz({ checkpointId, checkpointName, checkpointNumber, quiz, visit, busy, onAnswer, onStory }: {
  checkpointId: CheckpointId; checkpointName: string; checkpointNumber: number;
  quiz: PalaceQuestion[]; visit?: Visit; busy: boolean;
  onAnswer: (answer: QuestionAnswer, questionId: string) => Promise<boolean | null>;
  onStory: () => void;
}) {
  const { locale, t, setLocale } = useLanguage();
  const passed = new Set(visit?.attempts.filter(a => a.correct).map(a => a.questionId));
  const pending = quiz.find(q => !passed.has(q.id));
  const [activeId, setActiveId] = useState<string | null>(null);
  const [choice, setChoice] = useState<QuestionAnswer | null>(null);
  const [feedback, setFeedback] = useState<boolean | null>(null);
  const [hint, setHint] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null);
  const [past, setPast] = useState(true);
  const heading = useRef<HTMLHeadingElement>(null);
  const top = useRef<HTMLElement>(null);
  const q = quiz.find(item => item.id === activeId) || pending || quiz[quiz.length - 1];
  const index = quiz.indexOf(q);
  const scene = q.learning;
  const answered = passed.has(q.id) || feedback === true;
  const chapter = learningChapters[checkpointId];
  const compared = scene?.reveal?.kind === "compare" && answered;
  const asset = compared ? past ? "cabinet-archive" : "cabinet" : selectedAsset || scene?.asset || checkpointId;
  const caption = compared ? { vi: past ? "Ảnh tư liệu Phòng Nội các · không gán cho một ngày họp cụ thể." : "Phòng Nội các hiện nay · hai ảnh có góc chụp khác nhau.", en: past ? "Cabinet Room archive · not attributed to a specific meeting date." : "The Cabinet Room today · the photographs have different viewpoints." } : scene?.cards?.find(c => c.asset === selectedAsset)?.title || scene?.caption || { vi: checkpointName, en: checkpointName };
  async function submit() {
    if (choice === null || busy) return;
    // Freeze the displayed task while the server marks it passed and advances pending.
    setActiveId(q.id);
    const result = await onAnswer(choice, q.id);
    if (result !== null) { setFeedback(result); if (result) setSelectedAsset(null); }
  }
  function advance() {
    if (!pending) { onStory(); return; }
    setActiveId(pending.id); setChoice(null); setFeedback(null); setHint(false); setSelectedAsset(null); setPast(true);
    top.current?.scrollIntoView({ block: "start", behavior: "instant" });
    requestAnimationFrame(() => heading.current?.focus({ preventScroll: true }));
  }
  return <section ref={top} className="palace-learning" data-question-id={q.id} data-checkpoint={checkpointId} aria-label={t("Nhiệm vụ khám phá lịch sử", "Historical discovery tasks")}>
    <header className="learning-header"><span className="learning-chapter-number">{String(checkpointNumber).padStart(2, "0")}</span><div><small>CULTURE HUNT / {t("HỒ SƠ KHÁM PHÁ", "DISCOVERY FILE")}</small><strong>{checkpointName}</strong></div><div className="learning-language" role="group" aria-label={t("Ngôn ngữ nhiệm vụ", "Task language")}><button aria-pressed={locale === "vi"} onClick={() => setLocale("vi")}>VI</button><button aria-pressed={locale === "en"} onClick={() => setLocale("en")}>EN</button></div></header>
    <div className="learning-route"><span><ScanLine size={13} />{t("Đã nhận diện", "Identified")}</span><ArrowRight size={12} /><strong>{t("Khám phá", "Discover")} {index + 1}/{quiz.length}</strong><ArrowRight size={12} /><span><BookOpen size={13} />{t("Câu chuyện", "Story")}</span></div>
    <div className="learning-layout">
      <aside className="learning-evidence" aria-label={t("Ảnh và tư liệu để trả lời", "Photographs and records for this task")}>
        <div className="learning-evidence-heading"><span>{t("QUAN SÁT & LẦN THEO DẤU VẾT", "OBSERVE & FOLLOW THE TRACES")}</span><span>{String(index + 1).padStart(2, "0")} / {String(quiz.length).padStart(2, "0")}</span></div>
        {answered && scene?.reveal && <div className="learning-reveal" role="status"><span><Sparkles size={15} />{t("MỘT CHI TIẾT VỪA ĐƯỢC MỞ", "A DETAIL REVEALED")}</span><h3>{scene.reveal.title[locale]}</h3><p>{scene.reveal.text[locale]}</p>{scene.reveal.kind === "signal" && <SignalReveal />}</div>}
        {!(answered && scene?.reveal?.kind === "signal") && <LearningPhoto key={`${q.id}-${asset}`} asset={asset} caption={caption} crop={asset === scene?.asset && !compared ? scene?.crop : undefined} reveal={scene?.reveal} revealed={answered && !compared} guides={!answered && (scene?.reveal?.kind === "tam" || scene?.reveal?.kind === "painting")} />}
        {selectedAsset && !answered && <button className="learning-back-photo" onClick={() => setSelectedAsset(null)}><ChevronLeft size={15} />{t("Về ảnh chính", "Back to main image")}</button>}
        {compared && <div className="learning-comparison" role="group" aria-label={t("Đối chiếu ảnh qua thời gian", "Compare the photographs")}><button aria-pressed={past} onClick={() => setPast(true)}>{t("Ngày ấy", "Then")}</button><button aria-pressed={!past} onClick={() => setPast(false)}>{t("Hôm nay", "Now")}</button></div>}
        {scene?.cards && <details className="learning-records-wrap" open={!answered && scene.cards.length <= 3}><summary>{t("Tư liệu cho nhiệm vụ", "Task records")}</summary><div className="learning-records">{scene.cards.map((card, i) => <article key={i}><span className="learning-record-index">{String(i + 1).padStart(2, "0")}</span><div><strong>{card.title[locale]}</strong><p>{card.text[locale]}</p>{card.asset && <button onClick={() => setSelectedAsset(card.asset!)} disabled={answered}>{t("Xem ảnh tư liệu", "View record image")}<ArrowRight size={12} /></button>}</div></article>)}</div></details>}
      </aside>
      <div className="learning-task">
        <div className="learning-task-progress" aria-label={t("Tiến độ nhiệm vụ", "Task progress")}>{quiz.map((item, i) => <span key={item.id} className={passed.has(item.id) ? "is-passed" : item.id === q.id ? "is-current" : ""} aria-current={item.id === q.id ? "step" : undefined}>{passed.has(item.id) ? <Check size={14} /> : i + 1}</span>)}</div>
        <p className="learning-kicker">{t("NHIỆM VỤ", "TASK")} {index + 1} / {quiz.length}</p>
        <h2 ref={heading} tabIndex={-1}>{scene?.title[locale] || chapter.title[locale]}</h2>
        <p className="learning-context">{scene?.context[locale] || chapter.intro[locale]}</p>
        <h3 className="learning-question">{q.question[locale]}</h3>
        <PalaceQuestionInput question={q} value={choice} onChange={setChoice} disabled={answered || feedback !== null || busy} feedback={feedback} />
        <div className="learning-feedback" aria-live="polite">{answered ? <div className="is-correct"><Check size={20} /><div><strong>{t("Bạn đã nối được manh mối", "You connected the clues")}</strong><p>{q.explanation[locale]}</p></div></div> : feedback === false ? <div className="is-wrong"><Lightbulb size={20} /><div><strong>{t("Xem lại một chi tiết nhé", "Take another look")}</strong><p>{q.hint[locale]}</p></div></div> : hint ? <div className="is-hint"><Lightbulb size={20} /><p>{q.hint[locale]}</p></div> : null}</div>
        <footer className="learning-task-actions">{answered ? <button className="palace-button" onClick={advance}>{pending ? t("Nhiệm vụ tiếp theo", "Next task") : t("Mở câu chuyện & audio", "Unlock story & audio")}<ArrowRight size={18} /></button> : feedback === false ? <button className="palace-button" onClick={() => { setFeedback(null); if (!Array.isArray(choice)) setChoice(null); }}><RotateCcw size={17} />{t("Thử lại với manh mối", "Try again with the clue")}</button> : <><button className="palace-button" onClick={() => void submit()} disabled={busy || !isValidQuestionAnswer(q, choice)}>{busy ? <LoaderCircle size={18} className="spin" /> : <Check size={18} />}{t("Xác nhận đáp án", "Confirm answer")}</button><button className="learning-hint" onClick={() => setHint(!hint)} aria-expanded={hint}><Lightbulb size={16} />{t("Gợi ý quan sát", "Observation hint")}</button></>}
          <small>{t("Tiến độ tự lưu · Có thể xem lại tư liệu khi trả lời", "Progress is saved · Refer to the records while answering")}</small>
        </footer>
      </div>
    </div>
  </section>;
}
