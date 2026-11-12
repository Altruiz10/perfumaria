"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/components/providers/AppProviders";

export function PromoBar() {
  const { dict } = useI18n();
  const messages = dict.promo;
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => setI((n) => (n + 1) % messages.length), 4500);
    return () => window.clearInterval(id);
  }, [paused, messages.length]);

  return (
    <div
      className="relative z-50 bg-[#141210] text-[#efe7da]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="container-lux relative flex h-9 items-center justify-center overflow-hidden">
        {messages.map((m, idx) => (
          <p
            key={m}
            aria-hidden={idx !== i}
            className={`absolute inset-x-4 text-center text-[0.66rem] tracking-[0.22em] uppercase transition-all duration-700 ease-[var(--ease-lux)] ${
              idx === i ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
            }`}
          >
            {m}
          </p>
        ))}
        <p className="sr-only" aria-live="off">
          {messages.join(" · ")}
        </p>
      </div>
    </div>
  );
}
