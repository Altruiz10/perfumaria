import { describe, expect, it } from "vitest";
import { assertCents, formatMoney, percentOff, sumCents } from "./money";

describe("money (R1)", () => {
  it("CT-001 soma centavos sem erro de ponto flutuante", () => {
    expect(sumCents([10, 20, 30])).toBe(60);
    expect(sumCents([1990, 1990, 1990])).toBe(5970);
  });

  it("rejeita valores não inteiros", () => {
    expect(() => assertCents(10.5)).toThrow();
    expect(() => assertCents(Number.NaN)).toThrow();
    expect(assertCents(0)).toBe(0);
  });

  it("percentOff arredonda para baixo (R4)", () => {
    expect(percentOff(29900, 5)).toBe(1495);
    expect(percentOff(18999, 5)).toBe(949); // 949.95 -> 949
  });

  it("formata em BRL respeitando o idioma", () => {
    expect(formatMoney(29900, "pt").replace(/\s/g, " ")).toBe("R$ 299,00");
    expect(formatMoney(29900, "en")).toContain("299.00");
    expect(formatMoney(29900, "es")).toContain("299,00");
  });
});
