import { describe, expect, it } from "vitest";
import { placeOrder } from "./place-order";
import { InMemoryProductRepository } from "@/infra/catalog/in-memory-product-repository";
import { InMemoryOrderRepository } from "@/infra/orders/in-memory-order-repository";
import { FakePaymentGateway } from "@/infra/payments/fake-payment-gateway";
import { fixtureCatalog } from "@/domain/test-fixtures";
import { validCheckout } from "@/domain/test-fixtures";

function deps() {
  return {
    products: new InMemoryProductRepository(fixtureCatalog),
    orders: new InMemoryOrderRepository(),
    payments: new FakePaymentGateway(),
  };
}

describe("placeOrder", () => {
  it("cria pedido com total calculado no servidor (R2)", async () => {
    const d = deps();
    const r = await placeOrder({ ...validCheckout, total: 1, items: [{ ...validCheckout.items[0], priceCents: 1 }] }, d);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    // cedro-branco 100ml = 34900, frete grátis, Pix -5% = 1745
    expect(r.order.totals.total).toBe(34900 - 1745);
    expect(r.payment.method).toBe("pix");
    expect(r.payment.status).toBe("pending");
    expect(await d.orders.findById(r.order.id)).not.toBeNull();
  });

  it("cartão é aprovado pelo gateway falso", async () => {
    const r = await placeOrder({ ...validCheckout, paymentMethod: "card" }, deps());
    expect(r.ok && r.payment.status).toBe("approved");
  });

  it("CT-009 entrada inválida devolve erro de validação com campos", async () => {
    const r = await placeOrder({ ...validCheckout, customer: { ...validCheckout.customer, cpf: "111.111.111-11" } }, deps());
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error).toBe("validation");
    if (r.error !== "validation") return; // type narrowing only; the assertion above already fails otherwise
    expect(r.fields).toContain("customer.cpf");
  });

  it("item inexistente torna o pedido indisponível (R7)", async () => {
    const r = await placeOrder({ ...validCheckout, items: [{ slug: "fantasma", sizeMl: 100, quantity: 1 }] }, deps());
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe("unavailable");
  });

  it("CT-011 nome sanitizado chega ao pedido", async () => {
    const d = deps();
    const r = await placeOrder(
      { ...validCheckout, customer: { ...validCheckout.customer, name: "<img src=x onerror=alert(1)>Maria" } },
      d,
    );
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.order.customer.name).toBe("Maria");
  });
});
