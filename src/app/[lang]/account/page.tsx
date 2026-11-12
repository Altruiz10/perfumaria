import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowIcon } from "@/components/ui/icons";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { localizePath } from "@/i18n/routes";

export default async function AccountPage({ params }: PageProps<"/[lang]/account">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const a = getDictionary(lang).account;
  const cards = [
    { href: "/account/wishlist", title: a.wishlist, desc: a.wishlistDesc },
    { href: "/account/orders", title: a.orders, desc: a.ordersDesc },
    { href: "/account/addresses", title: a.addresses, desc: a.addressesDesc },
    { href: "/account/login", title: a.login, desc: a.loginDesc },
  ];
  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {cards.map((c) => (
        <li key={c.href}>
          <Link href={localizePath(lang, c.href)} className="group flex h-full flex-col border border-line p-7 transition-colors hover:border-ink">
            <span className="display text-3xl">{c.title}</span>
            <span className="mt-3 text-sm text-muted">{c.desc}</span>
            <ArrowIcon size={18} className="mt-8 transition-transform duration-500 group-hover:translate-x-2" />
          </Link>
        </li>
      ))}
    </ul>
  );
}
