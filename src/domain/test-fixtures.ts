import type { Product } from "./product";

const L = (pt: string, en = pt, es = pt) => ({ pt, en, es });
const LA = (pt: string[], en = pt, es = pt) => ({ pt, en, es });

export function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    slug: "ambar-noturno",
    name: "Âmbar Noturno",
    family: "amber",
    gender: "shared",
    concentration: "edp",
    tagline: L("Calor que permanece."),
    story: L("Uma história."),
    description: L("Âmbar, baunilha e couro."),
    notes: {
      top: LA(["Bergamota"]),
      heart: LA(["Rosa"]),
      base: LA(["Âmbar", "Vetiver"]),
    },
    variants: [
      { sizeMl: 50, priceCents: 18900, sku: "AMB-50" },
      { sizeMl: 100, priceCents: 28900, sku: "AMB-100" },
    ],
    images: ["/images/products/ambar-noturno-1.webp"],
    accent: "#8a5a2b",
    featured: false,
    createdAt: "2026-01-01",
    ...overrides,
  };
}

export const fixtureCatalog: Product[] = [
  makeProduct(),
  makeProduct({
    slug: "cedro-branco",
    name: "Cedro Branco",
    family: "woody",
    gender: "masculine",
    description: L("Cedro, vetiver e pimenta rosa."),
    notes: { top: LA(["Pimenta rosa"]), heart: LA(["Cedro"]), base: LA(["Vetiver"]) },
    variants: [{ sizeMl: 100, priceCents: 34900, sku: "CED-100" }],
    featured: true,
    createdAt: "2026-03-01",
  }),
  makeProduct({
    slug: "flor-de-sal",
    name: "Flor de Sal",
    family: "floral",
    gender: "feminine",
    description: L("Neroli, sal marinho e almíscar."),
    notes: { top: LA(["Neroli"]), heart: LA(["Sal marinho"]), base: LA(["Almíscar"]) },
    variants: [{ sizeMl: 50, priceCents: 15900, sku: "FLO-50" }],
    featured: true,
    createdAt: "2026-05-01",
  }),
];

export const validCheckout = {
  customer: { name: "Maria Souza", email: "maria@example.com", cpf: "529.982.247-25", phone: "(11) 91234-5678" },
  address: {
    cep: "01310-100",
    street: "Av. Paulista",
    number: "1000",
    complement: "",
    district: "Bela Vista",
    city: "São Paulo",
    state: "SP",
  },
  paymentMethod: "pix",
  items: [{ slug: "cedro-branco", sizeMl: 100, quantity: 1 }],
  acceptTerms: true,
  marketingOptIn: false,
};
