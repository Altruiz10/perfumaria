import { priceCart } from "@/domain/cart";
import { createVariantLookup } from "@/domain/catalog";
import { checkoutSchema, issuePaths } from "@/domain/checkout";
import type { Order, OrderRepository, PaymentGateway, PaymentResult, ProductRepository } from "@/domain/ports";

export interface PlaceOrderDeps {
  products: ProductRepository;
  orders: OrderRepository;
  payments: PaymentGateway;
  now?: () => Date;
  newId?: () => string;
}

export type PlaceOrderResult =
  | { ok: true; order: Order; payment: PaymentResult }
  | { ok: false; error: "validation"; fields: string[] }
  | { ok: false; error: "unavailable" }
  | { ok: false; error: "payment" };

function defaultId(): string {
  const rand = crypto.getRandomValues(new Uint32Array(1))[0].toString(36).toUpperCase().padStart(6, "0");
  return `HM-${Date.now().toString(36).toUpperCase()}-${rand}`;
}

/** Use case: validate (R9, S4) → price on server (R2–R4) → persist → charge. */
export async function placeOrder(input: unknown, deps: PlaceOrderDeps): Promise<PlaceOrderResult> {
  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "validation", fields: issuePaths(parsed.error) };
  const data = parsed.data;

  const lookup = createVariantLookup(await deps.products.list());
  if (data.items.some((i) => !lookup(i.slug, i.sizeMl))) return { ok: false, error: "unavailable" };

  const totals = priceCart(data.items, lookup, data.paymentMethod);
  const order: Order = {
    id: (deps.newId ?? defaultId)(),
    createdAt: (deps.now?.() ?? new Date()).toISOString(),
    customer: data.customer,
    address: data.address,
    paymentMethod: data.paymentMethod,
    totals,
    marketingOptIn: data.marketingOptIn,
  };

  await deps.orders.save(order);
  try {
    const payment = await deps.payments.charge(order);
    return { ok: true, order, payment };
  } catch {
    return { ok: false, error: "payment" };
  }
}
