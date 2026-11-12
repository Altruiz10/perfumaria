import { describe, expect, it } from "vitest";
import { checkoutSchema, isValidCep, isValidCpf } from "./checkout";
import { validCheckout } from "./test-fixtures";


describe("CPF e CEP (R9)", () => {
  it("CT-009 aceita CPF válido com ou sem máscara", () => {
    expect(isValidCpf("529.982.247-25")).toBe(true);
    expect(isValidCpf("52998224725")).toBe(true);
  });

  it("CT-009 rejeita dígito errado, repetido e tamanho errado", () => {
    expect(isValidCpf("529.982.247-24")).toBe(false);
    expect(isValidCpf("111.111.111-11")).toBe(false);
    expect(isValidCpf("123")).toBe(false);
  });

  it("CT-009 CEP precisa de 8 dígitos", () => {
    expect(isValidCep("01310-100")).toBe(true);
    expect(isValidCep("0131010")).toBe(false);
  });
});

describe("checkoutSchema (R9, S4)", () => {
  it("aceita pedido válido e normaliza CPF/CEP para dígitos", () => {
    const r = checkoutSchema.safeParse(validCheckout);
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.customer.cpf).toBe("52998224725");
      expect(r.data.address.cep).toBe("01310100");
    }
  });

  it("exige aceite dos termos", () => {
    expect(checkoutSchema.safeParse({ ...validCheckout, acceptTerms: false }).success).toBe(false);
  });

  it("rejeita sacola vazia e quantidade fora do limite (R5)", () => {
    expect(checkoutSchema.safeParse({ ...validCheckout, items: [] }).success).toBe(false);
    expect(
      checkoutSchema.safeParse({ ...validCheckout, items: [{ slug: "cedro-branco", sizeMl: 100, quantity: 11 }] })
        .success,
    ).toBe(false);
  });

  it("rejeita UF inexistente e e-mail inválido", () => {
    expect(
      checkoutSchema.safeParse({ ...validCheckout, address: { ...validCheckout.address, state: "XX" } }).success,
    ).toBe(false);
    expect(
      checkoutSchema.safeParse({ ...validCheckout, customer: { ...validCheckout.customer, email: "x@" } }).success,
    ).toBe(false);
  });

  it("CT-011 remove HTML de texto livre", () => {
    const r = checkoutSchema.safeParse({
      ...validCheckout,
      customer: { ...validCheckout.customer, name: "Maria <script>alert(1)</script>Souza" },
    });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.customer.name).not.toMatch(/[<>]/);
  });

  it("ignora campos de preço enviados pelo cliente (R2)", () => {
    const r = checkoutSchema.safeParse({
      ...validCheckout,
      items: [{ slug: "cedro-branco", sizeMl: 100, quantity: 1, priceCents: 1 }],
      total: 1,
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.items[0]).not.toHaveProperty("priceCents");
      expect(r.data).not.toHaveProperty("total");
    }
  });
});
