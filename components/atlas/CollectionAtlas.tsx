"use client";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { ArrowLeft, ArrowRight, Award, BookOpen, Check, ChevronRight, Compass, Flag, GraduationCap, Heart, History, Landmark, Map, MapPin, Share2, Sparkles, X, Zap } from "lucide-react";
import { useLanguage } from "@/components/UI/LanguageProvider";
import GameDialog from "@/components/UI/GameDialog";
import PalaceExperience from "@/components/palace/PalaceExperience";
import type { PalaceGame } from "@/components/palace/usePalaceJourney";
import { atlasBadges, atlasDestinations, destinationShare, type AtlasBadge, type AtlasDestination, type AtlasStop, type DestinationId, type ShareTarget } from "@/lib/atlas/model";
import CityMap from "./CityMap";
import CampusMap from "./CampusMap";
import ShareCard from "./ShareCard";
import "./atlas.css";

type Tab = "map" | "badges" | "journal" | "saved";
type Filter = "all" | "progress" | "complete" | "new";
const tabs = ["map", "badges", "journal", "saved"] as const;
const tabIcons = { map: Map, badges: Award, journal: History, saved: Heart };
const badgeIcons = { compass: Compass, palace: Landmark, science: GraduationCap, city: MapPin };

export default function CollectionAtlas({ game, campusProgress, name, savedDestinations, onToggleSaved, onPlay, sound }: {
  game: PalaceGame; campusProgress: number; name: string; savedDestinations: DestinationId[];
  onToggleSaved: (id: DestinationId) => void; onPlay: (id: DestinationId) => void; sound: boolean;
}) {
  const { locale, t } = useLanguage();
  const [tab, setTab] = useState<Tab>("map");
  const [place, setPlace] = useState<DestinationId | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [share, setShare] = useState<ShareTarget | null>(null);
  const [badge, setBadge] = useState<AtlasBadge | null>(null);
  const [campusStop, setCampusStop] = useState<AtlasStop | null>(null);
  const [journalPlace, setJournalPlace] = useState("all");
  const [period, setPeriod] = useState("all");
  const destinations = useMemo(() => atlasDestinations(locale, game.state, campusProgress), [locale, game.state, campusProgress]);
  const badges = useMemo(() => atlasBadges(destinations, locale), [destinations, locale]);
  const selected = destinations.find(d => d.id === place);
  const totalStops = destinations.reduce((sum, d) => sum + d.completed, 0);
  const totalPossible = destinations.reduce((sum, d) => sum + d.total, 0);
  const xp = destinations.reduce((sum, d) => sum + d.xp, 0);
  const earned = badges.filter(b => b.earned).length;
  const completeDestinations = destinations.filter(d => d.completed === d.total).length;
  const favoriteStories = destinations.flatMap(d => d.stops.filter(s => favorites.includes(`${d.id}:${s.id}`)).map(s => ({ destination: d, stop: s })));
  const date = (at: string) => new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-GB", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(at));

  useEffect(() => {
    function readUrl() {
      const query = new URLSearchParams(window.location.search);
      const destination = query.get("atlas"), pane = query.get("atlasTab");
      setPlace(destination === "palace" || destination === "hcmus" ? destination : null);
      setTab(tabs.includes(pane as Tab) ? pane as Tab : "map");
    }
    queueMicrotask(() => {
      readUrl();
      try {
        const stored: unknown = JSON.parse(localStorage.getItem("culture-hunt-atlas-favorites-v1") || "[]");
        if (Array.isArray(stored)) setFavorites(stored.filter((value): value is string => typeof value === "string" && /^(palace|hcmus):[a-z0-9-]+$/.test(value)));
      } catch { /* Optional browser storage. */ }
    });
    window.addEventListener("popstate", readUrl);
    return () => window.removeEventListener("popstate", readUrl);
  }, []);
  function navigate(destination: DestinationId | null, pane: Tab = "map") {
    setPlace(destination); setTab(pane); setCampusStop(null); setBadge(null);
    const url = new URL(window.location.href);
    url.searchParams.set("atlas", destination || "city"); url.searchParams.set("atlasTab", pane);
    window.history.pushState(null, "", `${url.pathname}${url.search}`);
    window.scrollTo({ top: 0, behavior: "instant" });
  }
  function favorite(destination: DestinationId, stop: AtlasStop) {
    const key = `${destination}:${stop.id}`;
    setFavorites(current => {
      const next = current.includes(key) ? current.filter(id => id !== key) : [...current, key];
      try { localStorage.setItem("culture-hunt-atlas-favorites-v1", JSON.stringify(next)); } catch { /* Session state is retained. */ }
      return next;
    });
  }
  function shareStop(d: AtlasDestination, stop: AtlasStop) {
    if (!stop.done) return;
    setShare({ kind: "checkpoint", title: stop.title, subtitle: d.shortTitle, completed: 1, total: 1, xp: 150, destinationId: d.id, at: stop.at });
  }
  function shareBadge(item: AtlasBadge) {
    if (!item.earned) return;
    setBadge(null); setShare({ kind: "badge", title: item.title, subtitle: item.description, completed: item.progress, total: item.total, xp: item.destinationId ? destinations.find(d => d.id === item.destinationId)!.xp : xp, destinationId: item.destinationId, badgeId: item.id, at: item.at });
  }
  const next = destinations.find(d => d.completed > 0 && d.completed < d.total) || destinations.find(d => d.completed < d.total);
  const visibleDestinations = destinations.filter(d => filter === "all" || (filter === "progress" ? d.completed > 0 && d.completed < d.total : filter === "complete" ? d.completed === d.total : d.completed === 0));
  const runs = (game.state?.runs || []).filter(run => {
    if (journalPlace === "hcmus") return false;
    if (period === "all") return true;
    const at = new Date(run.startedAt), now = new Date();
    return period === "today" ? at.toDateString() === now.toDateString() : at.getMonth() === now.getMonth() && at.getFullYear() === now.getFullYear();
  });
  function badgeCard(item: AtlasBadge) {
    const Icon = badgeIcons[item.icon];
    return <button key={item.id} className={`atlas-badge-card ${item.earned ? "is-earned" : ""}`} onClick={() => setBadge(item)} aria-label={`${item.title} · ${item.earned ? t("Đã nhận", "Earned") : `${item.progress}/${item.total}`} `}>
      <span className="atlas-badge-state">{item.earned ? <Check size={11} /> : <Flag size={11} />}{item.earned ? t("ĐÃ GHI DẤU", "EARNED") : t("CHỜ BẠN KHÁM PHÁ", "WAITING FOR YOU")}</span>
      <span className="atlas-medallion"><Icon size={35} strokeWidth={1.2} /><i>✦</i></span><strong>{item.title}</strong><small>{item.progress}/{item.total} {t("điều kiện đã đạt", "requirements met")}</small>
    </button>;
  }

  return <section className="atlas-experience" aria-label={t("Hộ chiếu khám phá", "Explorer passport")}>
    <div className="atlas-passport-header"><div><span className="atlas-eyebrow">CULTURE HUNT / A PERSONAL ATLAS</span><h2>{t("Đi qua thành phố.", "Explore the city.")}<br /><em>{t("Giữ lại câu chuyện.", "Keep its stories.")}</em></h2><p>{t("Một tấm bản đồ, những miền ký ức của riêng bạn.", "One map. A collection of stories that are yours.")}</p></div>
      <div className="atlas-passport-stamp" aria-label={t("Hộ chiếu khám phá Sài Gòn", "Saigon explorer passport")}><Compass size={31} strokeWidth={1.1} /><strong>SAIGON</strong><small>EXPLORER / 01</small></div>
    </div>
    <div className="atlas-summary"><span><MapPin size={16} /><strong>{completeDestinations}<small>/{destinations.length}</small></strong>{t("địa điểm hoàn thành", "destinations completed")}</span><span><Flag size={16} /><strong>{totalStops}<small>/{totalPossible}</small></strong>{t("dấu ấn", "discoveries")}</span><span><Award size={16} /><strong>{earned}</strong>{t("huy hiệu", "badges")}</span><span><Zap size={16} /><strong>{xp}</strong>XP</span></div>
    <div className="atlas-top-actions"><nav className="atlas-tabs" aria-label={t("Các phần của hộ chiếu", "Passport sections")}>
      {tabs.map(item => { const Icon = tabIcons[item]; return <button key={item} aria-current={tab === item ? "page" : undefined} onClick={() => navigate(null, item)}><Icon size={16} />{item === "map" ? t("Bản đồ", "Map") : item === "badges" ? t("Huy hiệu", "Badges") : item === "journal" ? t("Nhật ký", "Journal") : t("Đã lưu", "Saved")}{item === "saved" && favorites.length + savedDestinations.length > 0 && <small>{favorites.length + savedDestinations.length}</small>}</button>; })}
    </nav><button className="atlas-share-passport" disabled={!game.state} onClick={() => setShare({ kind: "city", title: t("Sài Gòn, những dấu ấn của tôi.", "Saigon, my discoveries."), subtitle: "CULTURE HUNT / SAIGON", completed: completeDestinations, total: destinations.length, xp, marks: destinations.map(d => ({ id: d.id, completed: d.completed, total: d.total })) })}><Share2 size={15} />{t("Chia sẻ hộ chiếu", "Share passport")}</button></div>
    {game.error && <div className="atlas-message" role="alert"><span>{t("Chưa đọc được tiến độ Dinh. Hãy kết nối lại trước khi chia sẻ thành tích tại đây.", "Palace progress is unavailable. Reconnect before sharing its achievements.")}</span><button onClick={game.reload}>{t("Thử lại", "Retry")}</button></div>}
    {!game.state && !game.error && <p className="atlas-loading" role="status">{t("Đang đọc những dấu ấn đã lưu…", "Reading your saved discoveries…")}</p>}

    {tab === "map" && !selected && <>
      <div className="atlas-city-layout"><CityMap destinations={destinations} onOpen={id => navigate(id)} /><aside className="atlas-destination-rail"><div className="atlas-rail-heading"><span className="atlas-eyebrow">YOUR NEXT CHAPTER</span><h3>{t("Chọn một miền khám phá.", "Choose your next chapter.")}</h3></div>
        <label className="atlas-filter-label">{t("Lọc địa điểm", "Filter destinations")}<select value={filter} onChange={e => setFilter(e.target.value as Filter)}><option value="all">{t("Tất cả địa điểm", "All destinations")}</option><option value="progress">{t("Đang khám phá", "In progress")}</option><option value="complete">{t("Đã hoàn thành", "Completed")}</option><option value="new">{t("Chưa bắt đầu", "Not started")}</option></select></label>
        {visibleDestinations.map((d) => <article key={d.id} className="atlas-destination-card"><div className="atlas-destination-photo"><Image src={d.photo} alt={d.shortTitle} width={420} height={220} /><span>{d.id === "palace" ? "01 / HERITAGE" : "02 / KNOWLEDGE"}</span><button aria-label={`${savedDestinations.includes(d.id) ? t("Bỏ lưu", "Unsave") : t("Lưu", "Save")} ${d.shortTitle}`} aria-pressed={savedDestinations.includes(d.id)} onClick={() => onToggleSaved(d.id)}><Heart size={16} fill={savedDestinations.includes(d.id) ? "currentColor" : "none"} /></button></div><div className="atlas-destination-copy"><small>{d.subtitle}</small><h3>{d.shortTitle}</h3><div className="atlas-destination-progress"><span>{d.completed}/{d.total} {t("dấu ấn", "discoveries")}</span><strong>{d.xp} XP</strong></div><progress value={d.completed} max={d.total} aria-label={d.shortTitle} /><button onClick={() => navigate(d.id)}>{t("Mở bản đồ địa điểm", "Open destination map")}<ArrowRight size={16} /></button></div></article>)}
        {!visibleDestinations.length && <p className="atlas-empty-inline">{t("Chưa có địa điểm ở trạng thái này. Đổi bộ lọc để tiếp tục khám phá.", "No destinations match this status. Try another filter.")}</p>}
      </aside></div>
      <div className="atlas-map-legend"><span><i />{t("Chưa bắt đầu", "Not started")}</span><span><i className="progress" />{t("Đang khám phá", "In progress")}</span><span><i className="complete" />{t("Đã hoàn thành", "Completed")}</span><small>{t("Mốc sáng thể hiện thành tích trong game.", "Bright markers represent in-game progress.")}</small></div>
      {next && <button className="atlas-next-chapter" onClick={() => navigate(next.id)}><span><Sparkles size={22} /></span><div><small>{t("CÂU CHUYỆN VẪN CÒN TIẾP", "THE STORY CONTINUES")}</small><strong>{next.completed ? t("Trở lại", "Return to") : t("Bắt đầu với", "Begin with")} {next.shortTitle}</strong><p>{next.total - next.completed} {t("dấu ấn đang chờ bạn mở.", "discoveries waiting to be unlocked.")}</p></div><ArrowRight size={22} /></button>}
      <div className="atlas-section-line"><div><span className="atlas-eyebrow">LITTLE SYMBOLS, GREAT STORIES</span><h3>{t("Những huy hiệu đang chờ.", "Badges waiting for your story.")}</h3></div><button onClick={() => navigate(null, "badges")}>{t("Xem bộ sưu tập", "View collection")}<ChevronRight size={15} /></button></div><div className="atlas-badge-grid">{badges.map(badgeCard)}</div>
    </>}

    {tab === "map" && selected && <div className="atlas-destination-detail">
      <nav className="atlas-breadcrumb" aria-label={t("Đường dẫn bản đồ", "Map breadcrumb")}><button onClick={() => navigate(null)}><ArrowLeft size={15} />{t("Bản đồ TP.HCM", "Ho Chi Minh City map")}</button><ChevronRight size={13} /><span>{selected.shortTitle}</span></nav>
      <div className="atlas-place-heading"><div><span className="atlas-eyebrow">{selected.id === "palace" ? "HERITAGE / THE INDEPENDENCE PALACE" : "KNOWLEDGE / UNIVERSITY OF SCIENCE"}</span><h3>{selected.shortTitle}</h3><p><MapPin size={13} />{selected.address}</p></div><div><button className="atlas-secondary" onClick={() => setShare(destinationShare(selected))}><Share2 size={15} />{t("Chia sẻ địa điểm", "Share destination")}</button><button className="atlas-primary" onClick={() => onPlay(selected.id)}><Compass size={15} />{selected.completed === selected.total ? t("Xem hành trình", "View journey") : t("Tiếp tục chơi", "Continue playing")}</button></div></div>
      <div className="atlas-place-status"><span><Flag size={16} /><strong>{selected.completed}/{selected.total}</strong> {t("checkpoint đã mở", "checkpoints unlocked")}</span><span><Zap size={15} />{selected.xp} XP</span><small>{t("Thành tích được tổng hợp từ tiến độ đã lưu.", "Achievements reflect your saved progress.")}</small></div>
      {selected.id === "palace" ? <div className="atlas-place-content"><PalaceExperience game={game} mode="journal" sound={sound} onJournal={() => navigate("palace")} onMap={() => onPlay("palace")} /></div> : <CampusMap destination={selected} onSelect={setCampusStop} />}
      <div className="atlas-section-line"><div><span className="atlas-eyebrow">KEEP A LITTLE MEMORY</span><h3>{t("Câu chuyện & dấu ấn", "Stories & discoveries")}</h3></div><span>{selected.completed}/{selected.total}</span></div>
      <div className="atlas-story-grid">{selected.stops.map(stop => <article key={stop.id} className={`atlas-story-card ${stop.done ? "is-complete" : ""}`}><div><span>{stop.done ? <Check size={15} /> : <Flag size={15} />}</span><strong>{stop.title}</strong><button aria-label={`${favorites.includes(`${selected.id}:${stop.id}`) ? t("Bỏ lưu câu chuyện", "Unsave story") : t("Lưu câu chuyện", "Save story")} ${stop.title}`} aria-pressed={favorites.includes(`${selected.id}:${stop.id}`)} onClick={() => favorite(selected.id, stop)}><Heart size={16} fill={favorites.includes(`${selected.id}:${stop.id}`) ? "currentColor" : "none"} /></button></div><p>{stop.done ? stop.at ? `${t("Khai mở", "Unlocked")} ${date(stop.at)}` : t("Tiến độ demo đã lưu", "Saved demo progress") : t("Câu chuyện còn chờ bạn khám phá", "A story waiting to be discovered")}</p><button disabled={!stop.done || !game.state} className="atlas-story-share" onClick={() => shareStop(selected, stop)}><Share2 size={14} />{t("Chia sẻ dấu ấn", "Share discovery")}</button></article>)}</div>
    </div>}

    {tab === "badges" && <><div className="atlas-section-line"><div><span className="atlas-eyebrow">THE EXPLORER’S CABINET</span><h3>{t("Mỗi huy hiệu, một hành trình.", "Every badge holds a journey.")}</h3><p>{t("Chạm một huy hiệu để xem điều kiện và thành tích đã ghi nhận.", "Select a badge to see its requirements and achievements.")}</p></div><strong>{earned}/{badges.length}</strong></div><div className="atlas-badge-grid atlas-badge-grid-large">{badges.map(badgeCard)}</div></>}

    {tab === "journal" && <div className="atlas-journal"><div className="atlas-section-line"><div><span className="atlas-eyebrow">PAGES FROM YOUR JOURNEY</span><h3>{t("Những lần trở lại.", "The journeys you keep.")}</h3><p>{t("Mỗi lượt chơi là một trang riêng trong hộ chiếu.", "Every run is a separate page in your passport.")}</p></div><History size={24} /></div><div className="atlas-journal-filters"><label>{t("Địa điểm", "Destination")}<select value={journalPlace} onChange={e => setJournalPlace(e.target.value)}><option value="all">{t("Tất cả", "All")}</option>{destinations.map(d => <option value={d.id} key={d.id}>{d.shortTitle}</option>)}</select></label><label>{t("Thời gian", "Period")}<select value={period} onChange={e => setPeriod(e.target.value)}><option value="all">{t("Tất cả thời gian", "All time")}</option><option value="today">{t("Hôm nay", "Today")}</option><option value="month">{t("Tháng này", "This month")}</option></select></label></div>
      <div className="atlas-timeline">{runs.map((run) => { const completed = Object.values(run.visits).filter(v => v?.completedAt).length; return <article key={run.id}><span className="atlas-timeline-dot"><Landmark size={16} /></span><div><small>{date(run.startedAt)} · {new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-GB", { hour: "2-digit", minute: "2-digit" }).format(new Date(run.startedAt))}</small><h4>{t("Dinh Độc Lập", "Independence Palace")} <span>#{(game.state?.runs.length || 0) - (game.state?.runs.findIndex(r => r.id === run.id) || 0)}</span></h4><p>{completed}/5 {t("dấu ấn", "discoveries")} · {run.status === "completed" ? t("Hoàn thành", "Completed") : run.status === "active" ? t("Đang chơi", "In progress") : t("Lượt đã lưu", "Saved run")}</p><button onClick={() => navigate("palace")}>{t("Xem bản đồ & lượt chơi", "View map & runs")}<ArrowRight size={14} /></button></div></article>; })}
      {campusProgress > 0 && journalPlace !== "palace" && period === "all" && <article><span className="atlas-timeline-dot"><GraduationCap size={16} /></span><div><small>{t("TIẾN ĐỘ DEMO TRONG TRÌNH DUYỆT", "BROWSER DEMO PROGRESS")}</small><h4>{destinations.find(d => d.id === "hcmus")!.shortTitle}</h4><p>{campusProgress}/3 {t("chặng đã hoàn thành · Chưa có mốc thời gian lượt chơi", "chapters complete · No run timestamps recorded")}</p><button onClick={() => navigate("hcmus")}>{t("Xem bản đồ tri thức", "View knowledge map")}<ArrowRight size={14} /></button></div></article>}
      {!runs.length && !(campusProgress > 0 && journalPlace !== "palace" && period === "all") && <div className="atlas-empty"><BookOpen size={35} /><h4>{t("Trang đầu còn đang chờ.", "Your first page awaits.")}</h4><p>{t("Chưa có lượt chơi trong bộ lọc này. Khám phá một checkpoint để bắt đầu ghi dấu.", "No runs match these filters. Discover a checkpoint to begin your journal.")}</p><button className="atlas-secondary" onClick={() => navigate(null)}>{t("Về bản đồ", "Back to map")}</button></div>}</div>
    </div>}

    {tab === "saved" && <><div className="atlas-section-line"><div><span className="atlas-eyebrow">STORIES WORTH KEEPING</span><h3>{t("Dành cho lần khám phá tới.", "For your next discovery.")}</h3><p>{t("Địa điểm và câu chuyện bạn đã đánh dấu yêu thích.", "The places and stories you’ve chosen to keep.")}</p></div><Heart size={24} /></div><div className="atlas-saved-grid">{destinations.filter(d => savedDestinations.includes(d.id)).map(d => <article key={d.id}><Image src={d.photo} alt={d.shortTitle} width={400} height={220} /><div><small>{t("ĐỊA ĐIỂM ĐÃ LƯU", "SAVED DESTINATION")}</small><h4>{d.shortTitle}</h4><button onClick={() => navigate(d.id)}>{t("Mở bản đồ", "Open map")}<ArrowRight size={14} /></button></div><button className="atlas-unsave" aria-label={`${t("Bỏ lưu", "Unsave")} ${d.shortTitle}`} onClick={() => onToggleSaved(d.id)}><X size={15} /></button></article>)}{favoriteStories.map(({ destination: d, stop }) => <article key={`${d.id}:${stop.id}`}><Image src={stop.photo} alt={stop.title} width={400} height={220} /><div><small>{d.shortTitle}</small><h4>{stop.title}</h4><button onClick={() => navigate(d.id)}>{t("Về câu chuyện", "View destination")}<ArrowRight size={14} /></button></div><button className="atlas-unsave" aria-label={`${t("Bỏ lưu câu chuyện", "Unsave story")} ${stop.title}`} onClick={() => favorite(d.id, stop)}><X size={15} /></button></article>)}</div>{!favoriteStories.length && !savedDestinations.length && <div className="atlas-empty"><Heart size={35} /><h4>{t("Giữ lại một chút tò mò.", "Keep a little curiosity.")}</h4><p>{t("Chạm biểu tượng trái tim tại địa điểm hoặc câu chuyện để lưu vào đây.", "Tap the heart on a destination or story to save it here.")}</p><button className="atlas-secondary" onClick={() => navigate(null)}>{t("Tìm một câu chuyện", "Find a story")}</button></div>}</>}

    <div className="atlas-passport-footer"><span>CULTURE HUNT · SAIGON STORIES</span><small>{t("Khám phá trong game · Lưu dấu cho riêng mình", "Discover in-game · Keep your own story")}</small></div>
    {badge && <GameDialog onClose={() => setBadge(null)} label={badge.title} animateEntry={false}><div className="atlas-badge-detail">{(() => { const Icon = badgeIcons[badge.icon]; return <span className={`atlas-medallion ${badge.earned ? "is-earned" : ""}`}><Icon size={52} strokeWidth={1.2} /></span>; })()}<span className="atlas-eyebrow">{badge.earned ? t("THÀNH TÍCH ĐÃ GHI NHẬN", "AN ACHIEVEMENT TO KEEP") : t("HÀNH TRÌNH ĐANG CHỜ", "A JOURNEY AWAITS")}</span><h2>{badge.title}</h2><p>{badge.description}</p><strong>{badge.progress}/{badge.total}</strong>{badge.earned && badge.at && <small>{t("Khai mở", "Unlocked")} {date(badge.at)}</small>}{badge.earned ? <button className="atlas-primary" onClick={() => shareBadge(badge)}><Share2 size={16} />{t("Chia sẻ huy hiệu", "Share badge")}</button> : <button className="atlas-primary" onClick={() => { const id = badge.destinationId; setBadge(null); navigate(id || null); }}>{t("Xem hành trình", "View journey")}<ArrowRight size={16} /></button>}</div></GameDialog>}
    {campusStop && <GameDialog onClose={() => setCampusStop(null)} label={campusStop.title} animateEntry={false}><div className="atlas-stop-detail"><Image src={campusStop.photo} alt={campusStop.title} width={650} height={340} /><span className="atlas-eyebrow">KNOWLEDGE / DEMO CHAPTER</span><h2>{campusStop.title}</h2><p>{campusStop.story}</p><small>{campusStop.done ? t("Chặng nội dung đã hoàn thành", "Story chapter completed") : t("Chặng nội dung chưa hoàn thành", "Story chapter not completed")}</small><div className="atlas-share-actions"><button className="atlas-secondary" onClick={() => favorite("hcmus", campusStop)}><Heart size={15} />{favorites.includes(`hcmus:${campusStop.id}`) ? t("Đã lưu", "Saved") : t("Lưu câu chuyện", "Save story")}</button>{campusStop.done && <button className="atlas-primary" onClick={() => { const stop = campusStop; setCampusStop(null); shareStop(destinations.find(d => d.id === "hcmus")!, stop); }}><Share2 size={15} />{t("Chia sẻ dấu ấn", "Share discovery")}</button>}</div><a href="https://hcmus.edu.vn/29-nam-truong-dai-hoc-khoa-hoc-tu-nhien-dhqg-hcm-30-3-1996-30-3-2025/" target="_blank" rel="noreferrer">{t("Nguồn: Trường ĐH KHTN", "Source: University of Science")}</a></div></GameDialog>}
    {share && <ShareCard target={share} name={name} onClose={() => setShare(null)} />}
  </section>;
}
