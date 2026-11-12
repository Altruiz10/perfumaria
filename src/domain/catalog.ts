import type { Locale } from "./locale";
import type { Cents } from "./money";
import type { Gender, OlfactiveFamily, Product, ProductVariant } from "./product";

export const SORTS = ["featured", "newest", "price-asc", "price-desc", "name"] as const;
export type CatalogSort = (typeof SORTS)[number];

export interface CatalogQuery {
  q?: string;
  family?: OlfactiveFamily;
  gender?: Gender;
  sort?: CatalogSort;
}

/** Minimal client-side shape (keeps the RSC payload small; no localized copy). */
export type ProductSummary = Pick<Product, "slug" | "name" | "family" | "images" | "variants">;

export function toSummary(p: Product): ProductSummary {
  return { slug: p.slug, name: p.name, family: p.family, images: p.images, variants: p.variants };
}

export type VariantLookup = (
  slug: string,
  sizeMl: number,
) => { product: ProductSummary; variant: ProductVariant } | undefined;

export function createVariantLookup(products: readonly ProductSummary[]): VariantLookup {
  const index = new Map<string, { product: ProductSummary; variant: ProductVariant }>();
  for (const product of products) {
    for (const variant of product.variants) index.set(`${product.slug}::${variant.sizeMl}`, { product, variant });
  }
  return (slug, sizeMl) => index.get(`${slug}::${sizeMl}`);
}

export function normalizeText(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function lowestPrice(product: Pick<Product, "variants">): Cents {
  return Math.min(...product.variants.map((v) => v.priceCents));
}

/** Bounded Levenshtein: returns true when distance(a, b) <= 1. */
function withinOneEdit(a: string, b: string): boolean {
  if (a === b) return true;
  const la = a.length;
  const lb = b.length;
  if (Math.abs(la - lb) > 1) return false;
  let i = 0;
  let j = 0;
  let edits = 0;
  while (i < la && j < lb) {
    if (a[i] === b[j]) {
      i++;
      j++;
      continue;
    }
    if (++edits > 1) return false;
    if (la > lb) i++;
    else if (lb > la) j++;
    else {
      i++;
      j++;
    }
  }
  return edits + (la - i) + (lb - j) <= 1;
}

const FUZZY_MIN_LENGTH = 5;

function searchableText(p: Product, locale: Locale): string {
  return normalizeText(
    [
      p.name,
      p.family,
      p.tagline[locale],
      p.description[locale],
      ...p.notes.top[locale],
      ...p.notes.heart[locale],
      ...p.notes.base[locale],
    ].join(" "),
  );
}

function matchesToken(haystack: string, words: string[], token: string): boolean {
  if (haystack.includes(token)) return true;
  if (token.length < FUZZY_MIN_LENGTH) return false;
  return words.some((w) => withinOneEdit(w, token));
}

/** R8: accent/case-insensitive, AND across tokens, one typo tolerated on 5+ letter tokens. */
export function matchesSearch(product: Product, q: string, locale: Locale): boolean {
  const tokens = normalizeText(q).split(" ").filter(Boolean);
  if (tokens.length === 0) return true;
  const haystack = searchableText(product, locale);
  const words = haystack.split(/[^a-z0-9]+/).filter(Boolean);
  return tokens.every((t) => matchesToken(haystack, words, t));
}

const comparators: Record<CatalogSort, (a: Product, b: Product) => number> = {
  featured: (a, b) => Number(b.featured) - Number(a.featured),
  newest: (a, b) => b.createdAt.localeCompare(a.createdAt),
  "price-asc": (a, b) => lowestPrice(a) - lowestPrice(b),
  "price-desc": (a, b) => lowestPrice(b) - lowestPrice(a),
  name: (a, b) => a.name.localeCompare(b.name, "pt"),
};

export function queryCatalog(products: readonly Product[], query: CatalogQuery, locale: Locale): Product[] {
  const result = products.filter(
    (p) =>
      (!query.family || p.family === query.family) &&
      (!query.gender || p.gender === query.gender) &&
      (!query.q || matchesSearch(p, query.q, locale)),
  );
  return result.sort(comparators[query.sort ?? "featured"]);
}
