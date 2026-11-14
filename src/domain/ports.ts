import type { Order, OrderStatus } from "./order";
import type { PaymentResult, PaymentSnapshot } from "./payment";
import type { Product } from "./product";

/**
 * Ports (ARCHITECTURE §Portas). Implementations live in src/infra and are wired in
 * infra/container.ts. Each port is as small as its consumer needs: a use case
 * depends only on the methods it calls (interface segregation), so swapping a
 * vendor means writing one adapter, never touching a use case.
 */

export interface ProductRepository {
  list(): Promise<Product[]>;
  findBySlug(slug: string): Promise<Product | null>;
}

export interface OrderRepository {
  create(order: Order): Promise<void>;
  findById(id: string): Promise<Order | null>;
  /**
   * Compare-and-swap: persists `next` only if the stored status is still
   * `expectedStatus`. Returns false when another writer got there first, so
   * concurrent webhooks can never overwrite each other.
   */
  update(next: Order, expectedStatus: OrderStatus): Promise<boolean>;
}

/** Where the customer returns to, and where the provider reports back. Built by the use case, consumed by gateways. */
export interface ChargeContext {
  returnUrl: string;
  /** null when the site is not publicly reachable over HTTPS (local development). */
  notificationUrl: string | null;
}

/** Asks a provider to start collecting money for an order. */
export interface PaymentGateway {
  readonly name: string;
  charge(order: Order, ctx: ChargeContext): Promise<PaymentResult>;
}

export interface NotificationRequest {
  headers: { get(name: string): string | null };
  query: URLSearchParams;
  body: unknown;
}

export type NotificationOutcome =
  | { kind: "payment"; externalId: string }
  /** Authentic, but not about a payment (or malformed): acknowledge and do nothing. */
  | { kind: "ignored" }
  /** Failed authentication: reject. */
  | { kind: "invalid" };

/**
 * Learns that a payment changed. Deliberately separate from `PaymentGateway`:
 * charging and reconciling are different use cases that happen to share a vendor.
 */
export interface PaymentNotifications {
  parse(req: NotificationRequest): NotificationOutcome;
  /** Authoritative state straight from the provider; the notification body is never trusted. */
  fetchPayment(externalId: string): Promise<PaymentSnapshot | null>;
}

export interface NewsletterRepository {
  subscribe(email: string, consentAt: string): Promise<void>;
}

export type { Order, OrderStatus, PaymentResult, PaymentSnapshot };
