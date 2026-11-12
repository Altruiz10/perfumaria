"use client";

import Link from "next/link";
import { useI18n, useUI } from "@/components/providers/AppProviders";
import { Drawer } from "@/components/ui/Drawer";
import { CloseIcon } from "@/components/ui/icons";
import { localizePath } from "@/i18n/routes";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { ThemeToggle } from "./ThemeToggle";

export function MobileMenu() {
  const { locale, dict } = useI18n();
  const { panel, close } = useUI();
  const L = (p: string) => localizePath(locale, p);

  const primary = [
    { href: L("/collection"), label: dict.nav.collection },
    { href: L("/collection?gender=masculine"), label: dict.nav.masculine },
    { href: L("/collection?gender=feminine"), label: dict.nav.feminine },
    { href: L("/collection?gender=shared"), label: dict.nav.shared },
    { href: `${L("/")}#familias`, label: dict.nav.families },
    { href: `${L("/")}#maison`, label: dict.nav.maison },
  ];
  const secondary = [
    { href: L("/account"), label: dict.nav.account },
    { href: L("/account/wishlist"), label: dict.nav.wishlist },
  ];

  return (
    <Drawer open={panel === "menu"} onClose={close} side="left" label={dict.header.menu}>
      <div className="flex h-full flex-col">
        <div className="flex h-16 items-center justify-between px-5 md:h-20">
          <span className="eyebrow">{dict.header.menu}</span>
          <button type="button" onClick={close} aria-label={dict.header.closeMenu} className="-mr-3 grid h-11 w-11 place-items-center">
            <CloseIcon size={22} />
          </button>
        </div>
        <nav aria-label={dict.header.menu} className="flex-1 overflow-y-auto px-5 pt-4">
          <ul className="space-y-1">
            {primary.map((item, i) => (
              <li key={item.href} className="animate-fade-up" style={{ animationDelay: `${80 + i * 50}ms` }}>
                <Link
                  href={item.href}
                  onClick={close}
                  className="display block py-2.5 text-[2rem] transition-colors hover:text-gold-ink"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="my-8 h-px bg-line" />
          <ul className="space-y-3">
            {secondary.map((item) => (
              <li key={item.href}>
                <Link href={item.href} onClick={close} className="caps link-lux text-ink-soft">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex items-center justify-between border-t border-line px-5 py-5">
          <LanguageSwitcher variant="inline" />
          <ThemeToggle />
        </div>
      </div>
    </Drawer>
  );
}
