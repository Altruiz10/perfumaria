import { describe, expect, it } from "vitest";
import { LOCALES } from "./config";
import { INTERNAL_ROUTES, localizePath, resolveRequest, switchLocalePath, toInternalPath } from "./routes";

describe("URLs traduzidas (ADR-001)", () => {
  it("localiza caminhos internos", () => {
    expect(localizePath("pt", "/")).toBe("/pt");
    expect(localizePath("pt", "/collection")).toBe("/pt/colecao");
    expect(localizePath("es", "/collection")).toBe("/es/coleccion");
    expect(localizePath("en", "/product/cedro-branco")).toBe("/en/product/cedro-branco");
    expect(localizePath("pt", "/product/cedro-branco")).toBe("/pt/perfume/cedro-branco");
    expect(localizePath("pt", "/account/wishlist")).toBe("/pt/conta/favoritos");
  });

  it("preserva query string", () => {
    expect(localizePath("pt", "/collection?family=woody")).toBe("/pt/colecao?family=woody");
  });

  it("CT-016 ida e volta é identidade para todo idioma e rota", () => {
    for (const locale of LOCALES) {
      for (const route of INTERNAL_ROUTES) {
        const pub = localizePath(locale, route);
        expect(toInternalPath(pub)).toEqual({ locale, internalPath: route });
      }
    }
  });

  it("CT-016 segmentos públicos são únicos por idioma", () => {
    for (const locale of LOCALES) {
      const pubs = INTERNAL_ROUTES.map((r) => localizePath(locale, r));
      expect(new Set(pubs).size).toBe(pubs.length);
    }
  });

  it("CT-018 troca de idioma mantém a página", () => {
    expect(switchLocalePath("/pt/colecao", "en")).toBe("/en/collection");
    expect(switchLocalePath("/pt/perfume/cedro-branco", "es")).toBe("/es/perfume/cedro-branco");
    expect(switchLocalePath("/en/account/orders", "pt")).toBe("/pt/conta/pedidos");
    expect(switchLocalePath("/qualquer", "es")).toBe("/es");
  });
});

describe("resolveRequest (decisão do proxy)", () => {
  it("sem idioma na URL: redireciona para o preferido", () => {
    expect(resolveRequest("/", "pt")).toEqual({ type: "redirect", to: "/pt" });
    expect(resolveRequest("/colecao", "en")).toEqual({ type: "redirect", to: "/en/colecao" });
  });

  it("URL pública traduzida: reescreve para o interno", () => {
    expect(resolveRequest("/pt/colecao", "pt")).toEqual({ type: "rewrite", to: "/pt/collection" });
    expect(resolveRequest("/es/perfume/x", "pt")).toEqual({ type: "rewrite", to: "/es/product/x" });
  });

  it("URL já canônica e idêntica ao interno: segue", () => {
    expect(resolveRequest("/en/collection", "pt")).toEqual({ type: "next" });
    expect(resolveRequest("/pt", "pt")).toEqual({ type: "next" });
  });

  it("segmento interno em idioma errado: redireciona para o canônico", () => {
    expect(resolveRequest("/pt/collection", "pt")).toEqual({ type: "redirect", to: "/pt/colecao" });
  });
});
