"use client";

import { ArrowDown, ArrowUp, Check, X } from "lucide-react";
import Image from "next/image";
import assets from "@/content/palace/learning-assets.json";
import { useLanguage } from "@/components/UI/LanguageProvider";
import type { PalaceQuestion, QuestionAnswer } from "@/lib/palace/question-types";
import "./questions.css";

export default function PalaceQuestionInput({ question, value, onChange, disabled, feedback }: {
  question: PalaceQuestion;
  value: QuestionAnswer | null;
  onChange: (value: QuestionAnswer) => void;
  disabled: boolean;
  feedback: boolean | null;
}) {
  const { locale, t } = useLanguage();
  const kind = question.kind || "single";
  const answers = question.answers[locale];
  const selected = Array.isArray(value) ? value : [];
  const resultClass = feedback === null ? "" : feedback ? "is-correct" : "is-wrong";
  if (kind === "number") return <label className="palace-number-answer">
    <span>{t("Điền câu trả lời bằng số", "Enter a number")}</span>
    <input inputMode="numeric" pattern="[0-9]*" autoComplete="off" maxLength={6}
      value={typeof value === "string" ? value : ""} disabled={disabled}
      onChange={event => onChange(event.target.value.replace(/[^0-9]/g, ""))}
      placeholder={t("Nhập số của bạn…", "Your number…")} />
  </label>;
  if (kind === "match") return <div className="palace-pair-answers">
    <p>{t("Chọn mảnh thông tin tương ứng với từng gợi ý.", "Choose the matching detail for each clue.")}</p>
    {question.prompts?.[locale].map((prompt, index) => <label key={index}>
      <span><b>{index + 1}</b>{prompt}</span>
      <select value={selected[index] ?? -1} disabled={disabled} onChange={event => {
        const next = question.prompts!.vi.map((_, i) => selected[i] ?? -1);
        next[index] = Number(event.target.value); onChange(next);
      }}><option value={-1} disabled>{t("Chọn mảnh ghép…", "Choose a match…")}</option>
        {answers.map((answer, i) => <option key={i} value={i}>{answer}</option>)}
      </select>
      {selected[index] !== undefined && selected[index] >= 0 && <small className="palace-pair-selected">{answers[selected[index]]}</small>}
    </label>)}
  </div>;
  if (kind === "order") return <div className="palace-order-answer">
    <p>{t("Chạm các thẻ theo thứ tự bạn chọn. Dùng mũi tên để đổi vị trí hoặc × để bỏ thẻ.", "Select cards in your chosen order. Use the arrows to move a card, or × to remove it.")}</p>
    <ol aria-label={t("Thứ tự đã chọn", "Your chosen order")}>
      {selected.map((item, index) => <li key={item}><b>{index + 1}</b><span>{answers[item]}</span>
        <div>{[-1, 1].map(direction => <button key={direction} disabled={disabled || index + direction < 0 || index + direction >= selected.length}
          aria-label={`${t(direction < 0 ? "Đưa lên" : "Đưa xuống", direction < 0 ? "Move up" : "Move down")}: ${answers[item]}`}
          onClick={() => { const next = [...selected]; [next[index], next[index + direction]] = [next[index + direction], next[index]]; onChange(next); }}>
          {direction < 0 ? <ArrowUp size={15} /> : <ArrowDown size={15} />}
        </button>)}<button disabled={disabled} aria-label={`${t("Bỏ thẻ", "Remove card")}: ${answers[item]}`} onClick={() => onChange(selected.filter(i => i !== item))}><X size={15} /></button></div>
      </li>)}
    </ol>
    <div className="palace-order-pool" role="group" aria-label={t("Thẻ chưa xếp", "Unplaced cards")}>
      {answers.map((answer, i) => !selected.includes(i) && <button key={i} disabled={disabled} onClick={() => onChange([...selected, i])}><span>+</span>{answer}</button>)}
    </div>
    <small aria-live="polite">{selected.length} / {answers.length} {t("thẻ đã xếp", "cards placed")}</small>
  </div>;
  const multi = kind === "multi";
  return <div className="palace-answer-list" role="group" aria-label={t(multi ? "Chọn tất cả đáp án đúng" : "Chọn một đáp án", multi ? "Select all correct answers" : "Choose an answer")}>
    {multi && <p className="palace-selection-note">{t("Có nhiều đáp án đúng. Chọn đủ các đáp án trước khi chốt.", "There are multiple correct answers. Select all of them before submitting.")}</p>}
    {answers.map((answer, i) => {
      const active = multi ? selected.includes(i) : value === i;
      const assetId = question.learning?.choiceAssets?.[i];
      const photo = assetId ? assets[assetId as keyof typeof assets] : undefined;
      return <button key={i} data-answer-index={i} className={`${active ? "is-selected" : ""} ${active ? resultClass : ""} ${photo ? "has-answer-photo" : ""}`}
        aria-pressed={active} disabled={disabled} onClick={() => onChange(multi ? active ? selected.filter(item => item !== i) : [...selected, i] : i)}>
        <span>{multi ? active ? <Check size={16} /> : "" : String.fromCharCode(65 + i)}</span>
        {photo && <Image src={photo.src} alt="" width={300} height={190} unoptimized />}
        <span className="palace-answer-text">{answer}</span>{feedback !== null && active && (feedback ? <Check size={18} /> : <X size={18} />)}
      </button>;
    })}
  </div>;
}
