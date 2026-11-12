import "server-only";
import type { NewsletterRepository, OrderRepository, PaymentGateway, ProductRepository } from "@/domain/ports";
import { InMemoryProductRepository } from "./catalog/in-memory-product-repository";
import { products } from "./catalog/products";
import { InMemoryOrderRepository } from "./orders/in-memory-order-repository";
import { FakePaymentGateway } from "./payments/fake-payment-gateway";

/**
 * Composition root: the ONLY place that picks implementations for each port.
 * Swap here to connect CMS, ERP, CRM or a real payment gateway.
 */
class InMemoryNewsletterRepository implements NewsletterRepository {
  private readonly subscribers = new Map<string, string>();
  async subscribe(email: string, consentAt: string) {
    this.subscribers.set(email, consentAt);
  }
}

export const container = {
  products: new InMemoryProductRepository(products) as ProductRepository,
  orders: new InMemoryOrderRepository() as OrderRepository,
  payments: new FakePaymentGateway() as PaymentGateway,
  newsletter: new InMemoryNewsletterRepository() as NewsletterRepository,
};
