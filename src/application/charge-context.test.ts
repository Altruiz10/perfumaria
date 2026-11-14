import { describe, expect, it } from "vitest";
import { buildChargeContext } from "./charge-context";

describe("buildChargeContext", () => {
  it("retorno localizado por idioma, com o id do pedido", () => {
    expect(buildChargeContext({ id: "HM-A1", locale: "pt" }, "https://loja.example").returnUrl).toBe(
      "https://loja.example/pt/finalizar/confirmacao?order=HM-A1",
    );
    expect(buildChargeContext({ id: "HM-A1", locale: "en" }, "https://loja.example/").returnUrl).toBe(
      "https://loja.example/en/checkout/confirmation?order=HM-A1",
    );
  });

  it("callback só existe em site público com HTTPS", () => {
    expect(buildChargeContext({ id: "HM-A1", locale: "pt" }, "https://loja.example").notificationUrl).toBe(
      "https://loja.example/api/webhooks/payments",
    );
    expect(buildChargeContext({ id: "HM-A1", locale: "pt" }, "http://localhost:3000").notificationUrl).toBeNull();
  });
});
