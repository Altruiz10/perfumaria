/** Bump when the privacy/cookie policy changes materially: re-opens the banner (C2). */
export const CONSENT_VERSION = "2026-09";
export const CONSENT_STORAGE_KEY = "hm_consent";

export type ConsentCategory = "necessary" | "analytics" | "marketing";

export interface ConsentState {
  version: string;
  necessary: true;
  analytics: boolean;
  marketing: boolean;
  updatedAt: string;
}

export function defaultConsent(): ConsentState {
  return { version: CONSENT_VERSION, necessary: true, analytics: false, marketing: false, updatedAt: "" };
}

export function createConsent(choice: { analytics: boolean; marketing: boolean }, now = new Date()): ConsentState {
  return {
    version: CONSENT_VERSION,
    necessary: true,
    analytics: choice.analytics === true,
    marketing: choice.marketing === true,
    updatedAt: now.toISOString(),
  };
}

export function parseConsent(raw: string | null | undefined): ConsentState | null {
  if (!raw) return null;
  try {
    const o = JSON.parse(raw) as Record<string, unknown>;
    if (
      o.version !== CONSENT_VERSION ||
      typeof o.analytics !== "boolean" ||
      typeof o.marketing !== "boolean" ||
      typeof o.updatedAt !== "string"
    )
      return null;
    return { version: CONSENT_VERSION, necessary: true, analytics: o.analytics, marketing: o.marketing, updatedAt: o.updatedAt };
  } catch {
    return null;
  }
}

/** C1: non-essential categories are denied unless explicitly granted. */
export function canUse(consent: ConsentState | null, category: ConsentCategory): boolean {
  if (category === "necessary") return true;
  return consent?.[category] === true;
}
