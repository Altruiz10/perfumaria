import type { Locale } from "@/domain/locale";
import en from "./en";
import es from "./es";
import pt, { type Dictionary } from "./pt";

export type { Dictionary };

/** What client components receive: legal copy stays on the server (payload size, P3). */
export type ClientDictionary = Omit<Dictionary, "legal">;

export function toClientDictionary(dict: Dictionary): ClientDictionary {
  const rest: Partial<Dictionary> = { ...dict };
  delete rest.legal;
  return rest as ClientDictionary;
}

export const dictionaries: Record<Locale, Dictionary> = { pt, en, es };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}

/** "{count} itens" + { count: 3 } -> "3 itens" */
export function t(template: string, vars: Record<string, string | number> = {}): string {
  return template.replace(/\{(\w+)\}/g, (_, k: string) => (k in vars ? String(vars[k]) : `{${k}}`));
}
