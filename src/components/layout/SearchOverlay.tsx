"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { useI18n, useUI } from "@/components/providers/AppProviders";
import { Drawer } from "@/components/ui/Drawer";
import { ArrowIcon, CloseIcon, SearchIcon } from "@/components/ui/icons";
import { formatMoney } from "@/domain/money";
import { localizePath } from "@/i18n/routes";

export function SearchOverlay() {
  const { locale, dict } = useI18n();
  const { panel, close } = useUI();
  const [q, setQ] = useState("");
  const inputId = useId();
  const term = q.trim();
  const { results, settled } = useServerSearch(term, locale);
  const suggestions = [dict.families.amber.name, dict.families.woody.name, dict.families.floral.name, "Íris", "Oud"];
  const L = (p: string) => localizePath(locale, p);

  return (
    <Drawer open={panel === "search"} onClose={close} side="top" label={dict.search.title}>
      <div className="container-lux pt-5 pb-10 md:pt-8 md:pb-14">
        <div className="flex items-center justify-between">
          <span className="eyebrow">{dict.search.title}</span>
          <button type="button" onClick={close} aria-label={dict.search.close} className="-mr-3 grid h-11 w-11 place-items-center">
            <CloseIcon size={22} />
          </button>
        </div>

        <form
          role="search"
          action={L("/collection")}
          onSubmit={() => close()}
          className="mt-4 flex items-center gap-4 border-b border-ink pb-3"
        >
          <SearchIcon size={22} className="shrink-0 text-muted" />
          <label htmlFor={inputId} className="sr-only">
            {dict.search.title}
          </label>
          <input
            id={inputId}
            name="q"
            type="search"
            autoFocus
            autoComplete="off"
            enterKeyHint="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={dict.search.placeholder}
            className="display w-full bg-transparent text-2xl placeholder:text-muted/70 focus:outline-none md:text-4xl"
            data-testid="search-input"
          />
        </form>

        <div className="mt-8" aria-live="polite">
          {q.trim().length < 2 ? (
            <div>
              <p className="eyebrow mb-4">{dict.search.suggestions}</p>
              <ul className="flex flex-wrap gap-2">
                {suggestions.map((s) => (
                  <li key={s}>
                    <button
                      type="button"
                      onClick={() => setQ(s)}
                      className="min-h-10 border border-line px-4 text-sm text-ink-soft transition-colors hover:border-ink hover:text-ink"
                    >
                      {s}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : !settled ? (
            <p className="text-muted" aria-busy="true">…</p>
          ) : results.length === 0 ? (
            <p className="text-muted">{dict.search.noResults}</p>
          ) : (
            <>
              <ul className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-6" data-testid="search-results">
                {results.map((p) => (
                  <li key={p.slug}>
                    <Link href={L(`/product/${p.slug}`)} onClick={close} className="group block">
                      <div className="relative aspect-[4/5] overflow-hidden bg-surface">
                        <Image
                          src={p.image}
                          alt=""
                          fill
                          sizes="(min-width: 768px) 16vw, 50vw"
                          className="object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      </div>
                      <p className="display mt-3 text-lg">{p.name}</p>
                      <p className="text-xs text-muted">
                        {dict.product.from} {formatMoney(p.fromPrice, locale)}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
              <Link
                href={`${L("/collection")}?q=${encodeURIComponent(q)}`}
                onClick={close}
                className="caps link-lux mt-8 inline-flex items-center gap-2"
              >
                {dict.search.seeAll} <ArrowIcon size={16} />
              </Link>
            </>
          )}
        </div>
      </div>
    </Drawer>
  );
}

interface SearchHit {
  slug: string;
  name: string;
  image: string;
  fromPrice: number;
}

/** Debounced, abortable GET /api/search. State is only set from async callbacks. */
function useServerSearch(term: string, locale: string) {
  const [state, setState] = useState<{ key: string; results: SearchHit[] }>({ key: "", results: [] });
  const key = `${locale}:${term}`;

  useEffect(() => {
    if (term.length < 2) return;
    const ctrl = new AbortController();
    const id = window.setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(term)}&locale=${locale}`, { signal: ctrl.signal });
        const data = (await res.json()) as { results: SearchHit[] };
        setState({ key, results: data.results ?? [] });
      } catch {
        if (!ctrl.signal.aborted) setState({ key, results: [] });
      }
    }, 180);
    return () => {
      ctrl.abort();
      window.clearTimeout(id);
    };
  }, [term, locale, key]);

  const settled = state.key === key;
  return { results: settled ? state.results : [], settled };
}
