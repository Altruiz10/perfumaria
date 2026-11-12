"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useI18n } from "@/components/providers/AppProviders";
import { MoonIcon, SunIcon } from "@/components/ui/icons";
import { storage } from "@/lib/storage";
import { THEME_KEY } from "@/lib/theme";

type Theme = "light" | "dark";

/** The source of truth is <html data-theme> (set pre-paint by the theme script); we observe it. */
function subscribe(cb: () => void) {
  const mo = new MutationObserver(cb);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => mo.disconnect();
}
const getTheme = (): Theme => (document.documentElement.dataset.theme === "dark" ? "dark" : "light");

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { dict } = useI18n();
  const theme = useSyncExternalStore<Theme | null>(subscribe, getTheme, () => null);

  // Follow the OS while the user has not chosen explicitly.
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (e: MediaQueryListEvent) => {
      if (storage.get(THEME_KEY)) return;
      document.documentElement.dataset.theme = e.matches ? "dark" : "light";
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const toggle = () => {
    const next: Theme = getTheme() === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    storage.set(THEME_KEY, next);
  };

  const isDark = theme === "dark";
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? dict.header.toLight : dict.header.toDark}
      aria-pressed={isDark}
      className={`grid h-11 w-11 place-items-center transition-opacity hover:opacity-60 ${className}`}
      data-testid="theme-toggle"
    >
      <span className="relative block h-5 w-5">
        <SunIcon
          className={`absolute inset-0 transition-all duration-500 ${isDark ? "scale-100 rotate-0 opacity-100" : "scale-50 -rotate-90 opacity-0"}`}
        />
        <MoonIcon
          className={`absolute inset-0 transition-all duration-500 ${isDark ? "scale-50 rotate-90 opacity-0" : "scale-100 rotate-0 opacity-100"}`}
        />
      </span>
    </button>
  );
}
