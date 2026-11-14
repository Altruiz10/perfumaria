import { describe, expect, it } from "vitest";
import { sampleOrder } from "../orders/order-repository.contract";
import { orderToRow, orderToUpdateRow, rowToOrder } from "./order-row";
import type { Order } from "@/domain/order";
import type { PaymentResult } from "@/domain/payment";

const results: PaymentResult[] = [
  { method: "pix", status: "pending", externalId: "p1", pixCode: "000201", expiresAt: "2026-11-14T12:30:00.000Z" },
];

describe("order ↔ row mapping", () => {
  it("round-trip sem perda para pedido novo, sem cobrança", () => {
    const o = sampleOrder();
    expect(rowToOrder(orderToRow(o))).toEqual(o);
  });

  it("round-trip para cada formato de cobrança", () => {
    const pix = results[0];
    const redirect: PaymentResult = { method: "card", status: "pending", externalId: "pref-1", redirectUrl: "https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=1" };
    const approved: PaymentResult = { method: "card", status: "approved", externalId: "fake_1" };
    const declined: PaymentResult = { method: "card", status: "declined", externalId: "fake_2" };
    for (const result of [pix, redirect, approved, declined]) {
      const o: Order = sampleOrder({ paymentMethod: result.method, charge: { provider: "mercadopago", result } });
      expect(rowToOrder(orderToRow(o))).toEqual(o);
    }
  });

  it("valores em centavos inteiros e itens viram snapshot", () => {
    const row = orderToRow(sampleOrder());
    expect(row.total_cents).toBe(row.subtotal_cents - row.discount_cents + row.shipping_cents);
    expect(row.items).toHaveLength(1);
    expect(Number.isInteger(row.total_cents)).toBe(true);
  });

  it("a parte mutável é só status + cobrança (nunca dados pessoais)", () => {
    const update = orderToUpdateRow(sampleOrder({ status: "paid", charge: { provider: "mercadopago", result: results[0] } }));
    expect(Object.keys(update).sort()).toEqual(["payment_details", "payment_external_id", "payment_provider", "status"]);
    expect(JSON.stringify(update)).not.toContain("maria");
  });

  it("timestamp do Postgres (+00:00) volta como ISO do domínio", () => {
    const row = { ...orderToRow(sampleOrder()), created_at: "2026-11-14T12:00:00+00:00" };
    expect(rowToOrder(row).createdAt).toBe("2026-11-14T12:00:00.000Z");
  });

  it("linha corrompida falha alto em vez de inventar dado", () => {
    expect(() => rowToOrder({ ...orderToRow(sampleOrder()), locale: "xx" })).toThrow();
  });
});
