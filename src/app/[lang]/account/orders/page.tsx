import { notFound } from "next/navigation";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

export default async function OrdersPage({ params }: PageProps<"/[lang]/account/orders">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const a = getDictionary(lang).account;
  return (
    <section>
      <h2 className="display text-4xl">{a.orders}</h2>
      <p className="mt-2 text-sm text-muted">{a.ordersDesc}</p>
      <p className="mt-10 border border-dashed border-line p-10 text-center text-ink-soft">{a.ordersEmpty}</p>
    </section>
  );
}
