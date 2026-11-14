import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Confirmation } from "@/components/checkout/Confirmation";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

export async function generateMetadata({ params }: PageProps<"/[lang]/checkout/confirmation">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  return { title: getDictionary(lang).confirmation.eyebrow, robots: { index: false, follow: false } };
}

export default async function ConfirmationPage({ params, searchParams }: PageProps<"/[lang]/checkout/confirmation">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  // Set by the card provider's return URL. Only an id: the status itself always comes from our server.
  const { order } = await searchParams;
  const orderId = typeof order === "string" ? order : undefined;
  return (
    <div className="container-lux py-16 md:py-24">
      <Confirmation orderId={orderId} />
    </div>
  );
}
