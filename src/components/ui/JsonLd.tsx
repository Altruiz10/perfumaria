import { headers } from "next/headers";
import { serializeJsonLd } from "@/lib/security";

/** S5: the only sanctioned dangerouslySetInnerHTML — escaped by serializeJsonLd. */
export async function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  return (
    <script
      type="application/ld+json"
      nonce={nonce}
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  );
}
