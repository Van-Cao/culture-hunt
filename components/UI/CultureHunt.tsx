"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, MotionConfig } from "framer-motion";
import { AccountProvider, useAccount } from "./AccountProvider";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Compass,
  Download,
  Flag,
  GraduationCap,
  Heart,
  HelpCircle,
  Home,
  Landmark,
  MapPin,
  Share2,
  Sparkles,
  Target,
  Trophy,
  UserRound,
  Volume2,
  VolumeX,
  Zap,
} from "lucide-react";
import { LanguageProvider, useLanguage, type Locale } from "./LanguageProvider";
import { getPlaces, type Place } from "./game-data";
import {
  ExplorerBadge,
  GameBrand,
  LanguageSwitch,
  XPBar,
} from "./GameElements";
import JourneyTutorial from "./JourneyTutorial";
import LandingPage from "./LandingPage";
import ArtifactScanner from "./ArtifactScanner";
import GameDialog from "./GameDialog";
import StoryCard from "./StoryCard";
import QuizCard from "./QuizCard";
import AccountPanel from "./AccountPanel";
import ExplorerProfile from "./ExplorerProfile";
import CampusExperience from "./CampusExperience";
import PalaceExperience from "@/components/palace/PalaceExperience";
import { usePalaceJourney } from "@/components/palace/usePalaceJourney";
import CollectionAtlas from "@/components/atlas/CollectionAtlas";
import { useExplorerProgress } from "./useExplorerProgress";
import "./game.css";

type View = "home" | "journeys" | "collection" | "profile";
type Overlay = "capture" | "story" | "quiz" | "help" | "account" | "achievement" | null;
type PlaceId = Place["id"];

export default function CultureHunt({
  initialLocale,
  initialPlay = false,
  initialStart = false,
  initialAuthFailed = false,
  initialDestination,
  initialView,
}: {
  initialLocale?: Locale;
  initialPlay?: boolean;
  initialStart?: boolean;
  initialAuthFailed?: boolean;
  initialDestination?: PlaceId;
  initialView?: View;
}) {
  return (
    <AccountProvider>
      <LanguageProvider initialLocale={initialLocale}>
        <MotionConfig reducedMotion="user">
          <Experience
            initialPlay={initialPlay}
            initialStart={initialStart}
            initialAuthFailed={initialAuthFailed}
            initialDestination={initialDestination}
            initialView={initialView}
          />
        </MotionConfig>
      </LanguageProvider>
    </AccountProvider>
  );
}

function Experience({
  initialPlay,
  initialStart,
  initialAuthFailed,
  initialDestination,
  initialView,
}: {
  initialPlay: boolean;
  initialStart: boolean;
  initialAuthFailed: boolean;
  initialDestination?: PlaceId;
  initialView?: View;
}) {
  const { t, locale } = useLanguage();
  const { data: session, ready: accountReady } = useAccount();
  const [entered, setEntered] = useState(initialPlay);
  const [entryDialog, setEntryDialog] = useState(
    initialStart || initialAuthFailed,
  );
  const [authFailed, setAuthFailed] = useState(initialAuthFailed);
  const [entryDestination, setEntryDestination] = useState<PlaceId | undefined>(
    initialDestination,
  );
  useEffect(() => {
    function readNavigation() {
      const query = new URLSearchParams(window.location.search);
      setEntered(query.get("play") === "1");
      setEntryDialog(query.get("start") === "1" || query.has("error"));
      if (query.has("error")) {
        setAuthFailed(true);
        setEntryDialog(true);
      }
    }
    queueMicrotask(readNavigation);
    window.addEventListener("popstate", readNavigation);
    return () => window.removeEventListener("popstate", readNavigation);
  }, []);
  function enter(destination = entryDestination) {
    setEntryDialog(false);
    setEntered(true);
    window.history.pushState(
      null,
      "",
      `/?play=1&lang=${locale}${destination ? `&place=${destination}&view=journeys` : ""}`,
    );
    window.scrollTo(0, 0);
  }
  function intro() {
    setEntered(false);
    window.history.pushState(null, "", `/?lang=${locale}`);
    window.scrollTo(0, 0);
  }
  return (
    <div className="culture-app" lang={locale}>
      {entered && !accountReady ? <div className="loading-screen" role="status">{t("Đang mở hồ sơ khám phá…", "Opening your explorer profile…")}</div> : entered ? (
        <Game
          key={session?.user.id || "guest"}
          onIntro={intro}
          initialDestination={entryDestination}
          initialView={initialView}
        />
      ) : (
        <LandingPage
          onStart={(destination) => {
            setEntryDestination(destination);
            if (session?.user) enter(destination);
            else setEntryDialog(true);
          }}
        />
      )}
      <AnimatePresence>
        {entryDialog && (
          <GameDialog
            animateEntry={!initialStart && !initialAuthFailed}
            className="account-dialog"
            label={t("Bắt đầu hành trình", "Start your adventure")}
            onClose={() => setEntryDialog(false)}
          >
            <AccountPanel
                authFailed={authFailed}
              onClose={() => setEntryDialog(false)}
              onGuest={() => enter()}
            />
          </GameDialog>
        )}
      </AnimatePresence>
    </div>
  );
}

function PlaceCard({
  place,
  saved,
  onSave,
  onOpen,
  completed,
}: {
  place: Place;
  saved: boolean;
  onSave: () => void;
  onOpen: () => void;
  completed: number;
}) {
  const { t } = useLanguage();
  return (
    <article className="discovery-card">
      <button
        className="discovery-photo"
        onClick={onOpen}
        aria-label={`${t("Khám phá", "Explore")} ${place.shortName}`}
      >
        <Image
          src={place.coverImage}
          alt={place.name}
          fill
          sizes="(max-width: 600px) 280px, 520px"
        />
        <span className="discovery-tag">
          {place.id === "palace" ? (
            <Landmark size={12} />
          ) : (
            <GraduationCap size={13} />
          )}
          {place.tag}
        </span>
        <span className="photo-xp">
          <Zap size={12} fill="currentColor" />
          {place.missions.length * 150} XP
        </span>
      </button>
      <button
        className={`save-place ${saved ? "is-saved" : ""}`}
        onClick={onSave}
        aria-pressed={saved}
        aria-label={`${saved ? t("Bỏ lưu", "Unsave") : t("Lưu", "Save")} ${place.shortName}`}
      >
        <Heart size={18} fill={saved ? "currentColor" : "none"} />
      </button>
      <div className="discovery-copy">
        <small>
          <MapPin size={12} />
          {t("Thành phố Hồ Chí Minh", "Ho Chi Minh City")}
        </small>
        <h3>{place.shortName}</h3>
        <p>{place.journey}</p>
        <div className="discovery-card-bottom">
          <span>
            <Flag size={14} />
            {completed}/{place.missions.length} {t("thử thách", "challenges")}
          </span>
          <button onClick={onOpen}>
            {completed === place.missions.length
              ? t("Xem lại", "Revisit")
              : t("Khám phá", "Explore")}
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </article>
  );
}

function Game({
  onIntro,
  initialDestination,
  initialView,
}: {
  onIntro: () => void;
  initialDestination?: PlaceId;
  initialView?: View;
}) {
  const { locale, t } = useLanguage();
  const { data: session } = useAccount();
  const places = getPlaces(locale);
  const [placeId, setPlaceId] = useState<PlaceId>(
    initialDestination || "palace",
  );
  const [view, setView] = useState<View>(
    initialView || (initialDestination ? "journeys" : "home"),
  );
  const [overlay, setOverlay] = useState<Overlay>(null);
  const tutorialKey = `culture-hunt-tutorial-v1:${session?.user.id || "guest"}`;
  useEffect(() => {
    let seen = false;
    try { seen = localStorage.getItem(tutorialKey) === "seen"; } catch { /* Storage is optional. */ }
    if (!seen) queueMicrotask(() => setOverlay("help"));
  }, [tutorialKey]);
  function dismissOverlay() {
    if (overlay === "help") {
      try { localStorage.setItem(tutorialKey, "seen"); } catch { /* Storage is optional. */ }
    }
    setOverlay(null);
  }
  const explorer = useExplorerProgress();
  const palaceGame = usePalaceJourney();
  const progress = {
    palace: palaceGame.state?.discovered.length || 0,
    hcmus: explorer.hcmus,
  };
  const saved = explorer.saved;
  const [filter, setFilter] = useState<"all" | PlaceId>("all");
  const [sound, setSound] = useState(true);
  const [activeMission, setActiveMission] = useState(0);
  const [toast, setToast] = useState("");
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const place = places.find((item) => item.id === placeId)!;
  const completed = progress[placeId];
  const totalCompleted = progress.palace + progress.hcmus;
  const xp = totalCompleted * 150;
  const mission = place.missions[activeMission];

  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current); }, []);

  useEffect(() => {
    const restore = () => {
      const query = new URLSearchParams(window.location.search);
      const destination = query.get("place");
      const requestedView = query.get("view");
      const target = requestedView === "scan" ? "journeys" : requestedView;
      if (destination === "palace" || destination === "hcmus")
        setPlaceId(destination);
      setView(
        target === "journeys" || target === "collection" || target === "profile"
          ? target
          : "home",
      );
    };
    // Account changes remount the game; retain the current navigation in that case.
    queueMicrotask(() => { restore(); window.scrollTo({ top: 0, behavior: "instant" }); });
    const onPopState = () => { setOverlay(null); restore(); };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);
  function navigate(next: View, destination = placeId) {
    setView(next);
    const url = new URL(window.location.href);
    url.searchParams.set("play", "1");
    url.searchParams.set("view", next);
    url.searchParams.set("place", destination);
    url.searchParams.set("lang", locale);
    if (url.search !== window.location.search)
      window.history.pushState(null, "", `${url.pathname}${url.search}`);
    window.scrollTo({ top: 0, behavior: "instant" });
  }
  function selectPlace(id: PlaceId) {
    setPlaceId(id);
    setActiveMission(
      Math.min(
        progress[id],
        places.find((item) => item.id === id)!.missions.length - 1,
      ),
    );
    navigate("journeys", id);
  }
  function openCollection(tab: "map" | "badges" | "journal" = "map") {
    const url = new URL(window.location.href);
    url.searchParams.set("atlasTab", tab);
    url.searchParams.delete("atlas");
    window.history.replaceState(null, "", `${url.pathname}${url.search}`);
    navigate("collection");
  }
  function toggleSaved(id: PlaceId) { void explorer.toggleSaved(id); }
  function notify(message: string) {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 4500);
  }
  function capture() {
    setOverlay(current => current === "capture" ? "story" : current);
  }
  function openMission(index: number) {
    setActiveMission(index);
    if (index < completed) setOverlay("story");
    else setOverlay("capture");
  }
  async function completeMission(answer: number) {
    if (placeId !== "hcmus" || !await explorer.completeCampus(activeMission, answer)) {
      notify(t("Chưa lưu được tiến độ. Hãy thử lại.", "Progress could not be saved. Please retry."));
      return false;
    }
    if (sound) {
      try {
        const audio = new AudioContext();
        [523.25, 659.25, 783.99].forEach((frequency, index) => {
          const oscillator = audio.createOscillator();
          const gain = audio.createGain();
          const start = audio.currentTime + index * 0.1;
          oscillator.frequency.value = frequency;
          gain.gain.setValueAtTime(0, start);
          gain.gain.linearRampToValueAtTime(0.045, start + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, start + 0.32);
          oscillator.connect(gain);
          gain.connect(audio.destination);
          oscillator.start(start);
          oscillator.stop(start + 0.35);
        });
        setTimeout(() => {
          void audio.close();
        }, 900);
      } catch {
        /* Visual feedback still works without audio. */
      }
    }
    return true;
  }
  async function share() {
    const text = t(
      `Mình đã giải mã ${completed}/${place.missions.length} thử thách tại ${place.name} và nhận ${completed * 150} XP trên Culture Hunt! #CultureHunt`,
      `I decoded ${completed}/${place.missions.length} challenges at ${place.name} and earned ${completed * 150} XP on Culture Hunt! #CultureHunt`,
    );
    try {
      if (navigator.share)
        await navigator.share({ title: "Culture Hunt", text });
      else {
        await navigator.clipboard.writeText(text);
        notify(
          t(
            "Đã sao chép thành tích! Dán vào Facebook hoặc Instagram nhé.",
            "Achievement copied! Paste it into Facebook or Instagram.",
          ),
        );
      }
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError"))
        notify(
          t(
            "Chưa chia sẻ được. Bạn có thể tải thẻ thành tích về nhé.",
            "Could not share. You can download your achievement card instead.",
          ),
        );
    }
  }
  function downloadCard() {
    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1350;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#073e61";
    ctx.fillRect(0, 0, 1080, 1350);
    ctx.strokeStyle = "#c1f17d";
    ctx.lineWidth = 3;
    ctx.strokeRect(48, 48, 984, 1254);
    ctx.textAlign = "center";
    ctx.fillStyle = "#c1f17d";
    ctx.font = "bold 32px Arial";
    ctx.fillText("CULTURE HUNT", 540, 165);
    ctx.font = "110px Arial";
    ctx.fillText("✦", 540, 420);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 50px Arial";
    ctx.fillText(t("DẤU ẤN KHÁM PHÁ", "MY EXPLORER STORY"), 540, 560);
    ctx.font = "32px Arial";
    ctx.fillText(place.shortName, 540, 650);
    ctx.fillStyle = "#c1f17d";
    ctx.font = "bold 110px Arial";
    ctx.fillText(`${completed}/${place.missions.length}`, 540, 860);
    ctx.fillStyle = "#c6dfeb";
    ctx.font = "30px Arial";
    ctx.fillText(t("THỬ THÁCH ĐÃ GIẢI MÃ", "CHALLENGES DECODED"), 540, 925);
    ctx.fillStyle = "#f3cc76";
    ctx.font = "bold 45px Arial";
    ctx.fillText(`+${completed * 150} XP`, 540, 1040);
    ctx.fillStyle = "#b3d7e3";
    ctx.font = "25px Arial";
    ctx.fillText("#CultureHunt  ·  #KeepExploring", 540, 1200);
    const link = document.createElement("a");
    link.download = `culture-hunt-${place.id}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    notify(
      t(
        "Đã tạo thẻ thành tích. Chia sẻ lên story của bạn nhé!",
        "Achievement card created. Add it to your story!",
      ),
    );
  }

  const nav = [
    { id: "home" as const, Icon: Home, label: t("Khám phá", "Explore") },
    {
      id: "journeys" as const,
      Icon: MapPin,
      label: t("Hành trình", "Journeys"),
    },
    {
      id: "collection" as const,
      Icon: Trophy,
      label: t("Dấu ấn", "Collection"),
    },
  ];

  if (!explorer.ready && !explorer.error) return <div className="loading-screen" role="status"><Compass size={28} /><p>{t("Đang tải dấu ấn của bạn…", "Loading your discoveries…")}</p></div>;

  return (
    <div className="mobile-app">
      <a href="#app-main" className="skip-link">
        {t("Đến nội dung chính", "Skip to main content")}
      </a>
      <header className={`app-top ${view === "home" ? "home-top" : ""}`}>
        <div className="app-top-inner">
          <GameBrand onClick={onIntro} />
          <div className="app-top-actions">
            <LanguageSwitch preservePlay />
            <button
              className="icon-button app-help"
              aria-label={t("Cách chơi", "How to play")}
              onClick={() => setOverlay("help")}
            >
              <HelpCircle size={21} />
            </button>
            <button
              className={`account-avatar ${session?.user ? "is-member" : ""}`}
              aria-label={t(
                session?.user ? "Mở hồ sơ của tôi" : "Tài khoản và đăng nhập",
                session?.user ? "Open my profile" : "Account and sign-in",
              )}
              onClick={() => session?.user ? navigate("profile") : setOverlay("account")}
            >
              {session?.user?.name?.charAt(0).toLocaleUpperCase(locale) || <UserRound size={21} />}
            </button>
          </div>
        </div>
        {view === "home" && (
          <div className="home-welcome">
            <div>
              <span className="welcome-eyebrow">
                {t("Xin chào,", "Hello,")}{" "}
                {session?.user?.name?.split(" ")[0] ||
                  t("nhà thám hiểm", "explorer")}{" "}
                <Sparkles size={15} />
              </span>
              <h1>
                {t("Hôm nay, mình", "Where will you")}
                <br />
                <span>{t("khám phá đâu?", "discover today?")}</span>
              </h1>
              <span className="welcome-city">
                <MapPin size={13} />
                {t("TP. Hồ Chí Minh", "Ho Chi Minh City")}
                <span />
                {session?.user
                  ? t("Đã đăng nhập", "Signed in")
                  : t("Chế độ khách", "Guest mode")}
              </span>
            </div>
            <XPBar xp={xp} />
          </div>
        )}
      </header>

      <main className={`app-main view-${view}`} id="app-main">
        {explorer.error && <div className="progress-sync-error" role="alert"><p>{explorer.error.split(" / ")[locale === "en" ? 1 : 0] || explorer.error}</p><button onClick={() => void explorer.reload()}>{t("Thử kết nối lại", "Retry connection")}</button></div>}
        {view === "collection" && (
            <div className="app-page-heading">
              <button
                className="icon-button"
                aria-label={t("Về khám phá", "Back to explore")}
                onClick={() => navigate("home")}
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <span className="eyebrow">
                  YOUR EXPLORER PASSPORT
                </span>
                <h1>{t("Hộ chiếu khám phá", "Explorer passport")}</h1>
              </div>
              <button
                className="icon-button sound-toggle"
                aria-label={
                  sound
                    ? t("Tắt âm thanh", "Mute sound")
                    : t("Bật âm thanh", "Enable sound")
                }
                aria-pressed={sound}
                onClick={() => {
                  setSound(!sound);
                  if (sound && "speechSynthesis" in window)
                    window.speechSynthesis.cancel();
                }}
              >
                {sound ? <Volume2 size={19} /> : <VolumeX size={19} />}
              </button>
            </div>
          )}

        {view === "home" && (
          <motion.div
            className="home-content"
            initial={false}
            animate={{ opacity: 1 }}
          >
            <button
              className="adventure-banner"
              onClick={() => selectPlace("palace")}
            >
              <Image
                src="/images/palace-exterior.webp"
                alt={t(
                  "Toàn cảnh Dinh Độc Lập",
                  "Independence Palace panorama",
                )}
                fill
                loading="eager"
                sizes="(max-width: 600px) 100vw, 1100px"
              />
              <span className="banner-copy">
                <small>
                  <Sparkles size={12} />
                  {t("MỞ KHÓA GÓC NHÌN MỚI", "UNLOCK A NEW PERSPECTIVE")}
                </small>
                <strong>
                  {t("Thành phố quen.", "Familiar city.")}
                  <br />
                  {t("Điều chưa kể.", "Untold stories.")}
                </strong>
                <span>
                  {t(
                    "Bắt đầu tại Dinh Độc Lập",
                    "Begin at Independence Palace",
                  )}
                  <ArrowRight size={15} />
                </span>
              </span>
              <span className="banner-stamp">
                <Compass size={30} />
                <small>
                  LET’S
                  <br />
                  EXPLORE
                </small>
              </span>
            </button>
            <section className="home-destinations">
              <div className="section-heading">
                <div>
                  <span className="eyebrow">
                    {t(
                      "CUỘC PHIÊU LƯU BẮT ĐẦU Ở ĐÂY",
                      "YOUR ADVENTURE STARTS HERE",
                    )}
                  </span>
                  <h2>{t("Điểm đến cho bạn", "Places to discover")}</h2>
                </div>
                <span className="section-count">
                  02 {t("địa điểm", "places")}
                </span>
              </div>
              <div
                className="destination-filters"
                role="group"
                aria-label={t("Lọc địa điểm", "Filter destinations")}
              >
                {[
                  {
                    id: "all" as const,
                    Icon: Compass,
                    title: t("Tất cả", "All places"),
                  },
                  {
                    id: "palace" as const,
                    Icon: Landmark,
                    title: t("Di tích", "Heritage"),
                  },
                  {
                    id: "hcmus" as const,
                    Icon: GraduationCap,
                    title: t("Tri thức", "Knowledge"),
                  },
                ].map(({ id, Icon, title }) => (
                  <button
                    key={id}
                    aria-pressed={filter === id}
                    className={filter === id ? "filter-active" : ""}
                    onClick={() => setFilter(id)}
                  >
                    <Icon size={15} />
                    {title}
                  </button>
                ))}
              </div>
              <div className="discovery-carousel">
                {places
                  .filter((item) => filter === "all" || item.id === filter)
                  .map((item) => (
                    <PlaceCard
                      key={item.id}
                      place={item}
                      completed={progress[item.id]}
                      saved={saved.includes(item.id)}
                      onSave={() => toggleSaved(item.id)}
                      onOpen={() => selectPlace(item.id)}
                    />
                  ))}
              </div>
              <p className="swipe-hint">
                {t(
                  "Hai điểm xuất phát. Nhiều điều để tò mò.",
                  "Two starting points. So much to be curious about.",
                )}
                <ArrowRight size={13} />
              </p>
            </section>
            <section className="today-quest">
              <div className="quest-icon">
                <Target size={25} />
              </div>
              <div>
                <span className="eyebrow">
                  {completed === place.missions.length
                    ? t("HÀNH TRÌNH ĐÃ HOÀN THÀNH", "JOURNEY COMPLETED")
                    : t("THỬ THÁCH ĐANG CHỜ", "YOUR NEXT LITTLE CHALLENGE")}
                </span>
                <h2>
                  {completed === place.missions.length
                    ? place.badge
                    : place.missions[completed].title}
                </h2>
                <p>
                  {place.shortName} <span>·</span> {completed}/
                  {place.missions.length} {t("đã giải mã", "decoded")}
                </p>
              </div>
              <button
                onClick={() =>
                  completed === place.missions.length
                    ? navigate("collection")
                    : navigate("journeys")
                }
                aria-label={
                  completed === place.missions.length
                    ? t("Xem bộ sưu tập", "View collection")
                    : t("Mở nhiệm vụ hiện tại", "Open current mission")
                }
              >
                <ArrowRight size={21} />
              </button>
              <span className="quest-xp">
                <Zap size={12} fill="currentColor" />
                +150 XP
              </span>
            </section>
            <section className="mini-how">
              <button
                className="text-button"
                onClick={() => setOverlay("help")}
              >
                {t("Xem lại hướng dẫn chơi", "Replay the tutorial")}
                <ArrowRight size={14} />
              </button>
            </section>
          </motion.div>
        )}

        {placeId === "palace" && view === "journeys" && (
          <PalaceExperience
            game={palaceGame}
            sound={sound}
            onJournal={() => navigate("collection")}
          />
        )}

        {view === "journeys" && placeId === "hcmus" && (
          <CampusExperience
            place={place}
            completed={completed}
            saved={saved.includes(placeId)}
            sound={sound}
            onSave={() => toggleSaved(placeId)}
            onSound={() => {
              setSound(!sound);
              if (sound && "speechSynthesis" in window)
                window.speechSynthesis.cancel();
            }}
            onOpenMission={openMission}
            onAchievement={() => setOverlay("achievement")}
          />
        )}

        {view === "collection" && (
          <CollectionAtlas
            game={palaceGame}
            campusProgress={progress.hcmus}
            name={session?.user?.name || t("Nhà thám hiểm tự do", "The curious explorer")}
            savedDestinations={saved}
            savedStories={explorer.bookmarks}
            onToggleStory={key => { void explorer.toggleBookmark(key); }}
            onToggleSaved={toggleSaved}
            onPlay={selectPlace}
            sound={sound}
          />
        )}
        {view === "profile" && <ExplorerProfile
          game={palaceGame}
          campusProgress={progress.hcmus}
          savedCount={saved.length}
          bookmarkCount={explorer.bookmarks.length}
          progressError={Boolean(explorer.error)}
          places={places}
          onExplore={selectPlace}
          onCollection={openCollection}
          onAccount={() => setOverlay("account")}
        />}
        <footer className="app-footer">
          <Compass size={14} />
          <span>
            Culture Hunt ·{" "}
            {t("Càng tò mò, càng thú vị.", "Stay curious. Keep exploring.")}
          </span>
          <small>{t("Trải nghiệm mẫu", "Preview experience")}</small>
        </footer>
      </main>
      <nav
        className="bottom-nav"
        aria-label={t("Điều hướng chính", "Main navigation")}
      >
        {nav.map(({ id, Icon, label }) => (
          <button
            key={id}
            className={view === id ? "nav-active" : ""}
            onClick={() => navigate(id)}
            aria-current={view === id ? "page" : undefined}
          >
            <span>
              <Icon size={21} strokeWidth={1.7} />
            </span>
            <small>{label}</small>
          </button>
        ))}
        <button className={view === "profile" ? "nav-active" : ""} aria-current={view === "profile" ? "page" : undefined} onClick={() => navigate("profile")}>
          <span>
            <UserRound size={21} strokeWidth={1.7} />
          </span>
          <small>{t("Cá nhân", "Profile")}</small>
        </button>
      </nav>

      <AnimatePresence mode="wait">
        {overlay && (
          <GameDialog
            key={overlay + locale}
            className={overlay === "account" ? "account-dialog" : overlay === "help" ? "tutorial-dialog" : ""}
            wide={overlay === "story" || overlay === "capture" || overlay === "quiz"}
            label={
              overlay === "capture" ? t("Nhận diện checkpoint", "Identify checkpoint") : overlay === "quiz"
                ? t("Thử thách tri thức", "Knowledge challenge")
                : overlay === "story"
                  ? t("Câu chuyện khám phá", "Discovery story")
                  : overlay === "account"
                    ? t("Tài khoản Culture Hunt", "Culture Hunt account")
                    : overlay === "help"
                      ? t("Hướng dẫn chơi", "How to play")
                      : t("Thành tích của bạn", "Your achievements")
            }
            onClose={dismissOverlay}
          >
            {overlay === "capture" && (
              <>
                <div className="checkpoint-scan-heading">
                  <small>CHECKPOINT {activeMission + 1} / {place.missions.length}</small>
                  <h2>{mission.title}</h2>
                </div>
                <ArtifactScanner place={place} checkpointNumber={activeMission + 1} onCapture={capture} />
              </>
            )}
            {overlay === "story" && (
              <StoryCard
                place={place}
                mission={mission}
                completed={activeMission < completed}
                sound={sound}
                onQuiz={() =>
                  activeMission < completed
                    ? setOverlay(null)
                    : setOverlay("quiz")
                }
              />
            )}
            {overlay === "quiz" && (
              <QuizCard
                mission={mission}
                final={activeMission === place.missions.length - 1}
                onComplete={completeMission}
                onContinue={() => {
                  if (activeMission === place.missions.length - 1) setOverlay("achievement");
                  else {
                    openMission(activeMission + 1);
                  }
                }}
              />
            )}
            {overlay === "account" && (
              <AccountPanel
                    onClose={() => setOverlay(null)}
              />
            )}
            {overlay === "help" && (
              <JourneyTutorial onDone={dismissOverlay} />
            )}
            {overlay === "achievement" && (
              <div className="achievement-content">
                <span className="eyebrow accent">
                  CULTURE HUNT · EXPLORER PASSPORT
                </span>
                <ExplorerBadge
                  kind={placeId === "palace" ? "landmark" : "star"}
                  locked={completed < place.missions.length}
                />
                <h2>
                  {completed === place.missions.length
                    ? place.badge
                    : t(
                        "Hành trình đang viết tiếp",
                        "Your story is still unfolding",
                      )}
                </h2>
                <p className="muted">{place.shortName}</p>
                <div className="achievement-stats">
                  <div>
                    <strong>
                      {completed}
                      <span>/{place.missions.length}</span>
                    </strong>
                    <small>{t("THỬ THÁCH", "CHALLENGES")}</small>
                  </div>
                  <div>
                    <strong>{completed * 150}</strong>
                    <small>{t("XP ĐÃ NHẬN", "XP EARNED")}</small>
                  </div>
                  <div>
                    <strong>
                      {Math.round((completed / place.missions.length) * 100)}
                      <span>%</span>
                    </strong>
                    <small>{t("KHÁM PHÁ", "EXPLORED")}</small>
                  </div>
                </div>
                <p className="achievement-caption">
                  {completed === place.missions.length
                    ? t(
                        "Không chỉ đi qua. Bạn đã mang về những câu chuyện.",
                        "You did more than visit. You brought back stories.",
                      )
                    : t(
                        "Hoàn thành tất cả checkpoint để mở huy hiệu địa điểm nhé.",
                        "Complete every checkpoint to unlock this destination's badge.",
                      )}
                </p>
                <button className="primary-button" onClick={share}>
                  <Share2 size={17} />
                  {t("Chia sẻ thành tích", "Share achievement")}
                </button>
                <button className="text-button" onClick={downloadCard}>
                  <Download size={16} />
                  {t(
                    "Tải thẻ cho Facebook / Instagram",
                    "Download for Facebook / Instagram",
                  )}
                </button>
                <small className="muted">
                  {t(
                    "Tiến độ được lưu theo hồ sơ đang chơi.",
                    "Progress is saved to your current explorer profile.",
                  )}
                </small>
              </div>
            )}
          </GameDialog>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {toast && (
          <motion.div
            className="game-toast"
            role="status"
            initial={{ y: 25, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 15, opacity: 0 }}
          >
            <Check size={18} />
            <span>{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
