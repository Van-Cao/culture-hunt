import { Check, Flag, LockKeyhole } from "lucide-react";
import { useLanguage } from "@/components/UI/LanguageProvider";
import type { AtlasDestination, AtlasStop } from "@/lib/atlas/model";
import LandmarkModel from "./LandmarkModels";

export default function CampusMap({ destination, onSelect }: { destination: AtlasDestination; onSelect: (stop: AtlasStop) => void }) {
  const { t } = useLanguage();
  return <div className="atlas-campus-board">
    <div className="atlas-campus-title"><span className="atlas-eyebrow">THE KNOWLEDGE TRAIL / 03 CHAPTERS</span><h3>{t("Theo dấu một miền tri thức.", "Follow a trail of knowledge.")}</h3><p>{t("Ba chặng câu chuyện trong bản demo", "Three story chapters in this demo")}</p></div>
    <div className="atlas-campus-scene">
      <svg viewBox="0 0 800 460" aria-hidden="true"><defs><linearGradient id="atlas-campus-ground" x2="0" y2="1"><stop stopColor="#d8e0be" /><stop offset="1" stopColor="#b2c393" /></linearGradient></defs>
        <ellipse cx="400" cy="350" rx="325" ry="83" fill="#183c3222" /><path d="M78 210L376 88 722 208V325L424 429 78 313Z" fill="#819970" /><path d="M78 210L376 88 722 208 424 335Z" fill="url(#atlas-campus-ground)" stroke="#e8e8c8" strokeWidth="3" />
        <path d="M160 314Q205 171 399 233T645 280" stroke="#f5efd8" strokeWidth="22" fill="none" /><path d="M160 314Q205 171 399 233T645 280" stroke="#a9b894" strokeWidth="3" strokeDasharray="2 12" strokeLinecap="round" fill="none" />
        {[115, 235, 545, 675].map((x, i) => <g key={x} transform={`translate(${x} ${i % 2 ? 160 : 300})`}><ellipse cy="25" rx="20" ry="8" fill="#6a865c44" /><path d="M0-17V24" stroke="#8b8056" strokeWidth="5" /><ellipse cy="-22" rx="23" ry="36" fill="#709566" /><ellipse cx="-7" cy="-28" rx="13" ry="26" fill="#91ac7c" /></g>)}
        <svg x="225" y="0" width="350" height="270" viewBox="0 0 280 216"><LandmarkModel destination="hcmus" landscape={false} /></svg>
      </svg>
      {destination.stops.map((stop, i) => <button key={stop.id} style={{ left: `${[22, 50, 79][i]}%`, top: `${[63, 39, 65][i]}%` }} onClick={() => onSelect(stop)} className={`atlas-campus-node ${stop.done ? "is-complete" : ""}`} aria-label={`${stop.title} · ${stop.done ? t("Đã khai mở", "Completed") : t("Chưa mở", "Not completed")}`}><span>{stop.done ? <Check size={22} /> : <>{i + 1}<LockKeyhole size={12} /></>}</span><strong>{stop.title}</strong></button>)}
    </div>
    <p className="atlas-campus-note"><Flag size={14} />{t("Các mốc là chặng nội dung, được sắp xếp để minh họa hành trình; chưa đại diện vị trí phòng trong trường.", "These markers are story chapters arranged for the demo, rather than physical room locations.")}</p>
  </div>;
}
