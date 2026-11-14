import { describe, expect, it } from "vitest";
import {
  ORDER_STATUSES,
  applyPaymentStatus,
  attachCharge,
  canTransition,
  markChargeFailed,
  toPublicView,
  type Order,
  type OrderStatus,
} from "./order";
import type { PaymentResult } from "./payment";
import { validCheckout } from "./test-fixtures";

const base: Order = {
  id: "HM-TEST-1",
  createdAt: "2026-11-14T12:00:00.000Z",
  locale: "pt",
  status: "pending_payment",
  customer: { name: "Maria Souza", email: "maria@example.com", cpf: "52998224725", phone: "11912345678" },
  address: { ...validCheckout.address, cep: "01310100", complement: "", state: "SP" },
  paymentMethod: "pix",
  totals: { lines: [], subtotal: 34900, shipping: 0, discount: 1745, total: 33155 },
  marketingOptIn: false,
  charge: null,
};
const at = (status: OrderStatus): Order => ({ ...base, status });

const pix: PaymentResult = {
  method: "pix",
  status: "pending",
  externalId: "123",
  pixCode: "000201...",
  expiresAt: "2026-11-14T12:30:00.000Z",
};

describe("order state machine", () => {
  it("CT-021 pedido pendente vira pago, falho, cancelado ou expirado", () => {
    for (const [event, expected] of [
      ["approved", "paid"],
      ["declined", "payment_failed"],
      ["cancelled", "cancelled"],
      ["expired", "expired"],
    ] as const) {
      expect(applyPaymentStatus(base, event)?.status).toBe(expected);
    }
  });

  it("CT-021 evento repetido não muda nada (webhook reentregue é idempotente)", () => {
    expect(applyPaymentStatus(at("paid"), "approved")).toBeNull();
    expect(applyPaymentStatus(base, "pending")).toBeNull();
  });

  it("CT-021 cartão recusado pode ser pago numa nova tentativa", () => {
    expect(applyPaymentStatus(at("payment_failed"), "approved")?.status).toBe("paid");
  });

  it("CT-021 evento atrasado nunca desfaz um pagamento", () => {
    expect(applyPaymentStatus(at("paid"), "declined")).toBeNull();
    expect(applyPaymentStatus(at("paid"), "pending")).toBeNull();
    expect(applyPaymentStatus(at("paid"), "expired")).toBeNull();
  });

  it("CT-021 pago só pode ser estornado; estados finais não saem do lugar", () => {
    expect(applyPaymentStatus(at("paid"), "refunded")?.status).toBe("refunded");
    for (const final of ["cancelled", "expired", "refunded"] as const) {
      for (const to of ORDER_STATUSES) expect(canTransition(final, to)).toBe(false);
    }
  });

  it("não muta o pedido recebido", () => {
    const next = applyPaymentStatus(base, "approved");
    expect(base.status).toBe("pending_payment");
    expect(next).not.toBe(base);
  });
});

describe("attachCharge / markChargeFailed", () => {
  it("Pix pendente guarda a cobrança e mantém o pedido pendente", () => {
    const o = attachCharge(base, "mercadopago", pix);
    expect(o.status).toBe("pending_payment");
    expect(o.charge).toEqual({ provider: "mercadopago", result: pix });
  });

  it("resposta final já move o pedido (gateway de demonstração)", () => {
    const ok = attachCharge(base, "fake", { method: "card", status: "approved", externalId: "fake_1" });
    expect(ok.status).toBe("paid");
    const no = attachCharge(base, "fake", { method: "card", status: "declined", externalId: "fake_2" });
    expect(no.status).toBe("payment_failed");
  });

  it("falha ao cobrar marca o pedido como falho", () => {
    expect(markChargeFailed(base).status).toBe("payment_failed");
    expect(markChargeFailed(at("paid")).status).toBe("paid");
  });
});

describe("toPublicView (C5)", () => {
  it("expõe status e código Pix enquanto pendente, e nada pessoal", () => {
    const view = toPublicView(attachCharge(base, "mercadopago", pix));
    expect(view).toEqual({
      status: "pending_payment",
      provider: "mercadopago",
      pix: { code: "000201...", expiresAt: pix.method === "pix" ? pix.expiresAt : "" },
    });
    expect(JSON.stringify(view)).not.toContain("maria");
    expect(JSON.stringify(view)).not.toContain("52998224725");
  });

  it("depois de pago o código Pix deixa de ser exposto", () => {
    const paid = { ...attachCharge(base, "mercadopago", pix), status: "paid" as const };
    expect(toPublicView(paid).pix).toBeNull();
  });
});
