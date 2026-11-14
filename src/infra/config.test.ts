import { describe, expect, it } from "vitest";
import { ConfigError, loadPaymentConfig, loadPersistenceConfig } from "./config";

const dev = { production: false };
const prod = { production: true };
const supabase = { PERSISTENCE: "supabase", SUPABASE_URL: "https://abc.supabase.co", SUPABASE_SERVICE_ROLE_KEY: "secret-key-value" };
const mp = { PAYMENT_GATEWAY: "mercadopago", MERCADOPAGO_ACCESS_TOKEN: "APP_USR-token", MERCADOPAGO_WEBHOOK_SECRET: "whsec" };

describe("loadPersistenceConfig", () => {
  it("desenvolvimento: sem variáveis usa memória", () => {
    expect(loadPersistenceConfig({}, dev)).toEqual({ kind: "memory" });
  });

  it("produção: sem escolha explícita recusa (nada de pedido em memória por esquecimento)", () => {
    expect(() => loadPersistenceConfig({}, prod)).toThrow(ConfigError);
    expect(() => loadPersistenceConfig({}, prod)).toThrow(/PERSISTENCE/);
  });

  it("produção: demonstração só quando explícita; Supabase exige URL e chave", () => {
    expect(loadPersistenceConfig({ PERSISTENCE: "memory" }, prod)).toEqual({ kind: "memory" });
    expect(loadPersistenceConfig(supabase, prod)).toEqual({
      kind: "supabase",
      url: "https://abc.supabase.co",
      serviceRoleKey: "secret-key-value",
    });
    expect(() => loadPersistenceConfig({ PERSISTENCE: "supabase" }, dev)).toThrow(/SUPABASE_URL/);
  });

  it("valor inválido nomeia a variável e nunca vaza o valor", () => {
    try {
      loadPersistenceConfig({ SUPABASE_URL: "not-a-url-but-secret" }, dev);
      expect.unreachable();
    } catch (e) {
      expect((e as Error).message).toContain("SUPABASE_URL");
      expect((e as Error).message).not.toContain("not-a-url-but-secret");
    }
  });

  it("não olha variáveis de pagamento (módulos independentes)", () => {
    expect(loadPersistenceConfig({ PAYMENT_GATEWAY: "mercadopago" }, dev)).toEqual({ kind: "memory" });
  });
});

describe("loadPaymentConfig", () => {
  it("desenvolvimento: sem variáveis usa o gateway falso", () => {
    expect(loadPaymentConfig({}, dev)).toEqual({ kind: "fake" });
  });

  it("produção: sem escolha explícita recusa (nada de pagamento que aprova tudo por esquecimento)", () => {
    expect(() => loadPaymentConfig({}, prod)).toThrow(/PAYMENT_GATEWAY/);
    expect(() => loadPaymentConfig(supabase, prod)).toThrow(/PAYMENT_GATEWAY/);
  });

  it("produção: Mercado Pago exige token e segredo do webhook", () => {
    expect(loadPaymentConfig(mp, prod)).toEqual({ kind: "mercadopago", accessToken: "APP_USR-token", webhookSecret: "whsec" });
    expect(() => loadPaymentConfig({ PAYMENT_GATEWAY: "mercadopago", MERCADOPAGO_ACCESS_TOKEN: "x" }, prod)).toThrow(
      /MERCADOPAGO_WEBHOOK_SECRET/,
    );
  });

  it("não olha variáveis de banco (módulos independentes)", () => {
    expect(loadPaymentConfig({ PERSISTENCE: "supabase" }, dev)).toEqual({ kind: "fake" });
  });
});
