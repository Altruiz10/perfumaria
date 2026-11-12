import { z } from "zod";
import { lowestPrice, queryCatalog } from "@/domain/catalog";
import { LOCALES } from "@/domain/locale";
import { container } from "@/infra/container";

const schema = z.object({
  q: z.string().trim().min(2).max(80),
  locale: z.enum(LOCALES),
});

/**
 * Read-only search (R8) on the server, so the client never downloads the whole
 * catalogue. Swap queryCatalog for a search engine (Algolia/Meilisearch) as it grows.
 */
export async function GET(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const parsed = schema.safeParse({ q: url.searchParams.get("q") ?? "", locale: url.searchParams.get("locale") ?? "" });
  if (!parsed.success) return Response.json({ results: [] }, { status: 400 });

  const results = queryCatalog(await container.products.list(), { q: parsed.data.q }, parsed.data.locale)
    .slice(0, 6)
    .map((p) => ({ slug: p.slug, name: p.name, image: p.images[0], fromPrice: lowestPrice(p) }));

  return Response.json(
    { results },
    { headers: { "cache-control": "public, max-age=60, stale-while-revalidate=300" } },
  );
}
