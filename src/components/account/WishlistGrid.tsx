"use client";

import Image from "next/image";
import Link from "next/link";
import { useCatalog, useI18n, useStore } from "@/components/providers/AppProviders";
import { WishlistButton } from "@/components/product/WishlistButton";
import { lowestPrice } from "@/domain/catalog";
import { formatMoney } from "@/domain/money";
import { localizePath } from "@/i18n/routes";

export function WishlistGrid() {
  const { locale, dict } = useI18n();
  const { products } = useCatalog();
  const { wishlist, hydrated } = useStore();
  if (!hydrated) return <div className="min-h-40" aria-busy="true" />;
  const items = products.filter((p) => wishlist.includes(p.slug));
  if (items.length === 0) return <p className="mt-10 text-ink-soft">{dict.account.wishlistEmpty}</p>;
  return (
    <ul className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-3">
      {items.map((p) => (
        <li key={p.slug} className="relative">
          <Link href={localizePath(locale, `/product/${p.slug}`)} className="block">
            <div className="relative aspect-[4/5] overflow-hidden bg-surface">
              <Image src={p.images[0]} alt="" fill sizes="(min-width: 1024px) 25vw, 50vw" className="object-cover" />
            </div>
            <p className="display mt-3 text-xl">{p.name}</p>
            <p className="text-xs text-muted">
              {dict.product.from} {formatMoney(lowestPrice(p), locale)}
            </p>
          </Link>
          <WishlistButton slug={p.slug} name={p.name} className="absolute top-2 right-2" />
        </li>
      ))}
    </ul>
  );
}
