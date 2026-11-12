import type { VariantLookup } from "./catalog";
import { percentOff, sumCents, type Cents } from "./money";

export const MAX_QUANTITY = 10;
export const FREE_SHIPPING_THRESHOLD: Cents = 29900; // R3
export const SHIPPING_FLAT: Cents = 2990; // R3
export const PIX_DISCOUNT_PERCENT = 5; // R4

export type PaymentMethod = "pix" | "card";

export interface CartLine {
  slug: string;
  sizeMl: number;
  quantity: number;
}

export type CartAction =
  | { type: "add"; slug: string; sizeMl: number; quantity?: number }
  | { type: "setQuantity"; slug: string; sizeMl: number; quantity: number }
  | { type: "remove"; slug: string; sizeMl: number }
  | { type: "replace"; lines: CartLine[] }
  | { type: "clear" };

/** R5 */
export function clampQuantity(n: number): number {
  if (!Number.isFinite(n)) return 1;
  return Math.min(MAX_QUANTITY, Math.max(1, Math.floor(n)));
}

const same = (l: CartLine, slug: string, sizeMl: number) => l.slug === slug && l.sizeMl === sizeMl;

export function cartReducer(state: readonly CartLine[], action: CartAction): CartLine[] {
  switch (action.type) {
    case "add": {
      const qty = clampQuantity(action.quantity ?? 1);
      const existing = state.find((l) => same(l, action.slug, action.sizeMl));
      if (!existing) return [...state, { slug: action.slug, sizeMl: action.sizeMl, quantity: qty }];
      return state.map((l) => (l === existing ? { ...l, quantity: clampQuantity(l.quantity + qty) } : l));
    }
    case "setQuantity":
      return state.map((l) =>
        same(l, action.slug, action.sizeMl) ? { ...l, quantity: clampQuantity(action.quantity) } : l,
      );
    case "remove":
      return state.filter((l) => !same(l, action.slug, action.sizeMl));
    case "replace":
      return [...action.lines];
    case "clear":
      return [];
  }
}

export function cartCount(lines: readonly CartLine[]): number {
  return lines.reduce((n, l) => n + l.quantity, 0);
}

function isLineShape(x: unknown): x is CartLine {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return typeof o.slug === "string" && typeof o.sizeMl === "number" && typeof o.quantity === "number";
}

/** R7: rebuild a cart from untrusted storage, dropping anything the catalog no longer sells. */
export function hydrateCart(raw: unknown, lookup: VariantLookup): CartLine[] {
  if (!Array.isArray(raw)) return [];
  return raw.reduce<CartLine[]>(
    (acc, item) =>
      isLineShape(item) && lookup(item.slug, item.sizeMl)
        ? cartReducer(acc, { type: "add", slug: item.slug, sizeMl: item.sizeMl, quantity: item.quantity })
        : acc,
    [],
  );
}

export interface PricedLine extends CartLine {
  name: string;
  image: string;
  unitPrice: Cents;
  lineTotal: Cents;
}

export interface CartTotals {
  lines: PricedLine[];
  subtotal: Cents;
  shipping: Cents;
  discount: Cents;
  total: Cents;
}

/** R2, R3, R4: the only place totals are computed — used by client display and server alike. */
export function priceCart(lines: readonly CartLine[], lookup: VariantLookup, method?: PaymentMethod): CartTotals {
  const priced: PricedLine[] = [];
  for (const line of lines) {
    const hit = lookup(line.slug, line.sizeMl);
    if (!hit) continue;
    const quantity = clampQuantity(line.quantity);
    priced.push({
      slug: line.slug,
      sizeMl: line.sizeMl,
      quantity,
      name: hit.product.name,
      image: hit.product.images[0] ?? "",
      unitPrice: hit.variant.priceCents,
      lineTotal: hit.variant.priceCents * quantity,
    });
  }
  const subtotal = sumCents(priced.map((l) => l.lineTotal));
  const shipping = subtotal === 0 || subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FLAT;
  const discount = method === "pix" ? percentOff(subtotal, PIX_DISCOUNT_PERCENT) : 0;
  return { lines: priced, subtotal, shipping, discount, total: subtotal - discount + shipping };
}
