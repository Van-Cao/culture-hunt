"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import {
  ArrowRight,
  AudioLines,
  ExternalLink,
  Pause,
  Play,
  ScrollText,
  Sparkles,
} from "lucide-react";
import type { Mission, Place } from "./game-data";
import { useLanguage } from "./LanguageProvider";

export default function StoryCard({
  mission,
  onQuiz,
  sound,
  place,
  completed,
}: {
  mission: Mission;
  onQuiz: () => void;
  sound: boolean;
  place: Place;
  completed: boolean;
}) {
  const { t, locale } = useLanguage();
  const [playing, setPlaying] = useState(false);
  const [audioStatus, setAudioStatus] = useState("");
  useEffect(
    () => () => {
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    },
    [],
  );
  function toggleAudio() {
    if (!("speechSynthesis" in window)) {
      setAudioStatus(
        t(
          "Trình duyệt này chưa hỗ trợ đọc văn bản. Bạn vẫn có thể đọc câu chuyện bên dưới.",
          "Text-to-speech is unavailable. You can still read the story below.",
        ),
      );
      return;
    }
    if (!sound) {
      setAudioStatus(
        t(
          "Bật âm thanh trên thanh công cụ để nghe câu chuyện nhé.",
          "Enable sound in the toolbar to listen to this story.",
        ),
      );
      return;
    }
    if (playing) {
      window.speechSynthesis.cancel();
      setPlaying(false);
      return;
    }
    window.speechSynthesis.cancel();
    const speech = new SpeechSynthesisUtterance(
      `${mission.storyTitle}. ${mission.story}`,
    );
    speech.lang = locale === "vi" ? "vi-VN" : "en-US";
    speech.rate = 0.92;
    speech.onend = () => setPlaying(false);
    speech.onerror = () => {
      setPlaying(false);
      setAudioStatus(
        t(
          "Không phát được giọng đọc. Bạn có thể tiếp tục với văn bản.",
          "Audio unavailable. You can continue with the written story.",
        ),
      );
    };
    const voice = window.speechSynthesis
      .getVoices()
      .find((v) => v.lang.startsWith(locale));
    if (voice) speech.voice = voice;
    window.speechSynthesis.speak(speech);
    setPlaying(true);
    setAudioStatus(
      voice
        ? t("Đang kể câu chuyện…", "Telling the story…")
        : t(
            "Giọng đọc tùy thuộc vào tiếng Việt trên thiết bị của bạn.",
            "Voice availability depends on your device.",
          ),
    );
  }
  return (
    <div className="story-content">
      <div className="story-art">
        <span className="rarity-label">
          <Sparkles size={13} />
          {place.tag}
        </span>
        <Image
          src={place.image}
          alt={place.name}
          width={500}
          height={400}
          className="story-place-image"
        />
        <span className="artifact-number">
          {t("ĐIỂM KHÁM PHÁ", "DISCOVERY")} #00{place.id === "palace" ? 1 : 2}
        </span>
        <h3>{place.shortName}</h3>
        <span className="muted">
          {t("Thành phố Hồ Chí Minh", "Ho Chi Minh City")}
        </span>
      </div>
      <div className="story-copy">
        <div className="eyebrow accent">
          <ScrollText size={14} />
          {t("ĐÃ MỞ KHÓA CÂU CHUYỆN", "STORY UNLOCKED")}
        </div>
        <h2>{mission.storyTitle}</h2>
        <button
          className={`audio-player ${playing ? "playing" : ""}`}
          onClick={toggleAudio}
          aria-label={
            playing
              ? t("Dừng nghe câu chuyện", "Stop story audio")
              : t("Nghe câu chuyện", "Listen to the story")
          }
        >
          <span className="audio-play">
            {playing ? (
              <Pause size={18} fill="currentColor" />
            ) : (
              <Play size={18} fill="currentColor" />
            )}
          </span>
          <span>
            <strong>
              {playing
                ? t("Đang kể chuyện…", "Telling the story…")
                : t("Lắng nghe câu chuyện", "Listen to the story")}
            </strong>
            <small>
              {t(
                "Tiếng Việt · Giọng đọc thiết bị",
                "English · Device text-to-speech",
              )}
            </small>
          </span>
          <AudioLines size={25} />
        </button>
        <p className="story-text">{mission.story}</p>
        <p className="audio-status" role="status">
          {audioStatus}
        </p>
        <div className="story-fact">
          <Sparkles size={17} />
          {mission.fact}
        </div>
        <a
          className="source-link"
          href={place.source}
          target="_blank"
          rel="noreferrer"
        >
          {t("Nguồn", "Source")}: {place.sourceName}
          <ExternalLink size={12} />
        </a>
        <button className="primary-button" onClick={onQuiz}>
          {completed
            ? t("Đã giải mã · Quay lại", "Decoded · Go back")
            : t("Sẵn sàng giải mã", "Ready to decode")}
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}
