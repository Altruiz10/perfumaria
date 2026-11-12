import { LOCALE_TAG, type Locale } from "./locale";

/** Integer amount in BRL cents (R1). */
export type Cents = number;

export function assertCents(value: number): Cents {
  if (!Number.isInteger(value)) throw new TypeError(`Money must be integer cents, got ${value}`);
  return value;
}

export function sumCents(values: readonly Cents[]): Cents {
  return values.reduce((acc, v) => acc + assertCents(v), 0);
}

/** Percentage discount, rounded down to the cent (R4). */
export function percentOff(amount: Cents, percent: number): Cents {
  return Math.floor((assertCents(amount) * percent) / 100);
}

const formatters = new Map<Locale, Intl.NumberFormat>();

export function formatMoney(cents: Cents, locale: Locale): string {
  let f = formatters.get(locale);
  if (!f) {
    f = new Intl.NumberFormat(LOCALE_TAG[locale], { style: "currency", currency: "BRL" });
    formatters.set(locale, f);
  }
  return f.format(assertCents(cents) / 100);
}
