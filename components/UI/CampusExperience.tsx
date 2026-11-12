"use client";

import { useState } from "react";
import Image from "next/image";
import { ArrowRight, BookOpen, Check, Flag, Gem, GraduationCap, Heart, LockKeyhole, MapPin, ScanLine, Share2, Trophy, Volume2, VolumeX, Zap } from "lucide-react";
import { useLanguage } from "./LanguageProvider";
import type { Place } from "./game-data";
import JourneyHeader from "./JourneyHeader";
import LandmarkModel from "@/components/atlas/LandmarkModels";
import "@/components/palace/palace.css";
import "@/components/palace/palace-map.css";
import "./campus.css";

export default function CampusExperience({
  place, completed, saved, sound, onSave, onSound, onOpenMission, onAchievement,
}: {
  place: Place;
  completed: number;
  saved: boolean;
  sound: boolean;
  onSave: () => void;
  onSound: () => void;
  onOpenMission: (index: number) => void;
  onAchievement: () => void;
}) {
  const { t } = useLanguage();
  const [picked, setPicked] = useState<number | null>(null);
  const total = place.missions.length;
  const selected = picked ?? Math.min(completed, total - 1);
  const mission = place.missions[selected];
  const done = selected < completed;
  const allComplete = completed === total;

  return (
    <section className="palace-experience campus-experience" aria-label={t("Hành trình ĐH Khoa học Tự nhiên", "University of Science journey")}>
      <JourneyHeader
        chapter="CHAPTER 02 / THE UNIVERSITY OF SCIENCE"
        edition="02"
        title={<>{t("Khám phá ", "Discover ")}<em>{place.shortName}.</em></>}
        description={t("Ba điểm dừng. Một chuyến đi theo dấu tri thức.", "Three stops. One journey following the trail of knowledge.")}
      >
        <span><Flag size={16} /><strong>{completed}<small>/{total}</small></strong>{t("đã khai mở", "uncovered")}</span>
        <span><Zap size={16} /><strong>{completed * 150}</strong>XP</span>
        <span className="palace-save-label"><span />{t("Tiến độ lưu trên trình duyệt này", "Progress saved in this browser")}</span>
        <div className="campus-actions">
          <button className="icon-button" onClick={onSave} aria-pressed={saved} aria-label={saved ? t("Bỏ lưu địa điểm", "Unsave destination") : t("Lưu địa điểm", "Save destination")}><Heart size={17} fill={saved ? "currentColor" : "none"} /></button>
          <button className="icon-button" onClick={onSound} aria-pressed={sound} aria-label={sound ? t("Tắt âm thanh", "Mute sound") : t("Bật âm thanh", "Enable sound")}>{sound ? <Volume2 size={17} /> : <VolumeX size={17} />}</button>
        </div>
      </JourneyHeader>

      <div className="palace-play-layout">
        <div className="palace-atlas palace-game-atlas">
          <div className="palace-atlas-bar">
            <span><GraduationCap size={16} />{place.shortName}</span>
            <span>{t("CHƯƠNG 02", "CHAPTER 02")}<i />{total} {t("MÀN KHÁM PHÁ", "DISCOVERIES")}</span>
          </div>
          <div className="palace-game-hud">
            <div className="palace-game-hud-title">
              <span><Flag size={21} /></span>
              <div><small>{t("HÀNH TRÌNH CỦA BẠN", "YOUR JOURNEY")}</small><strong>{t("Đánh thức những miền tri thức", "Awaken a world of knowledge")}</strong></div>
            </div>
            <div className="palace-game-gems" aria-label={`${completed}/${total}`}>
              <span>{place.missions.map((_, index) => <Gem key={index} size={15} className={index < completed ? "gem-earned" : ""} />)}</span>
              <strong>{completed}<small> / {total}</small></strong>
            </div>
          </div>
          <div className="campus-journey-scene">
            <LandmarkModel destination="hcmus" className="campus-journey-landmark" />
            <div className="campus-journey-stops" role="group" aria-label={t("Các điểm dừng trong hành trình", "Journey stops")}>
              {place.missions.map((item, index) => {
                const locked = index > completed;
                const isDone = index < completed;
                return (
                  <button key={item.title} disabled={locked} aria-pressed={selected === index} onClick={() => setPicked(index)} className={`campus-journey-stop ${isDone ? "is-complete" : ""} ${locked ? "is-locked" : ""}`}>
                    <span className="campus-stop-number">{isDone ? <Check size={24} /> : locked ? <LockKeyhole size={22} /> : String(index + 1).padStart(2, "0")}</span>
                    <strong>{item.title}</strong>
                    <small>{isDone ? t("Đã khai mở", "Uncovered") : locked ? t("Chưa mở khóa", "Locked") : t("Sẵn sàng khám phá", "Ready to explore")}</small>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="palace-game-next">
            <span>{allComplete ? <Trophy size={23} /> : <Flag size={23} />}</span>
            <p><strong>{allComplete ? t("Hành trình trọn vẹn!", "Journey complete!") : t("Mỗi khám phá, một dấu ấn.", "Every discovery leaves a mark.")}</strong>{allComplete ? place.badge : t("Theo những điểm dừng để mở câu chuyện của trường.", "Follow the stops to uncover the university’s story.")}</p>
            <button onClick={() => allComplete ? onAchievement() : onOpenMission(completed)}>{allComplete ? t("Dấu ấn", "Reward") : t("Tiếp tục", "Continue")}<ArrowRight size={15} /></button>
          </div>
          <p className="palace-map-disclaimer">{t("Sơ đồ minh họa ba chặng câu chuyện, không phải vị trí phòng trong trường.", "The map illustrates three story chapters, rather than physical room locations.")}</p>
        </div>

        <aside className="palace-quest-panel">
          <div className="palace-quest-photo">
            <Image src={place.coverImage} alt={place.name} fill sizes="(max-width: 800px) 100vw, 320px" loading="eager" />
            <span>CHECKPOINT {String(selected + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}</span>
          </div>
          <div className="palace-quest-copy">
            <span className="palace-overline"><MapPin size={12} />{t("Theo dấu tri thức", "The knowledge trail")}</span>
            <h3>{mission.title}</h3>
            <p>{mission.subtitle}</p>
            <div className="palace-quest-reward">
              <span><Zap size={14} />{done ? t("XP đã ghi nhận", "XP already earned") : "+150 XP"}</span>
              <span><BookOpen size={14} />{t("Câu chuyện & câu đố", "Story & quiz")}</span>
            </div>
            <button className="palace-button" onClick={() => onOpenMission(selected)}>{done ? <BookOpen size={17} /> : <ScanLine size={17} />}{done ? t("Xem dấu ấn", "View discovery") : t("Khám phá điểm này", "Explore this checkpoint")}<ArrowRight size={16} /></button>
          </div>
        </aside>
      </div>

      <div className="palace-legend">
        <span><i className="legend-available" />{t("Sẵn sàng khám phá", "Ready to explore")}</span>
        <span><i className="legend-locked" />{t("Chưa mở khóa", "Locked")}</span>
        <span><Check size={13} />{t("Đã khai mở", "Uncovered")}</span>
      </div>
      <div className="campus-reward">
        <Trophy size={30} />
        <div><span className="palace-overline">{t("PHẦN THƯỞNG ĐÍCH ĐẾN", "DESTINATION REWARD")}</span><h3>{place.badge}</h3><p>{allComplete ? t("Bạn đã chinh phục hành trình này!", "You conquered this journey!") : t("Hoàn thành đủ 3 thử thách để mở khóa.", "Complete all 3 challenges to unlock.")}</p></div>
        {allComplete && <button className="icon-button" onClick={onAchievement} aria-label={t("Chia sẻ thành tích", "Share achievement")}><Share2 size={18} /></button>}
      </div>
    </section>
  );
}
