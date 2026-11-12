import { DEFAULT_LOCALE, LOCALES, isLocale, type Locale } from "@/domain/locale";

/**
 * ADR-001: internal route folders are English; each locale exposes its own
 * public segment. Only segments listed here are translated — slugs pass through.
 */
const SEGMENTS: Record<string, Record<Locale, string>> = {
  collection: { pt: "colecao", en: "collection", es: "coleccion" },
  product: { pt: "perfume", en: "product", es: "perfume" },
  checkout: { pt: "finalizar", en: "checkout", es: "finalizar-compra" },
  confirmation: { pt: "confirmacao", en: "confirmation", es: "confirmacion" },
  account: { pt: "conta", en: "account", es: "cuenta" },
  wishlist: { pt: "favoritos", en: "wishlist", es: "favoritos" },
  orders: { pt: "pedidos", en: "orders", es: "pedidos" },
  addresses: { pt: "enderecos", en: "addresses", es: "direcciones" },
  login: { pt: "entrar", en: "login", es: "acceder" },
  privacy: { pt: "privacidade", en: "privacy", es: "privacidad" },
  terms: { pt: "termos", en: "terms", es: "terminos" },
  cookies: { pt: "cookies", en: "cookies", es: "cookies" },
};

/** Every static internal route (dynamic ones use a sample slug for testing). */
export const INTERNAL_ROUTES = [
  "/",
  "/collection",
  "/product/sample-slug",
  "/checkout",
  "/checkout/confirmation",
  "/account",
  "/account/wishlist",
  "/account/orders",
  "/account/addresses",
  "/account/login",
  "/privacy",
  "/terms",
  "/cookies",
] as const;

const toPublic = (locale: Locale, seg: string) => SEGMENTS[seg]?.[locale] ?? seg;

const reverse: Record<Locale, Map<string, string>> = Object.fromEntries(
  LOCALES.map((l) => [l, new Map(Object.entries(SEGMENTS).map(([internal, t]) => [t[l], internal]))]),
) as Record<Locale, Map<string, string>>;

const toInternal = (locale: Locale, seg: string) => reverse[locale].get(seg) ?? seg;

function splitQuery(path: string): [string, string] {
  const i = path.search(/[?#]/);
  return i === -1 ? [path, ""] : [path.slice(0, i), path.slice(i)];
}

const parts = (path: string) => path.split("/").filter(Boolean);

/** "/collection?x=1" -> "/pt/colecao?x=1" */
export function localizePath(locale: Locale, internalPath: string): string {
  const [path, query] = splitQuery(internalPath);
  const segs = parts(path).map((s) => toPublic(locale, s));
  return `/${[locale, ...segs].join("/")}${query}`;
}

/** "/pt/colecao" -> { locale: "pt", internalPath: "/collection" } */
export function toInternalPath(publicPath: string): { locale: Locale; internalPath: string } | null {
  const [path] = splitQuery(publicPath);
  const [first, ...rest] = parts(path);
  if (!isLocale(first)) return null;
  return { locale: first, internalPath: `/${rest.map((s) => toInternal(first, s)).join("/")}` };
}

export function switchLocalePath(publicPath: string, target: Locale): string {
  const parsed = toInternalPath(publicPath);
  return localizePath(target, parsed?.internalPath ?? "/");
}

export type ProxyDecision = { type: "next" } | { type: "rewrite"; to: string } | { type: "redirect"; to: string };

/** Pure routing decision used by proxy.ts. */
export function resolveRequest(pathname: string, preferred: Locale = DEFAULT_LOCALE): ProxyDecision {
  const segs = parts(pathname);
  if (!isLocale(segs[0])) {
    return { type: "redirect", to: `/${[preferred, ...segs].join("/")}` };
  }
  const locale = segs[0];
  const rest = segs.slice(1);
  const internal = rest.map((s) => toInternal(locale, s));
  const canonical = internal.map((s) => toPublic(locale, s));

  if (canonical.some((s, i) => s !== rest[i])) {
    return { type: "redirect", to: `/${[locale, ...canonical].join("/")}` };
  }
  if (internal.some((s, i) => s !== rest[i])) {
    return { type: "rewrite", to: `/${[locale, ...internal].join("/")}` };
  }
  return { type: "next" };
}
