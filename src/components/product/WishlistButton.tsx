"use client";

import { useI18n, useStore } from "@/components/providers/AppProviders";
import { HeartIcon } from "@/components/ui/icons";

export function WishlistButton({ slug, name, className = "" }: { slug: string; name: string; className?: string }) {
  const { dict } = useI18n();
  const { wishlist, toggleWishlist, hydrated } = useStore();
  const active = hydrated && wishlist.includes(slug);
  return (
    <button
      type="button"
      onClick={() => toggleWishlist(slug)}
      aria-pressed={active}
      aria-label={`${active ? dict.product.removeFromWishlist : dict.product.addToWishlist}: ${name}`}
      className={`z-10 grid h-11 w-11 place-items-center text-ink transition-transform duration-300 hover:scale-110 ${className}`}
    >
      <HeartIcon filled={active} className={active ? "text-gold" : ""} />
    </button>
  );
}
