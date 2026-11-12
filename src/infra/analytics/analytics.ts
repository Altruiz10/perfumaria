import { CONSENT_STORAGE_KEY, canUse, parseConsent } from "@/domain/consent";
import { storage } from "@/lib/storage";

/**
 * AnalyticsSink port (ARCHITECTURE §Portas). No-op until a provider is wired.
 * C1: never fires without analytics consent. C5: callers must not pass personal data.
 */
export type AnalyticsEvent =
  | { name: "view_item"; slug: string }
  | { name: "add_to_cart"; slug: string; sizeMl: number; value: number }
  | { name: "begin_checkout"; value: number }
  | { name: "purchase"; orderId: string; value: number };

type Sink = (e: AnalyticsEvent) => void;

let sink: Sink = () => {};

export function setAnalyticsSink(next: Sink) {
  sink = next;
}

export function track(event: AnalyticsEvent) {
  if (typeof window === "undefined") return;
  if (!canUse(parseConsent(storage.get(CONSENT_STORAGE_KEY)), "analytics")) return;
  sink(event);
}
