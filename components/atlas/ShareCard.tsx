"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Check, Copy, Download, LoaderCircle, Share2 } from "lucide-react";
import GameDialog from "@/components/UI/GameDialog";
import { useLanguage, type Locale } from "@/components/UI/LanguageProvider";
import type { ShareTarget } from "@/lib/atlas/model";

function lines(ctx: CanvasRenderingContext2D, value: string, x: number, y: number, maxWidth: number, lineHeight: number) {
  let line = "";
  for (const word of value.split(/\s+/)) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > maxWidth && line) { ctx.fillText(line, x, y); y += lineHeight; line = word; }
    else line = next;
  }
  ctx.fillText(line, x, y);
  return y;
}

function drawCard(target: ShareTarget, format: "post" | "story", locale: Locale, name?: string, date?: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 1080; canvas.height = format === "story" ? 1920 : 1350;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");
  const h = canvas.height, vi = locale === "vi";
  const serif = getComputedStyle(document.documentElement).getPropertyValue("--font-editorial").trim() || "Georgia";
  const sans = getComputedStyle(document.documentElement).getPropertyValue("--font-geist-sans").trim() || "Arial";
  ctx.fillStyle = "#f5f1e4"; ctx.fillRect(0, 0, 1080, h);
  ctx.fillStyle = "#1b4438"; ctx.fillRect(0, 0, 1080, 130);
  ctx.fillStyle = "#e1c587"; ctx.font = `600 25px ${sans}`; ctx.textAlign = "left"; ctx.fillText("CULTURE HUNT", 70, 78);
  ctx.textAlign = "right"; ctx.font = `18px ${sans}`; ctx.fillStyle = "#dfdfc8"; ctx.fillText("THE EXPLORER PASSPORT / DEMO", 1010, 76);
  ctx.strokeStyle = "#baab7a"; ctx.lineWidth = 1.5; ctx.strokeRect(34, 157, 1012, h - 191);
  ctx.fillStyle = "#536c53"; ctx.textAlign = "left"; ctx.font = `500 20px ${sans}`;
  ctx.fillText(target.kind === "badge" ? vi ? "MỘT HUY HIỆU. MỘT CÂU CHUYỆN." : "A BADGE. A STORY." : vi ? "MỖI ĐIỂM ĐẾN, MỘT DẤU ẤN." : "EVERY PLACE LEAVES A MARK.", 80, 225);
  ctx.font = `52px ${serif}`; ctx.fillStyle = "#204739";
  lines(ctx, target.title, 80, 305, 900, 65);
  const artY = format === "story" ? 610 : 485, artH = format === "story" ? 650 : 390;
  ctx.save(); ctx.beginPath(); ctx.roundRect(75, artY, 930, artH, 24); ctx.clip();
  ctx.fillStyle = "#dce3d0"; ctx.fillRect(75, artY, 930, artH);
  ctx.strokeStyle = "#f9f5e7"; ctx.lineWidth = 16;
  for (let i = -7; i < 14; i++) { ctx.beginPath(); ctx.moveTo(75 + i * 100, artY); ctx.lineTo(75 + i * 100 + 300, artY + artH); ctx.stroke(); }
  ctx.lineWidth = 11;
  for (let i = 0; i < 9; i++) { ctx.beginPath(); ctx.moveTo(75, artY + i * 100 - 250); ctx.lineTo(1005, artY + i * 100 + 150); ctx.stroke(); }
  ctx.strokeStyle = "#9ebfb4"; ctx.lineWidth = 70; ctx.beginPath(); ctx.moveTo(910, artY - 20); ctx.bezierCurveTo(650, artY + artH * .4, 1050, artY + artH * .6, 870, artY + artH + 20); ctx.stroke();
  if (target.kind === "badge") {
    ctx.fillStyle = "#1e4b3d"; ctx.beginPath(); ctx.arc(540, artY + artH / 2, Math.min(artH * .37, 180), 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#e3c985"; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(540, artY + artH / 2, Math.min(artH * .32, 155), 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = "#ead396"; ctx.textAlign = "center"; ctx.font = `105px ${serif}`; ctx.fillText("✦", 540, artY + artH / 2 + 36);
  } else {
    const dots = target.kind === "city" ? [{ x: 380, y: artY + artH * .68, label: "ĐH KHTN", id: "hcmus" }, { x: 665, y: artY + artH * .3, label: vi ? "Dinh Độc Lập" : "Independence Palace", id: "palace" }] : Array.from({ length: Math.max(1, target.total) }, (_, i) => ({ x: target.total === 1 ? 540 : 215 + i * (660 / Math.max(1, target.total - 1)), y: artY + artH * (.45 + Math.sin(i * 1.8) * .17), label: String(i + 1).padStart(2, "0"), id: "" }));
    dots.forEach((dot, i) => {
      const mark = target.marks?.find(m => m.id === dot.id);
      const done = target.kind === "city" ? Boolean(mark && mark.completed === mark.total) : i < target.completed;
      ctx.beginPath(); ctx.arc(dot.x, dot.y, 30, 0, Math.PI * 2); ctx.fillStyle = done ? "#d6b770" : mark?.completed ? "#adc194" : "#f4efdd"; ctx.fill(); ctx.strokeStyle = "#31553d"; ctx.lineWidth = 3; ctx.stroke();
      ctx.textAlign = "center"; ctx.fillStyle = "#244836"; ctx.font = `600 18px ${sans}`; ctx.fillText(target.kind === "city" ? "✦" : dot.label, dot.x, dot.y + 7);
      if (target.kind === "city") { ctx.font = `500 20px ${sans}`; ctx.fillText(`${dot.label}${mark ? ` · ${mark.completed}/${mark.total}` : ""}`, dot.x, dot.y + 65); }
    });
  }
  ctx.restore();
  const statsY = h - 320;
  ctx.fillStyle = "#214839"; ctx.textAlign = "left"; ctx.font = `64px ${serif}`; ctx.fillText(`${target.completed}/${target.total}`, 80, statsY);
  ctx.font = `21px ${sans}`; ctx.fillStyle = "#52634b"; ctx.fillText(target.kind === "city" ? vi ? "ĐỊA ĐIỂM HOÀN THÀNH" : "DESTINATIONS COMPLETED" : target.kind === "badge" ? vi ? "ĐIỀU KIỆN ĐÃ ĐẠT" : "REQUIREMENTS MET" : vi ? "CHECKPOINT ĐÃ MỞ" : "CHECKPOINTS UNLOCKED", 80, statsY + 43);
  ctx.textAlign = "right"; ctx.font = `64px ${serif}`; ctx.fillStyle = "#94763b"; ctx.fillText(`${target.xp} XP`, 1000, statsY); ctx.font = `21px ${sans}`; ctx.fillStyle = "#52634b"; ctx.fillText(vi ? "THÀNH TÍCH TRONG GAME" : "IN-GAME ACHIEVEMENT", 1000, statsY + 43);
  ctx.textAlign = "left"; ctx.font = `24px ${sans}`; ctx.fillStyle = "#38553e"; if (name) lines(ctx, name, 80, h - 160, 600, 30);
  if (date) { ctx.font = `17px ${sans}`; ctx.fillStyle = "#55674e"; ctx.fillText(`${vi ? "Tạo thẻ" : "Card created"} · ${date}`, 80, h - 115); }
  ctx.font = `18px ${sans}`; ctx.textAlign = "right"; ctx.fillStyle = "#496247"; ctx.fillText("#CultureHunt · #SaigonStories", 1000, h - 85);
  return canvas;
}

export default function ShareCard({ target, name, onClose }: { target: ShareTarget; name: string; onClose: () => void }) {
  const { locale, t } = useLanguage();
  const [format, setFormat] = useState<"post" | "story">("post");
  const [showName, setShowName] = useState(false), [showDate, setShowDate] = useState(false);
  const [preview, setPreview] = useState("");
  const [renderedFor, setRenderedFor] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const file = useRef<File | null>(null);
  const signature = `${format}:${locale}:${showName ? name : ""}:${showDate}:${target.kind}:${target.title}`;
  const ready = Boolean(preview) && renderedFor === signature;
  useEffect(() => {
    let cancelled = false, objectUrl = "";
    file.current = null;
    async function generate() {
      try {
        await document.fonts.ready;
        const date = showDate ? new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-GB").format(new Date()) : undefined;
        const canvas = drawCard(target, format, locale, showName ? name : undefined, date);
        const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(b => b ? resolve(b) : reject(new Error("Image unavailable")), "image/png"));
        if (cancelled) return;
        file.current = new File([blob], `culture-hunt-${target.destinationId || target.badgeId || "saigon"}-${format}.png`, { type: "image/png" });
        objectUrl = URL.createObjectURL(blob); setPreview(objectUrl); setRenderedFor(signature);
      } catch { if (!cancelled) setNotice(t("Chưa tạo được thẻ. Hãy thử lại trên trình duyệt khác.", "Could not create the card. Please try another browser.")); }
    }
    void generate();
    return () => { cancelled = true; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [target, format, locale, name, showName, showDate, t, signature]);
  const text = t(`Dấu ấn của mình trên Culture Hunt: ${target.title} · ${target.completed}/${target.total} · ${target.xp} XP. Trải nghiệm demo. #CultureHunt`, `My Culture Hunt discovery: ${target.title} · ${target.completed}/${target.total} · ${target.xp} XP. Demo experience. #CultureHunt`);
  function download() {
    if (!file.current) return;
    const url = URL.createObjectURL(file.current), a = document.createElement("a");
    a.href = url; a.download = file.current.name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    setNotice(t("Đã tải thẻ PNG. Bạn có thể đăng ảnh lên story.", "PNG downloaded. You can add it to your story."));
  }
  async function copy() {
    try { await navigator.clipboard.writeText(text); setNotice(t("Đã sao chép nội dung chia sẻ.", "Share text copied.")); }
    catch { setNotice(t("Bạn có thể sao chép nội dung trong ô bên dưới.", "You can copy the text below.")); }
  }
  async function share() {
    if (!file.current || busy) return;
    setBusy(true);
    try {
      if (navigator.canShare?.({ files: [file.current] })) await navigator.share({ title: "Culture Hunt", text, files: [file.current] });
      else if (navigator.share) await navigator.share({ title: "Culture Hunt", text });
      else { await copy(); return; }
      setNotice(t("Đã gửi tới bảng chia sẻ của thiết bị.", "Sent to your device’s share sheet."));
    } catch (error) { if (!(error instanceof DOMException && error.name === "AbortError")) setNotice(t("Chia sẻ chưa khả dụng. Hãy tải ảnh hoặc sao chép nội dung.", "Sharing is unavailable. Download the image or copy the text.")); }
    finally { setBusy(false); }
  }
  return <GameDialog label={t("Tạo thẻ chia sẻ dấu ấn", "Create a discovery share card")} onClose={onClose} wide animateEntry={false}>
    <div className="atlas-share-editor">
      <div className="atlas-share-preview">{preview ? <Image src={preview} alt={t("Xem trước thẻ thành tích", "Achievement card preview")} width={1080} height={format === "post" ? 1350 : 1920} unoptimized /> : <LoaderCircle className="spin" size={28} />}</div>
      <div className="atlas-share-options"><span className="atlas-eyebrow">MAKE IT A MEMORY</span><h2>{t("Mang câu chuyện đi xa.", "Let your story travel.")}</h2><p>{t("Chọn kiểu thẻ, xem trước và chia sẻ dấu ấn của riêng bạn.", "Choose a format, preview it and share your discoveries.")}</p>
        <fieldset><legend>{t("Định dạng ảnh", "Image format")}</legend><div className="atlas-format-options"><button aria-pressed={format === "post"} onClick={() => setFormat("post")}>4:5 <small>{t("Bài đăng", "Post")}</small></button><button aria-pressed={format === "story"} onClick={() => setFormat("story")}>9:16 <small>Story</small></button></div></fieldset>
        <label className="atlas-check"><input type="checkbox" checked={showName} onChange={e => setShowName(e.target.checked)} />{t("Hiện tên của tôi", "Show my name")}</label>
        <label className="atlas-check"><input type="checkbox" checked={showDate} onChange={e => setShowDate(e.target.checked)} />{t("Hiện ngày tạo thẻ", "Show card creation date")}</label>
        <button className="atlas-primary" disabled={!ready || busy} onClick={share}><Share2 size={16} />{t("Chia sẻ thẻ", "Share card")}</button>
        <div className="atlas-share-actions"><button className="atlas-secondary" disabled={!ready} onClick={download}><Download size={15} />{t("Tải PNG", "Download PNG")}</button><button className="atlas-secondary" onClick={copy}><Copy size={15} />{t("Sao chép", "Copy text")}</button></div>
        <label className="atlas-share-text">{t("Nội dung chia sẻ", "Share text")}<textarea readOnly value={text} rows={4} /></label>
        {notice && <p className="atlas-feedback" role="status"><Check size={14} />{notice}</p>}
      </div>
    </div>
  </GameDialog>;
}
