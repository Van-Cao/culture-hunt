"use client";
import { useState } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import {
  ArrowRight,
  Compass,
  LoaderCircle,
  LogOut,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { useLanguage } from "./LanguageProvider";

export function GoogleMark() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M21.6 12.23c0-.71-.06-1.39-.18-2.05H12v3.88h5.38a4.6 4.6 0 0 1-2 3.02v2.51h3.24c1.9-1.75 2.98-4.32 2.98-7.36Z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.7 0 4.96-.9 6.62-2.41l-3.24-2.51c-.9.6-2.06.97-3.38.97-2.6 0-4.8-1.76-5.59-4.12H3.07v2.59A10 10 0 0 0 12 22Z"
      />
      <path
        fill="#FBBC05"
        d="M6.41 13.93a6.04 6.04 0 0 1 0-3.86V7.48H3.07a10 10 0 0 0 0 9.04l3.34-2.59Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.95c1.47 0 2.79.5 3.82 1.49l2.87-2.87A9.59 9.59 0 0 0 12 2a10 10 0 0 0-8.93 5.48l3.34 2.59A6 6 0 0 1 12 5.95Z"
      />
    </svg>
  );
}

export default function AccountPanel({
  googleEnabled,
  onClose,
  authFailed = false,
  onGuest,
}: {
  googleEnabled: boolean;
  onClose: () => void;
  authFailed?: boolean;
  onGuest?: () => void;
}) {
  const { t, locale } = useLanguage();
  const { data: session } = useSession();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function login() {
    if (!googleEnabled || busy) return;
    setBusy(true);
    try {
      await signIn("google", { redirectTo: `/?play=1&lang=${locale}` });
    } catch {
      setBusy(false);
      setError(
        t(
          "Chưa đăng nhập được. Vui lòng thử lại nhé.",
          "Sign-in failed. Please try again.",
        ),
      );
    }
  }
  return (
    <div className="account-content">
      <div className="dialog-emblem">
        <Compass size={30} />
      </div>
      <span className="eyebrow accent">CULTURE HUNT · EXPLORER ID</span>
      {session?.user ? (
        <>
          <h2>
            {t("Chào nhà thám hiểm,", "Welcome, explorer,")}
            <br />
            {session.user.name}
          </h2>
          <p className="muted account-email">
            <UserRound size={16} />
            {session.user.email}
          </p>
          <div className="account-note">
            <ShieldCheck size={20} />
            <p>
              {t(
                "Đã đăng nhập với Google. Tiến độ demo hiện được lưu trên trình duyệt này.",
                "Signed in with Google. Demo progress is currently saved in this browser.",
              )}
            </p>
          </div>
          <form
            className="account-entry-action"
            action="/"
            method="get"
            onSubmit={(event) => {
              event.preventDefault();
              (onGuest || onClose)();
            }}
          >
            <input type="hidden" name="play" value="1" />
            <input type="hidden" name="lang" value={locale} />
            <button type="submit" className="primary-button">
              {t("Tiếp tục khám phá", "Keep exploring")}
              <ArrowRight size={18} />
            </button>
          </form>
          <button
            className="text-button"
            onClick={() => signOut({ redirectTo: "/" })}
          >
            <LogOut size={16} />
            {t("Đăng xuất", "Sign out")}
          </button>
        </>
      ) : (
        <>
          <h2>
            {t("Hành trình của bạn,", "Your adventure,")}
            <br />
            <span className="accent">
              {t("dấu ấn của riêng bạn.", "your own story.")}
            </span>
          </h2>
          <p className="muted">
            {t(
              "Dùng tài khoản Google để tạo danh tính nhà thám hiểm của bạn.",
              "Use your Google account to create your explorer identity.",
            )}
          </p>
          <button
            className="google-button"
            onClick={login}
            disabled={!googleEnabled || busy}
          >
            {busy ? (
              <LoaderCircle className="spin" size={20} />
            ) : (
              <GoogleMark />
            )}
            {t("Tiếp tục với Google", "Continue with Google")}
          </button>
          {!googleEnabled && (
            <p className="account-status">
              {t(
                "Đăng nhập Google sẽ được mở khi bản thử nghiệm kết nối tài khoản. Bạn vẫn có thể chơi ngay với chế độ khách.",
                "Google sign-in will be available once connected for this preview. You can explore as a guest right now.",
              )}
            </p>
          )}
          {error && (
            <p role="alert" className="account-status">
              {error}
            </p>
          )}
          {authFailed && !error && (
            <p role="alert" className="account-status">
              {t(
                "Lần đăng nhập trước chưa hoàn tất. Bạn có thể thử lại hoặc tiếp tục với chế độ khách.",
                "Your last sign-in did not complete. Try again or continue as a guest.",
              )}
            </p>
          )}
          <div className="account-divider">
            <span />
            {t("hoặc", "or")}
            <span />
          </div>
          <form
            className="account-entry-action"
            action="/"
            method="get"
            onSubmit={(event) => {
              event.preventDefault();
              (onGuest || onClose)();
            }}
          >
            <input type="hidden" name="play" value="1" />
            <input type="hidden" name="lang" value={locale} />
            <button type="submit" className="secondary-button">
              {t("Khám phá với tư cách khách", "Explore as a guest")}
              <ArrowRight size={17} />
            </button>
          </form>
          <small className="account-privacy">
            <ShieldCheck size={13} />
            {t(
              "Chỉ dùng hồ sơ cơ bản. Không truy cập hộp thư Gmail.",
              "Basic profile only. No access to your Gmail inbox.",
            )}
          </small>
        </>
      )}
    </div>
  );
}
