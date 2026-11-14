import type { Order, OrderStatus } from "@/domain/order";
import type { OrderRepository } from "@/domain/ports";

/** Development and tests only: orders vanish on restart. Production uses a database adapter. */
export class InMemoryOrderRepository implements OrderRepository {
  private readonly orders = new Map<string, Order>();

  async create(order: Order): Promise<void> {
    if (this.orders.has(order.id)) throw new Error("order_already_exists");
    this.orders.set(order.id, structuredClone(order));
  }

  async findById(id: string): Promise<Order | null> {
    const hit = this.orders.get(id);
    return hit ? structuredClone(hit) : null;
  }

  async update(next: Order, expectedStatus: OrderStatus): Promise<boolean> {
    const current = this.orders.get(next.id);
    if (!current || current.status !== expectedStatus) return false;
    this.orders.set(next.id, structuredClone(next));
    return true;
  }
}
