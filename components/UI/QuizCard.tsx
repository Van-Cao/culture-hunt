"use client";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Check,
  Lightbulb,
  RotateCcw,
  Sparkles,
  X,
  Zap,
} from "lucide-react";
import type { Mission } from "./game-data";
import Fireworks from "./Fireworks";
import { useLanguage } from "./LanguageProvider";

export default function QuizCard({
  mission,
  onComplete,
  onContinue,
  final,
}: {
  mission: Mission;
  onComplete: () => void;
  onContinue: () => void;
  final: boolean;
}) {
  const { t } = useLanguage();
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [hint, setHint] = useState(false);
  const correct = selected === mission.correct;
  function submit() {
    if (selected === null || submitted) return;
    setSubmitted(true);
    if (correct) onComplete();
  }
  return (
    <div className="quiz-content">
      {submitted && correct && <Fireworks />}
      <div
        className={`dialog-emblem ${submitted && correct ? "is-correct" : ""}`}
      >
        <Sparkles size={25} />
      </div>
      <div className="eyebrow accent">
        {t("THỬ THÁCH TRI THỨC", "KNOWLEDGE CHALLENGE")}
      </div>
      <div className="quiz-reward">
        <Zap size={14} fill="currentColor" /> +150 XP{" "}
        <span>{t("khi trả lời đúng", "for a correct answer")}</span>
      </div>
      <h2>{mission.question}</h2>
      <p className="muted">
        {t(
          "Mỗi đáp án là một bước gần hơn với câu chuyện.",
          "Every answer brings you closer to the story.",
        )}
      </p>
      <div
        className="quiz-answers"
        role="group"
        aria-label={t("Chọn một đáp án", "Choose an answer")}
      >
        {mission.answers.map((answer, index) => {
          const state =
            submitted && index === selected
              ? correct
                ? "answer-correct"
                : "answer-wrong"
              : selected === index
                ? "answer-selected"
                : "";
          return (
            <motion.button
              key={answer}
              whileHover={!submitted ? { x: 3 } : undefined}
              animate={
                submitted && !correct && index === selected
                  ? { x: [0, -5, 5, -5, 5, 0] }
                  : { x: 0 }
              }
              className={`quiz-answer ${state}`}
              aria-pressed={selected === index}
              disabled={submitted}
              onClick={() => setSelected(index)}
            >
              <span className="answer-letter">{"ABCD"[index]}</span>
              <span>{answer}</span>
              {submitted && selected === index ? (
                correct ? (
                  <Check size={19} />
                ) : (
                  <X size={19} />
                )
              ) : (
                <span className="answer-radio" />
              )}
            </motion.button>
          );
        })}
      </div>
      <div aria-live="polite">
        <AnimatePresence mode="wait">
          {submitted ? (
            <motion.div
              key="feedback"
              className={`quiz-feedback ${correct ? "feedback-correct" : "feedback-wrong"}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <strong>
                {correct
                  ? t(
                      "Xuất sắc, nhà thám hiểm! +150 XP",
                      "Brilliant, explorer! +150 XP",
                    )
                  : t(
                      "Chưa đúng rồi. Thử thêm lần nữa nhé!",
                      "Not quite. Give it another try!",
                    )}
              </strong>
              <p>{correct ? mission.explanation : mission.hint}</p>
            </motion.div>
          ) : hint ? (
            <motion.p
              key="hint"
              className="quiz-hint"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <Lightbulb size={17} />
              {mission.hint}
            </motion.p>
          ) : null}
        </AnimatePresence>
      </div>
      <div className="quiz-actions">
        {!submitted && (
          <button
            className="text-button"
            onClick={() => setHint(!hint)}
            aria-expanded={hint}
          >
            <Lightbulb size={17} />
            {hint
              ? t("Ẩn gợi ý", "Hide hint")
              : t("Một chút gợi ý", "A little hint")}
          </button>
        )}
        {submitted && !correct ? (
          <button
            className="primary-button"
            onClick={() => {
              setSelected(null);
              setSubmitted(false);
            }}
          >
            <RotateCcw size={17} />
            {t("Thử lại", "Try again")}
          </button>
        ) : submitted ? (
          <button className="primary-button" onClick={onContinue}>
            {final
              ? t("Nhận thành tựu", "Claim your badge")
              : t("Tiếp tục hành trình", "Keep exploring")}
            <ArrowRight size={18} />
          </button>
        ) : (
          <button
            className="primary-button"
            disabled={selected === null}
            onClick={submit}
          >
            {t("Chốt đáp án", "Lock in answer")}
            <ArrowRight size={18} />
          </button>
        )}
      </div>
    </div>
  );
}
