import type { Locale } from "@/domain/locale";
import { LOCALE_TAG } from "@/domain/locale";
import type { Dictionary } from "@/i18n/dictionaries";
import { t } from "@/i18n/dictionaries";

const UPDATED = new Date("2026-09-22T12:00:00Z");

export function LegalPage({
  locale,
  dict,
  doc,
}: {
  locale: Locale;
  dict: Dictionary;
  doc: { title: string; sections: { h: string; p: string }[] };
}) {
  const date = new Intl.DateTimeFormat(LOCALE_TAG[locale], { dateStyle: "long" }).format(UPDATED);
  return (
    <article className="container-lux max-w-3xl pt-12 md:pt-20">
      <h1 className="display text-5xl md:text-6xl">{doc.title}</h1>
      <p className="mt-4 text-xs tracking-wide text-muted">{t(dict.legal.updated, { date })}</p>
      <p className="mt-6 border-l-2 border-gold bg-surface px-4 py-3 text-xs text-ink-soft">{dict.legal.draft}</p>
      <div className="mt-12 space-y-10">
        {doc.sections.map((s, i) => (
          <section key={s.h}>
            <h2 className="display text-2xl md:text-3xl">
              <span className="mr-3 text-gold-ink">{i + 1}.</span>
              {s.h}
            </h2>
            <p className="mt-3 leading-[1.9] text-ink-soft">{s.p}</p>
          </section>
        ))}
      </div>
    </article>
  );
}
