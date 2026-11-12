"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useI18n, useStore, useUI } from "@/components/providers/AppProviders";
import { BagIcon, MenuIcon, SearchIcon, UserIcon } from "@/components/ui/icons";
import { t } from "@/i18n/dictionaries";
import { localizePath } from "@/i18n/routes";
import { ThemeToggle } from "./ThemeToggle";
import { Logo } from "./Logo";

export function Header() {
  const { locale, dict } = useI18n();
  const { count, hydrated } = useStore();
  const { open } = useUI();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const L = (p: string) => localizePath(locale, p);
  const nav = [
    { href: L("/collection"), label: dict.nav.collection },
    { href: L("/collection?gender=masculine"), label: dict.nav.masculine },
    { href: L("/collection?gender=feminine"), label: dict.nav.feminine },
    { href: L("/collection?gender=shared"), label: dict.nav.shared },
    { href: `${L("/")}#familias`, label: dict.nav.families },
    { href: `${L("/")}#maison`, label: dict.nav.maison },
  ];

  const iconBtn = "grid h-11 w-11 place-items-center transition-opacity hover:opacity-60";

  return (
    <header
      className={`sticky top-0 z-40 border-b transition-[background-color,border-color,box-shadow] duration-500 ${
        scrolled
          ? "border-line bg-bg/92 shadow-[0_1px_0_0_var(--line)] backdrop-blur-xl"
          : "border-transparent bg-bg"
      }`}
    >
      <div className="container-lux">
        <div className="grid h-16 grid-cols-[1fr_auto_1fr] items-center md:h-20">
          <div className="-ml-3 flex items-center">
            <button type="button" className={iconBtn} aria-label={dict.header.openMenu} onClick={() => open("menu")}>
              <MenuIcon size={22} />
            </button>
            <button
              type="button"
              className={iconBtn}
              aria-label={dict.header.search}
              onClick={() => open("search")}
              data-testid="open-search"
            >
              <SearchIcon />
            </button>
          </div>

          <Link href={L("/")} className="justify-self-center">
            <Logo sub={dict.brand.sub} />
          </Link>

          <div className="-mr-3 flex items-center justify-end">
            <ThemeToggle className="hidden sm:grid" />
            <Link href={L("/account")} className={`${iconBtn} hidden sm:grid`} aria-label={dict.header.account}>
              <UserIcon />
            </Link>
            <button
              type="button"
              className={`${iconBtn} relative`}
              aria-label={t(dict.header.bagWithCount, { count: hydrated ? count : 0 })}
              onClick={() => open("cart")}
              data-testid="open-cart"
            >
              <BagIcon />
              {hydrated && count > 0 && (
                <span
                  className="absolute top-1.5 right-1 grid h-4 min-w-4 place-items-center rounded-full bg-ink px-1 text-[0.6rem] leading-none text-bg"
                  data-testid="cart-count"
                >
                  {count}
                </span>
              )}
            </button>
          </div>
        </div>

        <nav aria-label={dict.header.menu} className="hidden justify-center pb-4 lg:flex">
          <ul className="flex gap-10">
            {nav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="caps link-lux text-ink-soft hover:text-ink">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
