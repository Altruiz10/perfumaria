import { createHmac } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import type { Order } from "@/domain/order";
import type { NotificationRequest } from "@/domain/ports";
import { sampleOrder } from "../orders/order-repository.contract";
import { MercadoPagoGateway } from "./gateway";
import { createMercadoPagoHttp, MercadoPagoError, type MercadoPagoHttp } from "./http";
import { amountToCents, centsToAmount, toCardPreferenceRequest, toPaymentStatus, toPixPaymentRequest } from "./mapping";
import { MercadoPagoNotifications, verifySignature } from "./notifications";

const ctx = {
  returnUrl: "https://loja.example/pt/finalizar/confirmacao?order=HM-1",
  notificationUrl: "https://loja.example/api/webhooks/payments",
};
const SECRET = "whsec_test";

function sign(dataId: string | null, requestId: string | null, ts = "1704908010", secret = SECRET) {
  const manifest = `${dataId ? `id:${dataId.toLowerCase()};` : ""}${requestId ? `request-id:${requestId};` : ""}ts:${ts};`;
  return `ts=${ts},v1=${createHmac("sha256", secret).update(manifest).digest("hex")}`;
}

describe("mapping (R1 na fronteira)", () => {
  it("centavos ↔ reais sem erro de ponto flutuante", () => {
    expect(centsToAmount(33155)).toBe(331.55);
    expect(centsToAmount(2990)).toBe(29.9);
    expect(amountToCents(331.55)).toBe(33155);
    expect(amountToCents(0.29)).toBe(29); // 0.29*100 = 28.999999999999996
    for (const c of [1, 10, 29, 57, 2990, 29900, 84900]) expect(amountToCents(centsToAmount(c))).toBe(c);
  });

  it("Pix: valor, referência do pedido, expiração em 30 min e CPF do pagador", () => {
    const o = sampleOrder({ createdAt: "2026-11-14T12:00:00.000Z" });
    const req = toPixPaymentRequest(o, ctx);
    expect(req).toMatchObject({
      transaction_amount: 331.55,
      payment_method_id: "pix",
      external_reference: o.id,
      date_of_expiration: "2026-11-14T12:30:00.000+00:00",
      notification_url: ctx.notificationUrl,
      payer: { email: "maria@example.com", first_name: "Maria", last_name: "Souza", identification: { type: "CPF", number: "52998224725" } },
    });
  });

  it("sem URL pública não envia notification_url", () => {
    const req = toPixPaymentRequest(sampleOrder(), { ...ctx, notificationUrl: null });
    expect("notification_url" in req).toBe(false);
  });

  it("cartão: itens + frete somam exatamente o total do pedido (R2)", () => {
    const o: Order = sampleOrder({
      paymentMethod: "card",
      totals: {
        lines: [
          { slug: "a", sizeMl: 50, quantity: 2, name: "A", image: "", unitPrice: 12345, lineTotal: 24690 },
          { slug: "b", sizeMl: 100, quantity: 1, name: "B", image: "", unitPrice: 1999, lineTotal: 1999 },
        ],
        subtotal: 26689,
        shipping: 2990,
        discount: 0,
        total: 29679,
      },
    });
    const req = toCardPreferenceRequest(o, ctx);
    const itemsCents = req.items.reduce((n, i) => n + amountToCents(i.unit_price) * i.quantity, 0);
    expect(itemsCents + amountToCents(req.shipments.cost)).toBe(o.totals.total);
    expect(req.external_reference).toBe(o.id);
    expect(req.payment_methods.excluded_payment_types.map((t) => t.id)).toContain("bank_transfer");
    expect(req.auto_return).toBe("approved");
  });

  it("cartão com desconto vira uma linha agregada em vez de item negativo", () => {
    const o = sampleOrder({ paymentMethod: "card" }); // discount 1745, shipping 0, total 33155
    const req = toCardPreferenceRequest(o, ctx);
    expect(req.items).toHaveLength(1);
    expect(amountToCents(req.items[0].unit_price) + amountToCents(req.shipments.cost)).toBe(o.totals.total);
  });

  it("retorno http (desenvolvimento) não pede auto_return", () => {
    const req = toCardPreferenceRequest(sampleOrder({ paymentMethod: "card" }), { returnUrl: "http://localhost:3000/x", notificationUrl: null });
    expect("auto_return" in req).toBe(false);
  });

  it("status do provedor → vocabulário do domínio; o desconhecido não muda nada", () => {
    expect(toPaymentStatus("approved")).toBe("approved");
    expect(toPaymentStatus("rejected")).toBe("declined");
    expect(toPaymentStatus("cancelled", "expired")).toBe("expired");
    expect(toPaymentStatus("cancelled", "by_collector")).toBe("cancelled");
    expect(toPaymentStatus("charged_back")).toBe("refunded");
    for (const s of ["pending", "in_process", "authorized", "in_mediation", "algo_novo", undefined]) {
      expect(toPaymentStatus(s)).toBe("pending");
    }
  });
});

describe("MercadoPagoGateway", () => {
  const http = (post: unknown): MercadoPagoHttp => ({ post: vi.fn().mockResolvedValue(post), get: vi.fn() }) as unknown as MercadoPagoHttp;

  it("Pix devolve o código copia-e-cola e usa o id do pedido como idempotência", async () => {
    const h = http({ id: 987, point_of_interaction: { transaction_data: { qr_code: "000201xyz" } }, date_of_expiration: "2026-11-14T09:30:00.000-03:00" });
    const o = sampleOrder();
    const r = await new MercadoPagoGateway(h).charge(o, ctx);
    expect(r).toEqual({ method: "pix", status: "pending", externalId: "987", pixCode: "000201xyz", expiresAt: "2026-11-14T12:30:00.000Z" });
    expect(h.post).toHaveBeenCalledWith("/v1/payments", expect.anything(), o.id);
  });

  it("Pix sem QR code é erro (nunca mostrar cobrança vazia)", async () => {
    await expect(new MercadoPagoGateway(http({ id: 1 })).charge(sampleOrder(), ctx)).rejects.toThrow();
  });

  it("cartão devolve a URL hospedada; o número do cartão nunca passa por aqui", async () => {
    const h = http({ id: "pref-1", init_point: "https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=pref-1" });
    const r = await new MercadoPagoGateway(h).charge(sampleOrder({ paymentMethod: "card" }), ctx);
    expect(r).toEqual({ method: "card", status: "pending", externalId: "pref-1", redirectUrl: "https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=pref-1" });
  });

  it("cartão recusa redirecionamento que não seja https", async () => {
    const h = http({ id: "p", init_point: "http://evil.example" });
    await expect(new MercadoPagoGateway(h).charge(sampleOrder({ paymentMethod: "card" }), ctx)).rejects.toThrow();
  });
});

describe("verifySignature", () => {
  const base = { dataId: "123456", requestId: "req-1", secret: SECRET };

  it("aceita assinatura válida", () => {
    expect(verifySignature({ ...base, signatureHeader: sign("123456", "req-1") })).toBe(true);
  });

  it("rejeita segredo errado, id adulterado, request-id adulterado e cabeçalho ausente/malformado", () => {
    expect(verifySignature({ ...base, signatureHeader: sign("123456", "req-1", "1", "outro") })).toBe(false);
    expect(verifySignature({ ...base, dataId: "999", signatureHeader: sign("123456", "req-1") })).toBe(false);
    expect(verifySignature({ ...base, requestId: "req-2", signatureHeader: sign("123456", "req-1") })).toBe(false);
    expect(verifySignature({ ...base, signatureHeader: null })).toBe(false);
    expect(verifySignature({ ...base, signatureHeader: "lixo" })).toBe(false);
    expect(verifySignature({ ...base, signatureHeader: "ts=1,v1=zz" })).toBe(false);
    expect(verifySignature({ ...base, signatureHeader: "ts=1,v1=abcd" })).toBe(false);
  });

  it("omite do manifesto o que não veio", () => {
    expect(verifySignature({ ...base, requestId: null, signatureHeader: sign("123456", null) })).toBe(true);
  });
});

describe("MercadoPagoNotifications", () => {
  const req = (query: string, signature: string | null, body: unknown = {}, requestId: string | null = "req-1"): NotificationRequest => ({
    headers: { get: (n) => ({ "x-signature": signature, "x-request-id": requestId })[n.toLowerCase()] ?? null },
    query: new URLSearchParams(query),
    body,
  });
  const make = (get: MercadoPagoHttp["get"] = vi.fn()) => new MercadoPagoNotifications({ get, post: vi.fn() } as unknown as MercadoPagoHttp, SECRET);

  it("autêntica e de pagamento → devolve o id; o corpo nunca é usado como fonte", () => {
    const out = make().parse(req("data.id=123456&type=payment", sign("123456", "req-1"), { data: { id: "evil" } }));
    expect(out).toEqual({ kind: "payment", externalId: "123456" });
  });

  it("sem assinatura válida → invalid", () => {
    expect(make().parse(req("data.id=123456&type=payment", null)).kind).toBe("invalid");
    expect(make().parse(req("data.id=123456&type=payment", sign("123456", "req-1", "1", "x"))).kind).toBe("invalid");
  });

  it("autêntica mas de outro assunto ou com id estranho → ignorada", () => {
    expect(make().parse(req("data.id=123456&type=merchant_order", sign("123456", "req-1"))).kind).toBe("ignored");
    expect(make().parse(req("data.id=a/../b&type=payment", sign("a/../b", "req-1"))).kind).toBe("ignored");
  });

  it("fetchPayment traduz status e valor; sem referência ou 404 → null", async () => {
    const get = vi.fn().mockResolvedValueOnce({ id: 55, status: "approved", external_reference: "HM-1", transaction_amount: 331.55 });
    expect(await make(get).fetchPayment("55")).toEqual({ externalId: "55", orderId: "HM-1", status: "approved", amountCents: 33155 });
    expect(await make(vi.fn().mockResolvedValue(null)).fetchPayment("1")).toBeNull();
    expect(await make(vi.fn().mockResolvedValue({ id: 1, status: "approved", transaction_amount: 1 })).fetchPayment("1")).toBeNull();
  });
});

describe("createMercadoPagoHttp", () => {
  it("envia token, idempotência e corpo; erro expõe só o status (C5)", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('{"cause":"maria@example.com"}', { status: 400 }));
    const http = createMercadoPagoHttp({ accessToken: "TOKEN", fetch: fetchMock as unknown as typeof fetch });
    await expect(http.post("/v1/payments", { a: 1 }, "key-1")).rejects.toSatisfy(
      (e: unknown) => e instanceof MercadoPagoError && e.code === "400" && !e.message.includes("maria"),
    );
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.mercadopago.com/v1/payments");
    expect(init.headers).toMatchObject({ authorization: "Bearer TOKEN", "x-idempotency-key": "key-1" });
  });

  it("GET 404 resolve null", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}", { status: 404 }));
    expect(await createMercadoPagoHttp({ accessToken: "T", fetch: fetchMock as unknown as typeof fetch }).get("/v1/payments/1")).toBeNull();
  });
});
