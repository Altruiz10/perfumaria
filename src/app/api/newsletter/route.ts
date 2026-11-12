import { z } from "zod";
import { container } from "@/infra/container";
import { isCsrfValid, json, readJson } from "@/lib/http";

const schema = z.object({
  email: z.string().trim().toLowerCase().max(254).pipe(z.email()),
  consent: z.literal(true), // C3: explicit, never pre-checked
  website: z.string().max(0).optional(), // honeypot
});

export async function POST(req: Request): Promise<Response> {
  if (!isCsrfValid(req)) return json({ error: "forbidden" }, 403);
  const parsed = schema.safeParse(await readJson(req, 2048));
  if (!parsed.success) return json({ error: "validation" }, 422);
  await container.newsletter.subscribe(parsed.data.email, new Date().toISOString());
  return json({ ok: true }, 201);
}
