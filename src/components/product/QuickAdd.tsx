"use client";

import { useState } from "react";
import { useCatalog, useI18n, useStore, useUI } from "@/components/providers/AppProviders";
import { t } from "@/i18n/dictionaries";
import { track } from "@/infra/analytics/analytics";

export function QuickAdd({ slug, sizeMl, name }: { slug: string; sizeMl: number; name: string }) {
  const { dict } = useI18n();
  const { dispatch } = useStore();
  const { lookup } = useCatalog();
  const { open } = useUI();
  const [added, setAdded] = useState(false);

  return (
    <button
      type="button"
      className="btn relative z-10 w-full border border-ink/10 bg-bg/95 text-ink backdrop-blur hover:bg-ink hover:text-bg"
      aria-label={t(dict.product.quickAdd, { name })}
      onClick={() => {
        dispatch({ type: "add", slug, sizeMl });
        track({ name: "add_to_cart", slug, sizeMl, value: lookup(slug, sizeMl)?.variant.priceCents ?? 0 });
        setAdded(true);
        window.setTimeout(() => setAdded(false), 1600);
        open("cart");
      }}
    >
      {added ? dict.product.added : `${dict.product.addToBag} · ${sizeMl} ml`}
    </button>
  );
}
