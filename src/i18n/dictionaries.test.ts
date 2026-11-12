import { describe, expect, it } from "vitest";
import { dictionaries } from "./dictionaries";

function keys(obj: unknown, prefix = ""): string[] {
  if (obj === null || typeof obj !== "object" || Array.isArray(obj)) return [prefix];
  return Object.entries(obj as Record<string, unknown>).flatMap(([k, v]) => keys(v, prefix ? `${prefix}.${k}` : k));
}

describe("dicionários", () => {
  const base = keys(dictionaries.pt).sort();

  it.each(["en", "es"] as const)("CT-015 %s tem exatamente as chaves do pt", (locale) => {
    expect(keys(dictionaries[locale]).sort()).toEqual(base);
  });

  it("nenhum valor vazio", () => {
    for (const d of Object.values(dictionaries)) {
      const flat = JSON.stringify(d);
      expect(flat).not.toMatch(/:""/);
    }
  });
});
