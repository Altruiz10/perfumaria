import type { Order } from "@/domain/order";
import { PIX_EXPIRY_MINUTES, type PaymentResult } from "@/domain/payment";
import type { NotificationOutcome, PaymentGateway, PaymentNotifications } from "@/domain/ports";

/**
 * Deterministic stand-in for a real provider. Same contract, no network, no card
 * data. Selected with PAYMENT_GATEWAY=fake (see infra/config.ts); never the default in production.
 */
export class FakePaymentGateway implements PaymentGateway {
  readonly name = "fake";

  async charge(order: Order): Promise<PaymentResult> {
    if (order.paymentMethod === "pix") {
      const expiresAt = new Date(Date.parse(order.createdAt) + PIX_EXPIRY_MINUTES * 60_000).toISOString();
      const amount = (order.totals.total / 100).toFixed(2);
      return {
        method: "pix",
        status: "pending",
        externalId: `fake_${order.id}`,
        pixCode: `00020126580014BR.GOV.BCB.PIX0136DEMO-${order.id}5204000053039865406${amount}5802BR5925HOMEM E MULHER PERFUMARIA6009SAO PAULO6304DEMO`,
        expiresAt,
      };
    }
    return { method: "card", status: "approved", externalId: `fake_${order.id}` };
  }
}

/** Nobody calls back in demo mode: every notification is rejected. */
export class FakePaymentNotifications implements PaymentNotifications {
  parse(): NotificationOutcome {
    return { kind: "invalid" };
  }
  async fetchPayment(): Promise<null> {
    return null;
  }
}
