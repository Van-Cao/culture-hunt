"use client";

import { useRef } from "react";
import Image from "next/image";
import { Expand, ExternalLink, X } from "lucide-react";
import { useLanguage } from "@/components/UI/LanguageProvider";
import assets from "@/content/palace/learning-assets.json";
import type { LearningReveal, QuestionText } from "@/lib/palace/question-types";

export function learningAsset(id: string) {
  return assets[id as keyof typeof assets] || assets.facade;
}

export default function LearningPhoto({ asset, caption, crop, reveal, revealed = false, guides = false }: {
  asset: string; caption: QuestionText; crop?: [number, number, number, number];
  reveal?: LearningReveal; revealed?: boolean; guides?: boolean;
}) {
  const { locale, t } = useLanguage();
  const viewer = useRef<HTMLDialogElement>(null);
  const photo = learningAsset(asset);
  const frame = crop || [0, 0, 100, 100];
  const artwork = (full = false) => <div className={`learning-photo-stage ${revealed ? "is-revealed" : ""} ${reveal?.kind || ""}`} style={{ aspectRatio: `${photo.width * frame[2]} / ${photo.height * frame[3]}` }}>
    <div className="learning-photo-layer" style={{ width: `${10000 / frame[2]}%`, height: `${10000 / frame[3]}%`, left: `${-100 * frame[0] / frame[2]}%`, top: `${-100 * frame[1] / frame[3]}%` }}>
      <Image src={photo.src} alt={caption[locale]} fill unoptimized loading={full ? "lazy" : "eager"} sizes="100vw" />
    </div>
    {(revealed || guides) && reveal?.kind === "tam" && <svg className={`learning-photo-overlay ${revealed ? "draw-reveal" : "guide-lines"}`} viewBox={frame.join(" ")} preserveAspectRatio="none" aria-hidden="true">
      <path d="M42 34 L58.2 34 M44 45.1 L57.6 45.1 M42 53 L59 53" />
    </svg>}
    {(revealed || guides) && reveal?.kind === "painting" && <svg className="learning-photo-overlay painting-marker" viewBox={frame.join(" ")} preserveAspectRatio="none" aria-hidden="true">
      <ellipse cx="48.4" cy="51" rx="3.8" ry="11" />
      {revealed && <><path d="M52 54 Q64 56 70 70" /><ellipse cx="72.4" cy="75" rx="7" ry="10" /></>}
    </svg>}
    {revealed && reveal?.kind === "roof" && <svg className="learning-photo-overlay roof-markers draw-reveal" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      <ellipse cx="23.6" cy="68.5" rx="12" ry="6" /><ellipse cx="76.4" cy="87.7" rx="16" ry="10" />
    </svg>}
    {revealed && reveal?.kind === "tam" && <span className="learning-photo-discovery"><b>三</b> TAM</span>}
    {revealed && reveal?.kind === "painting" && <span className="learning-photo-discovery painting-label">Văn Lang</span>}
  </div>;
  return <figure className="learning-photo">
    <div className="learning-photo-shell">{artwork()}<button type="button" className="learning-expand" onClick={() => viewer.current?.showModal()} aria-label={t("Phóng to ảnh tư liệu", "Enlarge the reference image")}><Expand size={17} /><span>{t("Phóng to", "Enlarge")}</span></button></div>
    <figcaption><span>{caption[locale]}</span><a href={photo.source} target="_blank" rel="noreferrer">{photo.credit}<ExternalLink size={11} /></a></figcaption>
    <dialog ref={viewer} className="learning-image-viewer" onClick={event => { if (event.target === event.currentTarget) viewer.current?.close(); }} onKeyDown={event => { if (event.key === "Escape") { event.stopPropagation(); viewer.current?.close(); } }} aria-label={t("Ảnh tư liệu phóng lớn", "Enlarged reference photograph")}>
      <button className="learning-viewer-close" onClick={() => viewer.current?.close()} autoFocus><X size={20} />{t("Đóng ảnh", "Close image")}</button>
      {artwork(true)}
      <p>{caption[locale]} · {photo.credit}</p>
      <a href={photo.src} target="_blank" rel="noreferrer">{t("Mở ảnh gốc để xem chi tiết", "Open the full-resolution image")}<ExternalLink size={13} /></a>
    </dialog>
  </figure>;
}
