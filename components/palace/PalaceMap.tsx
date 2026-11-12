"use client";
import { useEffect, useRef, useState, useId } from "react";
import { motion, useAnimationControls, useReducedMotion } from "framer-motion";
import { Check, Compass, LockKeyhole, Minus, Plus, LocateFixed, Camera, Flag, Gem, Trophy, Sparkles } from "lucide-react";
import { getCheckpoints, type CheckpointId } from "@/lib/palace/checkpoints";
import { useLanguage } from "@/components/UI/LanguageProvider";
import { Explorer, GardenTree, StageScenery } from "./PalaceScenery";
import "./palace-map.css";

// Stage positions illustrate the journey, rather than a measured floor plan.
const positions: Record<CheckpointId, { x: number; y: number }> = {
  facade: { x: 235, y: 710 }, reception: { x: 700, y: 625 },
  cabinet: { x: 335, y: 435 }, rooftop: { x: 735, y: 320 }, bunker: { x: 430, y: 180 },
};
const routes = [
  "M235 710C340 800 560 780 635 727S754 676 700 625",
  "M700 625C570 613 465 651 441 586S200 556 230 491 288 472 335 435",
  "M335 435C449 374 500 460 603 423S788 392 735 320",
  "M735 320C651 301 597 338 585 278S486 271 430 180",
];
const trees = [[138, 310], [180, 267], [240, 210], [590, 155], [665, 157], [852, 278], [882, 329], [846, 520], [895, 570], [135, 540], [167, 577], [522, 529], [569, 561], [794, 742], [832, 706], [121, 691], [510, 813]];
const island = "M109 239Q121 150 258 121L398 75Q486 43 578 89L839 172Q913 195 919 286L943 564Q958 682 840 768L641 844Q544 870 441 844L173 780Q74 753 74 660Z";

export default function PalaceMap({ completed, recognized = [], available, selected, actor, journal = false, paused = false, onSelect }: {
  completed: CheckpointId[]; recognized?: CheckpointId[]; available?: CheckpointId;
  selected: CheckpointId; actor: CheckpointId; journal?: boolean; paused?: boolean; onSelect: (id: CheckpointId) => void;
}) {
  const { locale, t } = useLanguage();
  const checkpoints = getCheckpoints(locale);
  const [zoom, setZoom] = useState(1);
  const [mapWidth, setMapWidth] = useState(1000);
  const viewport = useRef<HTMLDivElement>(null);
  const pathRefs = useRef<(SVGPathElement | null)[]>([]);
  const previousActor = useRef(actor);
  const previousScale = useRef(1);
  const dragging = useRef<{ x: number; left: number; y: number; top: number } | null>(null);
  const reduced = useReducedMotion();
  const walker = useAnimationControls();
  const uid = useId().replace(/:/g, "");
  const pos = positions[actor], active = positions[selected];
  // Maintain 44+ CSS pixel touch targets, even in the mobile overview.
  const nodeScale = Math.max(1, 660 / Math.max(250, mapWidth * zoom));
  const completedSet = new Set(completed);
  const next = checkpoints.find(c => c.id === available);

  useEffect(() => {
    const container = viewport.current;
    if (!container) return;
    const observer = new ResizeObserver(entries => {
      const width = entries[0].contentRect.width;
      if (width > 0) setMapWidth(width);
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    const container = viewport.current;
    if (container) container.scrollTo({
      left: (active.x / 1000) * container.scrollWidth - container.clientWidth / 2,
      top: ((active.y + 70) / 970) * container.scrollHeight - container.clientHeight / 2,
      behavior: reduced ? "instant" : "smooth",
    });
  }, [active.x, active.y, zoom, reduced]);
  useEffect(() => {
    // Wait until the reward dialog closes so the player can see the walk.
    if (paused) return;
    const ids = ["facade", "reception", "cabinet", "rooftop", "bunker"];
    const oldIndex = ids.indexOf(previousActor.current), newIndex = ids.indexOf(actor);
    const path = pathRefs.current[oldIndex];
    const offsetX = -55 * nodeScale, offsetY = -62 * nodeScale;
    if (!reduced && previousScale.current === nodeScale && newIndex === oldIndex + 1 && path) {
      const length = path.getTotalLength();
      const points = Array.from({ length: 45 }, (_, i) => path.getPointAtLength(length * i / 44));
      void walker.start({ x: points.map(p => p.x + offsetX), y: points.map(p => p.y + offsetY), transition: { duration: 2.1, ease: "easeInOut" } });
    } else walker.set({ x: pos.x + offsetX, y: pos.y + offsetY });
    previousActor.current = actor;
    previousScale.current = nodeScale;
    return () => walker.stop();
  }, [actor, nodeScale, pos.x, pos.y, reduced, walker, paused]);

  return <div className={`palace-atlas palace-game-atlas ${journal ? "is-journal" : ""}`}>
    <div className="palace-atlas-bar">
      <span><Compass size={15} />{t("DINH ĐỘC LẬP", "INDEPENDENCE PALACE")}</span>
      <span>{t("CHƯƠNG", "CHAPTER")} 01 <i /> {t("5 MÀN KHÁM PHÁ", "5 DISCOVERY STAGES")}</span>
    </div>
    <div className="palace-game-hud">
      <div className="palace-game-hud-title"><span><Flag size={17} /></span><div>
        <small>{journal ? t("NHẬT KÝ KHÁM PHÁ", "YOUR DISCOVERY JOURNAL") : t("HÀNH TRÌNH CỦA BẠN", "YOUR ADVENTURE")}</small>
        <strong>{journal ? t("Những miền đã mở", "Places you unlocked") : completed.length === 5 ? t("Dinh đã được giải mã!", "The Palace is decoded!") : t("Đánh thức những câu chuyện", "Bring the stories to life")}</strong>
      </div></div>
      <div className="palace-game-gems" aria-label={`${completed.length} / 5 ${t("màn hoàn thành", "stages completed")}`}>
        <span aria-hidden="true">{checkpoints.map(cp => <Gem key={cp.id} size={15} className={completedSet.has(cp.id) ? "gem-earned" : ""} />)}</span>
        <strong>{completed.length}<small> / 5</small></strong>
      </div>
    </div>
    <div className="palace-map-viewport" ref={viewport}
      onPointerDown={event => {
        if (event.pointerType !== "mouse" || (event.target as Element).closest("button")) return;
        dragging.current = { x: event.clientX, y: event.clientY, left: event.currentTarget.scrollLeft, top: event.currentTarget.scrollTop };
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onPointerMove={event => {
        if (!dragging.current) return;
        event.currentTarget.scrollLeft = dragging.current.left - event.clientX + dragging.current.x;
        event.currentTarget.scrollTop = dragging.current.top - event.clientY + dragging.current.y;
      }} onPointerUp={() => { dragging.current = null; }} onPointerCancel={() => { dragging.current = null; }}>
      <svg viewBox="0 -70 1000 970" className="palace-map-svg" style={{ width: `${zoom * 100}%`, minWidth: 0 }} role="group" aria-label={t("Bản đồ hành trình Dinh Độc Lập, 5 checkpoint", "Independence Palace journey map, five checkpoints")}>
        <defs>
          <radialGradient id={`${uid}-world`} cx="48%" cy="40%" r="68%"><stop stopColor="#699176" /><stop offset="1" stopColor="#234f45" /></radialGradient>
          <linearGradient id={`${uid}-grass`} x2=".7" y2="1"><stop stopColor="#c0cd9d" /><stop offset=".5" stopColor="#9ab986" /><stop offset="1" stopColor="#7c9e70" /></linearGradient>
          <linearGradient id={`${uid}-stone`} x2="0" y2="1"><stop stopColor="#b0a67b" /><stop offset="1" stopColor="#6f7756" /></linearGradient>
          <linearGradient id={`${uid}-road`} x2="0" y2="1"><stop stopColor="#f2d588" /><stop offset="1" stopColor="#bd9254" /></linearGradient>
          <radialGradient id={`${uid}-halo`}><stop stopColor="#fff0a5" stopOpacity=".75" /><stop offset="1" stopColor="#fff0a5" stopOpacity="0" /></radialGradient>
          <filter id={`${uid}-shadow`} x="-30%" y="-30%" width="170%" height="180%"><feDropShadow dx="0" dy="14" stdDeviation="13" floodColor="#123a32" floodOpacity=".35" /></filter>
          <pattern id={`${uid}-grain`} width="43" height="37" patternUnits="userSpaceOnUse"><path d="M5 8l3-4m18 21 2-5m8-8 2-3" stroke="#f5efb8" strokeWidth="1.2" opacity=".18" /></pattern>
        </defs>
        <g aria-hidden="true">
          <rect y="-70" width="1000" height="970" fill={`url(#${uid}-world)`} />
          <ellipse cx="520" cy="808" rx="409" ry="68" fill="#153e3640" />
          <g filter={`url(#${uid}-shadow)`}>
            <path d={island} transform="translate(0 24)" fill="#5b7053" stroke="#456549" strokeWidth="3" />
            <path d={island} transform="translate(0 12)" fill={`url(#${uid}-stone)`} />
            <path d={island} fill={`url(#${uid}-grass)`} stroke="#d6d6a4" strokeWidth="3" />
            <path d={island} fill={`url(#${uid}-grain)`} />
          </g>
          <path d="M143 384Q188 344 231 377T285 416Q253 450 198 433T143 384Z" fill="#719f90" stroke="#c4cbaa" strokeWidth="7" />
          <path d="M163 389Q197 367 224 390M189 410Q218 422 244 409" stroke="#b5d7bc" strokeWidth="2" fill="none" />
          <path d="M739 483Q784 446 822 470T846 510Q810 544 762 527T739 483Z" fill="#719f90" stroke="#c4cbaa" strokeWidth="7" />
          <path d="M774 485Q802 472 821 490M776 513L805 516" stroke="#b5d7bc" strokeWidth="2" fill="none" />
          <path d="M284 249Q365 210 478 251M160 657Q218 634 283 666M631 820L744 776" stroke="#d4d7af" strokeWidth="7" fill="none" opacity=".6" />
          {trees.map(([x, y], i) => <GardenTree key={i} x={x} y={y} small={i % 3 === 0} />)}
          {[[200, 340], [604, 494], [828, 634], [350, 796], [544, 190]].map(([x, y], i) => <g key={i} transform={`translate(${x} ${y})`}><ellipse rx="18" ry="7" fill="#658858" />{[-9, 0, 9].map(v => <circle key={v} cx={v} cy="-5" r="3" fill={i % 2 ? "#ead29a" : "#e4bdac"} />)}</g>)}
          <g opacity=".5" fill="none" stroke="#e8ecd1" strokeWidth="2" strokeLinecap="round"><path d="M106 103q7-8 14 0 7-8 14 0M818 92q5-6 10 0 5-6 10 0M866 110q5-6 10 0 5-6 10 0" /></g>
        </g>
        {routes.map((route, index) => {
          const lit = completedSet.has(checkpoints[index + 1].id);
          const open = !journal && completedSet.has(checkpoints[index].id);
          return <g key={route} aria-hidden="true" className={`palace-game-road ${lit ? "is-lit" : ""}`}>
            <path d={route} fill="none" stroke="#3b65444d" strokeWidth="30" transform="translate(0 5)" strokeLinecap="round" />
            <path d={route} fill="none" stroke={lit || open ? "#ad915b" : "#819477"} strokeWidth="25" strokeLinecap="round" />
            <path ref={el => { pathRefs.current[index] = el; }} d={route} fill="none" stroke={lit || open ? `url(#${uid}-road)` : "#bdc7a4"} strokeWidth="19" strokeLinecap="round" />
            <path d={route} fill="none" stroke={lit || open ? "#fff2c2" : "#e2e6cb"} opacity={lit || open ? .9 : .6} strokeWidth="3" strokeDasharray="1 14" strokeLinecap="round" className={open && !lit ? "palace-route-current" : ""} />
          </g>;
        })}
        {checkpoints.map((cp, index) => {
          const { x, y } = positions[cp.id];
          const done = completedSet.has(cp.id), identified = recognized.includes(cp.id);
          const locked = !done && (journal || (!identified && cp.id !== available));
          return <g key={cp.id} className={`palace-game-stage ${done ? "palace-node-lit" : ""} ${locked ? "stage-locked" : "stage-open"}`}>
            <g transform={`translate(${x} ${y - 85})`} aria-hidden="true" className="palace-stage-scenery">
              {done && <ellipse cy="-20" rx="160" ry="100" fill={`url(#${uid}-halo)`} />}
              <StageScenery id={cp.id} />
              {locked && <g className="palace-stage-mist" fill="#dde4cd" opacity=".27"><ellipse cx="-18" cy="-20" rx="101" ry="17" /><ellipse cx="43" cy="-48" rx="60" ry="14" /></g>}
              {done && <g className="palace-stage-sparkles" fill="#fff3bc"><path d="M-88-116l3 8 8 3-8 3-3 8-3-8-8-3 8-3Z" /><path d="M84-68l2 6 6 2-6 2-2 6-2-6-6-2 6-2Z" /></g>}
            </g>
            <g transform={`translate(${x} ${y}) scale(${nodeScale})`}>
              {done && <ellipse cy="9" rx="47" ry="23" fill="#e8cf7b55" />}
              {cp.id === available && !done && !journal && <ellipse className="palace-node-pulse" cy="8" rx="46" ry="29" fill="none" stroke="#fff0ae" strokeWidth="2" />}
              <foreignObject className="palace-node-hit-area" x="-93" y="-37" width="186" height="160">
                <div className={`palace-map-node ${done ? "is-complete" : locked ? "is-locked" : "is-available"} ${selected === cp.id ? "is-selected" : ""}`}>
                  <button type="button" onClick={() => onSelect(cp.id)} aria-label={`${index + 1}. ${cp.name} · ${done ? t("Đã khai mở", "Completed") : locked ? t("Chưa mở", "Locked") : t("Khám phá", "Explore")}`} aria-pressed={selected === cp.id} aria-disabled={locked}>
                    <span className="palace-stage-number">{done ? <Check size={26} strokeWidth={3} /> : identified ? <Camera size={25} /> : String(index + 1).padStart(2, "0")}</span>
                    {locked && <LockKeyhole className="palace-stage-lock" size={17} />}
                  </button>
                  <span>{cp.name}</span>
                  <small>{done ? <><Gem size={10} />{t("ĐÃ KHAI MỞ", "DISCOVERED")}</> : locked ? <><LockKeyhole size={9} />{t("CHƯA MỞ", "LOCKED")}</> : <><Flag size={10} />{t("CHƠI MÀN NÀY", "PLAY THIS STAGE")}</>}</small>
                </div>
              </foreignObject>
              {cp.id === available && !done && !journal && <g className="palace-stage-flag" transform="translate(39 -30)" aria-hidden="true"><path d="M0 15V-36" stroke="#f9e9bc" strokeWidth="2" /><path d="M0-36H32L25-25 32-14H0Z" fill="#b96145" stroke="#f8d29b" strokeWidth="1" /><path d="M9-30L17-25 9-20Z" fill="#fff1d1" /></g>}
            </g>
          </g>;
        })}
        {!journal && <motion.g initial={{ x: pos.x - 55 * nodeScale, y: pos.y - 62 * nodeScale }} animate={walker} aria-hidden="true" className="palace-explorer"><g transform={`scale(${nodeScale * 1.08})`}><Explorer /></g></motion.g>}
        <g aria-hidden="true" transform="translate(865 805)" fill="none" stroke="#eee4b7"><circle r="29" opacity=".4" /><path d="M0-20L5 0 0 20-5 0Z" fill="#eee4b7" opacity=".8" /><path d="M-20 0H20" opacity=".4" /><text y="-38" textAnchor="middle" fill="#eee4b7" stroke="none" fontSize="13" fontFamily="serif">N</text></g>
      </svg>
    </div>
    <div className="palace-game-next">
      <span>{completed.length === 5 ? <Trophy size={18} /> : <Sparkles size={18} />}</span>
      <p>{journal ? t("Chạm vào điểm sáng để xem lại dấu ấn.", "Tap a bright stage to revisit your discovery.") : next ? <>{t("Màn tiếp theo", "Next stage")} <strong>{String(checkpoints.indexOf(next) + 1).padStart(2, "0")} · {next.name}</strong></> : t("Bạn đã khai mở trọn vẹn hành trình.", "You have unlocked the entire journey.")}</p>
      {!journal && next && <button onClick={() => onSelect(next.id)} aria-label={`${t("Chơi màn", "Play stage")} ${next.name}`}>{t("Chơi", "Play")} <Flag size={13} /></button>}
    </div>
    <div className="palace-map-controls">
      <span>{t("Kéo để khám phá", "Drag to explore")} <b>· {Math.round(zoom * 100)}%</b></span>
      <div>
        <button onClick={() => setZoom(z => Math.max(1, +(z - .2).toFixed(1)))} aria-label={t("Thu nhỏ bản đồ", "Zoom out map")} disabled={zoom <= 1}><Minus size={17} /></button>
        <button onClick={() => { setZoom(1); viewport.current?.scrollTo({ left: 0, top: 0, behavior: reduced ? "instant" : "smooth" }); }} aria-label={t("Về điểm đang chọn", "Center selected checkpoint")}><LocateFixed size={18} /></button>
        <button onClick={() => setZoom(z => Math.min(2.4, +(z + .2).toFixed(1)))} aria-label={t("Phóng to bản đồ", "Zoom in map")} disabled={zoom >= 2.4}><Plus size={17} /></button>
      </div>
    </div>
    <p className="palace-map-disclaimer">{t("Bản đồ minh họa cho trò chơi · Các tiểu cảnh được sắp xếp theo hành trình, không dùng chỉ đường thực địa.", "Illustrative game map · Dioramas are arranged for the journey, not physical navigation.")}</p>
  </div>;
}
