"use client";

import Link from "next/link";
import { useMemo, useState, useSyncExternalStore } from "react";
import { useI18n } from "@/components/providers/AppProviders";
import { formatMoney } from "@/domain/money";
import type { PaymentResult } from "@/domain/ports";
import { t } from "@/i18n/dictionaries";
import { localizePath } from "@/i18n/routes";
import { LAST_ORDER_KEY } from "./CheckoutForm";

const noopSubscribe = () => () => {};
function readLastOrder(): string | null {
  try {
    return sessionStorage.getItem(LAST_ORDER_KEY);
  } catch {
    return null;
  }
}

interface LastOrder {
  orderId: string;
  total: number;
  payment: PaymentResult;
}

export function Confirmation() {
  const { locale, dict } = useI18n();
  const c = dict.confirmation;
  const [copied, setCopied] = useState(false);
  // undefined = server/hydration pass; null = no order in this tab.
  const raw = useSyncExternalStore(noopSubscribe, readLastOrder, () => undefined);
  const order = useMemo<LastOrder | null | undefined>(() => {
    if (raw === undefined) return undefined;
    try {
      return raw ? (JSON.parse(raw) as LastOrder) : null;
    } catch {
      return null;
    }
  }, [raw]);

  if (order === undefined) return <div className="min-h-[50vh]" aria-busy="true" />;

  return (
    <div className="mx-auto max-w-2xl text-center" data-testid="confirmation">
      <p className="eyebrow">{c.eyebrow}</p>
      <h1 className="display mt-5 text-5xl md:text-6xl">{c.title}</h1>
      {order && (
        <>
          <p className="caps mt-6 text-muted">{t(c.order, { id: order.orderId })}</p>
          <p className="display mt-2 text-3xl tabular-nums">{formatMoney(order.total, locale)}</p>

          {order.payment.method === "pix" ? (
            <div className="mt-12 border border-line p-6 text-left md:p-10">
              <h2 className="display text-3xl">{c.pixTitle}</h2>
              <p className="mt-3 text-sm text-ink-soft">{c.pixBody}</p>
              <code className="mt-6 block max-h-32 overflow-auto bg-surface p-4 text-xs break-all">{order.payment.pixCode}</code>
              <button
                type="button"
                className="btn btn-outline mt-5"
                onClick={async () => {
                  if (order.payment.method !== "pix") return;
                  try {
                    await navigator.clipboard.writeText(order.payment.pixCode);
                    setCopied(true);
                  } catch {
                    /* clipboard unavailable */
                  }
                }}
              >
                {copied ? c.copied : c.copy}
              </button>
            </div>
          ) : (
            <p className="mt-10 text-ink-soft">{c.cardApproved}</p>
          )}
        </>
      )}
      <p className="mt-10 text-xs text-muted">{c.demo}</p>
      <Link href={localizePath(locale, "/")} className="btn btn-primary mt-8">
        {c.back}
      </Link>
    </div>
  );
}
