import { reconcilePayment } from "@/application/reconcile-payment";
import { container } from "@/infra/container";
import { errorFields, logEvent } from "@/lib/log";
import { json, readJson } from "@/lib/http";

/**
 * ADR-012: provider callback. Server-to-server, so there is no Origin or CSRF
 * token (S3 protects browser sessions); authenticity comes from the provider's
 * signature, checked inside the notifications adapter, and the payment's real
 * state is always re-fetched from the provider.
 *
 * 2xx = "stop retrying". 401 = forged. 5xx = "try again later".
 */
export async function POST(req: Request): Promise<Response> {
  const body = (await readJson(req, 65_536)) ?? null;
  try {
    const result = await reconcilePayment(
      { headers: req.headers, query: new URL(req.url).searchParams, body },
      { orders: container.orders, notifications: container.paymentNotifications },
    );
    if (result.kind === "unauthorized") return json({ error: "unauthorized" }, 401);
    return json({ ok: true, result: result.kind }, 200);
  } catch (error) {
    logEvent("webhook", "reconcile_failed", errorFields(error));
    return json({ error: "retry" }, 500);
  }
}
