import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CollectionControls } from "@/components/collection/CollectionControls";
import { ProductCard } from "@/components/product/ProductCard";
import { JsonLd } from "@/components/ui/JsonLd";
import { SORTS, queryCatalog, type CatalogQuery } from "@/domain/catalog";
import { FAMILIES, GENDERS } from "@/domain/product";
import { container } from "@/infra/container";
import { isLocale } from "@/i18n/config";
import { getDictionary, t } from "@/i18n/dictionaries";
import { localizePath } from "@/i18n/routes";
import { alternatesFor } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";

const pick = <T extends string>(v: unknown, allowed: readonly T[]): T | undefined =>
  typeof v === "string" && (allowed as readonly string[]).includes(v) ? (v as T) : undefined;

function parseQuery(sp: Record<string, string | string[] | undefined>): CatalogQuery {
  const q = typeof sp.q === "string" ? sp.q.slice(0, 80) : undefined;
  return {
    q: q?.trim() || undefined,
    family: pick(sp.family, FAMILIES),
    gender: pick(sp.gender, GENDERS),
    sort: pick(sp.sort, SORTS),
  };
}

export async function generateMetadata({ params, searchParams }: PageProps<"/[lang]/collection">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const d = getDictionary(lang);
  const query = parseQuery(await searchParams);
  const title = query.family
    ? `${d.families[query.family].name} — ${d.collection.title}`
    : query.gender
      ? `${d.collection.title} ${d.genders[query.gender]}`
      : d.collection.title;
  // SEO per category: family pages are indexable with their own canonical; search/sort are not.
  const internal = query.family ? `/collection?family=${query.family}` : "/collection";
  return {
    title,
    description: query.family ? d.families[query.family].desc : d.collection.subtitle,
    alternates: alternatesFor(lang, internal),
    robots: query.q || query.sort ? { index: false, follow: true } : undefined,
  };
}

export default async function CollectionPage({ params, searchParams }: PageProps<"/[lang]/collection">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const d = getDictionary(lang);
  const query = parseQuery(await searchParams);
  const results = queryCatalog(await container.products.list(), query, lang);
  const heading = query.family ? d.families[query.family].name : query.gender ? d.genders[query.gender] : d.collection.title;

  return (
    <div className="container-lux pt-12 md:pt-20">
      <header className="mx-auto max-w-2xl text-center">
        <p className="eyebrow">{d.collection.eyebrow}</p>
        <h1 className="display mt-4 text-5xl md:text-7xl">{heading}</h1>
        <p className="mt-5 text-ink-soft">
          {query.q ? t(d.collection.resultsFor, { q: query.q }) : query.family ? d.families[query.family].desc : d.collection.subtitle}
        </p>
      </header>

      <CollectionControls query={query} basePath={localizePath(lang, "/collection")} />

      <p className="mt-8 text-xs tracking-[0.18em] text-muted uppercase" aria-live="polite" data-testid="results-count">
        {results.length === 1 ? d.collection.resultsOne : t(d.collection.results, { count: results.length })}
      </p>

      {results.length === 0 ? (
        <p className="display py-24 text-center text-3xl text-ink-soft">{d.collection.empty}</p>
      ) : (
        <ul className="mt-8 grid grid-cols-2 gap-x-4 gap-y-14 md:grid-cols-3 md:gap-x-8 md:gap-y-20 xl:grid-cols-4">
          {results.map((p, i) => (
            <li key={p.slug}>
              <ProductCard product={p} locale={lang} dict={d} priority={i < 2} headingLevel={2} />
            </li>
          ))}
        </ul>
      )}

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: heading,
          itemListElement: results.map((p, i) => ({
            "@type": "ListItem",
            position: i + 1,
            url: `${SITE_URL}${localizePath(lang, `/product/${p.slug}`)}`,
            name: p.name,
          })),
        }}
      />
    </div>
  );
}
