"use client";

import { useEffect, useState } from "react";
import type { OrderPublicView } from "@/domain/order";

const POLL_MS = 4_000;
const GIVE_UP_MS = 45 * 60_000; // a Pix lives 30 minutes

/**
 * The server is the only source of truth for whether an order is paid: the
 * browser asks until the order leaves "pending_payment", then stops. Failures are
 * silent — the page keeps showing what it already knows.
 */
export function useOrderStatus(orderId: string | undefined): OrderPublicView | null {
  const [view, setView] = useState<OrderPublicView | null>(null);

  useEffect(() => {
    if (!orderId) return;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const startedAt = Date.now();

    const poll = async () => {
      try {
        const res = await fetch(`/api/orders/${encodeURIComponent(orderId)}/status`, { cache: "no-store" });
        if (res.status === 404) return;
        if (res.ok) {
          const next = (await res.json()) as OrderPublicView;
          if (!stopped) setView(next);
          if (next.status !== "pending_payment") return;
        }
      } catch {
        /* offline or server restarting: try again */
      }
      if (!stopped && Date.now() - startedAt < GIVE_UP_MS) timer = setTimeout(poll, POLL_MS);
    };
    void poll();

    return () => {
      stopped = true;
      if (timer) clearTimeout(timer);
    };
  }, [orderId]);

  return view;
}
