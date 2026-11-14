"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { useCatalog, useI18n, useStore } from "@/components/providers/AppProviders";
import { LockIcon } from "@/components/ui/icons";
import { priceCart, type PaymentMethod } from "@/domain/cart";
import { UFS } from "@/domain/br";
import { formatMoney } from "@/domain/money";
import type { PaymentResult } from "@/domain/payment";
import { t } from "@/i18n/dictionaries";
import { localizePath } from "@/i18n/routes";
import { track } from "@/infra/analytics/analytics";
import { postJson } from "@/lib/api-client";

export const LAST_ORDER_KEY = "hm_last_order";

const maskCpf = (v: string) =>
  v
    .replace(/\D/g, "")
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
const maskCep = (v: string) =>
  v
    .replace(/\D/g, "")
    .slice(0, 8)
    .replace(/(\d{5})(\d)/, "$1-$2");
const maskPhone = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 10) return d.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{4})(\d)/, "$1-$2");
  return d.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d)/, "$1-$2");
};

type Errors = Record<string, string>;

export function CheckoutForm() {
  const { locale, dict } = useI18n();
  const { lookup } = useCatalog();
  const { lines, hydrated, dispatch } = useStore();
  const router = useRouter();
  const c = dict.checkout;
  const [method, setMethod] = useState<PaymentMethod>("pix");
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const summaryRef = useRef<HTMLDivElement>(null);
  const totals = priceCart(lines, lookup, method);
  const money = (n: number) => formatMoney(n, locale);
  const L = (p: string) => localizePath(locale, p);

  useEffect(() => {
    if (hydrated && totals.lines.length > 0) track({ name: "begin_checkout", value: totals.total });
  }, [hydrated]); // eslint-disable-line react-hooks/exhaustive-deps

  function messageFor(path: string): string {
    if (path === "customer.cpf") return c.errors.cpf;
    if (path === "address.cep") return c.errors.cep;
    if (path === "customer.email") return c.errors.email;
    if (path === "acceptTerms") return c.errors.terms;
    return c.errors.required;
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const s = (k: string) => String(fd.get(k) ?? "");
    const payload = {
      customer: { name: s("name"), email: s("email"), cpf: s("cpf"), phone: s("phone") },
      address: {
        cep: s("cep"),
        street: s("street"),
        number: s("number"),
        complement: s("complement"),
        district: s("district"),
        city: s("city"),
        state: s("state"),
      },
      paymentMethod: method,
      locale,
      items: lines.map(({ slug, sizeMl, quantity }) => ({ slug, sizeMl, quantity })),
      acceptTerms: fd.get("acceptTerms") === "on",
      marketingOptIn: fd.get("marketingOptIn") === "on",
    };

    // zod is loaded on demand (large chunk) — same schema the server enforces (R9, S4).
    const { checkoutSchema, issuePaths } = await import("@/domain/checkout");
    const local = checkoutSchema.safeParse(payload);
    if (!local.success) {
      const next: Errors = {};
      for (const p of issuePaths(local.error)) next[p] = messageFor(p);
      setErrors(next);
      setFormError(c.errors.summary);
      const first = Object.keys(next)[0];
      document.querySelector<HTMLElement>(`[data-field="${first}"]`)?.focus();
      return;
    }

    setErrors({});
    setFormError(null);
    setSending(true);
    const { status, data } = await postJson<{
      orderId: string;
      total: number;
      payment: unknown;
      fields?: string[];
    }>("/api/checkout", payload);
    setSending(false);

    if (status === 201 && data) {
      try {
        sessionStorage.setItem(LAST_ORDER_KEY, JSON.stringify(data));
      } catch {
        /* ignore */
      }
      const payment = data.payment as PaymentResult;
      if (payment.method === "card" && payment.status === "pending") {
        // Hosted card page. The bag is kept until the order is actually paid, so abandoning
        // there loses nothing; the provider sends the customer back to the confirmation page.
        if (payment.redirectUrl.startsWith("https://")) {
          setSending(true); // stay disabled while the browser leaves
          window.location.assign(payment.redirectUrl);
        } else setFormError(c.errors.generic);
        return;
      }
      dispatch({ type: "clear" });
      router.push(L("/checkout/confirmation"));
      return;
    }
    if (status === 422 && data?.fields) {
      const next: Errors = {};
      for (const p of data.fields) next[p] = messageFor(p);
      setErrors(next);
      setFormError(c.errors.summary);
      return;
    }
    setFormError(status === 409 ? c.errors.unavailable : c.errors.generic);
  }

  if (!hydrated) return <div className="min-h-[60vh]" aria-busy="true" />;

  if (totals.lines.length === 0) {
    return (
      <div className="mx-auto max-w-md py-24 text-center">
        <p className="display text-3xl">{c.empty}</p>
        <Link href={L("/collection")} className="btn btn-outline mt-8">
          {dict.cart.emptyCta}
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-12 lg:grid-cols-12 lg:gap-20" data-testid="checkout-form">
      <div className="space-y-14 lg:col-span-7">
        {formError && (
          <p role="alert" className="border-l-2 border-[#b3261e] bg-surface px-4 py-3 text-sm" data-testid="form-error">
            {formError}
          </p>
        )}

        <Section title={c.contact} n={1}>
          <Field name="name" label={c.name} autoComplete="name" errors={errors} path="customer.name" className="sm:col-span-2" />
          <Field name="email" type="email" label={c.email} autoComplete="email" errors={errors} path="customer.email" />
          <Field name="cpf" label={c.cpf} inputMode="numeric" mask={maskCpf} errors={errors} path="customer.cpf" placeholder="000.000.000-00" />
          <Field name="phone" type="tel" label={c.phone} autoComplete="tel-national" mask={maskPhone} errors={errors} path="customer.phone" />
        </Section>

        <Section title={c.address} n={2}>
          <Field name="cep" label={c.cep} inputMode="numeric" autoComplete="postal-code" mask={maskCep} errors={errors} path="address.cep" placeholder="00000-000" />
          <Field name="street" label={c.street} autoComplete="address-line1" errors={errors} path="address.street" className="sm:col-span-2" />
          <Field name="number" label={c.number} errors={errors} path="address.number" />
          <Field name="complement" label={c.complement} autoComplete="address-line2" errors={errors} path="address.complement" />
          <Field name="district" label={c.district} errors={errors} path="address.district" />
          <Field name="city" label={c.city} autoComplete="address-level2" errors={errors} path="address.city" />
          <SelectState label={c.state} error={errors["address.state"]} />
        </Section>

        <Section title={c.payment} n={3}>
          <fieldset className="sm:col-span-2">
            <legend className="sr-only">{c.payment}</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              {(
                [
                  { v: "pix", label: c.pix, desc: c.pixDesc },
                  { v: "card", label: c.card, desc: c.cardDesc },
                ] as const
              ).map((o) => (
                <label
                  key={o.v}
                  className={`flex cursor-pointer items-start gap-4 border p-5 transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-1 has-[:focus-visible]:outline-offset-2 ${
                    method === o.v ? "border-ink" : "border-line hover:border-ink-soft"
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value={o.v}
                    checked={method === o.v}
                    onChange={() => setMethod(o.v)}
                    className="mt-1 accent-[var(--ink)]"
                  />
                  <span>
                    <span className="caps block text-ink">{o.label}</span>
                    <span className="mt-1 block text-sm text-muted">{o.desc}</span>
                  </span>
                </label>
              ))}
            </div>
            {method === "card" && <p className="mt-4 text-xs text-muted">{c.cardNotice}</p>}
          </fieldset>
        </Section>

        <div className="space-y-4">
          <label className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed">
            <input
              type="checkbox"
              name="acceptTerms"
              data-field="acceptTerms"
              aria-invalid={Boolean(errors.acceptTerms)}
              aria-describedby={errors.acceptTerms ? "err-acceptTerms" : undefined}
              className="mt-1 h-4 w-4 shrink-0 accent-[var(--ink)]"
              data-testid="accept-terms"
            />
            <span>
              {c.acceptTermsPre}{" "}
              <Link href={L("/terms")} target="_blank" className="underline underline-offset-4">
                {c.termsLink}
              </Link>{" "}
              {c.acceptTermsMid}{" "}
              <Link href={L("/privacy")} target="_blank" className="underline underline-offset-4">
                {c.privacyLink}
              </Link>
              .
            </span>
          </label>
          {errors.acceptTerms && (
            <p id="err-acceptTerms" className="field-error">
              {errors.acceptTerms}
            </p>
          )}
          {/* C3: optional, never pre-checked, separate from the terms */}
          <label className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-ink-soft">
            <input type="checkbox" name="marketingOptIn" className="mt-1 h-4 w-4 shrink-0 accent-[var(--ink)]" />
            <span>{c.marketing}</span>
          </label>
        </div>
      </div>

      <aside className="lg:col-span-5">
        <div ref={summaryRef} className="bg-surface p-6 md:p-8 lg:sticky lg:top-32">
          <h2 className="display text-2xl">{c.summary}</h2>
          <ul className="mt-6 divide-y divide-line">
            {totals.lines.map((l) => (
              <li key={`${l.slug}-${l.sizeMl}`} className="flex items-center gap-4 py-4">
                <div className="relative aspect-[4/5] w-14 shrink-0 overflow-hidden bg-surface-2">
                  <Image src={l.image} alt="" fill sizes="56px" className="object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="display text-lg leading-tight">{l.name}</p>
                  <p className="text-xs text-muted">
                    {t(dict.cart.size, { size: l.sizeMl })} · × {l.quantity}
                  </p>
                </div>
                <p className="text-sm tabular-nums">{money(l.lineTotal)}</p>
              </li>
            ))}
          </ul>
          <dl className="mt-4 space-y-2 border-t border-line pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-ink-soft">{dict.cart.subtotal}</dt>
              <dd className="tabular-nums">{money(totals.subtotal)}</dd>
            </div>
            {totals.discount > 0 && (
              <div className="flex justify-between text-gold-ink">
                <dt>{dict.cart.pixDiscount}</dt>
                <dd className="tabular-nums">− {money(totals.discount)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-ink-soft">{dict.cart.shipping}</dt>
              <dd className="tabular-nums">{totals.shipping === 0 ? dict.cart.free : money(totals.shipping)}</dd>
            </div>
            <div className="flex justify-between border-t border-line pt-3 text-lg">
              <dt>{dict.cart.total}</dt>
              <dd className="display text-2xl tabular-nums" data-testid="checkout-total">
                {money(totals.total)}
              </dd>
            </div>
          </dl>
          <button type="submit" className="btn btn-primary mt-6 w-full" disabled={sending} data-testid="place-order">
            {sending ? c.processing : c.placeOrder}
          </button>
          <p className="mt-4 flex items-center justify-center gap-2 text-xs text-muted">
            <LockIcon size={14} /> {c.secure}
          </p>
        </div>
      </aside>
    </form>
  );
}

function Section({ title, n, children }: { title: string; n: number; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="flex items-baseline gap-4 border-b border-line pb-4">
        <span className="display text-xl text-gold-ink">0{n}</span>
        <span className="display text-3xl">{title}</span>
      </h2>
      <div className="mt-6 grid gap-x-6 gap-y-6 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function Field({
  name,
  label,
  path,
  errors,
  mask,
  className = "",
  ...rest
}: {
  name: string;
  label: string;
  path: string;
  errors: Errors;
  mask?: (v: string) => string;
  className?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  const error = errors[path];
  return (
    <div className={className}>
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      <input
        id={id}
        name={name}
        data-field={path}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-err` : undefined}
        className="field"
        onChange={mask ? (e) => (e.currentTarget.value = mask(e.currentTarget.value)) : undefined}
        {...rest}
      />
      {error && (
        <p id={`${id}-err`} className="field-error">
          {error}
        </p>
      )}
    </div>
  );
}

function SelectState({ label, error }: { label: string; error?: string }) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      <select
        id={id}
        name="state"
        data-field="address.state"
        defaultValue=""
        autoComplete="address-level1"
        aria-invalid={Boolean(error)}
        className="field cursor-pointer"
      >
        <option value="" disabled>
          —
        </option>
        {UFS.map((uf) => (
          <option key={uf} value={uf} className="bg-bg">
            {uf}
          </option>
        ))}
      </select>
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}
