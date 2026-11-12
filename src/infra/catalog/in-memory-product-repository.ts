import type { ProductRepository } from "@/domain/ports";
import type { Product } from "@/domain/product";

export class InMemoryProductRepository implements ProductRepository {
  constructor(private readonly products: readonly Product[]) {}

  async list(): Promise<Product[]> {
    return [...this.products];
  }

  async findBySlug(slug: string): Promise<Product | null> {
    return this.products.find((p) => p.slug === slug) ?? null;
  }
}
