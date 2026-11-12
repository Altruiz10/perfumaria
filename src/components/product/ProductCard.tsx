import Image from "next/image";
import Link from "next/link";
import { lowestPrice } from "@/domain/catalog";
import type { Locale } from "@/domain/locale";
import { formatMoney } from "@/domain/money";
import type { Product } from "@/domain/product";
import type { Dictionary } from "@/i18n/dictionaries";
import { localizePath } from "@/i18n/routes";
import { QuickAdd } from "./QuickAdd";
import { WishlistButton } from "./WishlistButton";

export function ProductCard({
  product,
  locale,
  dict,
  priority = false,
  sizes = "(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 50vw",
  headingLevel = 3,
}: {
  product: Product;
  locale: Locale;
  dict: Dictionary;
  priority?: boolean;
  sizes?: string;
  headingLevel?: 2 | 3;
}) {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  const href = localizePath(locale, `/product/${product.slug}`);
  const smallest = [...product.variants].sort((a, b) => a.priceCents - b.priceCents)[0];

  return (
    <article className="group relative" data-testid="product-card">
      <div className="relative aspect-[4/5] overflow-hidden bg-surface">
        <Link href={href} tabIndex={-1} aria-hidden="true" className="absolute inset-0">
          <Image
            src={product.images[0]}
            alt=""
            fill
            sizes={sizes}
            priority={priority}
            className="object-cover transition-[transform,opacity] duration-[1.2s] ease-[var(--ease-lux)] group-hover:scale-[1.04] md:group-hover:opacity-0"
          />
          {product.images[1] && (
            <Image
              src={product.images[1]}
              alt=""
              fill
              sizes={sizes}
              className="hidden object-cover opacity-0 transition-[transform,opacity] duration-[1.2s] ease-[var(--ease-lux)] group-hover:scale-[1.04] group-hover:opacity-100 md:block"
            />
          )}
        </Link>
        <WishlistButton slug={product.slug} name={product.name} className="absolute top-2 right-2" />
        <div className="absolute inset-x-3 bottom-3 translate-y-2 opacity-0 transition-all duration-500 ease-[var(--ease-lux)] group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:translate-y-0 group-hover:opacity-100 max-md:hidden">
          <QuickAdd slug={product.slug} sizeMl={smallest.sizeMl} name={product.name} />
        </div>
      </div>
      <div className="mt-4 text-center md:mt-5">
        <p className="eyebrow !text-[0.6rem] !text-muted">{dict.families[product.family].name}</p>
        <Heading className="display mt-1.5 text-xl md:text-2xl">
          <Link href={href} className="after:absolute after:inset-0 after:content-['']">
            {product.name}
          </Link>
        </Heading>
        <p className="mt-1 text-[0.8rem] text-muted">
          {dict.product.from} <span className="text-ink tabular-nums">{formatMoney(lowestPrice(product), locale)}</span>
        </p>
      </div>
    </article>
  );
}
