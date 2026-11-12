"use client";
import { useEffect, useRef, useState } from "react";
import type { Map as LibreMap } from "maplibre-gl";
import { Compass, LocateFixed, Minus, Plus } from "lucide-react";
import { destinationLocations, type AtlasDestination, type DestinationId } from "@/lib/atlas/model";
import { useLanguage } from "@/components/UI/LanguageProvider";
import "maplibre-gl/dist/maplibre-gl.css";

const bounds: [[number, number], [number, number]] = [[106.671, 10.755], [106.705, 10.784]];
export function LandmarkDrawing({ campus = false }: { campus?: boolean }) {
  return <svg viewBox="0 0 112 96" aria-hidden="true" className="atlas-landmark-art">
    <ellipse cx="56" cy="82" rx="42" ry="9" fill="#183c3230" />
    <path d="M11 72L52 57 103 71 62 88Z" fill="#b3c394" stroke="#eee7c6" strokeWidth="1.5" />
    <path d="M17 34L48 24 96 38 64 49Z" fill="#f2ecd4" />
    <path d="M17 34V66L64 80V49Z" fill="#e8e3cc" />
    <path d="M64 49L96 38V69L64 80Z" fill="#aebda4" />
    <path d="M17 42L64 56 96 45M17 52L64 66 96 55M17 62L64 76 96 65" stroke="#91a58b" strokeWidth="2" fill="none" />
    {Array.from({ length: 10 }, (_, i) => <path key={i} d={`M${21 + i * 4.2} ${37 + i * 1.3}v26`} stroke="#fffae4" strokeWidth={campus ? "2" : "2.7"} />)}
    <path d="M39 62L53 66V77L39 73Z" fill="#315a4b" />
    <path d="M37 74L54 79 62 83 43 78Z" fill="#f3ecd4" />
    {campus ? <><path d="M37 28L56 13 78 31 59 37Z" fill="#c5c4a0" /><path d="M45 29L56 20 69 31" stroke="#f3edcb" fill="none" /><path d="M58 39V48" stroke="#728e76" strokeWidth="2" /></> : <><path d="M48 25V6" stroke="#746544" strokeWidth="1.4" /><path d="M49 6L65 11 49 17Z" fill="#b65f42" /><path d="M54 10l1 2 2 0-2 1 0 2-2-1-1 0 1-2-1-1Z" fill="#f5d888" /></>}
  </svg>;
}

export default function CityMap({ destinations, onOpen }: { destinations: AtlasDestination[]; onOpen: (id: DestinationId) => void }) {
  const { t } = useLanguage();
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<LibreMap | null>(null);
  const [ready, setReady] = useState(false);
  const [points, setPoints] = useState<{ x: number; y: number }[]>([]);
  useEffect(() => {
    let disposed = false;
    let failed = false;
    let instance: LibreMap | undefined;
    let resize: ResizeObserver | undefined;
    async function mount() {
      try {
        const lib = await import("maplibre-gl");
        if (disposed || !container.current) return;
        lib.setWorkerUrl(new URL("maplibre-gl/dist/maplibre-gl-worker.mjs", import.meta.url).toString());
        instance = new lib.Map({ container: container.current, style: "/maps/hcmc-style.json", center: [106.69, 10.771], zoom: 13, minZoom: 11, maxZoom: 17, renderWorldCopies: false, cooperativeGestures: true, attributionControl: false, canvasContextAttributes: { antialias: true } });
        map.current = instance;
        const positionMarkers = () => {
          if (disposed || !instance) return;
          setPoints(destinationLocations.map(d => { const p = instance!.project(d.coordinates); return { x: p.x, y: p.y }; }));
        };
        instance.fitBounds(bounds, { padding: { top: 85, bottom: 70, left: 45, right: 45 }, duration: 0 });
        instance.on("move", positionMarkers);
        instance.on("load", () => { if (!disposed && !failed) { setReady(true); positionMarkers(); } });
        const showFallback = () => {
          failed = true;
          if (!disposed) setReady(false);
        };
        instance.on("webglcontextlost", showFallback);
        // A local schematic remains usable if WebGL, tiles or the network are unavailable.
        instance.on("error", showFallback);
        resize = new ResizeObserver(() => { if (!disposed && instance) { instance.resize(); instance.fitBounds(bounds, { padding: { top: 85, bottom: 70, left: 45, right: 45 }, duration: 0 }); positionMarkers(); } });
        resize.observe(container.current);
      } catch {
        if (!disposed) setReady(false);
      }
    }
    void mount();
    return () => { disposed = true; resize?.disconnect(); instance?.remove(); map.current = null; };
  }, []);
  const reset = () => map.current?.fitBounds(bounds, { padding: { top: 85, bottom: 70, left: 45, right: 45 }, duration: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 700 });
  return <div className="atlas-city-map" role="region" aria-label={t("Bản đồ dấu ấn TP.HCM", "Ho Chi Minh City discovery map")}>
    <div className="atlas-city-map-heading"><span><Compass size={15} />{t("THÀNH PHỐ HỒ CHÍ MINH", "HO CHI MINH CITY")}</span><span>{ready ? t("BẢN ĐỒ ĐỊA LÝ", "GEOGRAPHIC MAP") : t("BẢN ĐỒ GIẢN LƯỢC", "SCHEMATIC MAP")}</span></div>
    <div className="atlas-map-stage">
      <svg className="atlas-map-fallback" viewBox="0 0 800 630" preserveAspectRatio="none" aria-hidden="true">
        <defs><pattern id="atlas-city-grid" width="82" height="65" patternUnits="userSpaceOnUse" patternTransform="rotate(-28)"><rect width="82" height="65" fill="#e5e8d9" /><rect x="7" y="7" width="66" height="50" rx="4" fill="#d9dfcc" /><path d="M0 0H82V65" stroke="#f8f5e8" strokeWidth="8" fill="none" /></pattern></defs>
        <rect width="800" height="630" fill="url(#atlas-city-grid)" /><path d="M715-30Q600 80 692 170T748 338 703 491 825 640" fill="none" stroke="#a3c4bb" strokeWidth="75" /><path d="M30 605Q285 417 510 531T820 556" fill="none" stroke="#acc8bf" strokeWidth="23" />
        <path d="M-40 170L710 610M70-20L780 439M-20 470L550 25" stroke="#faf7e9" strokeWidth="14" /><path d="M251 81L407 132 342 233 220 194Z" fill="#bdd0ad" /><path d="M490 285L558 318 518 375 450 343Z" fill="#c1d4b3" />
        <text x="542" y="210" fill="#678c80" fontSize="12" transform="rotate(65 542 210)">Sông Sài Gòn</text>
      </svg>
      <div ref={container} className={`atlas-live-map ${ready ? "is-ready" : ""}`} />
      <div className="atlas-city-caption" aria-hidden="true"><span>SAIGON</span><small>{t("NHỮNG CÂU CHUYỆN ĐANG CHỜ", "STORIES WAITING TO BE FOUND")}</small></div>
      {destinations.map((d, i) => {
        const fallbackPoint = d.id === "palace" ? { x: "65%", y: "36%" } : { x: "30%", y: "72%" };
        const point = ready && points[i] ? { x: `${points[i].x}px`, y: `${points[i].y}px` } : fallbackPoint;
        return <button key={d.id} className={`atlas-map-marker ${d.completed === d.total ? "is-complete" : d.completed ? "is-progress" : "is-unvisited"}`} style={{ left: point.x, top: point.y }} onClick={() => onOpen(d.id)} aria-label={`${d.shortTitle} · ${d.completed}/${d.total} ${t("checkpoint · Xem bản đồ", "checkpoints · Open map")}`}>
          <span className="atlas-map-halo" /><LandmarkDrawing campus={d.id === "hcmus"} /><span className="atlas-marker-label"><strong>{d.id === "palace" ? t("Dinh Độc Lập", "Independence Palace") : t("ĐH KHTN", "University of Science")}</strong><small>{d.completed}/{d.total} {t("dấu ấn", "discoveries")}</small></span>
        </button>;
      })}
      <div className="atlas-map-tools"><button aria-label={t("Phóng to bản đồ thành phố", "Zoom in city map")} onClick={() => map.current?.zoomIn()} disabled={!ready}><Plus size={17} /></button><button aria-label={t("Thu nhỏ bản đồ thành phố", "Zoom out city map")} onClick={() => map.current?.zoomOut()} disabled={!ready}><Minus size={17} /></button><button aria-label={t("Xem toàn bộ địa điểm", "Fit all destinations")} onClick={reset} disabled={!ready}><LocateFixed size={17} /></button></div>
      <div className="atlas-map-scale" aria-hidden="true"><span>N ↑</span><i /><small>{ready ? t("Kéo để khám phá", "Drag to explore") : t("Chạm địa điểm để xem hành trình", "Tap a destination to open its journey")}</small></div>
    </div>
    <div className="atlas-city-map-footer"><span><i />{t("Hoàn thành thử thách để thắp sáng bản đồ", "Complete challenges to illuminate your map")}</span><span>© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> · <a href="https://openmaptiles.org/" target="_blank" rel="noreferrer">OpenMapTiles</a> · <a href="https://openfreemap.org/" target="_blank" rel="noreferrer">OpenFreeMap</a></span></div>
  </div>;
}
