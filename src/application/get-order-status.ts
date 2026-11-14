import { toPublicView, type OrderPublicView } from "@/domain/order";
import type { OrderRepository } from "@/domain/ports";

const ORDER_ID = /^HM-[A-Z0-9]{1,20}-[A-Z0-9]{1,24}$/;

/** Use case: what the confirmation page may know about an order. Returns null for unknown or malformed ids. */
export async function getOrderStatus(id: string, deps: { orders: OrderRepository }): Promise<OrderPublicView | null> {
  if (!ORDER_ID.test(id)) return null;
  const order = await deps.orders.findById(id);
  return order ? toPublicView(order) : null;
}
