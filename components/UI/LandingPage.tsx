"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type PointerEvent } from "react";
import { motion, useReducedMotion, useSpring } from "framer-motion";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  MapPin,
  Pause,
  Play,
} from "lucide-react";
import { getPlaces } from "./game-data";
import { useLanguage } from "./LanguageProvider";
import { GameBrand, LanguageSwitch } from "./GameElements";
import { useAccount } from "./AccountProvider";
import JourneyTutorial from "./JourneyTutorial";
import "./landing.css";
import "./landing-hero.css";

function StartAction({
  onStart,
  signIn = false,
}: {
  onStart: () => void;
  signIn?: boolean;
}) {
  const { locale, t } = useLanguage();
  const { data: session } = useAccount();
  return (
    <form
      action="/"
      method="get"
      className="intro-entry"
      onSubmit={(event) => {
        event.preventDefault();
        onStart();
      }}
    >
      <input type="hidden" name="start" value="1" />
      <input type="hidden" name="lang" value={locale} />
      <button type="submit" className={signIn ? "intro-signin" : "intro-start"}>
          {signIn
            ? session?.user ? t("Hành trình của tôi", "My journeys") : t("Đăng nhập", "Sign in")
          : t("Bắt đầu hành trình", "Get started")}
        {signIn ? (
          <ArrowUpRight size={16} aria-hidden="true" />
        ) : (
          <ArrowRight size={19} aria-hidden="true" />
        )}
      </button>
    </form>
  );
}

export default function LandingPage({
  onStart,
}: {
  onStart: (destination?: "palace" | "hcmus") => void;
}) {
  const { locale, t } = useLanguage();
  const places = getPlaces(locale);
  const reduced = useReducedMotion();
  const heroRef = useRef<HTMLElement>(null);
  const touchPointer = useRef<number | null>(null);
  const touchPoints = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ distance: number; scale: number } | null>(null);
  const [activePhoto, setActivePhoto] = useState(0);
  const [paused, setPaused] = useState(false);
  const photoCount = places.length;
  const featuredPlace = places[activePhoto];
  const originX = useSpring(0.5, { stiffness: 90, damping: 25 });
  const originY = useSpring(0.5, { stiffness: 90, damping: 25 });
  const photoScale = useSpring(1, { stiffness: 120, damping: 25 });

  useEffect(() => {
    if (paused) return;
    const timer = window.setInterval(() => {
      const bounds = heroRef.current?.getBoundingClientRect();
      if (document.hidden || touchPointer.current !== null || !bounds || bounds.bottom <= 0 || bounds.top >= window.innerHeight) return;
      setActivePhoto(current => (current + 1) % photoCount);
    }, 10_000);
    return () => window.clearInterval(timer);
  }, [paused, photoCount]);

  useEffect(() => {
    const reset = () => {
      touchPointer.current = null;
      touchPoints.current.clear();
      pinch.current = null;
      photoScale.set(1);
    };
    window.addEventListener("blur", reset);
    document.addEventListener("visibilitychange", reset);
    return () => {
      window.removeEventListener("blur", reset);
      document.removeEventListener("visibilitychange", reset);
    };
  }, [photoScale]);

  function resetPointer() {
    touchPointer.current = null;
    touchPoints.current.clear();
    pinch.current = null;
    photoScale.set(1);
  }

  function startTouch(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType === "mouse" || reduced) return;
    // Image gestures never capture links/buttons or block vertical page scrolling.
    const target = event.target as HTMLElement;
    if (!heroRef.current?.contains(target) || target.closest("a, button, input, select, textarea")) return;
    if (!event.isPrimary && touchPoints.current.size === 0) return;
    touchPoints.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    touchPointer.current ??= event.pointerId;
    if (touchPoints.current.size === 2) {
      const [a, b] = [...touchPoints.current.values()];
      pinch.current = { distance: Math.max(1, Math.hypot(a.x - b.x, a.y - b.y)), scale: photoScale.get() };
    }
    followPointer(event);
  }

  function followPointer(event: PointerEvent<HTMLDivElement>) {
    if (reduced) return;
    if (event.pointerType === "mouse") {
      if (!window.matchMedia("(any-hover: hover) and (any-pointer: fine)").matches) return;
    } else {
      if (!touchPoints.current.has(event.pointerId)) return;
      touchPoints.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    }
    const bounds = heroRef.current?.getBoundingClientRect();
    if (!bounds || event.clientY < bounds.top || event.clientY > bounds.bottom) {
      resetPointer();
      return;
    }
    let x = event.clientX, y = event.clientY, scale = 1.2;
    if (pinch.current && touchPoints.current.size >= 2) {
      const [a, b] = [...touchPoints.current.values()];
      x = (a.x + b.x) / 2;
      y = (a.y + b.y) / 2;
      scale = Math.max(1, Math.min(2.4, pinch.current.scale * Math.hypot(a.x - b.x, a.y - b.y) / pinch.current.distance));
    }
    originX.set(Math.max(0, Math.min(1, (x - bounds.left) / bounds.width)));
    originY.set(Math.max(0, Math.min(1, (y - bounds.top) / bounds.height)));
    photoScale.set(scale);
  }
  const backToTop = () =>
    window.scrollTo({ top: 0, behavior: reduced ? "instant" : "smooth" });
  return (
    <div
      className="intro-page"
      onPointerDown={startTouch}
      onPointerMove={followPointer}
      onPointerUp={event => { if (event.pointerType !== "mouse") resetPointer(); }}
      onPointerCancel={resetPointer}
      onLostPointerCapture={resetPointer}
      onPointerLeave={resetPointer}
    >
      <a className="skip-link" href="#landing-main">
        {t("Đến nội dung chính", "Skip to content")}
      </a>
      <header className="intro-header intro-container intro-overlay-header">
        <GameBrand onClick={backToTop} />
        <nav aria-label={t("Điều hướng giới thiệu", "Introduction navigation")}>
          <a href="#how-it-works">{t("Cách chơi", "How it works")}</a>
        </nav>
        <div className="intro-header-actions">
          <LanguageSwitch />
          <StartAction onStart={onStart} signIn />
        </div>
      </header>

      <main id="landing-main" tabIndex={-1}>
        <section className="travel-hero" ref={heroRef} aria-labelledby="intro-title">
          <motion.div
            className="travel-hero-scene"
            style={{ scale: reduced ? 1 : photoScale, originX, originY }}
          >
            {places.map((place, index) => (
              <div
                key={place.id}
                className={`travel-hero-photo${index === activePhoto ? " is-active" : ""}`}
                aria-hidden={index !== activePhoto}
              >
                <Image
                  src={place.coverImage}
                  alt={place.name}
                  fill
                  preload={index === 0}
                  loading={index === 0 ? undefined : "eager"}
                  sizes="100vw"
                />
              </div>
            ))}
          </motion.div>
          <div className="travel-hero-shade" aria-hidden="true" />
          <div className="travel-hero-content intro-container">
            <span className="travel-eyebrow"><span />{t("MỖI ĐIỂM ĐẾN, MỘT CÂU CHUYỆN", "EVERY PLACE HAS A STORY")}</span>
            <h1 id="intro-title">{t("ĐI ĐỂ THẤY.", "GO BEYOND.")}<br /><span>{t("CHẠM ĐỂ HIỂU.", "GET CURIOUS.")}</span></h1>
            <p>{t("Khám phá di sản. Giải mã dấu vết. Viết nên hành trình của riêng bạn.", "Explore heritage. Follow the clues. Make the journey your own.")}</p>
            <StartAction onStart={onStart} />
            <span className="travel-guest-note">{t("Đăng nhập hoặc khám phá ngay với tư cách khách", "Sign in or jump straight in as a guest")}</span>
            <span className="travel-touch-hint">{t("Giữ để rê ảnh · Dùng hai ngón để phóng/thu", "Hold to explore · Pinch to zoom the photo")}</span>
          </div>
          <div className="travel-hero-bottom intro-container">
            <div className="travel-location">
              <MapPin size={18} aria-hidden="true" />
              <span>
                <small>{t("VIỆT NAM", "VIETNAM")} · {String(activePhoto + 1).padStart(2, "0")} / {String(photoCount).padStart(2, "0")}</small>
                <strong>{featuredPlace.shortName}</strong>
              </span>
            </div>
            <a className="travel-scroll" href="#how-it-works"><span>{t("XEM CÁCH CHƠI", "HOW TO PLAY")}</span><ArrowDown size={18} aria-hidden="true" /></a>
            <div className="travel-slideshow">
              <span className="travel-slide-dots" aria-hidden="true">
                {places.map((place, index) => <span key={place.id} className={index === activePhoto ? "is-active" : ""} />)}
              </span>
              <button
                type="button"
                onClick={() => setPaused(value => !value)}
                aria-label={paused ? t("Tiếp tục đổi ảnh nền", "Resume background slideshow") : t("Tạm dừng đổi ảnh nền", "Pause background slideshow")}
              >
                {paused ? <Play size={15} aria-hidden="true" /> : <Pause size={15} aria-hidden="true" />}
              </button>
            </div>
          </div>
        </section>
        <section id="how-it-works" className="landing-tutorial intro-container" aria-label={t("Hướng dẫn chơi", "How to play")}>
          <JourneyTutorial />
        </section>
      </main>
      <footer className="intro-footer intro-container">
        <GameBrand onClick={backToTop} />
        <span>
          © 2026 Culture Hunt
          <br />
          {t("Đi để hiểu. Chơi để nhớ.", "Explore to learn. Play to remember.")}
        </span>
        <span className="intro-preview-note">
          <span />
          {t(
            "Bản trải nghiệm · Nội dung mẫu",
            "Preview experience · Sample content",
          )}
        </span>
        <button
          className="intro-back-top"
          onClick={backToTop}
          aria-label={t("Về đầu trang", "Back to top")}
        >
          <ArrowRight size={19} />
        </button>
      </footer>
    </div>
  );
}
