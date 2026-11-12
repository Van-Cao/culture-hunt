"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ArrowRight, AudioLines, BookOpen, Check, ExternalLink, Headphones, Pause, Play, RotateCcw, Trophy, Volume2 } from "lucide-react";
import { useLanguage, type Locale } from "@/components/UI/LanguageProvider";
import { getCheckpoints, type CheckpointId } from "@/lib/palace/checkpoints";
import stories from "@/content/palace/stories.json";
import manifest from "@/public/audio/palace/manifest.json";
import "./minigames.css";

type Track = { src: string; voice: string; duration: number; provider?: string };
const tracks = manifest.tracks as Record<string, Partial<Record<Locale, Track>>>;
const clock = (seconds: number) => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;

export default function CheckpointStory({ checkpointId, unlocked, sound, onContinue, onBonus, bonusComplete, reviewing = false, reward = null }: {
  checkpointId: CheckpointId; unlocked: boolean; sound: boolean; onContinue: () => void;
  onBonus?: () => void; bonusComplete: boolean; reviewing?: boolean;
  reward?: number | null;
}) {
  const { locale, t, setLocale } = useLanguage();
  const audio = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [error, setError] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [audioOptIn, setAudioOptIn] = useState(false);
  const story = stories.stories[checkpointId][locale];
  const checkpoint = getCheckpoints(locale).find(cp => cp.id === checkpointId)!;
  const track = tracks[checkpointId]?.[locale];
  const google = track?.provider?.startsWith("Google") || track?.voice.startsWith("Google");
  const voiceName = google ? "Google" : track?.voice.includes("Jenny") ? "Jenny" : "HoaiMy";
  const duration = track?.duration || 0;
  useEffect(() => { const media = audio.current; return () => { media?.pause(); }; }, []);
  useEffect(() => { if (!sound && !audioOptIn) audio.current?.pause(); }, [sound, audioOptIn]);
  async function toggle() {
    const media = audio.current;
    if (!media) return;
    if (!media.paused) { media.pause(); return; }
    setAudioOptIn(true); setError(false);
    try { await media.play(); } catch { setError(true); setPlaying(false); }
  }
  if (!unlocked) return <div className="checkpoint-story-locked"><BookOpen size={28} /><h2>{t("Câu chuyện đang chờ được mở", "A story waiting to be unlocked")}</h2><p>{t("Nhận diện địa điểm và hoàn thành mini game để mở câu chuyện này.", "Identify the checkpoint and complete its mini game to unlock this story.")}</p><button className="palace-button" onClick={onContinue}>{t("Quay lại hành trình", "Back to journey")}</button></div>;
  return <section className="checkpoint-story" aria-label={t("Câu chuyện checkpoint đã mở", "Unlocked checkpoint story")}>
    <div className="checkpoint-story-art"><Image src={checkpoint.photo} alt={checkpoint.name} width={1000} height={750} loading="eager" /><span><Check size={13} />{t("ĐÃ MỞ CÂU CHUYỆN", "STORY UNLOCKED")}</span><div><small>{checkpoint.floor}</small><h3>{checkpoint.name}</h3><p>{t("Một nơi đã đi qua. Một câu chuyện ở lại.", "A place discovered. A story to keep.")}</p></div></div>
    <div className="checkpoint-story-copy"><div className="minigame-topline"><span className="minigame-kicker"><Headphones size={14} />{t("LẮNG NGHE DI SẢN", "LISTEN TO HERITAGE")}</span><div className="mission-language" role="group" aria-label={t("Ngôn ngữ câu chuyện", "Story language")}><button aria-pressed={locale === "vi"} onClick={() => setLocale("vi")}>VI</button><button aria-pressed={locale === "en"} onClick={() => setLocale("en")}>EN</button></div></div><h2>{story.title}</h2>
      {reward !== null && <div className="checkpoint-story-reward" role="status"><Trophy size={18} /><span>{t("Nhiệm vụ hoàn thành · Dấu ấn đã lưu", "Mission complete · Discovery saved")}</span><strong>{reward ? `+${reward} XP` : t("XP đã nhận", "XP already earned")}</strong></div>}
      <div className="checkpoint-audio">
        {track && <audio key={track.src} ref={audio} src={track.src} preload="metadata" onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => { setPlaying(false); setPosition(0); }} onTimeUpdate={event => setPosition(event.currentTarget.currentTime)} onError={() => { setError(true); setPlaying(false); }} />}
        <div className="checkpoint-audio-heading"><AudioLines size={18} /><span>{voiceName} · {locale === "vi" ? "Tiếng Việt" : "English"}<small>{google ? t("Giọng đọc Google · Demo dự phòng", "Google narration · Demo fallback") : t("Giọng đọc AI · Bản demo Microsoft Edge", "AI narration · Microsoft Edge demo")}</small></span><button onClick={() => { const next = speed === 1 ? 1.25 : 1; setSpeed(next); if (audio.current) audio.current.playbackRate = next; }} aria-label={t("Đổi tốc độ đọc", "Change narration speed")}>{speed}×</button></div>
        <div className="checkpoint-audio-controls"><button className="checkpoint-audio-play" onClick={() => void toggle()} disabled={!track} aria-label={playing ? t("Tạm dừng câu chuyện", "Pause story") : t("Nghe câu chuyện", "Listen to story")}>{playing ? <Pause size={21} /> : <Play size={21} />}</button><div><input type="range" min="0" max={duration || 1} step=".1" value={Math.min(position, duration)} disabled={!track} aria-label={t("Tiến độ audio câu chuyện", "Story audio position")} onChange={event => { const at = Number(event.target.value); setPosition(at); if (audio.current) audio.current.currentTime = at; }} /><small>{clock(position)}<span>{clock(duration)}</span></small></div><button aria-label={t("Nghe lại từ đầu", "Replay from start")} disabled={!track} onClick={() => { if (audio.current) { audio.current.currentTime = 0; setPosition(0); if (audio.current.paused) void toggle(); } }}><RotateCcw size={17} /></button></div>
        {!sound && !audioOptIn && <p><Volume2 size={12} />{t("Chạm phát để bật riêng lời kể này.", "Press play to enable narration for this story.")}</p>}
        {(!track || error) && <p role="status">{t("Audio chưa tải được. Bạn vẫn có thể đọc trọn câu chuyện bên dưới.", "Audio could not load. The complete story is available below.")}</p>}
      </div>
      <p className="checkpoint-story-transcript">{story.text}</p><a className="checkpoint-story-source" href={checkpoint.source} target="_blank" rel="noreferrer">{t("Tư liệu và ảnh: Di tích Dinh Độc Lập", "Source and photograph: Independence Palace")}<ExternalLink size={12} /></a>
      <div className="checkpoint-story-actions"><button className="palace-button" onClick={onContinue}>{reviewing ? t("Trở lại dấu ấn", "Back to discoveries") : t("Về bản đồ hành trình", "Back to journey map")}<ArrowRight size={16} /></button>{onBonus && <button className="palace-text-button" onClick={onBonus} disabled={bonusComplete}><BookOpen size={14} />{bonusComplete ? t("Đã hoàn thành câu hỏi mở rộng", "Bonus questions completed") : t("Khám phá thêm · Câu hỏi mở rộng", "Explore more · Bonus questions")}</button>}</div>
    </div>
  </section>;
}
