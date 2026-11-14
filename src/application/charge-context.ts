import type { Order } from "@/domain/order";
import type { ChargeContext } from "@/domain/ports";
import { localizePath } from "@/i18n/routes";

export const PAYMENT_WEBHOOK_PATH = "/api/webhooks/payments";

/** Where the customer lands after paying (public, localized URL) and where the provider reports back. */
export function buildChargeContext(order: Pick<Order, "id" | "locale">, siteUrl: string): ChargeContext {
  const base = siteUrl.replace(/\/$/, "");
  const returnUrl = `${base}${localizePath(order.locale, "/checkout/confirmation")}?order=${encodeURIComponent(order.id)}`;
  // Providers only call back over public HTTPS; offering them http://localhost makes some reject the charge.
  const notificationUrl = base.startsWith("https://") ? `${base}${PAYMENT_WEBHOOK_PATH}` : null;
  return { returnUrl, notificationUrl };
}
