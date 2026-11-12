import { describe, expect, it } from "vitest";
import { GET } from "./route";

const get = (qs: string) => GET(new Request(`http://loja.test/api/search?${qs}`));

describe("GET /api/search (R8)", () => {
  it("encontra por nota sem acento e devolve só o resumo", async () => {
    const res = await get("q=ambar&locale=pt");
    expect(res.status).toBe(200);
    const { results } = await res.json();
    expect(results.map((r: { slug: string }) => r.slug)).toContain("ambar-imperial");
    expect(Object.keys(results[0]).sort()).toEqual(["fromPrice", "image", "name", "slug"]);
  });

  it("400 para consulta curta, longa ou idioma inválido", async () => {
    expect((await get("q=a&locale=pt")).status).toBe(400);
    expect((await get(`q=${"x".repeat(81)}&locale=pt`)).status).toBe(400);
    expect((await get("q=ambar&locale=fr")).status).toBe(400);
  });
});
