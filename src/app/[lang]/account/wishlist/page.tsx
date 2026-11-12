import { notFound } from "next/navigation";
import { WishlistGrid } from "@/components/account/WishlistGrid";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

export default async function WishlistPage({ params }: PageProps<"/[lang]/account/wishlist">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const a = getDictionary(lang).account;
  return (
    <section>
      <h2 className="display text-4xl">{a.wishlist}</h2>
      <p className="mt-2 text-sm text-muted">{a.wishlistDesc}</p>
      <WishlistGrid />
    </section>
  );
}
