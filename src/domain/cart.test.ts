import { describe, expect, it } from "vitest";
import {
  FREE_SHIPPING_THRESHOLD,
  SHIPPING_FLAT,
  cartCount,
  cartReducer,
  clampQuantity,
  hydrateCart,
  priceCart,
  type CartLine,
} from "./cart";
import { createVariantLookup } from "./catalog";
import { fixtureCatalog } from "./test-fixtures";

const lookup = createVariantLookup(fixtureCatalog);

describe("clampQuantity (R5)", () => {
  it.each([
    [0, 1],
    [-1, 1],
    [11, 10],
    [2.5, 2],
    [Number.NaN, 1],
    [3, 3],
  ])("CT-005 %s -> %s", (input, expected) => {
    expect(clampQuantity(input)).toBe(expected);
  });
});

describe("cartReducer (R6)", () => {
  it("CT-006 mesmo slug+tamanho soma quantidade", () => {
    let s: CartLine[] = [];
    s = cartReducer(s, { type: "add", slug: "cedro-branco", sizeMl: 100 });
    s = cartReducer(s, { type: "add", slug: "cedro-branco", sizeMl: 100, quantity: 2 });
    expect(s).toEqual([{ slug: "cedro-branco", sizeMl: 100, quantity: 3 }]);
  });

  it("CT-006 tamanhos diferentes geram linhas distintas", () => {
    let s: CartLine[] = [];
    s = cartReducer(s, { type: "add", slug: "ambar-noturno", sizeMl: 50 });
    s = cartReducer(s, { type: "add", slug: "ambar-noturno", sizeMl: 100 });
    expect(s).toHaveLength(2);
    expect(cartCount(s)).toBe(2);
  });

  it("soma nunca passa do máximo (R5)", () => {
    let s: CartLine[] = [{ slug: "cedro-branco", sizeMl: 100, quantity: 9 }];
    s = cartReducer(s, { type: "add", slug: "cedro-branco", sizeMl: 100, quantity: 5 });
    expect(s[0].quantity).toBe(10);
  });

  it("setQuantity ajusta e remove remove", () => {
    let s: CartLine[] = [{ slug: "cedro-branco", sizeMl: 100, quantity: 1 }];
    s = cartReducer(s, { type: "setQuantity", slug: "cedro-branco", sizeMl: 100, quantity: 4 });
    expect(s[0].quantity).toBe(4);
    s = cartReducer(s, { type: "remove", slug: "cedro-branco", sizeMl: 100 });
    expect(s).toEqual([]);
  });

  it("não muta o estado anterior", () => {
    const prev: CartLine[] = [{ slug: "cedro-branco", sizeMl: 100, quantity: 1 }];
    cartReducer(prev, { type: "add", slug: "cedro-branco", sizeMl: 100 });
    expect(prev[0].quantity).toBe(1);
  });
});

describe("hydrateCart (R7)", () => {
  it("CT-007 descarta item inexistente e lixo", () => {
    const raw = [
      { slug: "cedro-branco", sizeMl: 100, quantity: 2 },
      { slug: "nao-existe", sizeMl: 100, quantity: 1 },
      { slug: "cedro-branco", sizeMl: 30, quantity: 1 },
      "lixo",
      { slug: "flor-de-sal", sizeMl: 50, quantity: 99 },
    ];
    expect(hydrateCart(raw, lookup)).toEqual([
      { slug: "cedro-branco", sizeMl: 100, quantity: 2 },
      { slug: "flor-de-sal", sizeMl: 50, quantity: 10 },
    ]);
  });

  it("entrada não-array vira sacola vazia", () => {
    expect(hydrateCart(null, lookup)).toEqual([]);
    expect(hydrateCart({ a: 1 }, lookup)).toEqual([]);
  });
});

describe("priceCart (R2, R3, R4)", () => {
  it("CT-003 29899 paga frete; 29900 não", () => {
    expect(FREE_SHIPPING_THRESHOLD).toBe(29900);
    expect(SHIPPING_FLAT).toBe(2990);
    const cheap = priceCart([{ slug: "flor-de-sal", sizeMl: 50, quantity: 1 }], lookup);
    expect(cheap.subtotal).toBe(15900);
    expect(cheap.shipping).toBe(2990);
    expect(cheap.total).toBe(18890);

    const exact = priceCart(
      [{ slug: "ambar-noturno", sizeMl: 100, quantity: 1 }], // 28900
      createVariantLookup([
        { ...fixtureCatalog[0], variants: [{ sizeMl: 100, priceCents: 29900, sku: "X" }] },
      ]),
    );
    expect(exact.shipping).toBe(0);

    const below = priceCart(
      [{ slug: "ambar-noturno", sizeMl: 100, quantity: 1 }],
      createVariantLookup([
        { ...fixtureCatalog[0], variants: [{ sizeMl: 100, priceCents: 29899, sku: "X" }] },
      ]),
    );
    expect(below.shipping).toBe(2990);
  });

  it("CT-004 Pix dá 5% no subtotal, arredonda para baixo, sem desconto no frete", () => {
    const p = priceCart([{ slug: "flor-de-sal", sizeMl: 50, quantity: 1 }], lookup, "pix");
    expect(p.discount).toBe(795); // 15900 * 5% = 795
    expect(p.total).toBe(15900 - 795 + 2990);
  });

  it("frete grátis é decidido pelo subtotal antes do desconto Pix", () => {
    const p = priceCart([{ slug: "cedro-branco", sizeMl: 100, quantity: 1 }], lookup, "pix");
    expect(p.subtotal).toBe(34900);
    expect(p.shipping).toBe(0);
    expect(p.total).toBe(34900 - 1745);
  });

  it("ignora linhas sem produto no catálogo", () => {
    const p = priceCart([{ slug: "fantasma", sizeMl: 100, quantity: 3 }], lookup);
    expect(p.lines).toEqual([]);
    expect(p.subtotal).toBe(0);
    expect(p.shipping).toBe(0);
  });
});
