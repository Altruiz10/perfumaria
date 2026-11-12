"use client";

import { useRouter } from "next/navigation";
import { useId, useTransition } from "react";
import { useI18n } from "@/components/providers/AppProviders";
import { ChevronIcon, CloseIcon } from "@/components/ui/icons";
import { SORTS, type CatalogQuery } from "@/domain/catalog";
import { FAMILIES, GENDERS } from "@/domain/product";

export function CollectionControls({ query, basePath }: { query: CatalogQuery; basePath: string }) {
  const { dict } = useI18n();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const sortId = useId();

  function update(patch: Partial<CatalogQuery>) {
    const next = { ...query, ...patch };
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(next)) if (v) sp.set(k, String(v));
    const qs = sp.toString();
    startTransition(() => router.replace(qs ? `${basePath}?${qs}` : basePath, { scroll: false }));
  }

  const chip = (active: boolean) =>
    `shrink-0 min-h-10 px-4 text-[0.72rem] tracking-[0.16em] uppercase border transition-colors duration-300 ${
      active ? "border-ink bg-ink text-bg" : "border-line text-ink-soft hover:border-ink hover:text-ink"
    }`;

  const hasFilters = Boolean(query.family || query.gender || query.q);

  return (
    <div
      className={`sticky top-16 z-30 -mx-5 mt-12 border-y border-line bg-bg/95 px-5 py-4 backdrop-blur-md transition-opacity md:static md:mx-0 md:mt-16 md:border-x-0 md:bg-transparent md:px-0 md:backdrop-blur-none ${
        pending ? "opacity-60" : ""
      }`}
      data-testid="collection-controls"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div role="group" aria-label={dict.collection.family} className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 md:mx-0 md:flex-wrap md:px-0">
          <button type="button" className={chip(!query.family)} aria-pressed={!query.family} onClick={() => update({ family: undefined })}>
            {dict.collection.all}
          </button>
          {FAMILIES.map((f) => (
            <button
              key={f}
              type="button"
              className={chip(query.family === f)}
              aria-pressed={query.family === f}
              onClick={() => update({ family: query.family === f ? undefined : f })}
            >
              {dict.families[f].name}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 lg:justify-end">
          <div role="group" aria-label={dict.collection.gender} className="flex flex-wrap gap-x-4">
            {GENDERS.map((g) => (
              <button
                key={g}
                type="button"
                aria-pressed={query.gender === g}
                onClick={() => update({ gender: query.gender === g ? undefined : g })}
                className={`caps link-lux min-h-10 ${query.gender === g ? "text-ink [background-size:100%_1px]" : "text-muted hover:text-ink"}`}
              >
                {dict.genders[g]}
              </button>
            ))}
          </div>
          <div className="relative flex items-center">
            <label htmlFor={sortId} className="sr-only">
              {dict.collection.sort}
            </label>
            <select
              id={sortId}
              value={query.sort ?? "featured"}
              onChange={(e) => update({ sort: e.target.value === "featured" ? undefined : (e.target.value as CatalogQuery["sort"]) })}
              className="caps min-h-10 cursor-pointer appearance-none bg-transparent pr-6 text-ink focus:outline-none"
              data-testid="sort-select"
            >
              {SORTS.map((s) => (
                <option key={s} value={s} className="bg-bg text-ink normal-case">
                  {dict.collection.sorts[s]}
                </option>
              ))}
            </select>
            <ChevronIcon size={14} className="pointer-events-none absolute right-0" />
          </div>
        </div>
      </div>
      {hasFilters && (
        <button
          type="button"
          onClick={() => update({ family: undefined, gender: undefined, q: undefined })}
          className="mt-3 inline-flex items-center gap-1.5 text-xs text-muted hover:text-ink"
        >
          <CloseIcon size={12} /> {dict.collection.clear}
        </button>
      )}
    </div>
  );
}
