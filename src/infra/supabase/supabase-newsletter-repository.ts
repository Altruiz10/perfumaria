import type { SupabaseClient } from "@supabase/supabase-js";
import type { NewsletterRepository } from "@/domain/ports";
import { PersistenceError } from "./persistence-error";

export class SupabaseNewsletterRepository implements NewsletterRepository {
  constructor(private readonly db: SupabaseClient) {}

  async subscribe(email: string, consentAt: string): Promise<void> {
    // ignoreDuplicates: a repeat sign-up keeps the original consent timestamp (C2).
    const { error } = await this.db
      .from("newsletter_subscribers")
      .upsert({ email, consent_at: consentAt }, { onConflict: "email", ignoreDuplicates: true });
    if (error) throw new PersistenceError("newsletter.subscribe", error.code);
  }
}
