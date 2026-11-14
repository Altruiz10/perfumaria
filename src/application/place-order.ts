import { priceCart } from "@/domain/cart";
import { createVariantLookup } from "@/domain/catalog";
import { checkoutSchema, issuePaths } from "@/domain/checkout";
import { attachCharge, markChargeFailed, type Order } from "@/domain/order";
import type { OrderRepository, PaymentGateway, ProductRepository } from "@/domain/ports";
import type { PaymentResult } from "@/domain/payment";
import { errorFields, logEvent } from "@/lib/log";
import { buildChargeContext } from "./charge-context";

export interface PlaceOrderDeps {
  products: ProductRepository;
  orders: OrderRepository;
  payments: PaymentGateway;
  /** Public origin, used to build the return and notification URLs. */
  siteUrl?: string;
  now?: () => Date;
  newId?: () => string;
}

export type PlaceOrderResult =
  | { ok: true; order: Order; payment: PaymentResult }
  | { ok: false; error: "validation"; fields: string[] }
  | { ok: false; error: "unavailable" }
  | { ok: false; error: "payment" };

function defaultId(): string {
  const [a, b] = crypto.getRandomValues(new Uint32Array(2));
  return `HM-${Date.now().toString(36).toUpperCase()}-${a.toString(36).toUpperCase()}${b.toString(36).toUpperCase()}`;
}

/**
 * Use case: validate (R9, S4) → price on server (R2–R4) → persist as pending →
 * charge → record the gateway's answer.
 *
 * The order is saved BEFORE charging so that a provider callback can never
 * arrive for an order we do not know.
 */
export async function placeOrder(input: unknown, deps: PlaceOrderDeps): Promise<PlaceOrderResult> {
  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "validation", fields: issuePaths(parsed.error) };
  const data = parsed.data;

  const lookup = createVariantLookup(await deps.products.list());
  if (data.items.some((i) => !lookup(i.slug, i.sizeMl))) return { ok: false, error: "unavailable" };

  const totals = priceCart(data.items, lookup, data.paymentMethod);
  const pending: Order = {
    id: (deps.newId ?? defaultId)(),
    createdAt: (deps.now?.() ?? new Date()).toISOString(),
    locale: data.locale,
    status: "pending_payment",
    customer: data.customer,
    address: data.address,
    paymentMethod: data.paymentMethod,
    totals,
    marketingOptIn: data.marketingOptIn,
    charge: null,
  };

  await deps.orders.create(pending);

  let payment: PaymentResult;
  try {
    payment = await deps.payments.charge(pending, buildChargeContext(pending, deps.siteUrl ?? "http://localhost:3000"));
  } catch (error) {
    logEvent("place-order", "charge_failed", { orderId: pending.id, gateway: deps.payments.name, ...errorFields(error) });
    await persist(deps.orders, markChargeFailed(pending), pending);
    return { ok: false, error: "payment" };
  }

  const order = attachCharge(pending, deps.payments.name, payment);
  // The money request already exists at the provider. If recording it fails the customer must
  // still get the payment instructions; the provider's callback reconciles by order id.
  await persist(deps.orders, order, pending);
  return { ok: true, order, payment };
}

async function persist(orders: OrderRepository, next: Order, previous: Order): Promise<void> {
  try {
    await orders.update(next, previous.status);
  } catch (error) {
    logEvent("place-order", "persist_failed", { orderId: next.id, ...errorFields(error) });
  }
}
