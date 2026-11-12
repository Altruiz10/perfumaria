import { getImageProps } from "next/image";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { preload } from "react-dom";
import { ProductCard } from "@/components/product/ProductCard";
import { ArrowIcon } from "@/components/ui/icons";
import { Reveal } from "@/components/ui/Reveal";
import { queryCatalog } from "@/domain/catalog";
import { FAMILIES } from "@/domain/product";
import { container } from "@/infra/container";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { localizePath } from "@/i18n/routes";

export default async function Home({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const d = getDictionary(lang);
  const L = (p: string) => localizePath(lang, p);
  const featured = queryCatalog(await container.products.list(), { sort: "featured" }, lang).slice(0, 4);

  // Art direction: distinct crops for mobile and desktop, single request each (P1).
  const common = { alt: "", priority: true, sizes: "100vw", quality: 75 } as const;
  const { props: desktop } = getImageProps({ ...common, src: "/images/hero-desktop.webp", width: 2400, height: 1350 });
  const {
    props: { srcSet: mobileSrcSet, ...mobile },
  } = getImageProps({ ...common, src: "/images/hero-mobile.webp", width: 1080, height: 1620 });
  // <picture> art direction gets no automatic preload: add one per breakpoint (LCP).
  preload(mobile.src, { as: "image", imageSrcSet: mobileSrcSet, imageSizes: "100vw", fetchPriority: "high", media: "(max-width: 767px)" });
  preload(desktop.src, { as: "image", imageSrcSet: desktop.srcSet, imageSizes: "100vw", fetchPriority: "high", media: "(min-width: 768px)" });

  return (
    <>
      {/* HERO */}
      <section className="relative isolate h-[calc(100svh-6.25rem)] min-h-[34rem] overflow-hidden bg-[#0b0a09] text-on-dark md:h-[calc(100svh-8.25rem)] lg:h-[calc(100svh-10.5rem)]">
        <picture>
          <source media="(min-width: 768px)" srcSet={desktop.srcSet} sizes="100vw" />
          <source media="(max-width: 767px)" srcSet={mobileSrcSet} sizes="100vw" />
          {/* eslint-disable-next-line jsx-a11y/alt-text -- alt="" comes from getImageProps (decorative) */}
          <img {...mobile} className="animate-kenburns absolute inset-0 -z-10 h-full w-full object-cover" />
        </picture>
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/70 via-black/10 to-black/30 md:bg-gradient-to-r md:from-black/75 md:via-black/25 md:to-transparent" />
        <div className="container-lux flex h-full flex-col justify-end pb-14 md:justify-center md:pb-0">
          <div className="max-w-2xl">
            <p className="eyebrow animate-fade-up !text-[#d9bd87]" style={{ animationDelay: "200ms" }}>
              {d.hero.eyebrow}
            </p>
            <h1
              className="display animate-fade-up mt-5 text-[2.6rem] sm:text-6xl lg:text-[5.25rem]"
              style={{ animationDelay: "350ms" }}
            >
              {d.hero.title}
            </h1>
            <p
              className="animate-fade-up mt-6 max-w-md text-[0.95rem] leading-relaxed text-white/80 md:text-base"
              style={{ animationDelay: "550ms" }}
            >
              {d.hero.subtitle}
            </p>
            <div className="animate-fade-up mt-9 flex flex-wrap gap-3" style={{ animationDelay: "700ms" }}>
              <Link href={L("/collection")} className="btn btn-light">
                {d.hero.cta}
              </Link>
              <Link href="#maison" className="btn caps px-2 text-white/85 hover:text-white">
                {d.hero.secondary} <ArrowIcon size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURED */}
      <section className="container-lux py-20 md:py-32" aria-labelledby="featured-title">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="eyebrow">{d.home.featuredEyebrow}</p>
          <h2 id="featured-title" className="display mt-4 text-4xl md:text-5xl">
            {d.home.featuredTitle}
          </h2>
        </Reveal>
        <ul className="mt-14 grid grid-cols-2 gap-x-4 gap-y-12 md:mt-20 md:gap-x-8 lg:grid-cols-4">
          {featured.map((p, i) => (
            <Reveal as="li" key={p.slug} delay={i * 90}>
              <ProductCard product={p} locale={lang} dict={d} sizes="(min-width: 1024px) 25vw, 50vw" />
            </Reveal>
          ))}
        </ul>
        <div className="mt-14 text-center md:mt-20">
          <Link href={L("/collection")} className="btn btn-outline">
            {d.home.viewAll}
          </Link>
        </div>
      </section>

      {/* MANIFESTO */}
      <section id="maison" className="scroll-mt-24 bg-surface" aria-labelledby="maison-title">
        <div className="container-lux grid items-center gap-12 py-20 md:grid-cols-2 md:gap-20 md:py-32">
          <Reveal className="relative aspect-[4/5] overflow-hidden">
            <Image src="/images/atelier.webp" alt="" fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" />
          </Reveal>
          <Reveal delay={120} className="max-w-lg">
            <p className="eyebrow">{d.home.manifestoEyebrow}</p>
            <h2 id="maison-title" className="display mt-5 text-4xl md:text-6xl">
              {d.home.manifestoTitle}
            </h2>
            <p className="mt-7 leading-[1.9] text-ink-soft">{d.home.manifestoBody}</p>
            <Link href={L("/collection")} className="caps link-lux mt-9 inline-flex items-center gap-2">
              {d.home.manifestoCta} <ArrowIcon size={16} />
            </Link>
          </Reveal>
        </div>
      </section>

      {/* QUOTE */}
      <section className="relative isolate overflow-hidden bg-[#0b0a09] text-on-dark">
        <Image
          src="/images/products/ambar-imperial-2.webp"
          alt=""
          fill
          sizes="100vw"
          className="-z-10 object-cover object-[50%_40%] opacity-55"
        />
        <div className="absolute inset-0 -z-10 bg-black/35" />
        <Reveal className="container-lux py-28 text-center md:py-44">
          <p className="display mx-auto max-w-4xl text-4xl italic md:text-7xl">“{d.home.signatureQuote}”</p>
          <p className="eyebrow mt-8 !text-[#d9bd87]">{d.brand.name}</p>
        </Reveal>
      </section>

      {/* FAMILIES */}
      <section id="familias" className="scroll-mt-24 py-20 md:py-32" aria-labelledby="families-title">
        <Reveal className="container-lux max-w-2xl text-center">
          <p className="eyebrow">{d.home.familiesEyebrow}</p>
          <h2 id="families-title" className="display mt-4 text-4xl md:text-5xl">
            {d.home.familiesTitle}
          </h2>
        </Reveal>
        <ul className="no-scrollbar mt-14 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 md:container-lux md:mt-20 md:grid md:grid-cols-3 md:gap-6 md:overflow-visible">
          {FAMILIES.map((f, i) => (
            <Reveal as="li" key={f} delay={i * 60} className="w-[72vw] shrink-0 snap-start sm:w-[45vw] md:w-auto">
              <Link
                href={`${L("/collection")}?family=${f}`}
                className="group relative block aspect-[4/5] overflow-hidden text-on-dark md:aspect-[5/6]"
              >
                <Image
                  src={`/images/families/${f}.webp`}
                  alt=""
                  fill
                  sizes="(min-width: 768px) 33vw, 72vw"
                  className="object-cover transition-transform duration-[1.4s] ease-[var(--ease-lux)] group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-6 md:p-8">
                  <p className="display text-3xl md:text-4xl">{d.families[f].name}</p>
                  <p className="mt-2 max-w-xs text-sm text-white/80">{d.families[f].desc}</p>
                  <span className="caps mt-5 inline-flex items-center gap-2 text-white/90">
                    <span className="h-px w-8 bg-current transition-all duration-500 group-hover:w-14" />
                  </span>
                </div>
              </Link>
            </Reveal>
          ))}
        </ul>
      </section>

      {/* CRAFT */}
      <section className="container-lux border-t border-line pt-20 md:pt-28" aria-labelledby="craft-title">
        <div className="grid gap-12 md:grid-cols-12">
          <Reveal className="md:col-span-4">
            <p className="eyebrow">{d.home.craftEyebrow}</p>
            <h2 id="craft-title" className="display mt-4 text-4xl md:text-5xl">
              {d.home.craftTitle}
            </h2>
          </Reveal>
          <ol className="grid gap-10 sm:grid-cols-3 md:col-span-8 md:gap-8">
            {d.home.craft.map((c, i) => (
              <Reveal as="li" key={c.title} delay={i * 100}>
                <span className="display text-5xl text-gold-ink">0{i + 1}</span>
                <h3 className="caps mt-5 text-ink">{c.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-ink-soft">{c.body}</p>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>
    </>
  );
}
