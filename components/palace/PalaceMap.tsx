"use client";
import { useEffect, useRef, useState, useId } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  Check,
  Compass,
  LockKeyhole,
  Minus,
  Plus,
  LocateFixed,
  Camera,
} from "lucide-react";
import { getCheckpoints, type CheckpointId } from "@/lib/palace/checkpoints";
import { useLanguage } from "@/components/UI/LanguageProvider";

const routes = [
  "M485 630 C485 545 485 480 485 420",
  "M485 420 C485 350 295 390 295 290",
  "M295 290 C295 160 685 145 685 245",
  "M685 245 C830 240 905 380 850 450 S775 480 775 550",
];
const trees = [
  [130, 150],
  [180, 115],
  [100, 245],
  [155, 310],
  [120, 400],
  [135, 520],
  [180, 620],
  [245, 655],
  [80, 585],
  [850, 120],
  [900, 175],
  [875, 275],
  [920, 365],
  [905, 600],
  [835, 655],
  [730, 680],
  [370, 105],
  [500, 100],
  [620, 110],
];

export default function PalaceMap({
  completed,
  recognized = [],
  available,
  selected,
  actor,
  journal = false,
  onSelect,
}: {
  completed: CheckpointId[];
  recognized?: CheckpointId[];
  available?: CheckpointId;
  selected: CheckpointId;
  actor: CheckpointId;
  journal?: boolean;
  onSelect: (id: CheckpointId) => void;
}) {
  const { locale, t } = useLanguage();
  const checkpoints = getCheckpoints(locale);
  const [zoom, setZoom] = useState(1);
  const [mapWidth, setMapWidth] = useState(1000);
  const viewport = useRef<HTMLDivElement>(null);
  const dragging = useRef<{
    x: number;
    left: number;
    y: number;
    top: number;
  } | null>(null);
  const reduced = useReducedMotion();
  const uid = useId().replace(/:/g, "");
  const pos = checkpoints.find((c) => c.id === actor)!;
  const active = checkpoints.find((c) => c.id === selected)!;
  const nodeScale = Math.max(1, 700 / Math.max(280, mapWidth * zoom));
  useEffect(() => {
    const container = viewport.current;
    if (!container) return;
    const observer = new ResizeObserver((entries) => {
      const width = entries[0].contentRect.width;
      if (width > 0) setMapWidth(width);
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    const container = viewport.current;
    if (container)
      container.scrollTo({
        left:
          (active.x / 1000) * container.scrollWidth - container.clientWidth / 2,
        behavior: reduced ? "instant" : "smooth",
      });
  }, [active.x, zoom, reduced]);
  const completedSet = new Set(completed);
  const interiorOpen = completed.some((id) =>
    ["reception", "cabinet", "rooftop"].includes(id),
  );
  return (
    <div className="palace-atlas">
      <div className="palace-atlas-bar">
        <span>
          <Compass size={15} />
          {t("SA BÀN DI SẢN", "THE HERITAGE ATLAS")}
        </span>
        <span>10.7770° N · 106.6953° E</span>
      </div>
      <div
        className="palace-map-viewport"
        ref={viewport}
        onPointerDown={(event) => {
          if (
            event.pointerType !== "mouse" ||
            (event.target as Element).closest("button")
          )
            return;
          dragging.current = {
            x: event.clientX,
            y: event.clientY,
            left: event.currentTarget.scrollLeft,
            top: event.currentTarget.scrollTop,
          };
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          if (!dragging.current) return;
          event.currentTarget.scrollLeft =
            dragging.current.left - event.clientX + dragging.current.x;
          event.currentTarget.scrollTop =
            dragging.current.top - event.clientY + dragging.current.y;
        }}
        onPointerUp={() => {
          dragging.current = null;
        }}
        onPointerCancel={() => {
          dragging.current = null;
        }}
      >
        <svg
          viewBox="0 0 1000 740"
          className="palace-map-svg"
          style={{ width: `${zoom * 100}%`, minWidth: 0 }}
          role="group"
          aria-label={t(
            "Bản đồ hành trình Dinh Độc Lập, 5 checkpoint",
            "Independence Palace journey map, five checkpoints",
          )}
        >
          <defs>
            <pattern
              id={`${uid}-grid`}
              width="25"
              height="25"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M25 0H0V25"
                fill="none"
                stroke="#637e7020"
                strokeWidth=".7"
              />
            </pattern>
            <pattern
              id={`${uid}-roof`}
              width="12"
              height="12"
              patternUnits="userSpaceOnUse"
            >
              <path d="M0 0V12" stroke="#a8aaa0" strokeWidth="2" />
            </pattern>
            <filter
              id={`${uid}-shadow`}
              x="-30%"
              y="-30%"
              width="160%"
              height="160%"
            >
              <feDropShadow
                dx="0"
                dy="9"
                stdDeviation="8"
                floodColor="#153c3420"
              />
            </filter>
            <symbol id={`${uid}-tree`} viewBox="0 0 70 70">
              <ellipse cx="39" cy="47" rx="26" ry="18" fill="#284b2c12" />
              <circle cx="32" cy="31" r="24" fill="#859781" />
              <circle cx="25" cy="25" r="18" fill="#9dab8d" />
              <circle cx="40" cy="27" r="16" fill="#789071" />
              <circle cx="27" cy="19" r="10" fill="#a9b59a" />
            </symbol>
          </defs>
          <rect width="1000" height="740" fill="#e9eade" />
          <rect width="1000" height="740" fill={`url(#${uid}-grid)`} />
          <path
            d="M80 88H920V675H80Z"
            fill="none"
            stroke="#bdc7b4"
            strokeWidth="2"
          />
          <path
            d="M80 88H920M80 675H420M555 675H920"
            stroke="#d2d8c8"
            strokeWidth="15"
          />
          <rect
            x="193"
            y="145"
            width="600"
            height="465"
            rx="20"
            fill="#d7dfca"
          />
          <path
            d="M225 180H750V490H225Z"
            fill="#c8d0bf"
            stroke="#acbaa4"
            strokeWidth="1"
          />
          <path
            d="M250 205H750V480H250Z"
            fill="#8b998c"
            opacity=".22"
            transform="translate(10 15)"
          />
          <g filter={`url(#${uid}-shadow)`}>
            <path
              d="M245 180H755V463H245Z"
              fill={interiorOpen ? "#e7dfcd" : "#a9b4a7"}
              stroke="#849781"
              strokeWidth="2"
            />
            <path d="M245 180H755V205H245Z" fill="#f3eee0" />
            <rect
              x="265"
              y="222"
              width="185"
              height="122"
              fill={completedSet.has("cabinet") ? "#e8ddbd" : "#9aa99b"}
              stroke="#789080"
              strokeWidth="2"
            />
            <rect
              x="285"
              y="240"
              width="145"
              height="84"
              fill={`url(#${uid}-roof)`}
              opacity=".6"
            />
            <rect
              x="470"
              y="222"
              width="128"
              height="122"
              fill="#c2cbb9"
              stroke="#8d9d8b"
              strokeWidth="2"
            />
            <path
              d="M480 235H587M480 250H587M480 265H587M480 280H587M480 295H587M480 310H587"
              stroke="#99ab96"
              strokeWidth="2"
            />
            <rect
              x="620"
              y="210"
              width="115"
              height="135"
              fill={completedSet.has("rooftop") ? "#b8c5ac" : "#94a695"}
              stroke="#7d927e"
              strokeWidth="2"
            />
            <circle
              cx="678"
              cy="266"
              r="41"
              fill="none"
              stroke="#e5eadb"
              strokeWidth="3"
            />
            <path
              d="M663 248V284M692 248V284M663 266H692"
              stroke="#e5eadb"
              strokeWidth="4"
            />
            <path
              d="M245 363H755V463H245Z"
              fill={completedSet.has("reception") ? "#e6d3b6" : "#a6b2a4"}
              stroke="#8b9c87"
              strokeWidth="2"
            />
            <rect
              x="340"
              y="379"
              width="320"
              height="67"
              fill={completedSet.has("reception") ? "#c3a590" : "#8fa08f"}
            />
            <path
              d="M245 463H755L738 484H263Z"
              fill="#c1bcaa"
              stroke="#86967f"
            />
            {Array.from({ length: 22 }, (_, i) => (
              <rect
                key={i}
                x={254 + i * 23}
                y="465"
                width="7"
                height="13"
                fill="#f6f2e5"
              />
            ))}
            <path
              d="M450 484H550L575 515H425Z"
              fill="#dbd7c9"
              stroke="#b6bca9"
            />
            <path d="M442 492H558M435 500H565M428 508H572" stroke="#a6ae9d" />
          </g>
          <path
            d="M265 525H425V645H265Z M575 525H735V645H575Z"
            fill="#b4c5a2"
          />
          <path d="M485 515V675" stroke="#e1dcca" strokeWidth="50" />
          <ellipse
            cx="485"
            cy="590"
            rx="82"
            ry="59"
            fill="#c5c9b7"
            stroke="#ebeadb"
            strokeWidth="8"
          />
          <ellipse
            cx="485"
            cy="590"
            rx="61"
            ry="43"
            fill={completedSet.has("facade") ? "#9bbab2" : "#a1b2a7"}
            stroke="#aabbaa"
            strokeWidth="2"
          />
          <ellipse
            cx="485"
            cy="590"
            rx="30"
            ry="21"
            fill="none"
            stroke="#d8e5da"
            strokeWidth="2"
          />
          <g opacity={completedSet.has("bunker") ? 1 : 0.65}>
            <rect
              x="726"
              y="486"
              width="128"
              height="127"
              rx="4"
              fill="#b3bcad"
              stroke="#7c927e"
              strokeWidth="2"
              strokeDasharray="5 4"
            />
            <path
              d="M740 500H840V596H740Z M740 533H840 M790 500V596"
              fill="none"
              stroke="#e5e7d8"
              strokeWidth="3"
            />
          </g>
          {trees.map(([x, y], i) => (
            <use
              key={i}
              href={`#${uid}-tree`}
              x={x - 30}
              y={y - 30}
              width="65"
              height="65"
            />
          ))}
          <g
            fill="#627665"
            fontFamily="var(--font-geist-mono), monospace"
            fontSize="12"
            letterSpacing="2"
          >
            <text x="475" y="160" textAnchor="middle">
              DINH ĐỘC LẬP
            </text>
            <text x="485" y="714" textAnchor="middle">
              NAM KỲ KHỞI NGHĨA
            </text>
            <text x="791" y="638" textAnchor="middle">
              {t("TẦNG HẦM", "BASEMENT")}
            </text>
          </g>
          <g transform="translate(880 45)" fill="#47604d">
            <path d="M0 0L-8 25L0 20L8 25Z" />
            <text y="-9" textAnchor="middle" fontSize="13">
              N
            </text>
          </g>
          {routes.map((route, index) => (
            <g key={route}>
              <path
                d={route}
                fill="none"
                stroke="#f4f0e2"
                strokeWidth="11"
                strokeLinecap="round"
              />
              <path
                d={route}
                fill="none"
                stroke={
                  completedSet.has(checkpoints[index].id)
                    ? "#9f7d41"
                    : "#83947c"
                }
                strokeWidth="3"
                strokeDasharray={
                  completedSet.has(checkpoints[index].id) ? undefined : "6 8"
                }
                strokeLinecap="round"
              />
            </g>
          ))}
          {checkpoints.map((cp, index) => {
            const done = completedSet.has(cp.id),
              identified = recognized.includes(cp.id);
            const locked =
              !journal && !done && !identified && cp.id !== available;
            return (
              <g
                key={cp.id}
                className={done ? "palace-node-lit" : ""}
                transform={`translate(${cp.x} ${cp.y}) scale(${nodeScale}) translate(${-cp.x} ${-cp.y})`}
              >
                {done && (
                  <circle
                    cx={cp.x}
                    cy={cp.y}
                    r="48"
                    fill="#d8c28e55"
                    stroke="#b4955344"
                  />
                )}
                {cp.id === available && !done && !journal && (
                  <circle
                    className="palace-node-pulse"
                    cx={cp.x}
                    cy={cp.y}
                    r="43"
                    fill="none"
                    stroke="#bda466"
                    strokeWidth="2"
                  />
                )}
                <foreignObject
                  x={cp.x - 76}
                  y={cp.y - 33}
                  width="152"
                  height="108"
                >
                  <div
                    className={`palace-map-node ${done ? "is-complete" : locked ? "is-locked" : "is-available"} ${selected === cp.id ? "is-selected" : ""}`}
                  >
                    <button
                      type="button"
                      onClick={() => onSelect(cp.id)}
                      aria-label={`${index + 1}. ${cp.name} · ${done ? t("Đã khai mở", "Completed") : locked ? t("Chưa mở", "Locked") : t("Khám phá", "Explore")}`}
                      aria-pressed={selected === cp.id}
                      aria-disabled={locked}
                    >
                      {done ? (
                        <Check size={27} />
                      ) : locked ? (
                        <LockKeyhole size={22} />
                      ) : identified ? (
                        <Camera size={25} />
                      ) : (
                        <span>{String(index + 1).padStart(2, "0")}</span>
                      )}
                    </button>
                    <span>{cp.name}</span>
                  </div>
                </foreignObject>
              </g>
            );
          })}
          {!journal && (
            <motion.g
              initial={false}
              animate={{ x: pos.x + 44 * nodeScale, y: pos.y - 72 * nodeScale }}
              transition={
                reduced
                  ? { duration: 0 }
                  : { type: "spring", stiffness: 50, damping: 18 }
              }
              aria-hidden="true"
            >
              <g transform={`scale(${nodeScale})`}>
                <ellipse cy="56" rx="17" ry="6" fill="#1d3f3525" />
                <path
                  d="M-7 35L-9 52M7 35L9 52"
                  stroke="#3b4b3e"
                  strokeWidth="6"
                  strokeLinecap="round"
                />
                <path
                  d="M-10 17Q0 10 10 17L13 36H-13Z"
                  fill="#295b4b"
                  stroke="#e6e2cb"
                  strokeWidth="1.5"
                />
                <path
                  d="M-11 20L-18 31M11 20L18 29"
                  stroke="#d8ba8b"
                  strokeWidth="5"
                  strokeLinecap="round"
                />
                <circle cy="7" r="11" fill="#dfc294" />
                <path
                  d="M-18 4Q0 11 18 4L12 0L8-10H-8L-12 0Z"
                  fill="#e5d8b5"
                  stroke="#8d7e58"
                  strokeWidth="1.5"
                />
                <path d="M-5 20L7 34" stroke="#c4aa6a" strokeWidth="3" />
              </g>
            </motion.g>
          )}
        </svg>
      </div>
      <div className="palace-map-controls">
        <span>{t("Kéo để khám phá", "Drag to explore")}</span>
        <div>
          <button
            onClick={() => setZoom((z) => Math.max(1, z - 0.2))}
            aria-label={t("Thu nhỏ bản đồ", "Zoom out map")}
            disabled={zoom <= 1}
          >
            <Minus size={17} />
          </button>
          <button
            onClick={() => {
              setZoom(1);
              const el = viewport.current;
              if (el)
                el.scrollTo({
                  left: (active.x / 1000) * el.scrollWidth - el.clientWidth / 2,
                  behavior: "smooth",
                });
            }}
            aria-label={t("Về điểm đang chọn", "Center selected checkpoint")}
          >
            <LocateFixed size={18} />
          </button>
          <button
            onClick={() => setZoom((z) => Math.min(2.4, z + 0.2))}
            aria-label={t("Phóng to bản đồ", "Zoom in map")}
            disabled={zoom >= 2.4}
          >
            <Plus size={17} />
          </button>
        </div>
      </div>
      <p className="palace-map-disclaimer">
        {t(
          "Sa bàn minh họa theo chủ đề · Vị trí các điểm được bố trí cho trò chơi, không dùng chỉ đường thực địa.",
          "Illustrative game atlas · Checkpoint positions are arranged for gameplay, not physical navigation.",
        )}
      </p>
    </div>
  );
}
