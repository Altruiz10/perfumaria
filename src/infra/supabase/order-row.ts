import type { PricedLine } from "@/domain/cart";
import type { Order, OrderStatus } from "@/domain/order";
import type { PaymentResult } from "@/domain/payment";
import { isLocale } from "@/domain/locale";

/**
 * Pure translation between the Order aggregate and its row in public.orders.
 * No client, no I/O: this is the whole "schema knowledge" of the adapter and it is unit-tested.
 */

/** Method-specific part of a PaymentResult; method and externalId have their own columns. */
type PaymentDetails =
  | { status: "pending"; pixCode: string; expiresAt: string }
  | { status: "pending"; redirectUrl: string }
  | { status: "approved" | "declined" };

export interface OrderRow {
  id: string;
  created_at: string;
  locale: string;
  status: string;
  payment_method: string;
  subtotal_cents: number;
  shipping_cents: number;
  discount_cents: number;
  total_cents: number;
  items: PricedLine[];
  customer_name: string;
  customer_email: string;
  customer_cpf: string;
  customer_phone: string;
  address_cep: string;
  address_street: string;
  address_number: string;
  address_complement: string;
  address_district: string;
  address_city: string;
  address_state: string;
  marketing_opt_in: boolean;
  payment_provider: string | null;
  payment_external_id: string | null;
  payment_details: PaymentDetails | null;
}

/** The only columns that change after creation. */
export type OrderUpdateRow = Pick<OrderRow, "status" | "payment_provider" | "payment_external_id" | "payment_details">;

function detailsOf(result: PaymentResult): PaymentDetails {
  if (result.method === "pix") return { status: "pending", pixCode: result.pixCode, expiresAt: result.expiresAt };
  if (result.status === "pending") return { status: "pending", redirectUrl: result.redirectUrl };
  return { status: result.status };
}

export function orderToUpdateRow(order: Order): OrderUpdateRow {
  return {
    status: order.status,
    payment_provider: order.charge?.provider ?? null,
    payment_external_id: order.charge?.result.externalId ?? null,
    payment_details: order.charge ? detailsOf(order.charge.result) : null,
  };
}

export function orderToRow(order: Order): OrderRow {
  const { customer, address, totals } = order;
  return {
    id: order.id,
    created_at: order.createdAt,
    locale: order.locale,
    payment_method: order.paymentMethod,
    subtotal_cents: totals.subtotal,
    shipping_cents: totals.shipping,
    discount_cents: totals.discount,
    total_cents: totals.total,
    items: totals.lines,
    customer_name: customer.name,
    customer_email: customer.email,
    customer_cpf: customer.cpf,
    customer_phone: customer.phone,
    address_cep: address.cep,
    address_street: address.street,
    address_number: address.number,
    address_complement: address.complement,
    address_district: address.district,
    address_city: address.city,
    address_state: address.state,
    marketing_opt_in: order.marketingOptIn,
    ...orderToUpdateRow(order),
  };
}

function resultOf(method: Order["paymentMethod"], externalId: string, d: PaymentDetails): PaymentResult {
  if (method === "pix") {
    if (!("pixCode" in d)) throw new Error("corrupt_payment_details");
    return { method, status: "pending", externalId, pixCode: d.pixCode, expiresAt: d.expiresAt };
  }
  if ("redirectUrl" in d) return { method, status: "pending", externalId, redirectUrl: d.redirectUrl };
  if (d.status === "pending") throw new Error("corrupt_payment_details");
  return { method, status: d.status, externalId };
}

export function rowToOrder(row: OrderRow): Order {
  if (!isLocale(row.locale)) throw new Error("corrupt_order_row");
  const method = row.payment_method as Order["paymentMethod"];
  return {
    id: row.id,
    createdAt: new Date(row.created_at).toISOString(),
    locale: row.locale,
    status: row.status as OrderStatus,
    customer: {
      name: row.customer_name,
      email: row.customer_email,
      cpf: row.customer_cpf,
      phone: row.customer_phone,
    },
    address: {
      cep: row.address_cep,
      street: row.address_street,
      number: row.address_number,
      complement: row.address_complement,
      district: row.address_district,
      city: row.address_city,
      state: row.address_state as Order["address"]["state"],
    },
    paymentMethod: method,
    totals: {
      lines: row.items,
      subtotal: row.subtotal_cents,
      shipping: row.shipping_cents,
      discount: row.discount_cents,
      total: row.total_cents,
    },
    marketingOptIn: row.marketing_opt_in,
    charge:
      row.payment_provider && row.payment_external_id && row.payment_details
        ? { provider: row.payment_provider, result: resultOf(method, row.payment_external_id, row.payment_details) }
        : null,
  };
}
