"use client";

import Image from "next/image";
import { useState } from "react";
import { ArrowRight, BookOpen, ChevronRight, CloudCheck, Compass, Flag, GraduationCap, Heart, Landmark, LoaderCircle, LockKeyhole, LogOut, MapPin, ShieldCheck, WifiOff, Zap } from "lucide-react";
import type { PalaceGame } from "@/components/palace/usePalaceJourney";
import { atlasBadges, atlasDestinations } from "@/lib/atlas/model";
import type { Place } from "./game-data";
import { useAccount } from "./AccountProvider";
import { useLanguage } from "./LanguageProvider";
import "./account.css";

type Props = {
  game: PalaceGame;
  campusProgress: number;
  savedCount: number;
  bookmarkCount: number;
  progressError: boolean;
  places: Place[];
  onExplore: (place: Place["id"]) => void;
  onCollection: (tab?: "map" | "badges" | "journal") => void;
  onAccount: () => void;
};

export default function ExplorerProfile({ game, campusProgress, savedCount, bookmarkCount, progressError, places, onExplore, onCollection, onAccount }: Props) {
  const { t, locale } = useLanguage();
  const { data: session, signOut, error: accountError } = useAccount();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const user = session?.user;
  const discovered = game.state?.discovered.length || 0;
  const completed = discovered + campusProgress;
  const xp = (game.state?.xp || 0) + campusProgress * 150;
  const loaded = Boolean(game.state);
  const failed = progressError || Boolean(game.error || accountError);
  const runs = game.state?.runs || [];
  const active = runs.find(run => run.id === game.state?.activeRunId);
  const badges = atlasBadges(atlasDestinations(locale, game.state, campusProgress), locale);
  const badgeIcons = { compass: Compass, palace: Landmark, science: GraduationCap, city: MapPin };
  const badgeCount = badges.filter(badge => badge.earned).length;
  async function logout() {
    if (busy) return;
    setBusy(true); setError("");
    try { await signOut(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Chưa đăng xuất được. / Could not sign out."); }
    finally { setBusy(false); }
  }
  return <div className="explorer-profile">
    {game.error && <div className="progress-sync-error" role="alert"><p>{t("Chưa tải được nhật ký tại Dinh. Hãy kết nối lại để xem tiến độ.", "Could not load your Palace journal. Reconnect to see your progress.")}</p><button onClick={() => void game.reload()}>{t("Thử lại", "Retry")}</button></div>}
    <div className="profile-page-title"><div><span className="profile-kicker">CULTURE HUNT / {t("CÁ NHÂN", "PROFILE")}</span><h1>{t("Hành trình mang tên bạn.", "A journey of your own.")}</h1><p>{t("Những nơi đã đến. Những điều còn nhớ.", "The places you discover. The stories you keep.")}</p></div><span className="profile-edition">EXPLORER<br />EDITION / 01</span></div>

    <section className="explorer-passport" aria-label={t("Thẻ nhà thám hiểm", "Explorer passport")}>
      <div className="passport-identity">
        <div className="passport-topline"><span><Compass size={19} />EXPLORER PASSPORT</span><span className="passport-membership">{user ? t("THÀNH VIÊN", "MEMBER") : t("KHÁCH", "GUEST")}</span></div>
        <div className="passport-person"><div className="passport-avatar" aria-hidden="true">{user ? user.name.trim().charAt(0).toLocaleUpperCase(locale) : <UserCompass />}</div><div><span className="passport-hello">{t("Xin chào nhà thám hiểm,", "Hello, explorer,")}</span><h2>{user?.name || t("Người bạn tò mò", "Curious traveler")}</h2><p className="passport-email">{user?.email || t("Một chuyến đi mới đang chờ bạn.", "A new adventure is waiting for you.")}</p></div></div>
        <div className={`passport-sync ${failed ? "has-error" : ""}`} role="status">{failed ? <WifiOff size={16} /> : user ? <CloudCheck size={17} /> : <ShieldCheck size={17} />}<span>{failed ? t("Chưa kết nối được tiến độ. Hãy thử lại.", "Progress connection unavailable. Please retry.") : !loaded ? t("Đang tải tiến độ…", "Loading progress…") : user ? t("Tiến độ được lưu vào tài khoản", "Progress saved to your account") : t("Đang lưu theo trình duyệt này", "Saved for this browser")}</span></div>
      </div>
      <div className="passport-next"><span className="profile-kicker">{t("CÂU CHUYỆN TIẾP THEO", "YOUR NEXT STORY")}</span><div className="passport-mini-mark"><Landmark size={40} strokeWidth={1} /></div><h3>{active ? t("Viết tiếp hành trình ở Dinh.", "Continue your Palace story.") : t("Thêm một nơi. Thêm một góc nhìn.", "Another place. A new perspective.")}</h3><button onClick={() => onExplore("palace")}>{active ? t("Tiếp tục khám phá", "Continue exploring") : t("Bắt đầu khám phá", "Start exploring")}<ArrowRight size={17} /></button></div>
    </section>

    {!user && <div className="profile-guest-note"><div><ShieldCheck size={23} /><div><strong>{t("Giữ dấu ấn, kể cả khi đổi thiết bị.", "Take your discoveries to another device.")}</strong><p>{t("Tạo tài khoản để mang theo tiến độ khách và các câu chuyện đã lưu.", "Create an account to keep your guest progress and saved stories together.")}</p></div></div><button onClick={onAccount}>{t("Đăng nhập / Đăng ký", "Sign in / Join")}<ArrowRight size={16} /></button></div>}

    <dl className="profile-stats">
      {[{ Icon: Zap, value: loaded ? xp : "—", label: t("XP tích lũy", "Lifetime XP") }, { Icon: Flag, value: loaded ? `${completed}/9` : "—", label: t("Điểm đã khám phá", "Checkpoints unlocked") }, { Icon: BookOpen, value: bookmarkCount, label: t("Câu chuyện đã lưu", "Bookmarked stories") }, { Icon: Heart, value: savedCount, label: t("Điểm đến yêu thích", "Saved destinations") }].map(({ Icon, value, label }) => <div key={label}><dt><Icon size={18} />{label}</dt><dd>{value}</dd></div>)}
    </dl>

    <div className="profile-grid">
      <section className="profile-section profile-journeys" aria-labelledby="profile-journeys-title"><div className="profile-section-heading"><div><span className="profile-kicker">01 / {t("ĐI ĐỂ HIỂU", "GO TO DISCOVER")}</span><h2 id="profile-journeys-title">{t("Hành trình của tôi", "My journeys")}</h2></div><MapPin size={22} /></div>
        <div className="profile-destinations">{places.map(place => {
          const count = place.id === "palace" ? discovered : campusProgress;
          return <button className="profile-destination" key={place.id} onClick={() => onExplore(place.id)}><div className="profile-place-image"><Image src={place.coverImage} alt="" fill sizes="88px" /></div><span className="profile-place-copy"><strong>{place.shortName}</strong><span>{count === place.missions.length ? t("Đã hoàn thành hành trình", "Journey completed") : count > 0 ? t("Câu chuyện vẫn đang tiếp diễn", "Your story is still unfolding") : t("Sẵn sàng cho dấu ấn đầu tiên", "Ready for your first discovery")}</span><span className="profile-place-progress"><span role="progressbar" aria-label={place.shortName} aria-valuenow={count} aria-valuemin={0} aria-valuemax={place.missions.length}><i style={{ width: `${count / place.missions.length * 100}%` }} /></span><b>{count}/{place.missions.length}</b></span></span><ChevronRight size={19} /></button>;
        })}</div>
        <button className="profile-section-link" onClick={() => onCollection("map")}>{t("Mở bản đồ dấu ấn", "Open my discovery map")}<ArrowRight size={17} /></button>
      </section>
      <section className="profile-section" aria-labelledby="profile-badges-title"><div className="profile-section-heading"><div><span className="profile-kicker">02 / {t("CHƠI ĐỂ NHỚ", "PLAY TO REMEMBER")}</span><h2 id="profile-badges-title">{t("Bộ sưu tập huy hiệu", "My badges")}</h2></div><span className="profile-count">{badgeCount}/{badges.length}</span></div>
        <div className="profile-badges">{badges.map(({ id, icon, title, description, earned }) => { const Icon = badgeIcons[icon]; return <div key={id} className={`profile-badge ${earned ? "is-earned" : "is-locked"}`}><span className="profile-badge-medal"><Icon size={28} strokeWidth={1.35} />{earned ? <span className="badge-spark">✦</span> : <LockKeyhole size={12} className="badge-lock" />}</span><div><h3>{title}</h3><p>{description}</p></div><span className="badge-status">{!loaded ? "…" : earned ? t("Đã nhận", "Earned") : t("Chưa mở", "Locked")}</span></div>; })}</div>
        <button className="profile-section-link" onClick={() => onCollection("badges")}>{t("Xem huy hiệu & chia sẻ", "View badges & share")}<ArrowRight size={17} /></button>
      </section>
    </div>

    <section className="profile-section profile-history" aria-labelledby="profile-history-title"><div className="profile-section-heading"><div><span className="profile-kicker">03 / {t("GIỮ LẠI DẤU CHÂN", "KEEP YOUR FOOTPRINTS")}</span><h2 id="profile-history-title">{t("Nhật ký tại Dinh Độc Lập", "Palace journey log")}</h2></div><BookOpen size={22} /></div>
      {!loaded ? <p className="profile-empty" role="status">{t("Đang mở nhật ký…", "Opening your journal…")}</p> : runs.length ? <ol className="profile-run-list">{runs.slice(0, 3).map(run => {
        const total = Object.values(run.visits).filter(visit => visit?.completedAt).length;
        const date = new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(run.startedAt));
        return <li key={run.id}><span className="profile-run-icon"><Flag size={19} /></span><div><strong>{date}</strong><p>{total}/5 {t("điểm đã mở trong lượt chơi", "checkpoints in this run")}</p></div><span className={`profile-run-state ${run.id === active?.id ? "is-current" : ""}`}>{run.id === active?.id ? t("Đang khám phá", "In progress") : run.completedAt ? t("Hoàn thành", "Completed") : t("Đã lưu nhật ký", "Archived")}</span></li>;
      })}</ol> : <div className="profile-empty"><Compass size={30} strokeWidth={1.2} /><div><strong>{t("Trang đầu tiên đang chờ bạn.", "Your first page awaits.")}</strong><p>{t("Bắt đầu khám phá Dinh để lưu lại từng lượt chơi tại đây.", "Explore the Palace to begin your journey log here.")}</p></div><button onClick={() => onExplore("palace")}>{t("Đi khám phá", "Let's explore")}<ArrowRight size={16} /></button></div>}
      {runs.length > 3 && <button className="profile-section-link" onClick={() => onCollection("journal")}>{t("Xem toàn bộ nhật ký trong Dấu ấn", "See the full journal in Collection")}<ArrowRight size={17} /></button>}
    </section>

    <div className="profile-account-footer"><div><ShieldCheck size={19} /><p>{user ? t("Đăng nhập cùng tài khoản để tiếp tục trên thiết bị khác.", "Sign in with this account to continue on another device.") : t("Đăng nhập để giữ hành trình khi đổi trình duyệt.", "Sign in to keep your journey across browsers.")}</p></div>{user && <button className="profile-signout" disabled={busy} onClick={() => void logout()}>{busy ? <LoaderCircle className="spin" size={17} /> : <LogOut size={17} />}{busy ? t("Đang đăng xuất…", "Signing out…") : t("Đăng xuất", "Sign out")}</button>}</div>
    {error && <p className="account-status account-error" role="alert">{error.split(" / ")[locale === "en" ? 1 : 0] || error}</p>}
  </div>;
}

function UserCompass() { return <Compass size={34} strokeWidth={1.3} />; }
