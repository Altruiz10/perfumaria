import type { Cents } from "./money";

/** How long a Pix charge stays payable. Gateways apply it; the confirmation copy mentions it. */
export const PIX_EXPIRY_MINUTES = 30;

/**
 * Provider-neutral payment vocabulary. Each gateway adapter translates its own
 * statuses into this set, so nothing outside `infra/` knows a provider's words.
 */
export type PaymentStatus = "pending" | "approved" | "declined" | "cancelled" | "expired" | "refunded";

/**
 * What a gateway answers when asked to charge an order.
 * - Pix: a copy-and-paste code the customer pays in their bank app.
 * - Card, redirect: the customer finishes on the provider's hosted page (the card
 *   number never touches our server — PCI SAQ-A).
 * - Card, immediate: the provider already decided (used by the fake gateway).
 */
export type PaymentResult =
  | { method: "pix"; status: "pending"; externalId: string; pixCode: string; expiresAt: string }
  | { method: "card"; status: "pending"; externalId: string; redirectUrl: string }
  | { method: "card"; status: "approved" | "declined"; externalId: string };

/** What the provider says about one payment, fetched from the provider itself (never from a webhook body). */
export interface PaymentSnapshot {
  externalId: string;
  /** Our order id, echoed back by the provider (`external_reference`). */
  orderId: string;
  status: PaymentStatus;
  amountCents: Cents;
}
