import type { CartTotals, PaymentMethod } from "./cart";
import type { CheckoutInput } from "./checkout";
import type { Locale } from "./locale";
import type { PaymentResult, PaymentStatus } from "./payment";

export const ORDER_STATUSES = ["pending_payment", "paid", "payment_failed", "cancelled", "expired", "refunded"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

/** The charge as the gateway first answered it, plus who answered. `Order.status` is the source of truth afterwards. */
export interface ChargeRecord {
  provider: string;
  result: PaymentResult;
}

export interface Order {
  id: string;
  createdAt: string;
  locale: Locale;
  status: OrderStatus;
  customer: CheckoutInput["customer"];
  address: CheckoutInput["address"];
  paymentMethod: PaymentMethod;
  totals: CartTotals;
  marketingOptIn: boolean;
  charge: ChargeRecord | null;
}

/**
 * Legal moves. A card can be declined and then retried on the hosted page, so
 * `payment_failed → paid` is allowed; nothing leaves `cancelled`/`expired`/`refunded`,
 * and a late event about another attempt can never un-pay an order.
 */
const TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  pending_payment: ["paid", "payment_failed", "cancelled", "expired"],
  payment_failed: ["paid"],
  paid: ["refunded"],
  cancelled: [],
  expired: [],
  refunded: [],
};

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return TRANSITIONS[from].includes(to);
}

const FROM_PAYMENT: Record<PaymentStatus, OrderStatus> = {
  pending: "pending_payment",
  approved: "paid",
  declined: "payment_failed",
  cancelled: "cancelled",
  expired: "expired",
  refunded: "refunded",
};

export function orderStatusFor(payment: PaymentStatus): OrderStatus {
  return FROM_PAYMENT[payment];
}

/**
 * Applies what the provider reported. Returns the next order, or `null` when
 * there is nothing to persist (same status — webhooks are redelivered — or an
 * illegal move). Idempotent by construction.
 */
export function applyPaymentStatus(order: Order, payment: PaymentStatus): Order | null {
  const next = orderStatusFor(payment);
  if (next === order.status || !canTransition(order.status, next)) return null;
  return { ...order, status: next };
}

/** Records the gateway's answer to the first charge and moves the order if the answer was already final. */
export function attachCharge(order: Order, provider: string, result: PaymentResult): Order {
  const withCharge: Order = { ...order, charge: { provider, result } };
  return applyPaymentStatus(withCharge, result.status) ?? withCharge;
}

/** The gateway could not be reached or refused the request: the order exists but can never be paid. */
export function markChargeFailed(order: Order): Order {
  return applyPaymentStatus(order, "declined") ?? order;
}

/** What a customer's browser may learn about an order from its id alone: no personal data (C5). */
export interface OrderPublicView {
  status: OrderStatus;
  /** Lets the UI say "demo order" without guessing; set by the gateway that created the charge. */
  provider: string | null;
  pix: { code: string; expiresAt: string } | null;
}

export function toPublicView(order: Order): OrderPublicView {
  const result = order.charge?.result;
  const pix =
    order.status === "pending_payment" && result?.method === "pix"
      ? { code: result.pixCode, expiresAt: result.expiresAt }
      : null;
  return { status: order.status, provider: order.charge?.provider ?? null, pix };
}
