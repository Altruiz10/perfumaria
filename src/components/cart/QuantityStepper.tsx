"use client";

import { useI18n } from "@/components/providers/AppProviders";
import { MinusIcon, PlusIcon } from "@/components/ui/icons";
import { MAX_QUANTITY } from "@/domain/cart";

export function QuantityStepper({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const { dict } = useI18n();
  const btn = "grid h-9 w-9 place-items-center transition-opacity hover:opacity-60 disabled:opacity-25";
  return (
    <div role="group" aria-label={dict.cart.quantity} className="flex items-center border border-line">
      <button type="button" className={btn} onClick={() => onChange(value - 1)} disabled={value <= 1} aria-label={dict.cart.decrease}>
        <MinusIcon size={14} />
      </button>
      <output aria-live="polite" className="w-7 text-center text-sm tabular-nums">
        {value}
      </output>
      <button
        type="button"
        className={btn}
        onClick={() => onChange(value + 1)}
        disabled={value >= MAX_QUANTITY}
        aria-label={dict.cart.increase}
      >
        <PlusIcon size={14} />
      </button>
    </div>
  );
}
