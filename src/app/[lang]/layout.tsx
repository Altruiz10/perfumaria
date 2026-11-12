import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { CookieBanner } from "@/components/consent/CookieBanner";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { LazyPanels } from "@/components/layout/LazyPanels";
import { PromoBar } from "@/components/layout/PromoBar";
import { AppProviders } from "@/components/providers/AppProviders";
import { JsonLd } from "@/components/ui/JsonLd";
import { container } from "@/infra/container";
import { LOCALES, LOCALE_TAG, isLocale } from "@/i18n/config";
import { getDictionary, toClientDictionary } from "@/i18n/dictionaries";
import { toSummary } from "@/domain/catalog";
import { alternatesFor } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";
import { themeInitScript } from "@/lib/theme";
import "../globals.css";

// P2 / ADR-003: self-hosted, no third-party request.
// Latin subset only: it covers pt/en/es. Do NOT add latin-ext files here — next/font/local emits
// them without unicode-range and the last face wins, which breaks accents (â, ã).
const cormorant = localFont({
  src: [
    { path: "../../fonts/cormorant-garamond-latin-wght-normal.woff2", style: "normal", weight: "300 700" },
    { path: "../../fonts/cormorant-garamond-latin-wght-italic.woff2", style: "italic", weight: "300 700" },
  ],
  variable: "--font-cormorant",
  display: "swap",
  fallback: ["Georgia", "Times New Roman", "serif"],
});
const jost = localFont({
  src: [
    { path: "../../fonts/jost-latin-wght-normal.woff2", style: "normal", weight: "100 900" },
  ],
  variable: "--font-jost",
  display: "swap",
  fallback: ["system-ui", "Helvetica Neue", "Arial", "sans-serif"],
});

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const d = getDictionary(lang);
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: d.meta.title, template: `%s · ${d.brand.name}` },
    description: d.meta.description,
    applicationName: d.brand.name,
    alternates: alternatesFor(lang, "/"),
    openGraph: {
      type: "website",
      siteName: d.meta.siteName,
      locale: LOCALE_TAG[lang].replace("-", "_"),
      images: [{ url: "/images/og.png", width: 1200, height: 630, alt: d.brand.name }],
    },
    twitter: { card: "summary_large_image" },
    formatDetection: { telephone: false },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf8f5" },
    { media: "(prefers-color-scheme: dark)", color: "#0e0d0c" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function LocaleLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const dict = getDictionary(lang);
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  const products = (await container.products.list()).map(toSummary);

  return (
    <html lang={LOCALE_TAG[lang]} className={`${cormorant.variable} ${jost.variable}`} suppressHydrationWarning>
      <head>
        <script nonce={nonce} dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-dvh">
        <AppProviders locale={lang} dict={toClientDictionary(dict)} products={products}>
          <a
            href="#conteudo"
            className="sr-only z-[60] bg-ink px-4 py-3 text-bg focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
          >
            {dict.header.skipToContent}
          </a>
          <PromoBar />
          <Header />
          <main id="conteudo" tabIndex={-1} className="focus:outline-none">
            {children}
          </main>
          <Footer />
          <LazyPanels />
          <CookieBanner />
          <LanguageSwitcher />
        </AppProviders>
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "Organization",
            name: dict.brand.name,
            url: SITE_URL,
            logo: `${SITE_URL}/icon.svg`,
          }}
        />
      </body>
    </html>
  );
}
