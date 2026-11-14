import type { Order } from "@/domain/order";
import { PIX_EXPIRY_MINUTES, type PaymentStatus } from "@/domain/payment";
import type { ChargeContext } from "@/domain/ports";

/**
 * Pure translation between our domain and Mercado Pago's JSON. Everything
 * provider-specific that is not I/O lives here, so it is tested without a network.
 */

/** R1 boundary: the API speaks reais as decimals; we speak integer cents. */
export const centsToAmount = (cents: number): number => Math.round(cents) / 100;
export const amountToCents = (amount: number): number => Math.round(amount * 100);

function splitName(full: string): { first: string; last: string } {
  const parts = full.trim().split(/\s+/);
  return { first: parts[0] ?? "", last: parts.slice(1).join(" ") || parts[0] || "" };
}

const payerOf = (order: Order) => {
  const { first, last } = splitName(order.customer.name);
  return {
    email: order.customer.email,
    first_name: first,
    last_name: last,
    identification: { type: "CPF", number: order.customer.cpf },
  };
};

/** Mercado Pago wants an offset, not "Z". */
const toApiDate = (d: Date) => d.toISOString().replace("Z", "+00:00");

export function pixExpiry(order: Pick<Order, "createdAt">): Date {
  return new Date(Date.parse(order.createdAt) + PIX_EXPIRY_MINUTES * 60_000);
}

export function toPixPaymentRequest(order: Order, ctx: ChargeContext) {
  return {
    transaction_amount: centsToAmount(order.totals.total),
    description: `Pedido ${order.id}`,
    payment_method_id: "pix",
    external_reference: order.id,
    date_of_expiration: toApiDate(pixExpiry(order)),
    payer: payerOf(order),
    ...(ctx.notificationUrl ? { notification_url: ctx.notificationUrl } : {}),
  };
}

/**
 * Hosted checkout (Checkout Pro) restricted to cards. The sum of the items plus
 * shipping must equal the total we priced (R2), so a discounted order — which today
 * never happens for cards — is sent as one aggregated line instead of a negative item.
 */
export function toCardPreferenceRequest(order: Order, ctx: ChargeContext) {
  const { totals } = order;
  const items =
    totals.discount === 0
      ? totals.lines.map((l) => ({
          id: `${l.slug}-${l.sizeMl}`,
          title: `${l.name} ${l.sizeMl}ml`,
          quantity: l.quantity,
          unit_price: centsToAmount(l.unitPrice),
          currency_id: "BRL",
        }))
      : [
          {
            id: order.id,
            title: `Pedido ${order.id}`,
            quantity: 1,
            unit_price: centsToAmount(totals.total - totals.shipping),
            currency_id: "BRL",
          },
        ];
  const { first, last } = splitName(order.customer.name);
  const https = ctx.returnUrl.startsWith("https://");

  return {
    items,
    payer: {
      name: first,
      surname: last,
      email: order.customer.email,
      identification: { type: "CPF", number: order.customer.cpf },
    },
    external_reference: order.id,
    statement_descriptor: "HOMEM E MULHER",
    back_urls: { success: ctx.returnUrl, pending: ctx.returnUrl, failure: ctx.returnUrl },
    // auto_return is rejected for non-HTTPS return URLs (local development).
    ...(https ? { auto_return: "approved" } : {}),
    ...(ctx.notificationUrl ? { notification_url: ctx.notificationUrl } : {}),
    payment_methods: {
      // Pix is paid on our own page; boleto and bank transfer are not offered.
      excluded_payment_types: [{ id: "ticket" }, { id: "atm" }, { id: "bank_transfer" }],
      installments: 12,
    },
    shipments: { mode: "not_specified", cost: centsToAmount(totals.shipping) },
  };
}

/** Provider status → our vocabulary. Anything unrecognised is "pending": it changes nothing until we understand it. */
export function toPaymentStatus(status: string | undefined, statusDetail?: string): PaymentStatus {
  switch (status) {
    case "approved":
      return "approved";
    case "rejected":
      return "declined";
    case "cancelled":
      return statusDetail === "expired" ? "expired" : "cancelled";
    case "refunded":
    case "charged_back":
      return "refunded";
    default:
      return "pending"; // pending, in_process, authorized, in_mediation, unknown
  }
}
