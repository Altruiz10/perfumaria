import type { CartTotals, PaymentMethod } from "./cart";
import type { CheckoutInput } from "./checkout";
import type { Product } from "./product";

/** Ports (ARCHITECTURE §Portas). Implementations live in src/infra and are wired in infra/container.ts. */

export interface ProductRepository {
  list(): Promise<Product[]>;
  findBySlug(slug: string): Promise<Product | null>;
}

export interface Order {
  id: string;
  createdAt: string;
  customer: CheckoutInput["customer"];
  address: CheckoutInput["address"];
  paymentMethod: PaymentMethod;
  totals: CartTotals;
  marketingOptIn: boolean;
}

export interface OrderRepository {
  save(order: Order): Promise<void>;
  findById(id: string): Promise<Order | null>;
}

export type PaymentResult =
  | { method: "pix"; status: "pending"; pixCode: string; expiresAt: string }
  | { method: "card"; status: "approved" | "declined"; reference: string };

export interface PaymentGateway {
  readonly name: string;
  charge(order: Order): Promise<PaymentResult>;
}

export interface NewsletterRepository {
  subscribe(email: string, consentAt: string): Promise<void>;
}
