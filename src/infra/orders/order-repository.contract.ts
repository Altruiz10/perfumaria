import { describe, expect, it } from "vitest";
import type { Order } from "@/domain/order";
import type { OrderRepository } from "@/domain/ports";

let counter = 0;
export function sampleOrder(overrides: Partial<Order> = {}): Order {
  counter += 1;
  return {
    id: `HM-CONTRACT-${Date.now().toString(36).toUpperCase()}${counter}`,
    createdAt: "2026-11-14T12:00:00.000Z",
    locale: "pt",
    status: "pending_payment",
    customer: { name: "Maria Souza", email: "maria@example.com", cpf: "52998224725", phone: "11912345678" },
    address: {
      cep: "01310100",
      street: "Av. Paulista",
      number: "1000",
      complement: "",
      district: "Bela Vista",
      city: "São Paulo",
      state: "SP",
    },
    paymentMethod: "pix",
    totals: {
      lines: [
        {
          slug: "cedro-branco",
          sizeMl: 100,
          quantity: 1,
          name: "Cedro Branco",
          image: "/images/products/cedro-branco-1.webp",
          unitPrice: 34900,
          lineTotal: 34900,
        },
      ],
      subtotal: 34900,
      shipping: 0,
      discount: 1745,
      total: 33155,
    },
    marketingOptIn: true,
    charge: null,
    ...overrides,
  };
}

/**
 * The behaviour every OrderRepository must have, whatever it stores into.
 * Run against the in-memory adapter always, and against Supabase when a test project is configured.
 */
export function describeOrderRepositoryContract(name: string, make: () => OrderRepository | Promise<OrderRepository>, opts: { skip?: boolean } = {}) {
  describe.skipIf(opts.skip)(`OrderRepository contract: ${name}`, () => {
    it("guarda e devolve o pedido inteiro, sem perder campo", async () => {
      const repo = await make();
      const order = sampleOrder();
      await repo.create(order);
      expect(await repo.findById(order.id)).toEqual(order);
    });

    it("devolve null para id desconhecido", async () => {
      expect(await (await make()).findById("HM-NAO-EXISTE")).toBeNull();
    });

    it("recusa criar o mesmo id duas vezes", async () => {
      const repo = await make();
      const order = sampleOrder();
      await repo.create(order);
      await expect(repo.create(order)).rejects.toThrow();
    });

    it("update grava quando o status esperado confere, inclusive a cobrança", async () => {
      const repo = await make();
      const order = sampleOrder();
      await repo.create(order);
      const next: Order = {
        ...order,
        status: "paid",
        charge: {
          provider: "mercadopago",
          result: { method: "pix", status: "pending", externalId: `pay-${order.id}`, pixCode: "000201abc", expiresAt: "2026-11-14T12:30:00.000Z" },
        },
      };
      expect(await repo.update(next, "pending_payment")).toBe(true);
      expect(await repo.findById(order.id)).toEqual(next);
    });

    it("update é compare-and-swap: status esperado errado não grava e devolve false", async () => {
      const repo = await make();
      const order = sampleOrder();
      await repo.create(order);
      expect(await repo.update({ ...order, status: "paid" }, "pending_payment")).toBe(true);
      expect(await repo.update({ ...order, status: "expired" }, "pending_payment")).toBe(false);
      expect((await repo.findById(order.id))?.status).toBe("paid");
    });

    it("duas atualizações concorrentes: exatamente uma vence", async () => {
      const repo = await make();
      const order = sampleOrder();
      await repo.create(order);
      const results = await Promise.all([
        repo.update({ ...order, status: "paid" }, "pending_payment"),
        repo.update({ ...order, status: "cancelled" }, "pending_payment"),
      ]);
      expect(results.filter(Boolean)).toHaveLength(1);
    });

    it("update de pedido inexistente devolve false", async () => {
      const repo = await make();
      expect(await repo.update(sampleOrder({ id: "HM-FANTASMA" }), "pending_payment")).toBe(false);
    });
  });
}
