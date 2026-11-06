"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowDown,
  ArrowRight,
  AudioLines,
  Compass,
  Flag,
  MapPin,
  ScanLine,
  ShieldCheck,
  Sparkles,
  Trophy,
  Zap,
} from "lucide-react";
import { getPlaces } from "./game-data";
import { useLanguage } from "./LanguageProvider";
import { GameBrand, LanguageSwitch } from "./GameElements";

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
      className={signIn ? "landing-signin-form" : "hero-entry-form"}
      onSubmit={(event) => {
        event.preventDefault();
        onStart();
      }}
    >
      <input type="hidden" name="start" value="1" />
      <input type="hidden" name="lang" value={locale} />
      <button
        type="submit"
        className={signIn ? "landing-signin" : "hero-start"}
      >
        {signIn ? (
          <>
            {t("Đăng nhập", "Sign in")}
            <ArrowRight size={15} />
          </>
        ) : (
          <>
            <span className="hero-start-label">Get started</span>
            <span className="hero-start-icon" aria-hidden="true">
              <ArrowRight size={21} />
            </span>
          </>
        )}
      </button>
    </form>
  );
}

export default function LandingPage({ onStart }: { onStart: () => void }) {
  const { locale, t } = useLanguage();
  const places = getPlaces(locale);
  const reduced = useReducedMotion();
  return (
    <div className="landing-page">
      <a className="skip-link" href="#landing-main">
        {t("Đến nội dung chính", "Skip to content")}
      </a>
      <section className="landing-hero">
        <motion.div
          className="hero-photograph"
          initial={false}
          animate={reduced ? {} : { scale: [1.04, 1] }}
          transition={{ duration: 2.5, ease: "easeOut" }}
        >
          <Image
            src="/images/palace-exterior.webp"
            alt={t(
              "Toàn cảnh Dinh Độc Lập giữa không gian xanh của TP. Hồ Chí Minh",
              "Independence Palace surrounded by the greenery of Ho Chi Minh City",
            )}
            fill
            preload
            sizes="100vw"
          />
        </motion.div>
        <div className="hero-shade" />
        <header className="landing-header">
          <GameBrand
            onClick={() =>
              window.scrollTo({
                top: 0,
                behavior: reduced ? "instant" : "smooth",
              })
            }
          />
          <nav
            aria-label={t("Điều hướng giới thiệu", "Introduction navigation")}
          >
            <a href="#destinations">{t("Điểm đến", "Destinations")}</a>
            <a href="#how-it-works">{t("Cách chơi", "How it works")}</a>
          </nav>
          <div>
            <LanguageSwitch />
            <StartAction onStart={onStart} signIn />
          </div>
        </header>
        <main id="landing-main" className="hero-copy">
          <div className="hero-content">
            <span className="hero-eyebrow">
              <span />
              {t(
                "MỖI ĐIỂM ĐẾN, MỘT CUỘC PHIÊU LƯU",
                "EVERY DESTINATION, A NEW ADVENTURE",
              )}
            </span>
            <h1>
              {t("ĐI ĐỂ THẤY.", "GO BEYOND.")}
              <br />
              <span>{t("CHẠM ĐỂ HIỂU.", "GET CURIOUS.")}</span>
            </h1>
            <p>
              {t(
                "Đừng chỉ đi qua những nơi quen thuộc. Quét một dấu vết, mở một câu chuyện và mang về dấu ấn của riêng bạn.",
                "There is more to familiar places. Scan a clue, unlock a story, and bring home a discovery of your own.",
              )}
            </p>
            <StartAction onStart={onStart} />
            <small>
              {t(
                "Đăng nhập với Google hoặc khám phá ngay với tư cách khách",
                "Sign in with Google or jump straight in as a guest",
              )}
            </small>
          </div>
        </main>
        <div className="hero-reward" aria-hidden="true">
          <span>
            <Trophy size={23} />
          </span>
          <div>
            <small>
              {t("KHÁM PHÁ CÓ PHẦN THƯỞNG", "CURIOSITY HAS ITS REWARDS")}
            </small>
            <strong>
              +150 XP <Sparkles size={14} />
            </strong>
          </div>
        </div>
        <div className="hero-bottom">
          <div>
            <MapPin size={19} />
            <span>
              {t("Dinh Độc Lập", "Independence Palace")}
              <small>{t("THÀNH PHỐ HỒ CHÍ MINH", "HO CHI MINH CITY")}</small>
            </span>
          </div>
          <a href="#destinations">
            <span>{t("Cuộn để khám phá", "Scroll to discover")}</span>
            <ArrowDown size={17} />
          </a>
          <span className="hero-chapter">
            01 <i /> 02
          </span>
        </div>
      </section>

      <section className="landing-destinations" id="destinations">
        <div className="landing-section-heading">
          <div>
            <span className="eyebrow">
              <Compass size={15} />
              {t(
                "GẦN BẠN. KHÁC HƠN BẠN NGHĨ.",
                "CLOSER THAN YOU THINK. MORE THAN YOU EXPECT.",
              )}
            </span>
            <h2>
              {t("Chọn một nơi.", "Pick a place.")}
              <br />
              <span>{t("Mở cả hành trình.", "Unlock an adventure.")}</span>
            </h2>
          </div>
          <p>
            {t(
              "Từ dấu ấn lịch sử đến những câu chuyện tri thức. Hai điểm xuất phát, vô vàn điều để tò mò.",
              "From historic landmarks to stories of discovery. Two starting points, a world of curiosity.",
            )}
          </p>
        </div>
        <div className="landing-place-grid">
          {places.map((place, index) => (
            <button className="landing-place" key={place.id} onClick={onStart}>
              <Image
                src={place.coverImage}
                alt={place.name}
                fill
                sizes="(max-width: 700px) 100vw, 650px"
              />
              <span className="landing-place-top">
                <span>
                  0{index + 1} / {place.tag}
                </span>
                <span>
                  <ArrowRight size={19} />
                </span>
              </span>
              <span className="landing-place-bottom">
                <span>
                  <small>
                    <MapPin size={12} />
                    {t("TP. Hồ Chí Minh", "Ho Chi Minh City")}
                  </small>
                  <strong>{place.shortName}</strong>
                  <span>{place.journey}</span>
                </span>
                <span className="place-reward">
                  <Zap size={14} fill="currentColor" />
                  450 XP
                </span>
              </span>
            </button>
          ))}
        </div>
        <div className="landing-facts">
          <span>
            <MapPin size={17} />
            <strong>02</strong>
            {t("điểm đến", "destinations")}
          </span>
          <span>
            <Flag size={17} />
            <strong>06</strong>
            {t("thử thách mẫu", "sample challenges")}
          </span>
          <span>
            <Trophy size={17} />
            {t("Dấu ấn do bạn chinh phục", "Achievements you earn")}
          </span>
        </div>
      </section>

      <section className="landing-how" id="how-it-works">
        <div className="landing-section-heading">
          <div>
            <span className="eyebrow">
              <Sparkles size={15} />
              {t(
                "KHÔNG CẦN BIẾT TRƯỚC. CHỈ CẦN TÒ MÒ.",
                "NO EXPERTISE NEEDED. JUST A LITTLE CURIOSITY.",
              )}
            </span>
            <h2>
              {t("Một cuộc săn.", "One little hunt.")}
              <br />
              <span>
                {t("Nhiều hơn một chuyến đi.", "So much more than a visit.")}
              </span>
            </h2>
          </div>
          <p>
            {t(
              "Điện thoại là la bàn. Bạn là nhà thám hiểm. Câu chuyện ở ngay trước mắt.",
              "Your phone is the compass. You are the explorer. The story is right in front of you.",
            )}
          </p>
        </div>
        <div className="landing-step-grid">
          {[
            {
              Icon: ScanLine,
              title: t("Quét một dấu vết", "Scan a clue"),
              description: t(
                "Đưa hiện vật vào khung ngắm hoặc chọn ảnh. Bắt đầu bằng một chút tò mò.",
                "Frame a discovery or choose a photo. It starts with a little curiosity.",
              ),
            },
            {
              Icon: AudioLines,
              title: t("Mở một câu chuyện", "Unlock a story"),
              description: t(
                "Nghe thuyết minh, đọc chuyện ngắn và thử tài với quiz A, B, C, D.",
                "Hear the narration, read a short story, and take on an A–D quiz.",
              ),
            },
            {
              Icon: Trophy,
              title: t("Giữ một dấu ấn", "Earn your story"),
              description: t(
                "Nhận XP, mở huy hiệu và chia sẻ hành trình lên story của bạn.",
                "Earn XP, unlock a badge, and share your adventure to your story.",
              ),
            },
          ].map(({ Icon, title, description }, index) => (
            <article key={title}>
              <span className="landing-step-number">0{index + 1}</span>
              <span className="landing-step-icon">
                <Icon size={26} />
              </span>
              <h3>{title}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="landing-last-call">
        <span className="landing-last-star">✦</span>
        <div>
          <span className="eyebrow">YOUR NEXT STORY IS OUT THERE</span>
          <h2>
            {t(
              "Hành trình hay bắt đầu bằng một chạm.",
              "Your next adventure is one tap away.",
            )}
          </h2>
          <p>
            {t(
              "Bạn mang theo sự tò mò. Culture Hunt lo phần còn lại.",
              "Bring your curiosity. Let Culture Hunt take it from there.",
            )}
          </p>
        </div>
        <StartAction onStart={onStart} />
      </section>
      <footer className="landing-footer">
        <GameBrand
          onClick={() =>
            window.scrollTo({
              top: 0,
              behavior: reduced ? "instant" : "smooth",
            })
          }
        />
        <span>
          © 2026 Culture Hunt ·{" "}
          {t("Đi để hiểu. Chơi để nhớ.", "Explore to learn. Play to remember.")}
        </span>
        <span>
          <ShieldCheck size={13} />
          {t(
            "Bản trải nghiệm · Nội dung mẫu",
            "Preview experience · Sample content",
          )}
        </span>
      </footer>
    </div>
  );
}
