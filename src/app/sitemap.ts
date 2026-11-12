import type { MetadataRoute } from "next";
import { FAMILIES } from "@/domain/product";
import { container } from "@/infra/container";
import { LOCALES, LOCALE_TAG } from "@/i18n/config";
import { localizePath } from "@/i18n/routes";
import { SITE_URL } from "@/lib/site";

function entry(internal: string, priority: number, lastModified?: string): MetadataRoute.Sitemap[number] {
  const languages = Object.fromEntries(LOCALES.map((l) => [LOCALE_TAG[l], `${SITE_URL}${localizePath(l, internal)}`]));
  return {
    url: `${SITE_URL}${localizePath("pt", internal)}`,
    lastModified: lastModified ?? new Date("2026-09-22"),
    changeFrequency: "weekly",
    priority,
    alternates: { languages },
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await container.products.list();
  return [
    entry("/", 1),
    entry("/collection", 0.9),
    ...FAMILIES.map((f) => entry(`/collection?family=${f}`, 0.7)),
    ...products.map((p) => entry(`/product/${p.slug}`, 0.8, p.createdAt)),
    entry("/privacy", 0.2),
    entry("/terms", 0.2),
    entry("/cookies", 0.2),
  ];
}
