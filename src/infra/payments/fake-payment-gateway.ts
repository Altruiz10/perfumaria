import type { Order, PaymentGateway, PaymentResult } from "@/domain/ports";

/**
 * Deterministic stand-in for Stripe / Mercado Pago. Same contract, no network,
 * no card data. Swap in infra/container.ts once credentials exist.
 */
export class FakePaymentGateway implements PaymentGateway {
  readonly name = "fake";

  async charge(order: Order): Promise<PaymentResult> {
    if (order.paymentMethod === "pix") {
      const expiresAt = new Date(Date.parse(order.createdAt) + 30 * 60_000).toISOString();
      const amount = (order.totals.total / 100).toFixed(2);
      return {
        method: "pix",
        status: "pending",
        pixCode: `00020126580014BR.GOV.BCB.PIX0136DEMO-${order.id}5204000053039865406${amount}5802BR5925HOMEM E MULHER PERFUMARIA6009SAO PAULO6304DEMO`,
        expiresAt,
      };
    }
    return { method: "card", status: "approved", reference: `fake_${order.id}` };
  }
}
