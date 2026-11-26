"use client";
import Image from "next/image";
import { useId, useState, type FormEvent } from "react";
import { ArrowRight, BookOpen, Check, Compass, Eye, EyeOff, Flag, LoaderCircle, MapPin, ShieldCheck, Trophy } from "lucide-react";
import { useAccount } from "./AccountProvider";
import { useLanguage } from "./LanguageProvider";
import "./account.css";

export default function AccountPanel({ onClose, onGuest }: { onClose: () => void; onGuest?: () => void; authFailed?: boolean }) {
  const { t, locale } = useLanguage();
  const { data: session, ready, configured, error: connectionError, authenticate } = useAccount();
  const id = useId();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [visible, setVisible] = useState(false);
  const translate = (text: string) => text.split(" / ")[locale === "en" ? 1 : 0] || text;
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const data = new FormData(event.currentTarget);
    setBusy(true); setError("");
    try {
      await authenticate(mode, String(data.get("email") || "").trim(), String(data.get("password") || ""), String(data.get("name") || "").trim());
      (onGuest || onClose)();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Đăng nhập chưa hoàn tất. / Sign-in failed."); }
    finally { setBusy(false); }
  }
  return <div className="account-content account-email-login">
    <aside className="account-intro">
      <div className="account-wordmark"><Compass size={26} strokeWidth={1.4} /><span>CULTURE HUNT<small>EXPLORER PASSPORT</small></span></div>
      <h2>{t("Đi một chuyến.", "Go somewhere.")}<br /><em>{t("Giữ một câu chuyện.", "Keep a story.")}</em></h2>
      <div className="account-keepsake" aria-hidden="true">
        <div className="account-photo"><Image src="/images/palace-exterior.webp" alt="" fill sizes="340px" /><span><MapPin size={13} />{t("Dinh Độc Lập · Sài Gòn", "Independence Palace · Saigon")}</span></div>
        <div className="account-stamp"><Compass size={27} strokeWidth={1.2} /><span>STAY CURIOUS<br />KEEP EXPLORING</span></div>
        <small>01 / {t("MỘT ĐIỂM ĐẾN. NHIỀU ĐIỀU ĐỂ NHỚ.", "ONE PLACE. SO MUCH TO REMEMBER.")}</small>
      </div>
      <ul className="account-benefits">
        <li><Flag size={18} /><span>{t("Tiếp tục từ nơi bạn dừng lại", "Pick up where you left off")}</span></li>
        <li><Trophy size={18} /><span>{t("Sưu tầm huy hiệu của riêng mình", "Build your own badge collection")}</span></li>
        <li><BookOpen size={18} /><span>{t("Mang theo những câu chuyện đã mở", "Keep the stories you unlock")}</span></li>
      </ul>
    </aside>
    <section className="account-form-panel" aria-labelledby={`${id}-heading`}>
      {session?.user ? <>
        <span className="account-kicker"><ShieldCheck size={16} />{t("TÀI KHOẢN CỦA BẠN", "YOUR ACCOUNT")}</span>
        <h2 id={`${id}-heading`}>{t("Chào bạn,", "Welcome,")} {session.user.name}.</h2>
        <p className="account-description">{t("Hành trình đã sẵn sàng. Cùng khám phá câu chuyện tiếp theo nhé.", "Your journey is ready. Discover your next story.")}</p>
        <button className="primary-button" onClick={onGuest || onClose}>{t("Tiếp tục khám phá", "Keep exploring")}<ArrowRight size={18} /></button>
      </> : <>
        <span className="account-kicker"><span />{t("HỘ CHIẾU KHÁM PHÁ CỦA BẠN", "YOUR EXPLORER PASSPORT")}</span>
        <h2 id={`${id}-heading`}>{mode === "signin" ? t("Chào mừng trở lại.", "Welcome back.") : t("Bắt đầu câu chuyện của bạn.", "Start your own story.")}</h2>
        <p className="account-description">{mode === "signin" ? t("Đăng nhập để tiếp tục hành trình và giữ lại những dấu ấn của bạn.", "Sign in to continue your journey and keep your discoveries together.") : t("Chỉ cần email và mật khẩu. Những dấu ấn đầu tiên đang chờ bạn.", "An email and password are all you need. Your first discoveries await.")}</p>
        <div className="account-tabs" role="group" aria-label={t("Chọn đăng nhập hoặc đăng ký", "Sign in or create account")}>{(["signin", "signup"] as const).map(action => <button key={action} type="button" disabled={busy} aria-pressed={mode === action} onClick={() => { setMode(action); setError(""); setVisible(false); }}>{action === "signin" ? t("Đăng nhập", "Sign in") : t("Tạo tài khoản", "Create account")}</button>)}</div>
        <form className="account-form" onSubmit={event => void submit(event)} aria-busy={busy}>
          {mode === "signup" && <div className="account-field"><label htmlFor={`${id}-name`}>{t("Tên nhà thám hiểm", "Explorer name")}</label><input id={`${id}-name`} name="name" autoComplete="nickname" required maxLength={80} placeholder={t("Tên bạn muốn hiển thị", "Your display name")} disabled={busy} /></div>}
          <div className="account-field"><label htmlFor={`${id}-email`}>Email</label><input id={`${id}-email`} name="email" type="email" autoComplete="email" autoCapitalize="none" spellCheck={false} required maxLength={254} placeholder="ban@example.com" disabled={busy} /></div>
          <div className="account-field"><label htmlFor={`${id}-password`}>{t("Mật khẩu", "Password")}</label><div className="account-password"><input id={`${id}-password`} name="password" type={visible ? "text" : "password"} autoComplete={mode === "signup" ? "new-password" : "current-password"} required minLength={8} maxLength={128} placeholder={t("Ít nhất 8 ký tự", "At least 8 characters")} disabled={busy} aria-describedby={mode === "signup" ? `${id}-password-hint` : undefined} /><button type="button" disabled={busy} onClick={() => setVisible(!visible)} aria-label={visible ? t("Ẩn mật khẩu", "Hide password") : t("Hiện mật khẩu", "Show password")} aria-controls={`${id}-password`} aria-pressed={visible}>{visible ? <EyeOff size={19} /> : <Eye size={19} />}</button></div>{mode === "signup" && <small id={`${id}-password-hint`} className="account-field-hint">{t("Dùng ít nhất 8 ký tự để bảo vệ hành trình của bạn.", "Use at least 8 characters to protect your journey.")}</small>}</div>
          {(error || connectionError) && <p role="alert" className="account-status account-error">{translate(error || connectionError)}</p>}
          {ready && !configured && <p className="account-status" role="status">{t("Kết nối tài khoản chưa sẵn sàng. Bạn có thể khám phá bằng chế độ khách.", "Accounts are not available yet. You can explore as a guest.")}</p>}
          <button type="submit" className="primary-button" disabled={busy || !ready || !configured}>{busy ? <><LoaderCircle className="spin" size={18} />{mode === "signin" ? t("Đang đăng nhập…", "Signing in…") : t("Đang tạo tài khoản…", "Creating your account…")}</> : <>{mode === "signin" ? t("Đăng nhập & tiếp tục", "Sign in & continue") : t("Tạo tài khoản & khám phá", "Create account & explore")}<ArrowRight size={18} /></>}</button>
        </form>
        <div className="account-divider"><span />{t("hoặc", "or")}<span /></div>
        <button type="button" className="account-guest-action" disabled={busy} onClick={onGuest || onClose}>{t("Khám phá với tư cách khách", "Explore as a guest")}<ArrowRight size={16} /></button>
        <p className="account-privacy"><Check size={14} />{t("Tiến độ khách sẽ được gộp khi bạn đăng nhập.", "Guest progress joins your account when you sign in.")}</p>
      </>}
    </section>
  </div>;
}
