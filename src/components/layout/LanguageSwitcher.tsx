"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useI18n } from "@/components/providers/AppProviders";
import { ChevronIcon } from "@/components/ui/icons";
import { LOCALES, LOCALE_COOKIE, LOCALE_META, type Locale } from "@/i18n/config";
import { switchLocalePath } from "@/i18n/routes";

/** Persists choice in a first-party essential cookie (read by proxy.ts) and moves to the translated URL. */
export function changeLocale(target: Locale) {
  document.cookie = `${LOCALE_COOKIE}=${target}; path=/; max-age=31536000; samesite=lax`;
  const { pathname, search, hash } = window.location;
  // Full document navigation on purpose: <html lang>, dictionaries and the proxy cookie all change.
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination
  window.location.assign(`${switchLocalePath(pathname, target)}${search}${hash}`);
}

export function LanguageSwitcher({
  variant = "floating",
}: {
  variant?: "floating" | "inline";
}) {
  const { locale, dict } = useI18n();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const listId = useId();

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (variant === "inline") {
    return (
      <div role="group" aria-label={dict.header.language} className="flex gap-2">
        {LOCALES.map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => l !== locale && changeLocale(l)}
            aria-current={l === locale ? "true" : undefined}
            lang={l}
            className={`caps flex min-h-11 items-center gap-2 border px-3 transition-colors ${
              l === locale ? "border-ink text-ink" : "border-line text-muted hover:border-ink hover:text-ink"
            }`}
          >
            <span aria-hidden="true">{LOCALE_META[l].flag}</span>
            {LOCALE_META[l].short}
          </button>
        ))}
      </div>
    );
  }

  const current = LOCALE_META[locale];
  return (
    <div ref={root} className="fixed right-4 bottom-4 z-40 md:right-6 md:bottom-6" data-testid="language-switcher">
      <div
        id={listId}
        role="menu"
        aria-label={dict.header.language}
        className={`absolute right-0 bottom-full mb-2 min-w-44 origin-bottom-right border border-line bg-bg/95 py-2 shadow-[0_20px_60px_-20px_rgba(0,0,0,.35)] backdrop-blur-md transition-all duration-400 ease-[var(--ease-lux)] ${
          open ? "visible translate-y-0 scale-100 opacity-100" : "invisible translate-y-2 scale-95 opacity-0"
        }`}
      >
        {LOCALES.map((l) => (
          <button
            key={l}
            role="menuitemradio"
            aria-checked={l === locale}
            lang={l}
            type="button"
            tabIndex={open ? 0 : -1}
            onClick={() => (l === locale ? setOpen(false) : changeLocale(l))}
            className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors hover:bg-surface ${
              l === locale ? "text-ink" : "text-muted"
            }`}
          >
            <span aria-hidden="true" className="text-base">
              {LOCALE_META[l].flag}
            </span>
            <span className="flex-1">{LOCALE_META[l].label}</span>
            {l === locale && <span aria-hidden="true" className="h-1 w-1 rounded-full bg-gold" />}
          </button>
        ))}
      </div>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={`${dict.header.language}: ${current.label}`}
        onClick={() => setOpen((o) => !o)}
        className="flex h-11 items-center gap-2 rounded-full border border-line bg-bg/90 pr-3 pl-3.5 text-ink shadow-[0_10px_30px_-12px_rgba(0,0,0,.35)] backdrop-blur-md transition-colors hover:border-ink"
      >
        <span aria-hidden="true" className="text-base leading-none">
          {current.flag}
        </span>
        <span className="text-[0.7rem] tracking-[0.18em]">{current.short}</span>
        <ChevronIcon size={14} className={`transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
      </button>
    </div>
  );
}
