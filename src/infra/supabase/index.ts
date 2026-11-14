import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { NewsletterRepository, OrderRepository } from "@/domain/ports";
import { SupabaseNewsletterRepository } from "./supabase-newsletter-repository";
import { SupabaseOrderRepository } from "./supabase-order-repository";

export interface SupabaseConfig {
  url: string;
  serviceRoleKey: string;
}

/**
 * The module's public surface. Nothing outside infra/supabase imports the Supabase
 * client or knows a table name; the rest of the app sees ports only.
 *
 * Server-side only: the service-role key bypasses Row Level Security (S6).
 */
export function createSupabaseRepositories({ url, serviceRoleKey }: SupabaseConfig): {
  orders: OrderRepository;
  newsletter: NewsletterRepository;
} {
  const db = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    // Next.js may cache server-side fetches; an order status must never be stale.
    global: { fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }) },
  });
  return { orders: new SupabaseOrderRepository(db), newsletter: new SupabaseNewsletterRepository(db) };
}
