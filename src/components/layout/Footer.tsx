"use client";

import Link from "next/link";
import { useI18n, useUI } from "@/components/providers/AppProviders";
import { localizePath } from "@/i18n/routes";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { Logo } from "./Logo";
import { NewsletterForm } from "./NewsletterForm";

export function Footer() {
  const { locale, dict } = useI18n();
  const { open } = useUI();
  const L = (p: string) => localizePath(locale, p);
  const f = dict.footer;

  const columns = [
    {
      title: f.shop,
      links: [
        { href: L("/collection"), label: dict.nav.collection },
        { href: L("/collection?gender=masculine"), label: dict.nav.masculine },
        { href: L("/collection?gender=feminine"), label: dict.nav.feminine },
        { href: L("/collection?gender=shared"), label: dict.nav.shared },
      ],
    },
    {
      title: f.help,
      links: [
        { href: L("/account"), label: dict.nav.account },
        { href: L("/account/orders"), label: dict.account.orders },
        { href: L("/terms"), label: f.shippingInfo },
        { href: L("/terms"), label: f.returns },
      ],
    },
    {
      title: f.legal,
      links: [
        { href: L("/privacy"), label: f.privacy },
        { href: L("/terms"), label: f.terms },
        { href: L("/cookies"), label: f.cookies },
      ],
    },
  ];

  return (
    <footer className="mt-24 bg-[#12100e] text-on-dark md:mt-32">
      <div className="container-lux grid gap-14 py-16 md:grid-cols-12 md:py-24">
        <div className="md:col-span-5">
          <p className="eyebrow !text-[#d4b47f]">{f.newsletterTitle}</p>
          <p className="display mt-4 text-3xl md:text-4xl">{f.newsletterBody}</p>
          <div className="mt-8 max-w-md">
            <NewsletterForm />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-3 md:col-span-6 md:col-start-7">
          {columns.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <p className="caps text-white/60">{col.title}</p>
              <ul className="mt-5 space-y-3 text-sm">
                {col.links.map((l, i) => (
                  <li key={`${l.href}-${i}`}>
                    <Link href={l.href} className="link-lux text-white/85 hover:text-white">
                      {l.label}
                    </Link>
                  </li>
                ))}
                {col.title === f.legal && (
                  <li>
                    <button type="button" onClick={() => open("cookies")} className="link-lux text-left text-white/85 hover:text-white">
                      {f.manageCookies}
                    </button>
                  </li>
                )}
              </ul>
            </nav>
          ))}
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-lux flex flex-col items-center gap-6 py-10 text-center md:flex-row md:justify-between md:text-left">
          <Logo inverted sub={dict.brand.sub} />
          <p className="max-w-sm text-xs leading-relaxed text-white/60">{f.tagline}</p>
          <div className="[&_button]:border-white/25 [&_button]:text-white/75 [&_button[aria-current]]:border-white [&_button[aria-current]]:text-white">
            <LanguageSwitcher variant="inline" />
          </div>
        </div>
        <div className="container-lux flex flex-col items-center justify-between gap-2 pb-10 text-[0.7rem] tracking-wide text-white/60 md:flex-row">
          <p>
            © {new Date().getFullYear()} {dict.brand.name}. {f.rights}
          </p>
          <p>{f.payments}</p>
        </div>
      </div>
    </footer>
  );
}
