export { LOCALES, DEFAULT_LOCALE, LOCALE_TAG, isLocale, type Locale } from "@/domain/locale";
import type { Locale } from "@/domain/locale";

export const LOCALE_COOKIE = "hm_locale";

export const LOCALE_META: Record<Locale, { label: string; flag: string; short: string }> = {
  pt: { label: "Português", flag: "🇧🇷", short: "PT" },
  en: { label: "English", flag: "🇺🇸", short: "EN" },
  es: { label: "Español", flag: "🇪🇸", short: "ES" },
};

/** Minimal Accept-Language negotiation: first supported primary tag wins. */
export function negotiateLocale(acceptLanguage: string | null, fallback: Locale): Locale {
  if (!acceptLanguage) return fallback;
  const tags = acceptLanguage
    .split(",")
    .map((part) => {
      const [tag, q] = part.trim().split(";q=");
      return { tag: tag.toLowerCase().split("-")[0], q: q ? Number(q) : 1 };
    })
    .sort((a, b) => b.q - a.q);
  for (const { tag } of tags) {
    if (tag === "pt" || tag === "en" || tag === "es") return tag;
  }
  return fallback;
}
