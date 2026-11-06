"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type Locale = "vi" | "en";
const LanguageContext = createContext({
  locale: "vi" as Locale,
  setLocale: (_locale: Locale) => {
    void _locale;
  },
  t: (vi: string, _en: string) => {
    void _en;
    return vi;
  },
});

export function LanguageProvider({
  children,
  initialLocale,
}: {
  children: ReactNode;
  initialLocale?: Locale;
}) {
  const [locale, updateLocale] = useState<Locale>(initialLocale || "vi");
  useEffect(() => {
    // An explicit URL choice must win over a saved device preference.
    if (initialLocale) return;
    // Restore after hydration so server and client render the same initial UI.
    let saved: string | null = null;
    try {
      saved = localStorage.getItem("culture-hunt-language");
    } catch {
      /* Session-only preference. */
    }
    if (saved === "en") queueMicrotask(() => updateLocale("en"));
  }, [initialLocale]);
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
  useEffect(() => {
    const restoreUrlLanguage = () => {
      const language = new URLSearchParams(window.location.search).get("lang");
      if (language === "vi" || language === "en") updateLocale(language);
    };
    window.addEventListener("popstate", restoreUrlLanguage);
    return () => window.removeEventListener("popstate", restoreUrlLanguage);
  }, []);
  function setLocale(next: Locale) {
    updateLocale(next);
    const url = new URL(window.location.href);
    url.searchParams.set("lang", next);
    window.history.replaceState(
      null,
      "",
      `${url.pathname}${url.search}${url.hash}`,
    );
    try {
      localStorage.setItem("culture-hunt-language", next);
    } catch {
      /* Session-only preference. */
    }
  }
  return (
    <LanguageContext.Provider
      value={{ locale, setLocale, t: (vi, en) => (locale === "vi" ? vi : en) }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
