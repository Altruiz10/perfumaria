"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useI18n, useStore } from "@/components/providers/AppProviders";
import type { OrderStatus } from "@/domain/order";
import { formatMoney } from "@/domain/money";
import type { PaymentResult } from "@/domain/payment";
import { t } from "@/i18n/dictionaries";
import { localizePath } from "@/i18n/routes";
import { track } from "@/infra/analytics/analytics";
import { LAST_ORDER_KEY } from "./CheckoutForm";
import { useOrderStatus } from "./useOrderStatus";

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

/** What to show before the server has answered: the checkout response, read from this tab. */
function provisionalStatus(order: LastOrder | null): OrderStatus {
  return order?.payment.method === "card" && order.payment.status === "approved" ? "paid" : "pending_payment";
}

export function Confirmation({ orderId: orderIdFromUrl }: { orderId?: string }) {
  const { locale, dict } = useI18n();
  const { dispatch } = useStore();
  const c = dict.confirmation;
  const [copied, setCopied] = useState(false);
  // undefined = server/hydration pass; null = no order in this tab.
  const raw = useSyncExternalStore(noopSubscribe, readLastOrder, () => undefined);
  const stored = useMemo<LastOrder | null | undefined>(() => {
    if (raw === undefined) return undefined;
    try {
      return raw ? (JSON.parse(raw) as LastOrder) : null;
    } catch {
      return null;
    }
  }, [raw]);

  // The return URL from the card provider carries ?order=; the tab's own record is only a cache.
  const order = stored && (!orderIdFromUrl || stored.orderId === orderIdFromUrl) ? stored : null;
  const orderId = orderIdFromUrl ?? order?.orderId;
  const view = useOrderStatus(stored === undefined ? undefined : orderId);
  const status: OrderStatus = view?.status ?? provisionalStatus(order);
  const pix = view?.pix ?? (order?.payment.method === "pix" && status === "pending_payment" ? order.payment : null);

  // Paid: the bag is spent, and analytics hears about the purchase exactly once (not at checkout, when it was only intent).
  useEffect(() => {
    if (status !== "paid" || !orderId) return;
    dispatch({ type: "clear" });
    const key = `hm_purchase_tracked_${orderId}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      /* private mode: may track twice, harmless */
    }
    if (order) track({ name: "purchase", orderId, value: order.total });
  }, [status, orderId, order, dispatch]);

  if (stored === undefined) return <div className="min-h-[50vh]" aria-busy="true" />;

  const paid = status === "paid" || status === "refunded";
  const pixCode = pix ? ("code" in pix ? pix.code : pix.pixCode) : null;

  return (
    <div className="mx-auto max-w-2xl text-center" data-testid="confirmation">
      <p className="eyebrow">{paid ? c.eyebrow : c.received}</p>
      <h1 className="display mt-5 text-5xl md:text-6xl">{c.title}</h1>
      {orderId && (
        <>
          <p className="caps mt-6 text-muted">{t(c.order, { id: orderId })}</p>
          {order && <p className="display mt-2 text-3xl tabular-nums">{formatMoney(order.total, locale)}</p>}

          {pixCode ? (
            <div className="mt-12 border border-line p-6 text-left md:p-10" data-testid="pix-box">
              <h2 className="display text-3xl">{c.pixTitle}</h2>
              <p className="mt-3 text-sm text-ink-soft">{c.pixBody}</p>
              <code className="mt-6 block max-h-32 overflow-auto bg-surface p-4 text-xs break-all">{pixCode}</code>
              <button
                type="button"
                className="btn btn-outline mt-5"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(pixCode);
                    setCopied(true);
                  } catch {
                    /* clipboard unavailable */
                  }
                }}
              >
                {copied ? c.copied : c.copy}
              </button>
              <p className="mt-5 text-xs text-muted" role="status">
                {c.waiting}
              </p>
            </div>
          ) : (
            <p className="mt-10 text-ink-soft" role="status" data-testid="order-status" data-status={status}>
              {paid && c.cardApproved}
              {status === "pending_payment" && c.waiting}
              {status === "payment_failed" && c.failed}
              {(status === "expired" || status === "cancelled") && c.expired}
            </p>
          )}
        </>
      )}
      {view?.provider === "fake" && <p className="mt-10 text-xs text-muted">{c.demo}</p>}
      <div className="mt-8 flex flex-wrap justify-center gap-4">
        {status === "payment_failed" && (
          <Link href={localizePath(locale, "/checkout")} className="btn btn-outline">
            {c.retry}
          </Link>
        )}
        <Link href={localizePath(locale, "/")} className="btn btn-primary">
          {c.back}
        </Link>
      </div>
    </div>
  );
}
