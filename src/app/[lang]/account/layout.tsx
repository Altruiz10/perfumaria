import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { localizePath } from "@/i18n/routes";

export async function generateMetadata({ params }: LayoutProps<"/[lang]/account">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  return { title: getDictionary(lang).account.title, robots: { index: false, follow: true } };
}

/** Account area: structure ready for auth (login, wishlist, orders, addresses). */
export default async function AccountLayout({ children, params }: LayoutProps<"/[lang]/account">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const a = getDictionary(lang).account;
  const L = (p: string) => localizePath(lang, p);
  const nav = [
    { href: L("/account"), label: a.title },
    { href: L("/account/wishlist"), label: a.wishlist },
    { href: L("/account/orders"), label: a.orders },
    { href: L("/account/addresses"), label: a.addresses },
    { href: L("/account/login"), label: a.login },
  ];
  return (
    <div className="container-lux pt-12 md:pt-20">
      <header>
        <p className="eyebrow">{a.subtitle}</p>
        <h1 className="display mt-4 text-5xl md:text-6xl">{a.title}</h1>
      </header>
      <div className="mt-10 grid gap-10 md:mt-14 md:grid-cols-12">
        <nav aria-label={a.title} className="md:col-span-3">
          <ul className="no-scrollbar -mx-5 flex gap-6 overflow-x-auto border-b border-line px-5 pb-4 md:mx-0 md:flex-col md:gap-4 md:border-0 md:px-0">
            {nav.map((n) => (
              <li key={n.href} className="shrink-0">
                <Link href={n.href} className="caps link-lux text-ink-soft hover:text-ink">
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="md:col-span-9">{children}</div>
      </div>
    </div>
  );
}
