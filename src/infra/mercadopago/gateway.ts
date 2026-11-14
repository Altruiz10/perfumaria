import type { Order } from "@/domain/order";
import type { PaymentResult } from "@/domain/payment";
import type { ChargeContext, PaymentGateway } from "@/domain/ports";
import type { MercadoPagoHttp } from "./http";
import { pixExpiry, toCardPreferenceRequest, toPixPaymentRequest } from "./mapping";

interface PixResponse {
  id: number | string;
  point_of_interaction?: { transaction_data?: { qr_code?: string } };
  date_of_expiration?: string;
}

interface PreferenceResponse {
  id: string;
  init_point?: string;
}

export class MercadoPagoGateway implements PaymentGateway {
  readonly name = "mercadopago";

  constructor(private readonly http: MercadoPagoHttp) {}

  async charge(order: Order, ctx: ChargeContext): Promise<PaymentResult> {
    // The order id as idempotency key: a retried request can never create a second charge.
    return order.paymentMethod === "pix" ? this.chargePix(order, ctx) : this.chargeCard(order, ctx);
  }

  private async chargePix(order: Order, ctx: ChargeContext): Promise<PaymentResult> {
    const res = await this.http.post<PixResponse>("/v1/payments", toPixPaymentRequest(order, ctx), order.id);
    const pixCode = res.point_of_interaction?.transaction_data?.qr_code;
    if (!pixCode) throw new Error("mercadopago_missing_pix_code");
    return {
      method: "pix",
      status: "pending",
      externalId: String(res.id),
      pixCode,
      expiresAt: new Date(res.date_of_expiration ?? pixExpiry(order)).toISOString(),
    };
  }

  private async chargeCard(order: Order, ctx: ChargeContext): Promise<PaymentResult> {
    const res = await this.http.post<PreferenceResponse>("/checkout/preferences", toCardPreferenceRequest(order, ctx), order.id);
    if (!res.init_point || !res.init_point.startsWith("https://")) throw new Error("mercadopago_missing_redirect");
    return { method: "card", status: "pending", externalId: res.id, redirectUrl: res.init_point };
  }
}
