"use client";
import { useState } from "react";
import Image from "next/image";
import { Check, Eye, Lightbulb, LoaderCircle, LockKeyhole, MousePointer2, Radio, RotateCw, Sparkles } from "lucide-react";
import { useLanguage } from "@/components/UI/LanguageProvider";
import type { ChallengeMove, ChallengeSession } from "@/lib/palace/challenges";
import "./minigames.css";

export default function PalaceMiniGame({ session, busy, onMove }: {
  session: ChallengeSession; busy: boolean;
  onMove: (move: ChallengeMove) => Promise<{ accepted: boolean; solved: boolean } | null>;
}) {
  const { t, locale, setLocale } = useLanguage();
  const { definition: game, progress } = session;
  const [selected, setSelected] = useState<number | null>(null);
  const [card, setCard] = useState<string | null>(null);
  const [hint, setHint] = useState(false);
  const [reference, setReference] = useState(false);
  const [feedback, setFeedback] = useState<boolean | null>(null);
  const [cursor, setCursor] = useState({ x: 50, y: 50 });
  const nextTarget = game.targets?.find(target => !progress.found.includes(target.id));
  const count = game.kind === "spot" ? progress.found.length : game.kind === "match" ? progress.pairs.length : game.kind === "puzzle" ? progress.board.filter((piece, i) => piece === i).length : progress.connected.length;
  const total = game.targets?.length || progress.board.length || 12;
  async function send(move: ChallengeMove) {
    if (busy) return;
    const result = await onMove(move);
    if (result) { setFeedback(result.accepted); if (result.accepted) setCard(null); }
  }
  async function swap(index: number) {
    if (busy) return;
    if (selected === null) { setSelected(index); return; }
    if (selected === index) { setSelected(null); return; }
    const previous = selected; setSelected(null);
    await send({ type: "swap", a: previous, b: index });
  }
  return <section className="palace-minigame" aria-label={game.title[locale]}>
    <header className="minigame-heading"><div className="minigame-topline"><span className="minigame-kicker"><Sparkles size={14} />{t("NHIỆM VỤ KHÁM PHÁ", "A DISCOVERY MISSION")}</span><div className="mission-language" role="group" aria-label={t("Ngôn ngữ nhiệm vụ", "Mission language")}><button aria-pressed={locale === "vi"} onClick={() => setLocale("vi")}>VI</button><button aria-pressed={locale === "en"} onClick={() => setLocale("en")}>EN</button></div></div><h2>{game.title[locale]}</h2><p>{game.instructions[locale]}</p></header>
    <div className="minigame-layout"><div className="minigame-play-area">
      {game.kind === "spot" && <>
        <div className="minigame-clue"><span>{progress.found.length + 1} / {total}</span><strong>{nextTarget?.label[locale]}</strong></div>
        <div className="minigame-photo minigame-photo-facade">
          <Image src={game.image} width={1800} height={1125} alt={t("Toàn cảnh mặt tiền Dinh để tìm chi tiết", "Palace facade reference photograph")} loading="eager" />
          <button className="minigame-spot-surface" disabled={busy} aria-label={t("Chọn chi tiết trên ảnh. Dùng phím mũi tên di chuyển, Enter để chọn.", "Select a detail in the photo. Use arrow keys to move and Enter to select.")}
            onKeyDown={event => { const offsets: Record<string, [number, number]> = { ArrowLeft: [-2, 0], ArrowRight: [2, 0], ArrowUp: [0, -2], ArrowDown: [0, 2] }; if (offsets[event.key]) { event.preventDefault(); const [x, y] = offsets[event.key]; setCursor(c => ({ x: Math.max(0, Math.min(100, c.x + x)), y: Math.max(0, Math.min(100, c.y + y)) })); } }}
            onClick={event => { const box = event.currentTarget.getBoundingClientRect(); const point = event.detail ? { x: (event.clientX - box.left) / box.width * 100, y: (event.clientY - box.top) / box.height * 100 } : cursor; setCursor(point); void send({ type: "tap", ...point }); }}>
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
              {game.targets!.filter(target => progress.found.includes(target.id) || (hint && target.id === nextTarget?.id)).map(target => <rect key={target.id} x={target.region.x} y={target.region.y} width={target.region.w} height={target.region.h} rx=".8" className={progress.found.includes(target.id) ? "is-found" : "is-hint"} vectorEffect="non-scaling-stroke" />)}
              <path className="minigame-reticle" d={`M${cursor.x - 2} ${cursor.y}h4M${cursor.x} ${cursor.y - 2}v4`} vectorEffect="non-scaling-stroke" />
            </svg>
          </button>
        </div><small className="minigame-caption"><MousePointer2 size={12} />{t("Chạm ảnh để chọn · Bàn phím: mũi tên và Enter", "Tap to select · Keyboard: arrow keys and Enter")}</small>
      </>}
      {game.kind === "puzzle" && <>
        <div className="minigame-puzzle" style={{ gridTemplateColumns: `repeat(${game.columns}, 1fr)` }} role="group" aria-label={t("Bảng ghép ảnh sáu mảnh", "Six-piece picture puzzle")}>
          {progress.board.map((piece, i) => <button key={i} className={`${selected === i ? "is-selected" : ""}`} aria-label={`${t("Mảnh ở vị trí", "Piece at position")} ${i + 1}`} aria-pressed={selected === i} disabled={busy} onClick={() => void swap(i)}
            style={{ backgroundImage: `url(${game.image})`, backgroundSize: `${game.columns! * 100}% ${game.rows! * 100}%`, backgroundPosition: `${(piece % game.columns!) / (game.columns! - 1) * 100}% ${Math.floor(piece / game.columns!) / (game.rows! - 1) * 100}%` }}><span>{String(i + 1).padStart(2, "0")}</span>{selected === i && <i><RotateCw size={20} /></i>}</button>)}
        </div><p className="minigame-caption">{selected === null ? t("Chọn một mảnh để bắt đầu đổi chỗ.", "Select a piece to begin a swap.") : t("Giờ chọn mảnh thứ hai để đổi chỗ.", "Now select the second piece to swap.")}</p>
      </>}
      {game.kind === "match" && <>
        <div className="minigame-photo"><Image src={game.image} width={1280} height={817} alt={t("Phòng Nội các với các mốc ghép dấu vật", "Cabinet Room with matching markers")} loading="eager" />
          {[...game.targets!].reverse().map((target, i) => <button key={target.id} className={`minigame-match-pin ${progress.pairs.includes(target.id) ? "is-matched" : ""}`} style={{ left: `${target.region.x + target.region.w / 2}%`, top: `${target.region.y + target.region.h / 2}%` }} aria-label={`${t("Mốc", "Marker")} ${i + 1}${progress.pairs.includes(target.id) ? ` · ${target.label[locale]}` : ""}`} disabled={busy || progress.pairs.includes(target.id) || !card} onClick={() => card && void send({ type: "match", itemId: card, targetId: i })}>{progress.pairs.includes(target.id) ? <Check size={20} /> : i + 1}</button>)}
        </div>
        <div className="minigame-match-cards" role="group" aria-label={t("Thẻ tên dấu vật", "Detail name cards")}>{game.targets!.map(target => <button key={target.id} aria-pressed={card === target.id} disabled={busy || progress.pairs.includes(target.id)} className={card === target.id ? "is-selected" : ""} onClick={() => { setCard(target.id); setFeedback(null); }}>{progress.pairs.includes(target.id) ? <Check size={15} /> : <MousePointer2 size={15} />}{target.label[locale]}</button>)}</div>
      </>}
      {game.kind === "circuit" && <div className="minigame-circuit-shell">
        <div className="minigame-circuit-labels"><span><Radio size={14} />{t("NGUỒN", "SOURCE")}</span><span>{t("ĐÍCH", "DESTINATION")}<Radio size={14} /></span></div>
        <div className="minigame-circuit" role="group" aria-label={t("Mạch nối thông tin 12 ô", "Twelve-tile signal circuit")}>
          {game.cells!.map((kind, i) => <button key={i} className={progress.connected.includes(i) ? "has-signal" : ""} disabled={busy} aria-label={`${t("Ô", "Tile")} ${Math.floor(i / 4) + 1}-${i % 4 + 1}. ${t("Xoay dây 90 độ", "Rotate pipe 90 degrees")}`} onClick={() => void send({ type: "rotate", index: i })}>
            <svg viewBox="0 0 80 80" aria-hidden="true" style={{ transform: `rotate(${progress.turns[i] * 90}deg)` }}><path d={kind === "elbow" ? "M40 0V29Q40 40 51 40H80" : "M40 0V80"} /><circle cx="40" cy="40" r="3" /></svg><small>{Math.floor(i / 4) + 1}.{i % 4 + 1}</small>
          </button>)}
        </div><p>{t("Tình huống game minh họa về liên lạc trong khu hầm.", "An illustrative signal puzzle inspired by the bunker's communications role.")}</p>
      </div>}
      <div className="minigame-feedback" role="status">{busy ? <><LoaderCircle size={15} className="spin" />{t("Đang lưu thao tác…", "Saving your move…")}</> : feedback === false ? t("Chưa khớp. Quan sát thêm một chút rồi thử lại nhé.", "Not a match yet. Take another look and try again.") : feedback === true ? t("Đã lưu. Tiếp tục khám phá nhé!", "Saved. Keep exploring!") : t("Không giới hạn lượt thử. Cứ khám phá theo nhịp của bạn.", "Take your time. You can try as often as you like.")}</div>
    </div><aside className="minigame-notebook"><span className="minigame-kicker">FIELD NOTES / 0{["facade", "reception", "cabinet", "rooftop", "bunker"].indexOf(game.checkpointId) + 1}</span><h3>{t("Mỗi chi tiết, một phát hiện.", "Every detail, a discovery.")}</h3>
      <div className="minigame-progress"><strong>{count}<small>{game.kind === "circuit" ? t(" ô có tín hiệu", " live tiles") : ` / ${total}`}</small></strong><span>{game.kind === "puzzle" ? t("mảnh đang đúng vị trí", "pieces in place") : game.kind === "circuit" ? t("nối nguồn đến đích", "connect source to destination") : t("dấu hiệu đã tìm thấy", "details found")}</span><div><i style={{ width: `${Math.min(100, count / total * 100)}%` }} /></div></div>
      {game.targets && <ul className="minigame-target-list">{game.targets.map((target, i) => <li key={target.id} className={progress.found.includes(target.id) || progress.pairs.includes(target.id) ? "is-done" : ""}><span>{progress.found.includes(target.id) || progress.pairs.includes(target.id) ? <Check size={13} /> : i + 1}</span>{target.label[locale]}</li>)}</ul>}
      <button className="minigame-helper" onClick={() => setHint(!hint)} aria-expanded={hint}><Lightbulb size={16} />{t("Một chút gợi ý", "A little hint")}</button>{hint && <p className="minigame-hint">{game.hint[locale]}</p>}
      {game.kind === "puzzle" && <><button className="minigame-helper" onClick={() => setReference(!reference)} aria-expanded={reference}><Eye size={16} />{t("Xem ảnh đối chiếu", "View reference picture")}</button>{reference && <Image className="minigame-reference" src={game.image} width={500} height={333} alt={t("Ảnh hoàn chỉnh để đối chiếu", "Completed reference picture")} />}</>}
      <div className="minigame-story-locked"><LockKeyhole size={20} /><strong>{t("Một câu chuyện đang chờ bạn", "A story is waiting for you")}</strong><p>{t("Hoàn thành nhiệm vụ để mở lời kể và ghi dấu trên hành trình.", "Complete this mission to unlock its narration and mark your journey.")}</p></div>
      <small className="minigame-saved">{t("Đã lưu", "Saved")} · {progress.moves} {t("thao tác", "moves")}</small>
    </aside></div>
  </section>;
}
