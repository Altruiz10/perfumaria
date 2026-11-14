import type { SupabaseClient } from "@supabase/supabase-js";
import type { Order, OrderStatus } from "@/domain/order";
import type { OrderRepository } from "@/domain/ports";
import { orderToRow, orderToUpdateRow, rowToOrder, type OrderRow } from "./order-row";
import { PersistenceError } from "./persistence-error";

const TABLE = "orders";

export class SupabaseOrderRepository implements OrderRepository {
  constructor(private readonly db: SupabaseClient) {}

  async create(order: Order): Promise<void> {
    const { error } = await this.db.from(TABLE).insert(orderToRow(order));
    if (error) throw new PersistenceError("orders.create", error.code);
  }

  async findById(id: string): Promise<Order | null> {
    const { data, error } = await this.db.from(TABLE).select("*").eq("id", id).maybeSingle<OrderRow>();
    if (error) throw new PersistenceError("orders.findById", error.code);
    return data ? rowToOrder(data) : null;
  }

  async update(next: Order, expectedStatus: OrderStatus): Promise<boolean> {
    // One statement: "set … where id = ? and status = expected". Postgres serialises concurrent
    // writers on the row, so exactly one of them matches.
    const { data, error } = await this.db
      .from(TABLE)
      .update(orderToUpdateRow(next))
      .eq("id", next.id)
      .eq("status", expectedStatus)
      .select("id");
    if (error) throw new PersistenceError("orders.update", error.code);
    return (data?.length ?? 0) === 1;
  }
}
