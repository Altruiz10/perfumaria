"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { cartCount, cartReducer, hydrateCart, type CartAction, type CartLine } from "@/domain/cart";
import { createVariantLookup, type ProductSummary, type VariantLookup } from "@/domain/catalog";
import { CONSENT_STORAGE_KEY, createConsent, parseConsent, type ConsentState } from "@/domain/consent";
import type { Locale } from "@/domain/locale";
import type { ClientDictionary } from "@/i18n/dictionaries";
import { createStorageStore, useIsClient, useStorageValue } from "@/lib/browser-store";

/* ───────────── i18n ───────────── */
interface I18nValue {
  locale: Locale;
  dict: ClientDictionary;
}
const I18nContext = createContext<I18nValue | null>(null);
export function useI18n() {
  const v = useContext(I18nContext);
  if (!v) throw new Error("useI18n outside AppProviders");
  return v;
}

/* ───────────── catalogue ───────────── */
interface CatalogValue {
  products: ProductSummary[];
  lookup: VariantLookup;
}
const CatalogContext = createContext<CatalogValue | null>(null);
export function useCatalog() {
  const v = useContext(CatalogContext);
  if (!v) throw new Error("useCatalog outside AppProviders");
  return v;
}

/* ───────────── panels (menu, search, bag, cookies) ───────────── */
export type Panel = "menu" | "search" | "cart" | "cookies" | null;
interface UIValue {
  panel: Panel;
  open: (p: Exclude<Panel, null>) => void;
  close: () => void;
}
const UIContext = createContext<UIValue | null>(null);
export function useUI() {
  const v = useContext(UIContext);
  if (!v) throw new Error("useUI outside AppProviders");
  return v;
}

/* ───────────── bag + wishlist ───────────── */
const cartStore = createStorageStore("hm_cart");
const wishlistStore = createStorageStore("hm_wishlist");
const consentStore = createStorageStore(CONSENT_STORAGE_KEY);

function parseJson(raw: string | null): unknown {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

interface StoreValue {
  hydrated: boolean;
  lines: CartLine[];
  count: number;
  dispatch: (a: CartAction) => void;
  wishlist: string[];
  toggleWishlist: (slug: string) => void;
}
const StoreContext = createContext<StoreValue | null>(null);
export function useStore() {
  const v = useContext(StoreContext);
  if (!v) throw new Error("useStore outside AppProviders");
  return v;
}

/* ───────────── consent (C1–C4) ───────────── */
interface ConsentValue {
  consent: ConsentState | null;
  decided: boolean;
  ready: boolean;
  save: (choice: { analytics: boolean; marketing: boolean }) => void;
}
const ConsentContext = createContext<ConsentValue | null>(null);
export function useConsent() {
  const v = useContext(ConsentContext);
  if (!v) throw new Error("useConsent outside AppProviders");
  return v;
}

export function AppProviders({
  locale,
  dict,
  products,
  children,
}: {
  locale: Locale;
  dict: ClientDictionary;
  products: ProductSummary[];
  children: React.ReactNode;
}) {
  const i18n = useMemo(() => ({ locale, dict }), [locale, dict]);
  const catalog = useMemo(() => ({ products, lookup: createVariantLookup(products) }), [products]);

  // Panels
  const [panel, setPanel] = useState<Panel>(null);
  const ui = useMemo<UIValue>(() => ({ panel, open: (p) => setPanel(p), close: () => setPanel(null) }), [panel]);

  // Bag (R5–R7) + wishlist: localStorage-backed external stores (SSR snapshot = empty).
  const hydrated = useIsClient();
  const rawCart = useStorageValue(cartStore);
  const rawWishlist = useStorageValue(wishlistStore);

  const lines = useMemo(() => hydrateCart(parseJson(rawCart), catalog.lookup), [rawCart, catalog.lookup]);
  const wishlist = useMemo(() => {
    const w = parseJson(rawWishlist);
    const known = new Set(products.map((p) => p.slug));
    return Array.isArray(w) ? w.filter((s): s is string => typeof s === "string" && known.has(s)) : [];
  }, [rawWishlist, products]);

  const dispatch = useCallback(
    (action: CartAction) => {
      const current = hydrateCart(parseJson(cartStore.getSnapshot()), catalog.lookup);
      cartStore.write(JSON.stringify(cartReducer(current, action)));
    },
    [catalog.lookup],
  );

  const toggleWishlist = useCallback(
    (slug: string) => {
      const next = wishlist.includes(slug) ? wishlist.filter((s) => s !== slug) : [...wishlist, slug];
      wishlistStore.write(JSON.stringify(next));
    },
    [wishlist],
  );

  const store = useMemo<StoreValue>(
    () => ({ hydrated, lines, count: cartCount(lines), dispatch, wishlist, toggleWishlist }),
    [hydrated, lines, dispatch, wishlist, toggleWishlist],
  );

  // Consent (C1–C4)
  const rawConsent = useStorageValue(consentStore);
  const consentValue = useMemo<ConsentValue>(() => {
    const consent = parseConsent(rawConsent);
    return {
      consent,
      decided: consent !== null,
      ready: hydrated,
      save: (choice) => {
        const c = createConsent(choice);
        consentStore.write(JSON.stringify(c));
        window.dispatchEvent(new CustomEvent("hm:consent", { detail: c }));
      },
    };
  }, [rawConsent, hydrated]);

  return (
    <I18nContext.Provider value={i18n}>
      <CatalogContext.Provider value={catalog}>
        <ConsentContext.Provider value={consentValue}>
          <StoreContext.Provider value={store}>
            <UIContext.Provider value={ui}>{children}</UIContext.Provider>
          </StoreContext.Provider>
        </ConsentContext.Provider>
      </CatalogContext.Provider>
    </I18nContext.Provider>
  );
}
