import { describe, expect, it } from "vitest";
import { CONSENT_VERSION, canUse, createConsent, defaultConsent, parseConsent } from "./consent";

describe("consentimento (C1, C2)", () => {
  it("CT-014 padrão recusa analytics e marketing", () => {
    const c = defaultConsent();
    expect(c.analytics).toBe(false);
    expect(c.marketing).toBe(false);
    expect(canUse(c, "necessary")).toBe(true);
    expect(canUse(c, "analytics")).toBe(false);
    expect(canUse(null, "marketing")).toBe(false);
  });

  it("registra versão e data", () => {
    const c = createConsent({ analytics: true, marketing: false }, new Date("2026-09-01T00:00:00Z"));
    expect(c.version).toBe(CONSENT_VERSION);
    expect(c.updatedAt).toBe("2026-09-01T00:00:00.000Z");
    expect(canUse(c, "analytics")).toBe(true);
  });

  it("CT-014 versão diferente invalida o registro", () => {
    const old = { ...createConsent({ analytics: true, marketing: true }), version: "0" };
    expect(parseConsent(JSON.stringify(old))).toBeNull();
  });

  it("JSON inválido ou formato errado vira null", () => {
    expect(parseConsent("{")).toBeNull();
    expect(parseConsent(JSON.stringify({ version: CONSENT_VERSION, analytics: "yes" }))).toBeNull();
    expect(parseConsent(null)).toBeNull();
  });

  it("round-trip preserva escolhas", () => {
    const c = createConsent({ analytics: false, marketing: true });
    expect(parseConsent(JSON.stringify(c))).toEqual(c);
  });
});
