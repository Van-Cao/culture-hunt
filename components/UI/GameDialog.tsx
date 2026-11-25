"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { useLanguage } from "./LanguageProvider";

export default function GameDialog({
  children,
  onClose,
  label,
  wide = false,
  animateEntry = true,
  className = "",
}: {
  children: ReactNode;
  onClose: () => void;
  label: string;
  wide?: boolean;
  animateEntry?: boolean;
  className?: string;
}) {
  const { t } = useLanguage();
  const panel = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panel.current?.focus();
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        // A native photo viewer owns Escape even if its React handler has just closed it.
        if (event.target instanceof Element && event.target.closest("dialog")) return;
        closeRef.current();
      }
      if (event.key !== "Tab") return;
      const focusRoot = panel.current?.querySelector<HTMLDialogElement>("dialog[open]") || panel.current;
      const focusable = Array.from(focusRoot?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex="0"]',
      ) || []).filter(element => element.getClientRects().length > 0 && !element.closest("[inert]"));
      if (!focusable?.length) {
        event.preventDefault();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (
        event.shiftKey &&
        (document.activeElement === first ||
          document.activeElement === panel.current)
      ) {
        event.preventDefault();
        last.focus();
      } else if (
        !event.shiftKey &&
        (document.activeElement === last ||
          document.activeElement === panel.current)
      ) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", keydown);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", keydown);
      previous?.focus();
    };
  }, []);
  return (
    <motion.div
      className="dialog-backdrop"
      initial={animateEntry ? { opacity: 0 } : false}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        className={`game-dialog ${wide ? "dialog-wide" : ""} ${className}`}
        onClick={(event) => event.stopPropagation()}
        initial={animateEntry ? { y: 70, opacity: 0, scale: 0.97 } : false}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 35, opacity: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 28 }}
      >
        <button
          className="icon-button dialog-close"
          aria-label={t("Đóng cửa sổ", "Close dialog")}
          onClick={onClose}
        >
          <X size={19} />
        </button>
        {children}
      </motion.div>
    </motion.div>
  );
}
