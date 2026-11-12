import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/product/ProductCard";
import { ProductGallery } from "@/components/product/ProductGallery";
import { ProductPurchase } from "@/components/product/ProductPurchase";
import { JsonLd } from "@/components/ui/JsonLd";
import { Reveal } from "@/components/ui/Reveal";
import { lowestPrice } from "@/domain/catalog";
import { container } from "@/infra/container";
import { LOCALE_TAG, isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { localizePath } from "@/i18n/routes";
import { alternatesFor } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";

export async function generateMetadata({ params }: PageProps<"/[lang]/product/[slug]">): Promise<Metadata> {
  const { lang, slug } = await params;
  if (!isLocale(lang)) return {};
  const p = await container.products.findBySlug(slug);
  if (!p) return {};
  const d = getDictionary(lang);
  return {
    title: `${p.name} — ${d.product.concentrations[p.concentration]}`,
    description: `${p.tagline[lang]} ${p.description[lang]}`,
    alternates: alternatesFor(lang, `/product/${p.slug}`),
    openGraph: {
      type: "website",
      title: p.name,
      description: p.description[lang],
      locale: LOCALE_TAG[lang].replace("-", "_"),
      images: [{ url: p.images[0], width: 1200, height: 1500, alt: p.name }],
    },
  };
}

export default async function ProductPage({ params }: PageProps<"/[lang]/product/[slug]">) {
  const { lang, slug } = await params;
  if (!isLocale(lang)) notFound();
  const product = await container.products.findBySlug(slug);
  if (!product) notFound();
  const d = getDictionary(lang);
  const L = (p: string) => localizePath(lang, p);
  const all = await container.products.list();
  const related = all
    .filter((p) => p.slug !== product.slug)
    .sort((a, b) => Number(b.family === product.family) - Number(a.family === product.family))
    .slice(0, 4);
  const url = `${SITE_URL}${L(`/product/${product.slug}`)}`;

  const tiers = [
    { label: d.product.top, notes: product.notes.top[lang] },
    { label: d.product.heart, notes: product.notes.heart[lang] },
    { label: d.product.base, notes: product.notes.base[lang] },
  ];

  return (
    <>
      <nav aria-label="Breadcrumb" className="container-lux pt-6 text-[0.7rem] tracking-[0.14em] text-muted uppercase">
        <ol className="flex flex-wrap gap-2">
          <li>
            <Link href={L("/")} className="hover:text-ink">
              {d.header.home}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link href={L("/collection")} className="hover:text-ink">
              {d.collection.title}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="text-ink">
            {product.name}
          </li>
        </ol>
      </nav>

      <div className="container-lux mt-6 grid gap-10 md:mt-10 md:grid-cols-12 md:gap-12 lg:gap-20">
        <div className="-mx-5 md:col-span-7 md:mx-0">
          <ProductGallery images={product.images} name={product.name} />
        </div>

        <div className="md:col-span-5">
          <div className="md:sticky md:top-32">
            <p className="eyebrow">
              {d.families[product.family].name} · {d.product.concentrations[product.concentration]}
            </p>
            <h1 className="display mt-4 text-5xl md:text-6xl" data-testid="product-title">
              {product.name}
            </h1>
            <p className="display mt-3 text-2xl text-ink-soft italic">{product.tagline[lang]}</p>
            <p className="mt-6 leading-relaxed text-ink-soft">{product.description[lang]}</p>

            <ProductPurchase product={product} />

            <ul className="mt-8 space-y-2 border-t border-line pt-6 text-xs tracking-wide text-muted">
              <li>{d.product.shipping}</li>
              <li>{d.product.sample}</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Story + pyramid */}
      <section className="mt-24 bg-surface md:mt-36" aria-labelledby="story-title">
        <div className="container-lux grid gap-16 py-20 md:grid-cols-2 md:gap-24 md:py-28">
          <Reveal>
            <p className="eyebrow">{d.product.story}</p>
            <h2 id="story-title" className="display mt-5 text-4xl md:text-5xl">
              {product.tagline[lang]}
            </h2>
            <p className="mt-7 text-[1.05rem] leading-[1.95] text-ink-soft">{product.story[lang]}</p>
          </Reveal>
          <Reveal delay={120}>
            <p className="eyebrow">{d.product.notes}</p>
            <dl className="mt-6 divide-y divide-line border-y border-line">
              {tiers.map((tier, i) => (
                <div key={tier.label} className="grid grid-cols-[5.5rem_1fr] items-baseline gap-4 py-6 md:grid-cols-[7rem_1fr]">
                  <dt className="caps text-muted">
                    <span className="display mr-2 text-lg text-gold-ink normal-case">{["I", "II", "III"][i]}</span>
                    {tier.label}
                  </dt>
                  <dd className="display text-2xl md:text-3xl">{tier.notes.join(" · ")}</dd>
                </div>
              ))}
            </dl>
            <dl className="mt-8 grid grid-cols-2 gap-6 text-sm">
              <div>
                <dt className="caps text-muted">{d.product.family}</dt>
                <dd className="mt-2">{d.families[product.family].name}</dd>
              </div>
              <div>
                <dt className="caps text-muted">{d.product.gender}</dt>
                <dd className="mt-2">{d.genders[product.gender]}</dd>
              </div>
            </dl>
          </Reveal>
        </div>
      </section>

      {/* Related */}
      <section className="container-lux pt-20 md:pt-28" aria-labelledby="related-title">
        <h2 id="related-title" className="display text-center text-4xl md:text-5xl">
          {d.product.related}
        </h2>
        <ul className="mt-12 grid grid-cols-2 gap-x-4 gap-y-12 md:mt-16 md:gap-x-8 lg:grid-cols-4">
          {related.map((p) => (
            <li key={p.slug}>
              <ProductCard product={p} locale={lang} dict={d} sizes="(min-width: 1024px) 25vw, 50vw" />
            </li>
          ))}
        </ul>
      </section>

      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "Product",
            name: product.name,
            description: product.description[lang],
            image: product.images.map((i) => `${SITE_URL}${i}`),
            brand: { "@type": "Brand", name: d.brand.name },
            category: d.families[product.family].name,
            sku: product.variants[0].sku,
            offers: {
              "@type": "AggregateOffer",
              priceCurrency: "BRL",
              lowPrice: (lowestPrice(product) / 100).toFixed(2),
              highPrice: (Math.max(...product.variants.map((v) => v.priceCents)) / 100).toFixed(2),
              offerCount: product.variants.length,
              availability: "https://schema.org/InStock",
              url,
            },
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: d.header.home, item: `${SITE_URL}${L("/")}` },
              { "@type": "ListItem", position: 2, name: d.collection.title, item: `${SITE_URL}${L("/collection")}` },
              { "@type": "ListItem", position: 3, name: product.name, item: url },
            ],
          },
        ]}
      />
    </>
  );
}
