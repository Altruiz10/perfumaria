import "server-only";
import type { PaymentGateway, PaymentNotifications } from "@/domain/ports";
import { MercadoPagoGateway } from "./gateway";
import { createMercadoPagoHttp } from "./http";
import { MercadoPagoNotifications } from "./notifications";

export interface MercadoPagoConfig {
  accessToken: string;
  webhookSecret: string;
}

/**
 * The module's public surface: two ports backed by one HTTP client. Nothing outside
 * infra/mercadopago knows an endpoint, a status string or a header name.
 */
export function createMercadoPago({ accessToken, webhookSecret }: MercadoPagoConfig): {
  payments: PaymentGateway;
  notifications: PaymentNotifications;
} {
  const http = createMercadoPagoHttp({ accessToken });
  return { payments: new MercadoPagoGateway(http), notifications: new MercadoPagoNotifications(http, webhookSecret) };
}
