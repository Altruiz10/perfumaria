import { describe, expect, it } from "vitest";
import { POST } from "./route";
import { CSRF_COOKIE, CSRF_HEADER } from "@/lib/csrf-constants";
import { validCheckout } from "@/domain/test-fixtures";

const TOKEN = "a".repeat(40);

function req(body: unknown, opts: { origin?: string | null; token?: string; cookie?: string } = {}) {
  const headers = new Headers({ "content-type": "application/json", host: "loja.test" });
  if (opts.origin !== null) headers.set("origin", opts.origin ?? "http://loja.test");
  headers.set(CSRF_HEADER, opts.token ?? TOKEN);
  headers.set("cookie", `${CSRF_COOKIE}=${opts.cookie ?? TOKEN}`);
  return new Request("http://loja.test/api/checkout", { method: "POST", headers, body: JSON.stringify(body) });
}

describe("POST /api/checkout (integração)", () => {
  it("CT-010 403 sem Origin", async () => {
    const res = await POST(req(validCheckout, { origin: null }));
    expect(res.status).toBe(403);
  });

  it("CT-010 403 com token divergente", async () => {
    const res = await POST(req(validCheckout, { token: "b".repeat(40) }));
    expect(res.status).toBe(403);
  });

  it("422 com payload inválido, sem ecoar dados pessoais (C5)", async () => {
    const res = await POST(req({ ...validCheckout, acceptTerms: false }));
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(JSON.stringify(body)).not.toContain("maria@example.com");
    expect(body.fields).toContain("acceptTerms");
  });

  it("201 com pedido válido e total do servidor", async () => {
    const res = await POST(req({ ...validCheckout, items: [{ slug: "cedro-branco", sizeMl: 100, quantity: 1, priceCents: 1 }] }));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.orderId).toMatch(/^HM-/);
    expect(body.total).toBeGreaterThan(1);
    expect(res.headers.get("cache-control")).toContain("no-store");
  });

  it("400 com JSON malformado", async () => {
    const r = req({});
    const bad = new Request(r.url, { method: "POST", headers: r.headers, body: "{" });
    const res = await POST(bad);
    expect(res.status).toBe(400);
  });
});
