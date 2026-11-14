import { placeOrder } from "@/application/place-order";
import { container } from "@/infra/container";
import { isCsrfValid, json, readJson } from "@/lib/http";
import { errorFields, logEvent } from "@/lib/log";

/** ADR-004: POST /api/checkout — CSRF (S3) → schema (S4, R9) → server pricing (R2). */
export async function POST(req: Request): Promise<Response> {
  if (!isCsrfValid(req)) return json({ error: "forbidden" }, 403);

  const body = await readJson(req);
  if (body === undefined) return json({ error: "bad_request" }, 400);

  let result;
  try {
    result = await placeOrder(body, container);
  } catch (error) {
    // The order could not even be stored (database down): nothing was charged.
    logEvent("checkout", "place_order_failed", errorFields(error));
    return json({ error: "unavailable_service" }, 503);
  }
  if (!result.ok) {
    if (result.error === "validation") return json({ error: "validation", fields: result.fields }, 422);
    if (result.error === "unavailable") return json({ error: "unavailable" }, 409);
    return json({ error: "payment" }, 502);
  }

  // C5: response carries no personal data, only what the confirmation page needs.
  return json(
    {
      orderId: result.order.id,
      total: result.order.totals.total,
      payment: result.payment,
    },
    201,
  );
}
