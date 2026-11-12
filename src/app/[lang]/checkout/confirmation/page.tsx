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

export default async function ConfirmationPage({ params }: PageProps<"/[lang]/checkout/confirmation">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  return (
    <div className="container-lux py-16 md:py-24">
      <Confirmation />
    </div>
  );
}
