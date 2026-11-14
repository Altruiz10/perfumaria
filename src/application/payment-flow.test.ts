import { describe, expect, it, vi } from "vitest";
import { getOrderStatus } from "./get-order-status";
import { placeOrder } from "./place-order";
import { reconcilePayment } from "./reconcile-payment";
import { fixtureCatalog, validCheckout } from "@/domain/test-fixtures";
import type { Order } from "@/domain/order";
import type { NotificationOutcome, PaymentGateway, PaymentNotifications, PaymentSnapshot } from "@/domain/ports";
import { InMemoryProductRepository } from "@/infra/catalog/in-memory-product-repository";
import { InMemoryOrderRepository } from "@/infra/orders/in-memory-order-repository";
import { FakePaymentGateway } from "@/infra/payments/fake-payment-gateway";

const req = { headers: { get: () => null }, query: new URLSearchParams(), body: null };
const TOTAL = 34900 - 1745; // cedro-branco 100ml, Pix -5%

function setup(gateway: PaymentGateway = new FakePaymentGateway()) {
  const orders = new InMemoryOrderRepository();
  const deps = { products: new InMemoryProductRepository(fixtureCatalog), orders, payments: gateway };
  return { orders, deps };
}

function notifications(outcome: NotificationOutcome, snapshot: PaymentSnapshot | null): PaymentNotifications {
  return { parse: () => outcome, fetchPayment: vi.fn().mockResolvedValue(snapshot) };
}
const payment = (o: Order, patch: Partial<PaymentSnapshot> = {}): PaymentSnapshot => ({
  externalId: "p-1",
  orderId: o.id,
  status: "approved",
  amountCents: o.totals.total,
  ...patch,
});

describe("placeOrder — ciclo de vida", () => {
  it("CT-022 grava o pedido pendente ANTES de cobrar", async () => {
    const orders = new InMemoryOrderRepository();
    let seenDuringCharge: Order | null = null;
    const gateway: PaymentGateway = {
      name: "spy",
      charge: async (o) => {
        seenDuringCharge = await orders.findById(o.id);
        return { method: "pix", status: "pending", externalId: "x", pixCode: "c", expiresAt: "2026-01-01T00:00:00.000Z" };
      },
    };
    const r = await placeOrder(validCheckout, { products: new InMemoryProductRepository(fixtureCatalog), orders, payments: gateway });
    expect(r.ok).toBe(true);
    expect((seenDuringCharge as Order | null)?.status).toBe("pending_payment");
  });

  it("Pix: pedido fica pendente e guarda a cobrança do provedor", async () => {
    const { orders, deps } = setup();
    const r = await placeOrder(validCheckout, deps);
    if (!r.ok) throw new Error("expected ok");
    const stored = await orders.findById(r.order.id);
    expect(stored?.status).toBe("pending_payment");
    expect(stored?.charge?.provider).toBe("fake");
    expect(stored?.totals.total).toBe(TOTAL);
    expect(stored?.locale).toBe("pt");
  });

  it("cartão aprovado na hora já nasce pago", async () => {
    const { orders, deps } = setup();
    const r = await placeOrder({ ...validCheckout, paymentMethod: "card", locale: "en" }, deps);
    if (!r.ok) throw new Error("expected ok");
    const stored = await orders.findById(r.order.id);
    expect(stored?.status).toBe("paid");
    expect(stored?.locale).toBe("en");
  });

  it("CT-022 gateway fora do ar: pedido fica como falho e o cliente recebe erro de pagamento", async () => {
    const orders = new InMemoryOrderRepository();
    const gateway: PaymentGateway = { name: "down", charge: async () => { throw new Error("boom"); } };
    const r = await placeOrder(validCheckout, { products: new InMemoryProductRepository(fixtureCatalog), orders, payments: gateway });
    expect(r).toEqual({ ok: false, error: "payment" });
    const all = (orders as unknown as { orders: Map<string, Order> }).orders;
    expect([...all.values()].map((o) => o.status)).toEqual(["payment_failed"]);
  });

  it("falha ao registrar a cobrança não derruba um pagamento que já existe no provedor", async () => {
    const { orders, deps } = setup();
    vi.spyOn(orders, "update").mockRejectedValue(new Error("db down"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    const r = await placeOrder(validCheckout, deps);
    expect(r.ok).toBe(true);
  });
});

describe("reconcilePayment", () => {
  async function pendingOrder() {
    const { orders, deps } = setup();
    const r = await placeOrder(validCheckout, deps);
    if (!r.ok) throw new Error("expected ok");
    return { orders, order: r.order };
  }

  it("CT-023 pagamento aprovado marca o pedido como pago", async () => {
    const { orders, order } = await pendingOrder();
    const out = await reconcilePayment(req, { orders, notifications: notifications({ kind: "payment", externalId: "p-1" }, payment(order)) });
    expect(out).toEqual({ kind: "updated" });
    expect((await orders.findById(order.id))?.status).toBe("paid");
  });

  it("CT-023 a mesma notificação repetida não muda nada (idempotência)", async () => {
    const { orders, order } = await pendingOrder();
    const n = notifications({ kind: "payment", externalId: "p-1" }, payment(order));
    await reconcilePayment(req, { orders, notifications: n });
    expect(await reconcilePayment(req, { orders, notifications: n })).toEqual({ kind: "unchanged" });
  });

  it("CT-023 notificação sem assinatura válida é rejeitada e nada é consultado", async () => {
    const { orders } = await pendingOrder();
    const n = notifications({ kind: "invalid" }, null);
    expect(await reconcilePayment(req, { orders, notifications: n })).toEqual({ kind: "unauthorized" });
    expect(n.fetchPayment).not.toHaveBeenCalled();
  });

  it("CT-023 valor diferente do cobrado nunca marca como pago (R2)", async () => {
    const { orders, order } = await pendingOrder();
    vi.spyOn(console, "error").mockImplementation(() => {});
    const out = await reconcilePayment(req, {
      orders,
      notifications: notifications({ kind: "payment", externalId: "p-1" }, payment(order, { amountCents: 100 })),
    });
    expect(out).toEqual({ kind: "ignored", reason: "amount_mismatch" });
    expect((await orders.findById(order.id))?.status).toBe("pending_payment");
  });

  it("CT-023 pedido ou pagamento desconhecidos são reconhecidos sem erro (o provedor para de reenviar)", async () => {
    const { orders, order } = await pendingOrder();
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await reconcilePayment(req, { orders, notifications: notifications({ kind: "payment", externalId: "?" }, null) })).toEqual({
      kind: "ignored",
      reason: "unknown_payment",
    });
    expect(
      await reconcilePayment(req, { orders, notifications: notifications({ kind: "payment", externalId: "p" }, payment(order, { orderId: "HM-NAO-EXISTE" })) }),
    ).toEqual({ kind: "ignored", reason: "unknown_order" });
    expect(await reconcilePayment(req, { orders, notifications: notifications({ kind: "ignored" }, null) })).toEqual({
      kind: "ignored",
      reason: "not_a_payment",
    });
  });

  it("CT-023 evento atrasado de recusa não desfaz um pedido já pago", async () => {
    const { orders, order } = await pendingOrder();
    await reconcilePayment(req, { orders, notifications: notifications({ kind: "payment", externalId: "p-1" }, payment(order)) });
    const late = await reconcilePayment(req, {
      orders,
      notifications: notifications({ kind: "payment", externalId: "p-0" }, payment(order, { status: "declined", externalId: "p-0" })),
    });
    expect(late).toEqual({ kind: "unchanged" });
    expect((await orders.findById(order.id))?.status).toBe("paid");
  });

  it("CT-023 corrida entre webhooks: perde o CAS, relê e decide de novo", async () => {
    const { orders, order } = await pendingOrder();
    const real = orders.update.bind(orders);
    let first = true;
    vi.spyOn(orders, "update").mockImplementation(async (next, expected) => {
      if (first) {
        first = false;
        await real({ ...order, status: "paid" }, "pending_payment"); // another webhook wins
      }
      return real(next, expected);
    });
    const out = await reconcilePayment(req, { orders, notifications: notifications({ kind: "payment", externalId: "p-1" }, payment(order)) });
    expect(out).toEqual({ kind: "unchanged" });
    expect((await orders.findById(order.id))?.status).toBe("paid");
  });

  it("falha do banco propaga (o provedor reenvia)", async () => {
    const { orders, order } = await pendingOrder();
    vi.spyOn(orders, "update").mockRejectedValue(new Error("db"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    await expect(
      reconcilePayment(req, { orders, notifications: notifications({ kind: "payment", externalId: "p-1" }, payment(order)) }),
    ).rejects.toThrow();
  });
});

describe("getOrderStatus", () => {
  it("devolve a visão pública do pedido, sem dados pessoais (C5)", async () => {
    const { orders, deps } = setup();
    const r = await placeOrder(validCheckout, deps);
    if (!r.ok) throw new Error("expected ok");
    const view = await getOrderStatus(r.order.id, { orders });
    expect(view?.status).toBe("pending_payment");
    expect(view?.pix?.code).toContain("DEMO");
    expect(Object.keys(view ?? {}).sort()).toEqual(["pix", "provider", "status"]);
    const json = JSON.stringify(view);
    for (const personal of ["maria@example.com", "Maria Souza", "52998224725", "Av. Paulista", "01310100"]) {
      expect(json).not.toContain(personal);
    }
  });

  it("id malformado ou inexistente → null", async () => {
    const { orders } = setup();
    expect(await getOrderStatus("../etc/passwd", { orders })).toBeNull();
    expect(await getOrderStatus("HM-AAA-BBB", { orders })).toBeNull();
  });
});
