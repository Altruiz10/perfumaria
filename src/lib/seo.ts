import type { Metadata } from "next";
import { LOCALES, LOCALE_TAG, type Locale } from "@/domain/locale";
import { localizePath } from "@/i18n/routes";
import { SITE_URL } from "./site";

/** Canonical + hreflang for an internal path (translated URLs, ADR-001). */
export function alternatesFor(locale: Locale, internalPath: string): Metadata["alternates"] {
  const languages: Record<string, string> = {};
  for (const l of LOCALES) languages[LOCALE_TAG[l]] = `${SITE_URL}${localizePath(l, internalPath)}`;
  languages["x-default"] = `${SITE_URL}${localizePath("pt", internalPath)}`;
  return { canonical: `${SITE_URL}${localizePath(locale, internalPath)}`, languages };
}
