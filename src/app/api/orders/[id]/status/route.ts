import { getOrderStatus } from "@/application/get-order-status";
import { container } from "@/infra/container";
import { errorFields, logEvent } from "@/lib/log";
import { json } from "@/lib/http";

/** Polled by the confirmation page. Read-only and personal-data-free (C5), so no CSRF token (S3 covers writes). */
export async function GET(_req: Request, ctx: RouteContext<"/api/orders/[id]/status">): Promise<Response> {
  const { id } = await ctx.params;
  try {
    const view = await getOrderStatus(id, container);
    return view ? json(view) : json({ error: "not_found" }, 404);
  } catch (error) {
    logEvent("order-status", "lookup_failed", errorFields(error));
    return json({ error: "unavailable" }, 503);
  }
}
