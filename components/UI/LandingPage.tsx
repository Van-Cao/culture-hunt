"use client";

import Image from "next/image";
import { useReducedMotion } from "framer-motion";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  AudioLines,
  Compass,
  Flag,
  MapPin,
  ScanLine,
  Sparkles,
  Ticket,
  Trophy,
  Zap,
} from "lucide-react";
import { getPlaces } from "./game-data";
import { useLanguage } from "./LanguageProvider";
import { GameBrand, LanguageSwitch } from "./GameElements";
import "./landing.css";

function StartAction({
  onStart,
  signIn = false,
}: {
  onStart: () => void;
  signIn?: boolean;
}) {
  const { locale, t } = useLanguage();
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
          ? t("Đăng nhập", "Sign in")
          : t("Bắt đầu khám phá", "Start exploring")}
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
  const backToTop = () =>
    window.scrollTo({ top: 0, behavior: reduced ? "instant" : "smooth" });
  const steps = [
    {
      Icon: ScanLine,
      title: t("Quét một dấu vết", "Scan a clue"),
      description: t(
        "Đưa hiện vật vào khung ngắm hoặc chọn một bức ảnh. Mỗi chi tiết là một khởi đầu.",
        "Frame an artifact or choose a photo. Every little detail is a beginning.",
      ),
      note: t("NHÌN KỸ HƠN MỘT CHÚT", "LOOK A LITTLE CLOSER"),
    },
    {
      Icon: AudioLines,
      title: t("Mở một câu chuyện", "Unlock a story"),
      description: t(
        "Lắng nghe, đọc và giải mã những điều thú vị qua các câu hỏi ngắn.",
        "Listen, read, and uncover something unexpected through a few short questions.",
      ),
      note: t("ĐỂ SỰ TÒ MÒ DẪN LỐI", "LET CURIOSITY LEAD"),
    },
    {
      Icon: Trophy,
      title: t("Giữ một dấu ấn", "Make it a memory"),
      description: t(
        "Tích lũy XP, mở huy hiệu và mang về một câu chuyện để chia sẻ.",
        "Collect XP, unlock a badge, and take home a story worth sharing.",
      ),
      note: t("MANG CÂU CHUYỆN VỀ NHÀ", "TAKE THE STORY HOME"),
    },
  ];

  return (
    <div className="intro-page">
      <a className="skip-link" href="#landing-main">
        {t("Đến nội dung chính", "Skip to content")}
      </a>
      <header className="intro-header intro-container">
        <GameBrand onClick={backToTop} />
        <nav aria-label={t("Điều hướng giới thiệu", "Introduction navigation")}>
          <a href="#destinations">{t("Điểm đến", "Destinations")}</a>
          <a href="#how-it-works">{t("Cách chơi", "How it works")}</a>
        </nav>
        <div className="intro-header-actions">
          <LanguageSwitch />
          <StartAction onStart={onStart} signIn />
        </div>
      </header>

      <main id="landing-main" tabIndex={-1}>
        <section
          className="intro-hero intro-container"
          aria-labelledby="intro-title"
        >
          <div className="intro-copy">
            <span className="intro-kicker">
              <span />
              {t("DÀNH CHO NHỮNG TÂM HỒN TÒ MÒ", "FOR THE ENDLESSLY CURIOUS")}
            </span>
            <h1 id="intro-title">
              {t("Đi để thấy.", "Go beyond.")}
              <br />
              <em>{t("Chạm để hiểu.", "Get curious.")}</em>
            </h1>
            <p className="intro-description">
              {t(
                "Có những câu chuyện chỉ hiện ra khi bạn dừng lại. Khám phá di sản, giải mã dấu vết và nhìn thành phố qua một góc nhìn mới.",
                "Some stories only appear when you slow down. Explore heritage, follow the clues, and see a familiar city in a whole new light.",
              )}
            </p>
            <div className="intro-hero-actions">
              <StartAction onStart={onStart} />
              <a className="intro-how-link" href="#how-it-works">
                {t("Mình chơi thế nào?", "How does it work?")}
                <ArrowUpRight size={17} aria-hidden="true" />
              </a>
            </div>
            <span className="intro-guest-note">
              <Compass size={14} aria-hidden="true" />
              {t(
                "Khám phá ngay với tư cách khách",
                "Jump straight in as a guest",
              )}
            </span>
            <div className="intro-hero-footnote">
              <span className="intro-small-compass" aria-hidden="true">
                <Compass size={27} strokeWidth={1.1} />
              </span>
              <p>
                {t("Một thành phố quen.", "A familiar city.")}
                <br />
                <strong>
                  {t("Ngàn điều chưa kể.", "A thousand untold stories.")}
                </strong>
              </p>
              <a
                href="#destinations"
                aria-label={t("Cuộn đến điểm đến", "Scroll to destinations")}
              >
                <ArrowDown size={19} />
              </a>
            </div>
          </div>
          <figure className="intro-visual">
            <div className="intro-photo">
              <Image
                src="/images/palace-exterior.webp"
                alt={t(
                  "Dinh Độc Lập giữa những tán cây xanh tại TP. Hồ Chí Minh",
                  "Independence Palace among the green trees of Ho Chi Minh City",
                )}
                fill
                preload
                sizes="(max-width: 760px) 100vw, 55vw"
              />
              <span className="intro-photo-label">
                <span />
                {t("HÀNH TRÌNH NỔI BẬT", "THE FEATURED JOURNEY")}
              </span>
              <div className="intro-photo-title">
                <span>01 — 02</span>
                <strong>{t("Dinh Độc Lập", "Independence Palace")}</strong>
                <span>
                  <MapPin size={13} aria-hidden="true" />
                  {t("Thành phố Hồ Chí Minh", "Ho Chi Minh City")}
                </span>
              </div>
              <span className="intro-photo-stamp" aria-hidden="true">
                <Compass size={34} strokeWidth={1.2} />
                <span>
                  GO. SEEK.
                  <br />
                  DISCOVER.
                </span>
              </span>
            </div>
            <figcaption className="intro-photo-caption">
              <span>
                {t(
                  "GÓC NHÌN MỚI, CÂU CHUYỆN MỚI",
                  "A NEW PERSPECTIVE. A NEW STORY.",
                )}
              </span>
              <span>10.7770° N · 106.6953° E</span>
            </figcaption>
            <div className="intro-ticket">
              <span className="intro-ticket-icon">
                <Ticket size={25} strokeWidth={1.5} aria-hidden="true" />
              </span>
              <div>
                <span>{t("TẤM VÉ CỦA SỰ TÒ MÒ", "YOUR CURIOSITY PASS")}</span>
                <strong>
                  {t(
                    "Chạm vào một hành trình mới",
                    "Your next chapter starts here",
                  )}
                </strong>
              </div>
              <span className="intro-ticket-xp">
                <Zap size={14} fill="currentColor" aria-hidden="true" />
                750 XP<small>{t("/ hành trình", "/ journey")}</small>
              </span>
            </div>
          </figure>
        </section>
        <div className="intro-facts-wrap">
          <div className="intro-facts intro-container">
            <span className="intro-facts-label">
              {t(
                "ĐI MỘT CHUYẾN. MANG VỀ NHIỀU HƠN.",
                "GO SOMEWHERE. COME BACK WITH MORE.",
              )}
            </span>
            <span>
              <MapPin size={18} aria-hidden="true" />
              <strong>02</strong>
              {t("điểm đến", "destinations")}
            </span>
            <span>
              <Flag size={18} aria-hidden="true" />
              <strong>08</strong>
              {t("thử thách", "challenges")}
            </span>
            <span>
              <Trophy size={18} aria-hidden="true" />
              {t("Dấu ấn của riêng bạn", "Memories made by you")}
            </span>
          </div>
        </div>
        <section
          className="intro-destinations intro-container"
          id="destinations"
          aria-labelledby="destinations-title"
        >
          <div className="intro-section-heading">
            <div>
              <span className="intro-kicker">
                01 / {t("CHỌN ĐIỂM XUẤT PHÁT", "PICK YOUR STARTING POINT")}
              </span>
              <h2 id="destinations-title">
                {t("Gần bạn.", "Close to you.")}{" "}
                <em>{t("Khác bạn nghĩ.", "Far from ordinary.")}</em>
              </h2>
            </div>
            <p>
              {t(
                "Những nơi tưởng đã quen, vẫn còn nhiều điều để kể. Bạn muốn bắt đầu từ đâu?",
                "Even the places you know have more to tell. Where will your curiosity take you?",
              )}
            </p>
          </div>
          <div className="intro-place-grid">
            {places.map((place, index) => (
              <article className="intro-place" key={place.id}>
                <button
                  className="intro-place-image"
                  onClick={() => onStart(place.id)}
                  aria-label={`${t("Khám phá", "Explore")} ${place.shortName}`}
                >
                  <Image
                    src={place.coverImage}
                    alt={place.name}
                    fill
                    sizes="(max-width: 760px) 100vw, 50vw"
                  />
                  <span className="intro-place-tag">{place.tag}</span>
                  <span className="intro-place-arrow">
                    <ArrowUpRight size={23} aria-hidden="true" />
                  </span>
                </button>
                <div className="intro-place-details">
                  <span className="intro-place-number">0{index + 1}</span>
                  <div>
                    <span className="intro-place-city">
                      <MapPin size={12} aria-hidden="true" />
                      {t("TP. Hồ Chí Minh", "Ho Chi Minh City")}
                    </span>
                    <h3>
                      <button onClick={() => onStart(place.id)}>
                        {place.shortName}
                      </button>
                    </h3>
                    <p>{place.journey}</p>
                  </div>
                  <span className="intro-place-xp">
                    <Zap size={13} fill="currentColor" aria-hidden="true" />
                    {place.missions.length * 150} XP
                  </span>
                </div>
              </article>
            ))}
          </div>
          <p className="intro-destination-note">
            <Compass size={15} aria-hidden="true" />
            {t(
              "Không cần đi xa để có một cuộc phiêu lưu.",
              "You don’t have to go far to find an adventure.",
            )}
          </p>
        </section>
        <section
          className="intro-how"
          id="how-it-works"
          aria-labelledby="how-title"
        >
          <div className="intro-container">
            <div className="intro-section-heading">
              <div>
                <span className="intro-kicker">
                  02 / {t("CHỈ CẦN MỘT CHÚT TÒ MÒ", "JUST A LITTLE CURIOSITY")}
                </span>
                <h2 id="how-title">
                  {t("Một chuyến đi.", "One little visit.")}
                  <br />
                  <em>
                    {t("Nhiều hơn một trải nghiệm.", "A whole new experience.")}
                  </em>
                </h2>
              </div>
              <p>
                {t(
                  "Điện thoại là la bàn. Bạn là nhà thám hiểm. Câu chuyện ở ngay trước mắt.",
                  "Your phone is the compass. You are the explorer. The story is right in front of you.",
                )}
              </p>
            </div>
            <div className="intro-step-grid">
              {steps.map(({ Icon, title, description, note }, index) => (
                <article key={title}>
                  <div className="intro-step-top">
                    <span>0{index + 1}</span>
                    <Icon size={28} strokeWidth={1.3} aria-hidden="true" />
                  </div>
                  <h3>{title}</h3>
                  <p>{description}</p>
                  <span className="intro-step-note">{note}</span>
                </article>
              ))}
            </div>
          </div>
        </section>
        <section
          className="intro-last-call intro-container"
          aria-labelledby="last-call-title"
        >
          <div className="intro-last-symbol" aria-hidden="true">
            <Sparkles size={46} strokeWidth={1} />
          </div>
          <span className="intro-kicker">
            {t(
              "CÂU CHUYỆN TIẾP THEO ĐANG CHỜ BẠN",
              "YOUR NEXT STORY IS OUT THERE",
            )}
          </span>
          <h2 id="last-call-title">
            {t("Mang theo sự tò mò.", "Bring your curiosity.")}
            <br />
            <em>
              {t(
                "Còn lại, cứ để hành trình lo.",
                "Let the adventure do the rest.",
              )}
            </em>
          </h2>
          <StartAction onStart={onStart} />
          <p>
            {t(
              "Đăng nhập với Google hoặc bắt đầu với tư cách khách.",
              "Sign in with Google or start exploring as a guest.",
            )}
          </p>
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
