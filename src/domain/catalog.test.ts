import { describe, expect, it } from "vitest";
import { lowestPrice, normalizeText, queryCatalog } from "./catalog";
import { fixtureCatalog } from "./test-fixtures";

const slugs = (xs: { slug: string }[]) => xs.map((x) => x.slug);

describe("normalizeText", () => {
  it("remove acento e caixa", () => {
    expect(normalizeText("  ÂMBAR Noturno ")).toBe("ambar noturno");
  });
});

describe("busca (R8)", () => {
  it("CT-008 'ambar' encontra 'Âmbar'", () => {
    expect(slugs(queryCatalog(fixtureCatalog, { q: "ambar" }, "pt"))).toContain("ambar-noturno");
  });

  it("CT-008 tolera um erro de digitação em termo com 5+ letras", () => {
    const r = slugs(queryCatalog(fixtureCatalog, { q: "vetiveer" }, "pt"));
    expect(r).toContain("cedro-branco");
    expect(r).toContain("ambar-noturno");
    expect(r).not.toContain("flor-de-sal");
  });

  it("não tolera erro em termo curto", () => {
    expect(queryCatalog(fixtureCatalog, { q: "sak" }, "pt")).toEqual([]);
  });

  it("múltiplos termos são E lógico", () => {
    expect(slugs(queryCatalog(fixtureCatalog, { q: "cedro pimenta" }, "pt"))).toEqual(["cedro-branco"]);
  });

  it("busca em notas olfativas", () => {
    expect(slugs(queryCatalog(fixtureCatalog, { q: "neroli" }, "pt"))).toEqual(["flor-de-sal"]);
  });

  it("consulta vazia devolve tudo", () => {
    expect(queryCatalog(fixtureCatalog, { q: "   " }, "pt")).toHaveLength(3);
  });
});

describe("filtros e ordenação", () => {
  it("filtra por família e gênero", () => {
    expect(slugs(queryCatalog(fixtureCatalog, { family: "woody" }, "pt"))).toEqual(["cedro-branco"]);
    expect(slugs(queryCatalog(fixtureCatalog, { gender: "feminine" }, "pt"))).toEqual(["flor-de-sal"]);
  });

  it("ordena por preço usando o menor tamanho", () => {
    expect(lowestPrice(fixtureCatalog[0])).toBe(18900);
    expect(slugs(queryCatalog(fixtureCatalog, { sort: "price-asc" }, "pt"))).toEqual([
      "flor-de-sal",
      "ambar-noturno",
      "cedro-branco",
    ]);
    expect(slugs(queryCatalog(fixtureCatalog, { sort: "price-desc" }, "pt"))[0]).toBe("cedro-branco");
  });

  it("ordena por novidade e destaque", () => {
    expect(slugs(queryCatalog(fixtureCatalog, { sort: "newest" }, "pt"))[0]).toBe("flor-de-sal");
    const featured = slugs(queryCatalog(fixtureCatalog, { sort: "featured" }, "pt"));
    expect(featured.slice(0, 2).sort()).toEqual(["cedro-branco", "flor-de-sal"]);
  });

  it("não muta a lista de entrada", () => {
    const before = slugs(fixtureCatalog);
    queryCatalog(fixtureCatalog, { sort: "price-desc" }, "pt");
    expect(slugs(fixtureCatalog)).toEqual(before);
  });
});
