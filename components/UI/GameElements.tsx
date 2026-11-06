"use client";

import { motion } from "framer-motion";
import {
  Compass,
  Globe2,
  Landmark,
  LockKeyhole,
  Sparkles,
  Star,
  Zap,
} from "lucide-react";
import { useLanguage } from "./LanguageProvider";

export function GameBrand({ onClick }: { onClick: () => void }) {
  return (
    <button className="game-brand" onClick={onClick} aria-label="Culture Hunt">
      <span className="brand-symbol">
        <Compass size={25} strokeWidth={1.7} />
      </span>
      <span>
        culture
        <span>
          hunt<span className="brand-dot">.</span>
        </span>
      </span>
    </button>
  );
}

export function LanguageSwitch({
  preservePlay = false,
}: {
  preservePlay?: boolean;
}) {
  const { locale, setLocale, t } = useLanguage();
  return (
    <form
      className="language-switch"
      action="/"
      method="get"
      role="group"
      aria-label={t("Ngôn ngữ", "Language")}
    >
      {preservePlay && <input type="hidden" name="play" value="1" />}
      <Globe2 size={15} />
      {(["vi", "en"] as const).map((language) => (
        <button
          key={language}
          type="submit"
          name="lang"
          value={language}
          onClick={(event) => {
            event.preventDefault();
            setLocale(language);
          }}
          aria-pressed={locale === language}
          aria-label={language === "vi" ? "Tiếng Việt" : "English"}
          className={locale === language ? "language-active" : ""}
        >
          {language.toUpperCase()}
        </button>
      ))}
    </form>
  );
}

export function ExplorerBadge({
  kind = "compass",
  locked = false,
  small = false,
}: {
  kind?: "compass" | "star" | "landmark";
  locked?: boolean;
  small?: boolean;
}) {
  const Icon = locked
    ? LockKeyhole
    : kind === "star"
      ? Star
      : kind === "landmark"
        ? Landmark
        : Compass;
  return (
    <div
      className={`badge-medallion ${locked ? "badge-locked" : ""} ${small ? "badge-small" : ""}`}
      aria-hidden="true"
    >
      <span className="badge-spark spark-one">✦</span>
      <span className="badge-spark spark-two">✧</span>
      <div className="badge-hex">
        <Icon size={small ? 24 : 39} strokeWidth={1.6} />
      </div>
      <span className="badge-ribbon" />
    </div>
  );
}

export function XPBar({ xp }: { xp: number }) {
  const { t } = useLanguage();
  const level = Math.floor(xp / 450) + 1;
  return (
    <div className="explorer-xp">
      <div className="xp-level">
        <Sparkles size={20} />
        <span>LV. {String(level).padStart(2, "0")}</span>
      </div>
      <div className="xp-detail">
        <div>
          <strong>{t("Nhà thám hiểm", "Explorer")}</strong>
          <span>
            <Zap size={12} fill="currentColor" />
            <b data-testid="xp-total">{xp}</b> XP
          </span>
        </div>
        <div className="progress-track">
          <motion.div
            initial={false}
            animate={{ width: `${((xp % 450) / 450) * 100}%` }}
          />
        </div>
        <small>
          {450 - (xp % 450)} XP {t("để lên cấp tiếp theo", "to the next level")}
        </small>
      </div>
    </div>
  );
}
