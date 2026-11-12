"use client";

import Image from "next/image";
import Link from "next/link";
import { useCatalog, useI18n, useStore, useUI } from "@/components/providers/AppProviders";
import { Drawer } from "@/components/ui/Drawer";
import { CloseIcon } from "@/components/ui/icons";
import { FREE_SHIPPING_THRESHOLD, priceCart } from "@/domain/cart";
import { formatMoney } from "@/domain/money";
import { t } from "@/i18n/dictionaries";
import { localizePath } from "@/i18n/routes";
import { QuantityStepper } from "./QuantityStepper";

export function MiniCart() {
  const { locale, dict } = useI18n();
  const { lookup } = useCatalog();
  const { lines, dispatch } = useStore();
  const { panel, close } = useUI();
  const totals = priceCart(lines, lookup);
  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - totals.subtotal);
  const progress = Math.min(100, (totals.subtotal / FREE_SHIPPING_THRESHOLD) * 100);
  const money = (c: number) => formatMoney(c, locale);
  const L = (p: string) => localizePath(locale, p);

  return (
    <Drawer open={panel === "cart"} onClose={close} side="right" label={dict.cart.title}>
      <div className="flex h-full flex-col" data-testid="mini-cart">
        <div className="flex h-16 items-center justify-between border-b border-line px-5 md:h-20 md:px-7">
          <h2 className="display text-2xl">{dict.cart.title}</h2>
          <button type="button" onClick={close} aria-label={dict.cart.close} className="-mr-3 grid h-11 w-11 place-items-center">
            <CloseIcon size={22} />
          </button>
        </div>

        {totals.lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-6 px-8 text-center">
            <p className="display text-2xl text-ink-soft">{dict.cart.empty}</p>
            <Link href={L("/collection")} onClick={close} className="btn btn-outline">
              {dict.cart.emptyCta}
            </Link>
          </div>
        ) : (
          <>
            <div className="border-b border-line px-5 py-4 md:px-7">
              <p className="text-xs tracking-wide text-ink-soft" aria-live="polite">
                {remaining > 0
                  ? t(dict.cart.freeShippingProgress, { amount: money(remaining) })
                  : dict.cart.freeShippingReached}
              </p>
              <div className="mt-2.5 h-px w-full bg-line" aria-hidden="true">
                <div className="h-px bg-gold transition-[width] duration-700 ease-[var(--ease-lux)]" style={{ width: `${progress}%` }} />
              </div>
            </div>

            <ul className="flex-1 divide-y divide-line overflow-y-auto px-5 md:px-7">
              {totals.lines.map((line) => (
                <li key={`${line.slug}-${line.sizeMl}`} className="flex gap-4 py-5" data-testid="cart-line">
                  <Link
                    href={L(`/product/${line.slug}`)}
                    onClick={close}
                    className="relative aspect-[4/5] w-20 shrink-0 overflow-hidden bg-surface"
                  >
                    <Image src={line.image} alt="" fill sizes="80px" className="object-cover" />
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="display text-lg leading-tight">{line.name}</p>
                        <p className="mt-1 text-xs text-muted">{t(dict.cart.size, { size: line.sizeMl })}</p>
                      </div>
                      <p className="text-sm tabular-nums">{money(line.lineTotal)}</p>
                    </div>
                    <div className="mt-auto flex items-center justify-between pt-3">
                      <QuantityStepper
                        value={line.quantity}
                        onChange={(q) => dispatch({ type: "setQuantity", slug: line.slug, sizeMl: line.sizeMl, quantity: q })}
                      />
                      <button
                        type="button"
                        onClick={() => dispatch({ type: "remove", slug: line.slug, sizeMl: line.sizeMl })}
                        className="text-xs text-muted underline-offset-4 hover:text-ink hover:underline"
                        aria-label={t(dict.cart.remove, { name: line.name })}
                      >
                        {t(dict.cart.remove, { name: "" }).trim()}
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <div className="border-t border-line bg-surface/50 px-5 pt-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] md:px-7">
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-ink-soft">{dict.cart.subtotal}</dt>
                  <dd className="tabular-nums">{money(totals.subtotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-ink-soft">{dict.cart.shipping}</dt>
                  <dd className="tabular-nums">{totals.shipping === 0 ? dict.cart.free : money(totals.shipping)}</dd>
                </div>
                <div className="flex justify-between border-t border-line pt-3 text-base">
                  <dt>{dict.cart.total}</dt>
                  <dd className="tabular-nums" data-testid="cart-total">
                    {money(totals.total)}
                  </dd>
                </div>
              </dl>
              <Link href={L("/checkout")} onClick={close} className="btn btn-primary mt-5 w-full" data-testid="go-checkout">
                {dict.cart.checkout}
              </Link>
              <button type="button" onClick={close} className="caps mt-3 w-full py-3 text-ink-soft hover:text-ink">
                {dict.cart.continue}
              </button>
            </div>
          </>
        )}
      </div>
    </Drawer>
  );
}
