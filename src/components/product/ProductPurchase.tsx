"use client";

import { useEffect, useState } from "react";
import { useI18n, useStore, useUI } from "@/components/providers/AppProviders";
import { PIX_DISCOUNT_PERCENT } from "@/domain/cart";
import { formatMoney, percentOff } from "@/domain/money";
import type { Product } from "@/domain/product";
import { t } from "@/i18n/dictionaries";
import { track } from "@/infra/analytics/analytics";
import { WishlistButton } from "./WishlistButton";

export function ProductPurchase({ product }: { product: Product }) {
  const { locale, dict } = useI18n();
  const { dispatch } = useStore();
  const { open } = useUI();
  const variants = [...product.variants].sort((a, b) => a.sizeMl - b.sizeMl);
  const [size, setSize] = useState(variants[variants.length - 1].sizeMl);
  const [added, setAdded] = useState(false);
  const variant = variants.find((v) => v.sizeMl === size) ?? variants[0];
  const money = (c: number) => formatMoney(c, locale);

  useEffect(() => track({ name: "view_item", slug: product.slug }), [product.slug]);

  return (
    <div className="mt-8">
      <div className="flex items-baseline justify-between gap-4">
        <p className="display text-3xl tabular-nums" data-testid="product-price">
          {money(variant.priceCents)}
        </p>
        <p className="text-right text-xs text-muted">
          {t(dict.product.pixPrice, { amount: money(variant.priceCents - percentOff(variant.priceCents, PIX_DISCOUNT_PERCENT)) })}
          <br />
          {t(dict.product.installments, { amount: money(Math.floor(variant.priceCents / 6)) })}
        </p>
      </div>

      <fieldset className="mt-8">
        <legend className="caps text-muted">{dict.product.size}</legend>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {variants.map((v) => (
            <label
              key={v.sizeMl}
              className={`flex min-h-14 cursor-pointer flex-col items-center justify-center border transition-colors duration-300 has-[:focus-visible]:outline has-[:focus-visible]:outline-1 has-[:focus-visible]:outline-offset-2 ${
                size === v.sizeMl ? "border-ink" : "border-line hover:border-ink-soft"
              }`}
            >
              <input
                type="radio"
                name="size"
                value={v.sizeMl}
                checked={size === v.sizeMl}
                onChange={() => setSize(v.sizeMl)}
                className="sr-only"
              />
              <span className="text-sm">{v.sizeMl} ml</span>
              <span className="text-[0.7rem] text-muted tabular-nums">{money(v.priceCents)}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="mt-6 flex gap-2">
        <button
          type="button"
          className="btn btn-primary flex-1"
          onClick={() => {
            dispatch({ type: "add", slug: product.slug, sizeMl: size });
            track({ name: "add_to_cart", slug: product.slug, sizeMl: size, value: variant.priceCents });
            setAdded(true);
            window.setTimeout(() => setAdded(false), 1800);
            open("cart");
          }}
          data-testid="add-to-bag"
        >
          {added ? dict.product.added : dict.product.addToBag}
        </button>
        <WishlistButton slug={product.slug} name={product.name} className="h-[3.25rem] w-[3.25rem] border border-line" />
      </div>
    </div>
  );
}
