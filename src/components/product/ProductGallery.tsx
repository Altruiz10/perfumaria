"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { useI18n } from "@/components/providers/AppProviders";
import { t } from "@/i18n/dictionaries";

/** Mobile: swipeable scroll-snap strip with indicators. Desktop: stacked editorial column + thumbnails. */
export function ProductGallery({ images, name }: { images: string[]; name: string }) {
  const { dict } = useI18n();
  const [active, setActive] = useState(0);
  const strip = useRef<HTMLDivElement>(null);

  const onScroll = () => {
    const el = strip.current;
    if (!el) return;
    setActive(Math.round(el.scrollLeft / el.clientWidth));
  };
  const goTo = (i: number) => {
    const el = strip.current;
    if (!el) return;
    el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  };

  return (
    <div role="region" aria-roledescription="carousel" aria-label={t(dict.product.gallery, { name })}>
      {/* Mobile strip */}
      <div className="relative md:hidden">
        <div
          ref={strip}
          onScroll={onScroll}
          tabIndex={0}
          aria-label={t(dict.product.gallery, { name })}
          className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto"
        >
          {images.map((src, i) => (
            <div
              key={src}
              role="group"
              aria-roledescription="slide"
              aria-label={t(dict.product.image, { index: i + 1, total: images.length })}
              className="relative aspect-[4/5] w-full shrink-0 snap-center bg-surface"
            >
              <Image
                src={src}
                alt={i === 0 ? name : ""}
                fill
                sizes="100vw"
                priority={i === 0}
                className="object-cover"
              />
            </div>
          ))}
        </div>
        <div className="absolute inset-x-0 bottom-4 flex justify-center gap-2">
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => goTo(i)}
              aria-label={t(dict.product.image, { index: i + 1, total: images.length })}
              aria-current={active === i}
              className="grid h-6 w-6 place-items-center"
            >
              <span className={`block h-px transition-all duration-500 ${active === i ? "w-6 bg-ink" : "w-3 bg-ink/40"}`} />
            </button>
          ))}
        </div>
      </div>

      {/* Desktop editorial */}
      <div className="hidden gap-4 md:grid md:grid-cols-[4.5rem_1fr]">
        <div className="sticky top-32 flex flex-col gap-3 self-start">
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => {
                setActive(i);
                document.getElementById(`gallery-${i}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
              }}
              aria-label={t(dict.product.image, { index: i + 1, total: images.length })}
              aria-current={active === i}
              className={`relative aspect-[4/5] overflow-hidden bg-surface transition-opacity ${active === i ? "opacity-100 ring-1 ring-ink" : "opacity-50 hover:opacity-100"}`}
            >
              <Image src={src} alt="" fill sizes="72px" className="object-cover" />
            </button>
          ))}
        </div>
        <div className="space-y-4">
          {images.map((src, i) => (
            <div key={src} id={`gallery-${i}`} className="relative aspect-[4/5] overflow-hidden bg-surface">
              <Image
                src={src}
                alt={i === 0 ? name : ""}
                fill
                sizes="(min-width: 1280px) 50vw, 55vw"
                priority={i === 0}
                className="object-cover"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
