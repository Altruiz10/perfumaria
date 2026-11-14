import "server-only";
import type {
  NewsletterRepository,
  OrderRepository,
  PaymentGateway,
  PaymentNotifications,
  ProductRepository,
} from "@/domain/ports";
import { SITE_URL } from "@/lib/site";
import { InMemoryProductRepository } from "./catalog/in-memory-product-repository";
import { products } from "./catalog/products";
import { loadPaymentConfig, loadPersistenceConfig } from "./config";
import { createMercadoPago } from "./mercadopago";
import { InMemoryNewsletterRepository } from "./newsletter/in-memory-newsletter-repository";
import { InMemoryOrderRepository } from "./orders/in-memory-order-repository";
import { FakePaymentGateway, FakePaymentNotifications } from "./payments/fake-payment-gateway";
import { createSupabaseRepositories } from "./supabase";

/**
 * Composition root: the ONLY place that picks an implementation for each port.
 * Nothing else imports from infra/supabase or infra/mercadopago.
 *
 * Three independent slices, each built on first use and each validating only its
 * own settings. Not at import: `next build` imports route modules without runtime
 * secrets, and a misconfigured production must fail the request that needs the
 * missing piece, with a clear message, instead of serving with the wrong backend.
 * A catalogue page never needs a database key; a webhook never needs the catalogue.
 */
export interface Container {
  products: ProductRepository;
  orders: OrderRepository;
  newsletter: NewsletterRepository;
  payments: PaymentGateway;
  paymentNotifications: PaymentNotifications;
  /** Public origin for return and callback URLs. */
  siteUrl: string;
}

const mode = () => ({ production: process.env.NODE_ENV === "production" });

function once<T>(build: () => T): () => T {
  let value: T | undefined;
  return () => (value ??= build());
}

/** In demo mode the stores live on globalThis so every route bundle in the process shares one copy. */
const demo = globalThis as typeof globalThis & { __hmDemoStores?: { orders: OrderRepository; newsletter: NewsletterRepository } };

const catalog = once((): ProductRepository => new InMemoryProductRepository(products));

const persistence = once(() => {
  const config = loadPersistenceConfig(process.env, mode());
  if (config.kind === "supabase") return createSupabaseRepositories(config);
  if (mode().production) console.warn("[container] PERSISTENCE=memory in production: orders are lost on restart.");
  return (demo.__hmDemoStores ??= { orders: new InMemoryOrderRepository(), newsletter: new InMemoryNewsletterRepository() });
});

const payment = once((): { payments: PaymentGateway; notifications: PaymentNotifications } => {
  const config = loadPaymentConfig(process.env, mode());
  if (config.kind === "mercadopago") return createMercadoPago(config);
  if (mode().production) console.warn("[container] PAYMENT_GATEWAY=fake in production: no real charge is made.");
  return { payments: new FakePaymentGateway(), notifications: new FakePaymentNotifications() };
});

export const container: Container = {
  get products() {
    return catalog();
  },
  get orders() {
    return persistence().orders;
  },
  get newsletter() {
    return persistence().newsletter;
  },
  get payments() {
    return payment().payments;
  },
  get paymentNotifications() {
    return payment().notifications;
  },
  siteUrl: SITE_URL,
};
