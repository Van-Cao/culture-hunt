"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, MotionConfig } from "framer-motion";
import { SessionProvider, useSession } from "next-auth/react";
import type { Session } from "next-auth";
import {
  ArrowLeft,
  ArrowRight,
  AudioLines,
  Award,
  Check,
  ChevronRight,
  Compass,
  Download,
  Flag,
  GraduationCap,
  Heart,
  HelpCircle,
  Home,
  Landmark,
  LockKeyhole,
  MapPin,
  ScanLine,
  Share2,
  ShieldCheck,
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
import LandingPage from "./LandingPage";
import ArtifactScanner from "./ArtifactScanner";
import GameDialog from "./GameDialog";
import StoryCard from "./StoryCard";
import QuizCard from "./QuizCard";
import AccountPanel from "./AccountPanel";
import PalaceExperience from "@/components/palace/PalaceExperience";
import { usePalaceJourney } from "@/components/palace/usePalaceJourney";
import "./game.css";

type View = "home" | "journeys" | "scan" | "collection";
type Overlay = "story" | "quiz" | "help" | "account" | "achievement" | null;
type PlaceId = Place["id"];
type Progress = Record<PlaceId, number>;

export default function CultureHunt({
  session,
  googleEnabled,
  initialLocale,
  initialPlay = false,
  initialStart = false,
  initialAuthFailed = false,
  initialDestination,
  initialView,
}: {
  session: Session | null;
  googleEnabled: boolean;
  initialLocale?: Locale;
  initialPlay?: boolean;
  initialStart?: boolean;
  initialAuthFailed?: boolean;
  initialDestination?: PlaceId;
  initialView?: View;
}) {
  return (
    <SessionProvider session={session} refetchOnWindowFocus={false}>
      <LanguageProvider initialLocale={initialLocale}>
        <MotionConfig reducedMotion="user">
          <Experience
            googleEnabled={googleEnabled}
            initialPlay={initialPlay}
            initialStart={initialStart}
            initialAuthFailed={initialAuthFailed}
            initialDestination={initialDestination}
            initialView={initialView}
          />
        </MotionConfig>
      </LanguageProvider>
    </SessionProvider>
  );
}

function Experience({
  googleEnabled,
  initialPlay,
  initialStart,
  initialAuthFailed,
  initialDestination,
  initialView,
}: {
  googleEnabled: boolean;
  initialPlay: boolean;
  initialStart: boolean;
  initialAuthFailed: boolean;
  initialDestination?: PlaceId;
  initialView?: View;
}) {
  const { t, locale } = useLanguage();
  const { data: session } = useSession();
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
      {entered ? (
        <Game
          googleEnabled={googleEnabled}
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
            label={t("Bắt đầu hành trình", "Start your adventure")}
            onClose={() => setEntryDialog(false)}
          >
            <AccountPanel
              googleEnabled={googleEnabled}
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
  googleEnabled,
  onIntro,
  initialDestination,
  initialView,
}: {
  googleEnabled: boolean;
  onIntro: () => void;
  initialDestination?: PlaceId;
  initialView?: View;
}) {
  const { locale, t } = useLanguage();
  const { data: session } = useSession();
  const places = getPlaces(locale);
  const [placeId, setPlaceId] = useState<PlaceId>(
    initialDestination || "palace",
  );
  const [view, setView] = useState<View>(
    initialView || (initialDestination ? "journeys" : "home"),
  );
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [localProgress, setProgress] = useState<Progress>({
    palace: 0,
    hcmus: 0,
  });
  const palaceGame = usePalaceJourney();
  const progress: Progress = {
    palace: palaceGame.state?.discovered.length || 0,
    hcmus: localProgress.hcmus,
  };
  const [saved, setSaved] = useState<PlaceId[]>([]);
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

  useEffect(() => {
    try {
      const stored = JSON.parse(
        localStorage.getItem("culture-hunt-progress-v1") || "null",
      );
      if (
        stored &&
        [stored.palace, stored.hcmus].every(
          (n: unknown) =>
            typeof n === "number" && Number.isInteger(n) && n >= 0 && n <= 3,
        )
      )
        queueMicrotask(() => setProgress({ palace: 0, hcmus: stored.hcmus }));
      const favorites = JSON.parse(
        localStorage.getItem("culture-hunt-saved-v1") || "[]",
      );
      if (Array.isArray(favorites))
        queueMicrotask(() =>
          setSaved([
            ...new Set(
              favorites.filter(
                (id): id is PlaceId => id === "palace" || id === "hcmus",
              ),
            ),
          ]),
        );
    } catch {
      /* Browser-local storage is optional for guest play. */
    }
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  useEffect(() => {
    const restore = () => {
      const query = new URLSearchParams(window.location.search);
      const destination = query.get("place");
      const target = query.get("view");
      if (destination === "palace" || destination === "hcmus")
        setPlaceId(destination);
      setView(
        target === "journeys" || target === "scan" || target === "collection"
          ? target
          : "home",
      );
    };
    window.addEventListener("popstate", restore);
    return () => window.removeEventListener("popstate", restore);
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
  function toggleSaved(id: PlaceId) {
    const next = saved.includes(id)
      ? saved.filter((item) => item !== id)
      : [...saved, id];
    setSaved(next);
    try {
      localStorage.setItem("culture-hunt-saved-v1", JSON.stringify(next));
    } catch {
      /* Keep session state. */
    }
  }
  function notify(message: string) {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 4500);
  }
  function capture() {
    if (completed === place.missions.length) {
      setOverlay("achievement");
      return;
    }
    setActiveMission(completed);
    setOverlay("story");
  }
  function openMission(index: number) {
    setActiveMission(index);
    if (index < completed) setOverlay("story");
    else navigate("scan");
  }
  function completeMission() {
    setProgress((current) => {
      if (current[placeId] !== activeMission) return current;
      const next = {
        ...current,
        [placeId]: Math.min(place.missions.length, activeMission + 1),
      };
      try {
        localStorage.setItem("culture-hunt-progress-v1", JSON.stringify(next));
      } catch {
        /* Keep session progress. */
      }
      return next;
    });
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
    { id: "scan" as const, Icon: ScanLine, label: t("Quét", "Scan") },
    {
      id: "collection" as const,
      Icon: Trophy,
      label: t("Dấu ấn", "Collection"),
    },
  ];
  const badges = [
    {
      name: t("Bước chân đầu tiên", "First footsteps"),
      desc: t("Giải mã thử thách đầu tiên", "Decode your first challenge"),
      kind: "compass" as const,
      unlocked: totalCompleted > 0,
      destination: (progress.palace > 0 ? "palace" : "hcmus") as PlaceId,
    },
    ...places.map((item) => ({
      name: item.badge,
      desc: item.shortName,
      kind: item.id === "palace" ? ("landmark" as const) : ("star" as const),
      unlocked: progress[item.id] === item.missions.length,
      destination: item.id,
    })),
  ];

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
              className="account-avatar"
              aria-label={t(
                "Tài khoản và đăng nhập Google",
                "Account and Google sign-in",
              )}
              onClick={() => setOverlay("account")}
            >
              {session?.user?.name?.charAt(0) || <UserRound size={21} />}
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
        {view !== "home" &&
          !(
            placeId === "palace" &&
            (view === "journeys" || view === "scan")
          ) && (
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
                  {view === "scan"
                    ? t("MỘT CHẠM, MỞ CÂU CHUYỆN", "ONE TAP. A NEW STORY.")
                    : view === "journeys"
                      ? t(
                          "ĐI TỪ TÒ MÒ ĐẾN KHÁM PHÁ",
                          "FROM CURIOUS TO EXPLORER",
                        )
                      : "YOUR EXPLORER PASSPORT"}
                </span>
                <h1>
                  {view === "scan"
                    ? t("Trạm quét", "Scan station")
                    : view === "journeys"
                      ? t("Hành trình của bạn", "Your adventure")
                      : t("Những dấu ấn của bạn", "Your discoveries")}
                </h1>
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
                    : navigate("scan")
                }
                aria-label={
                  completed === place.missions.length
                    ? t("Xem bộ sưu tập", "View collection")
                    : t("Đến trạm quét", "Go to scanner")
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
              <h2>
                {t(
                  "Chơi một chút. Biết thêm nhiều.",
                  "A little play. A lot to discover.",
                )}
              </h2>
              <div>
                <span>
                  <ScanLine size={21} />
                  {t("Quét dấu vết", "Scan a clue")}
                </span>
                <ChevronRight size={14} />
                <span>
                  <AudioLines size={21} />
                  {t("Nghe câu chuyện", "Hear a story")}
                </span>
                <ChevronRight size={14} />
                <span>
                  <Trophy size={21} />
                  {t("Săn dấu ấn", "Earn a badge")}
                </span>
              </div>
              <button
                className="text-button"
                onClick={() => setOverlay("help")}
              >
                {t("Mình chơi như thế nào?", "How do I play?")}
                <ArrowRight size={14} />
              </button>
            </section>
          </motion.div>
        )}

        {(view === "journeys" || view === "scan") && placeId !== "palace" && (
          <div
            className="place-choice-strip"
            role="group"
            aria-label={t("Địa điểm khám phá", "Discovery locations")}
          >
            {places.map((item) => (
              <button
                key={item.id}
                aria-pressed={placeId === item.id}
                className={placeId === item.id ? "place-choice-active" : ""}
                onClick={() => {
                  setPlaceId(item.id);
                  setActiveMission(
                    Math.min(progress[item.id], item.missions.length - 1),
                  );
                }}
              >
                {item.id === "palace" ? (
                  <Landmark size={16} />
                ) : (
                  <GraduationCap size={17} />
                )}
                {item.shortName}
              </button>
            ))}
          </div>
        )}

        {placeId === "palace" && (view === "journeys" || view === "scan") && (
          <PalaceExperience
            game={palaceGame}
            mode={view === "scan" ? "scan" : "map"}
            sound={sound}
            onJournal={() => navigate("collection")}
          />
        )}

        {view === "journeys" && placeId !== "palace" && (
          <motion.div
            className="journey-view"
            key={placeId}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="journey-hero">
              <Image
                src={place.coverImage}
                alt={place.name}
                fill
                sizes="(max-width: 600px) 100vw, 1100px"
              />
              <span className="journey-hero-tag">
                <MapPin size={13} />
                {place.tag}
              </span>
              <div>
                <h2>{place.shortName}</h2>
                <p>{place.journey}</p>
                <span>
                  <Flag size={14} />
                  {place.missions.length} {t("thử thách", "challenges")}
                  <i />
                  <Zap size={14} fill="currentColor" />
                  {place.missions.length * 150} XP
                </span>
              </div>
              <button
                className={`save-place ${saved.includes(placeId) ? "is-saved" : ""}`}
                aria-pressed={saved.includes(placeId)}
                aria-label={t("Lưu địa điểm này", "Save this destination")}
                onClick={() => toggleSaved(placeId)}
              >
                <Heart
                  size={19}
                  fill={saved.includes(placeId) ? "currentColor" : "none"}
                />
              </button>
            </div>
            <div className="journey-progress">
              <div>
                <strong>
                  {t(
                    "Mỗi khám phá, một dấu ấn.",
                    "Every discovery leaves a mark.",
                  )}
                </strong>
                <span>
                  {completed}/{place.missions.length}
                </span>
              </div>
              <div className="progress-track">
                <motion.div
                  initial={false}
                  animate={{
                    width: `${(completed / place.missions.length) * 100}%`,
                  }}
                />
              </div>
            </div>
            <div className="section-heading">
              <div>
                <span className="eyebrow">YOUR DISCOVERY TRAIL</span>
                <h2>{t("Lộ trình giải mã", "Your discovery trail")}</h2>
              </div>
              <span className="route-line-icon">
                <Flag size={21} />
              </span>
            </div>
            <div className="mission-list">
              {place.missions.map((item, index) => (
                <button
                  key={index}
                  disabled={index > completed}
                  className={`mission-step ${index < completed ? "mission-done" : index === completed ? "mission-current" : "mission-locked"}`}
                  onClick={() => openMission(index)}
                >
                  <span className="mission-node">
                    {index < completed ? (
                      <Check size={20} />
                    ) : index > completed ? (
                      <LockKeyhole size={18} />
                    ) : (
                      <ScanLine size={21} />
                    )}
                  </span>
                  <span>
                    <small>
                      {t("THỬ THÁCH", "CHALLENGE")} 0{index + 1}
                    </small>
                    <strong>{item.title}</strong>
                    <span>
                      {index < completed
                        ? t("Đã hoàn thành", "Completed")
                        : item.subtitle}
                    </span>
                  </span>
                  <span className="mission-end">
                    {index > completed ? (
                      <LockKeyhole size={14} />
                    ) : (
                      <ChevronRight size={20} />
                    )}
                    <small>+150 XP</small>
                  </span>
                </button>
              ))}
            </div>
            <div className="journey-badge">
              <ExplorerBadge
                small
                kind="star"
                locked={completed < place.missions.length}
              />
              <div>
                <span className="eyebrow">
                  {t("PHẦN THƯỞNG ĐÍCH ĐẾN", "DESTINATION REWARD")}
                </span>
                <h3>{place.badge}</h3>
                <p>
                  {completed === place.missions.length
                    ? t(
                        "Bạn đã chinh phục hành trình này!",
                        "You conquered this journey!",
                      )
                    : t(
                        "Hoàn thành đủ 3 thử thách để mở khóa.",
                        "Complete every challenge to unlock.",
                      )}
                </p>
              </div>
              {completed === place.missions.length && (
                <button
                  className="icon-button"
                  onClick={() => setOverlay("achievement")}
                  aria-label={t("Chia sẻ thành tích", "Share achievement")}
                >
                  <Share2 size={18} />
                </button>
              )}
            </div>
          </motion.div>
        )}

        {view === "scan" && placeId !== "palace" && (
          <motion.div
            className="scan-layout"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div>
              <div className="scanner-mission-label">
                <span>
                  <span className="live-dot" />
                  {place.shortName}
                </span>
                <span>
                  {Math.min(completed + 1, place.missions.length)}/
                  {place.missions.length}
                </span>
              </div>
              <ArtifactScanner
                key={`${placeId}-${locale}`}
                place={place}
                complete={completed === place.missions.length}
                onCapture={capture}
              />
            </div>
            <aside className="scan-side">
              <div className="scan-quest-note">
                <Target size={24} />
                <div>
                  <span className="eyebrow">
                    {t("NHIỆM VỤ HIỆN TẠI", "CURRENT QUEST")}
                  </span>
                  <h2>
                    {completed === place.missions.length
                      ? t("Hành trình trọn vẹn!", "Journey complete!")
                      : place.missions[completed].title}
                  </h2>
                  <p>
                    {t(
                      "Quét, nghe chuyện và giải mã để nhận",
                      "Scan, listen, and decode to earn",
                    )}{" "}
                    <strong>150 XP.</strong>
                  </p>
                </div>
              </div>
              <button
                className="scan-route-link"
                onClick={() => navigate("journeys")}
              >
                <Flag size={17} />
                {t("Xem toàn bộ hành trình", "View your discovery trail")}
                <ArrowRight size={17} />
              </button>
              <div className="scan-tips">
                <ShieldCheck size={18} />
                <p>
                  {t(
                    "Ảnh ở trên thiết bị của bạn. Bản trải nghiệm mở câu chuyện và quiz mẫu tại địa điểm đã chọn.",
                    "Photos stay on your device. This preview opens sample stories and quizzes for your selected destination.",
                  )}
                </p>
              </div>
            </aside>
          </motion.div>
        )}

        {view === "collection" && (
          <motion.div
            className="collection-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <PalaceExperience
              game={palaceGame}
              mode="journal"
              sound={sound}
              onJournal={() => navigate("collection")}
              onMap={() => selectPlace("palace")}
            />
            <div className="passport-summary">
              <span className="passport-icon">
                <Compass size={34} />
              </span>
              <div>
                <span className="eyebrow">CULTURE HUNT · EXPLORER ID</span>
                <h2>
                  {session?.user?.name ||
                    t("Nhà thám hiểm tự do", "The curious explorer")}
                </h2>
                <span>
                  {t(
                    "Đi để hiểu. Chơi để nhớ.",
                    "Explore to learn. Play to remember.",
                  )}
                </span>
              </div>
              <span className="passport-level">
                LV. {Math.floor(xp / 450) + 1}
              </span>
            </div>
            <div className="passport-stats">
              <div>
                <strong>{xp}</strong>
                <span>{t("XP đã nhận", "XP earned")}</span>
              </div>
              <div>
                <strong>
                  {totalCompleted}
                  <small>
                    /
                    {places.reduce(
                      (sum, item) => sum + item.missions.length,
                      0,
                    )}
                  </small>
                </strong>
                <span>{t("Thử thách", "Challenges")}</span>
              </div>
              <div>
                <strong>
                  {badges.filter((item) => item.unlocked).length}
                  <small>/3</small>
                </strong>
                <span>{t("Huy hiệu", "Badges")}</span>
              </div>
            </div>
            <div className="section-heading">
              <div>
                <span className="eyebrow">COLLECT MOMENTS, NOT THINGS</span>
                <h2>{t("Bộ sưu tập huy hiệu", "Your badge collection")}</h2>
              </div>
              <Award size={23} />
            </div>
            <div className="badge-collection">
              {badges.map((badge) => (
                <button
                  key={badge.name}
                  className={`collection-badge ${badge.unlocked ? "unlocked" : ""}`}
                  disabled={!badge.unlocked}
                  onClick={() => {
                    setPlaceId(badge.destination);
                    setOverlay("achievement");
                  }}
                >
                  <span className="badge-state">
                    {badge.unlocked ? (
                      <Check size={12} />
                    ) : (
                      <LockKeyhole size={11} />
                    )}
                    {badge.unlocked
                      ? t("ĐÃ MỞ KHÓA", "UNLOCKED")
                      : t("CHỜ KHÁM PHÁ", "YET TO DISCOVER")}
                  </span>
                  <ExplorerBadge kind={badge.kind} locked={!badge.unlocked} />
                  <h3>{badge.name}</h3>
                  <p>{badge.desc}</p>
                </button>
              ))}
            </div>
            <div className="share-banner">
              <span>
                <Share2 size={23} />
              </span>
              <div>
                <h3>
                  {t(
                    "Chuyện hay là để chia sẻ.",
                    "Good stories are meant to be shared.",
                  )}
                </h3>
                <p>
                  {t(
                    "Mang dấu ấn lên Facebook & Instagram.",
                    "Take your story to Facebook & Instagram.",
                  )}
                </p>
              </div>
              <button
                className="icon-button"
                aria-label={t("Mở thẻ thành tích", "Open achievement card")}
                onClick={() => setOverlay("achievement")}
              >
                <ArrowRight size={19} />
              </button>
            </div>
            <div className="section-heading saved-heading">
              <div>
                <span className="eyebrow">FOR YOUR NEXT ADVENTURE</span>
                <h2>{t("Địa điểm đã lưu", "Saved destinations")}</h2>
              </div>
              <Heart size={21} />
            </div>
            {saved.length ? (
              <div className="saved-places">
                {places
                  .filter((item) => saved.includes(item.id))
                  .map((item) => (
                    <button key={item.id} onClick={() => selectPlace(item.id)}>
                      <Image
                        src={item.coverImage}
                        alt={item.name}
                        width={76}
                        height={76}
                      />
                      <span>
                        <strong>{item.shortName}</strong>
                        <small>
                          {progress[item.id]}/{item.missions.length}{" "}
                          {t("thử thách đã giải mã", "challenges decoded")}
                        </small>
                      </span>
                      <ArrowRight size={18} />
                    </button>
                  ))}
              </div>
            ) : (
              <div className="saved-empty">
                <Heart size={24} />
                <p>
                  {t(
                    "Chạm trái tim ở điểm đến để lưu cho hành trình sau.",
                    "Tap the heart on a destination to save it for your next adventure.",
                  )}
                </p>
                <button
                  className="text-button"
                  onClick={() => navigate("home")}
                >
                  {t("Tìm điểm đến", "Find a destination")}
                  <ArrowRight size={14} />
                </button>
              </div>
            )}
          </motion.div>
        )}

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
            className={`${view === id ? "nav-active" : ""} ${id === "scan" ? "nav-scan" : ""}`}
            onClick={() => navigate(id)}
            aria-current={view === id ? "page" : undefined}
          >
            <span>
              <Icon size={id === "scan" ? 26 : 21} strokeWidth={1.7} />
            </span>
            <small>{label}</small>
          </button>
        ))}
        <button onClick={() => setOverlay("account")}>
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
            wide={overlay === "story"}
            label={
              overlay === "quiz"
                ? t("Thử thách tri thức", "Knowledge challenge")
                : overlay === "story"
                  ? t("Câu chuyện khám phá", "Discovery story")
                  : overlay === "account"
                    ? t("Tài khoản Culture Hunt", "Culture Hunt account")
                    : overlay === "help"
                      ? t("Hướng dẫn chơi", "How to play")
                      : t("Thành tích của bạn", "Your achievements")
            }
            onClose={() => setOverlay(null)}
          >
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
                final={activeMission === 2}
                onComplete={completeMission}
                onContinue={() => {
                  if (activeMission === 2) setOverlay("achievement");
                  else {
                    setActiveMission(activeMission + 1);
                    setOverlay("story");
                  }
                }}
              />
            )}
            {overlay === "account" && (
              <AccountPanel
                googleEnabled={googleEnabled}
                onClose={() => setOverlay(null)}
              />
            )}
            {overlay === "help" && (
              <div className="help-content">
                <span className="dialog-emblem">
                  <Compass size={29} />
                </span>
                <span className="eyebrow accent">LET THE HUNT BEGIN</span>
                <h2>
                  {t(
                    "Thành phố là một sân chơi.",
                    "The city is your playground.",
                  )}
                </h2>
                <p className="muted">
                  {t(
                    "Bạn là nhà thám hiểm. Sự tò mò là hành trang.",
                    "You are the explorer. Curiosity is all you need.",
                  )}
                </p>
                {[
                  {
                    Icon: MapPin,
                    title: t("Chọn điểm đến", "Pick your place"),
                    text: t(
                      "Khám phá Dinh Độc Lập hoặc ĐH Khoa học Tự nhiên. Tiến độ mỗi nơi được lưu riêng.",
                      "Explore Independence Palace or the University of Science. Each destination has its own progress.",
                    ),
                  },
                  {
                    Icon: ScanLine,
                    title: t("Quét & nghe chuyện", "Scan & listen"),
                    text: t(
                      "Bật camera, tải ảnh hoặc thử ảnh mẫu để mở thẻ chuyện và audio.",
                      "Open your camera, upload a photo, or try a sample to unlock a story and audio.",
                    ),
                  },
                  {
                    Icon: Trophy,
                    title: t("Giải mã & nhận thưởng", "Decode & earn"),
                    text: t(
                      "Mỗi quiz đúng nhận 150 XP. Hoàn thành đủ 3 để mở huy hiệu địa điểm và chia sẻ thành tích.",
                      "The Palace has five checkpoints: identify a photo, discover its story, and answer a quiz. Complete the trail to earn a badge and save your discovery atlas.",
                    ),
                  },
                ].map(({ Icon, title, text }, index) => (
                  <div className="help-step" key={title}>
                    <span>
                      <Icon size={23} />
                    </span>
                    <div>
                      <h3>
                        0{index + 1} · {title}
                      </h3>
                      <p>{text}</p>
                    </div>
                  </div>
                ))}
                <button
                  className="primary-button"
                  onClick={() => {
                    setOverlay(null);
                    navigate("home");
                  }}
                >
                  {t("Mình sẵn sàng rồi!", "Ready for the adventure!")}
                  <ArrowRight size={18} />
                </button>
              </div>
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
                        "Hoàn thành cả 3 thử thách để mở huy hiệu địa điểm nhé.",
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
                    "Tiến độ demo được lưu trên trình duyệt này.",
                    "Demo progress is saved in this browser.",
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
