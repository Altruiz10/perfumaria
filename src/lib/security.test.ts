import { describe, expect, it } from "vitest";
import { buildCsp, sanitizeText, securityHeaders, serializeJsonLd, verifyCsrf } from "./security";

describe("sanitizeText (S4)", () => {
  it("remove tags, controles e espaços excedentes", () => {
    expect(sanitizeText("  Olá <b>mundo</b>\u0000 <script>x</script>  ")).toBe("Olá mundo x");
  });
  it("remove < e > soltos", () => {
    expect(sanitizeText("a < b > c")).toBe("a b c");
  });
});

describe("serializeJsonLd (S5)", () => {
  it("CT-012 escapa fechamento de script", () => {
    const out = serializeJsonLd({ name: "</script><script>alert(1)</script>" });
    expect(out).not.toContain("</script>");
    expect(out).toContain("\\u003c");
    expect(JSON.parse(out).name).toBe("</script><script>alert(1)</script>");
  });
});

describe("CSP (S1, S2)", () => {
  it("CT-013 produção: nonce e sem unsafe-inline/unsafe-eval em script-src", () => {
    const csp = buildCsp("abc123", { isDev: false });
    const scriptSrc = csp.split(";").find((d) => d.trim().startsWith("script-src"))!;
    expect(scriptSrc).toContain("'nonce-abc123'");
    expect(scriptSrc).not.toContain("unsafe-inline");
    expect(scriptSrc).not.toContain("unsafe-eval");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("base-uri 'self'");
  });

  it("dev permite unsafe-eval (necessário ao React em dev)", () => {
    expect(buildCsp("n", { isDev: true })).toContain("'unsafe-eval'");
  });

  it("headers seguros obrigatórios", () => {
    const h = Object.fromEntries(securityHeaders().map((x) => [x.key.toLowerCase(), x.value]));
    expect(h["strict-transport-security"]).toMatch(/max-age=\d+/);
    expect(h["x-content-type-options"]).toBe("nosniff");
    expect(h["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    expect(h["permissions-policy"]).toBeDefined();
    expect(h["x-frame-options"]).toBe("DENY");
  });
});

describe("CSRF (S3)", () => {
  const ok = { origin: "https://loja.com", host: "loja.com", cookieToken: "t".repeat(32), headerToken: "t".repeat(32) };

  it("aceita origin igual ao host e tokens iguais", () => {
    expect(verifyCsrf(ok)).toBe(true);
  });

  it("CT-010 rejeita sem origin, origin diferente ou token divergente", () => {
    expect(verifyCsrf({ ...ok, origin: null })).toBe(false);
    expect(verifyCsrf({ ...ok, origin: "https://evil.com" })).toBe(false);
    expect(verifyCsrf({ ...ok, headerToken: "x".repeat(32) })).toBe(false);
    expect(verifyCsrf({ ...ok, cookieToken: null })).toBe(false);
    expect(verifyCsrf({ ...ok, cookieToken: "short", headerToken: "short" })).toBe(false);
  });
});
