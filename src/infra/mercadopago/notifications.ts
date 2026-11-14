import { createHmac, timingSafeEqual } from "node:crypto";
import type { PaymentSnapshot } from "@/domain/payment";
import type { NotificationOutcome, NotificationRequest, PaymentNotifications } from "@/domain/ports";
import type { MercadoPagoHttp } from "./http";
import { amountToCents, toPaymentStatus } from "./mapping";

interface PaymentResponse {
  id: number | string;
  status?: string;
  status_detail?: string;
  external_reference?: string | null;
  transaction_amount?: number;
}

/**
 * Mercado Pago signs `x-signature: ts=<unix>,v1=<hex>` with HMAC-SHA256 over
 * `id:<data.id>;request-id:<x-request-id>;ts:<ts>;` using the app's secret.
 * Parts that are absent are omitted from the template.
 */
export function verifySignature(input: {
  signatureHeader: string | null;
  requestId: string | null;
  dataId: string | null;
  secret: string;
}): boolean {
  const { signatureHeader, requestId, dataId, secret } = input;
  if (!signatureHeader) return false;

  let ts: string | undefined;
  let v1: string | undefined;
  for (const part of signatureHeader.split(",")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === "ts") ts = rest.join("=");
    if (key === "v1") v1 = rest.join("=");
  }
  if (!ts || !v1) return false;

  const manifest = [
    dataId ? `id:${dataId.toLowerCase()};` : "",
    requestId ? `request-id:${requestId};` : "",
    `ts:${ts};`,
  ].join("");
  const expected = createHmac("sha256", secret).update(manifest).digest();

  if (!/^[0-9a-f]{64}$/i.test(v1)) return false;
  return timingSafeEqual(expected, Buffer.from(v1, "hex"));
}

export class MercadoPagoNotifications implements PaymentNotifications {
  constructor(
    private readonly http: MercadoPagoHttp,
    private readonly webhookSecret: string,
  ) {}

  parse(req: NotificationRequest): NotificationOutcome {
    const dataId = req.query.get("data.id");
    const authentic = verifySignature({
      signatureHeader: req.headers.get("x-signature"),
      requestId: req.headers.get("x-request-id"),
      dataId,
      secret: this.webhookSecret,
    });
    if (!authentic) return { kind: "invalid" };

    const type = req.query.get("type") ?? (req.body as { type?: unknown } | null)?.type;
    if (type !== "payment" || !dataId || !/^[A-Za-z0-9_-]{1,64}$/.test(dataId)) return { kind: "ignored" };
    return { kind: "payment", externalId: dataId };
  }

  async fetchPayment(externalId: string): Promise<PaymentSnapshot | null> {
    const res = await this.http.get<PaymentResponse>(`/v1/payments/${encodeURIComponent(externalId)}`);
    if (!res || !res.external_reference || typeof res.transaction_amount !== "number") return null;
    return {
      externalId: String(res.id),
      orderId: res.external_reference,
      status: toPaymentStatus(res.status, res.status_detail),
      amountCents: amountToCents(res.transaction_amount),
    };
  }
}
