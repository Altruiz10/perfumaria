import { applyPaymentStatus } from "@/domain/order";
import type { NotificationRequest, OrderRepository, PaymentNotifications } from "@/domain/ports";
import { errorFields, logEvent } from "@/lib/log";

export interface ReconcileDeps {
  orders: OrderRepository;
  notifications: PaymentNotifications;
}

export type ReconcileResult =
  | { kind: "unauthorized" }
  | { kind: "ignored"; reason: "not_a_payment" | "unknown_payment" | "unknown_order" | "amount_mismatch" }
  | { kind: "unchanged" }
  | { kind: "updated" };

const MAX_ATTEMPTS = 3;

/**
 * Use case: a provider says a payment changed. We authenticate the call, then
 * ask the provider for the payment's real state (never trust the body), check
 * it against what we charged, and move the order through the state machine.
 * Safe to run twice for the same event, and safe to run concurrently.
 */
export async function reconcilePayment(req: NotificationRequest, deps: ReconcileDeps): Promise<ReconcileResult> {
  const outcome = deps.notifications.parse(req);
  if (outcome.kind === "invalid") return { kind: "unauthorized" };
  if (outcome.kind === "ignored") return { kind: "ignored", reason: "not_a_payment" };

  const payment = await deps.notifications.fetchPayment(outcome.externalId);
  if (!payment) return { kind: "ignored", reason: "unknown_payment" };

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const order = await deps.orders.findById(payment.orderId);
    if (!order) {
      logEvent("reconcile", "unknown_order", { orderId: payment.orderId, paymentId: payment.externalId });
      return { kind: "ignored", reason: "unknown_order" };
    }

    // R2: never mark paid an order the provider collected a different amount for.
    if (payment.status === "approved" && payment.amountCents !== order.totals.total) {
      logEvent("reconcile", "amount_mismatch", {
        orderId: order.id,
        paymentId: payment.externalId,
        expected: order.totals.total,
        received: payment.amountCents,
      });
      return { kind: "ignored", reason: "amount_mismatch" };
    }

    const next = applyPaymentStatus(order, payment.status);
    if (!next) return { kind: "unchanged" };

    try {
      if (await deps.orders.update(next, order.status)) return { kind: "updated" };
    } catch (error) {
      logEvent("reconcile", "update_failed", { orderId: order.id, ...errorFields(error) });
      throw error; // let the provider redeliver
    }
    // Lost a race with another webhook: re-read and decide again.
  }
  throw new Error("reconcile_contention");
}
