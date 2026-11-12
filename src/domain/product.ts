import type { Localized } from "./locale";
import type { Cents } from "./money";

export const FAMILIES = ["woody", "amber", "floral", "citrus", "aromatic", "leather"] as const;
export type OlfactiveFamily = (typeof FAMILIES)[number];

export const GENDERS = ["masculine", "feminine", "shared"] as const;
export type Gender = (typeof GENDERS)[number];

export type Concentration = "edp" | "extrait";

export interface ProductVariant {
  sizeMl: number;
  priceCents: Cents;
  sku: string;
}

export interface OlfactivePyramid {
  top: Localized<string[]>;
  heart: Localized<string[]>;
  base: Localized<string[]>;
}

export interface Product {
  slug: string;
  name: string;
  family: OlfactiveFamily;
  gender: Gender;
  concentration: Concentration;
  tagline: Localized;
  story: Localized;
  description: Localized;
  notes: OlfactivePyramid;
  variants: ProductVariant[];
  images: string[];
  /** Art-direction accent (placeholder imagery, subtle UI tints). */
  accent: string;
  featured: boolean;
  createdAt: string;
}
