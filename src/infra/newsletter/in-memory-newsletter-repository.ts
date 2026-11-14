import type { NewsletterRepository } from "@/domain/ports";

/** Development and tests only. */
export class InMemoryNewsletterRepository implements NewsletterRepository {
  private readonly subscribers = new Map<string, string>();

  async subscribe(email: string, consentAt: string): Promise<void> {
    // The first consent timestamp is the evidence (C2); a repeat sign-up must not rewrite it.
    if (!this.subscribers.has(email)) this.subscribers.set(email, consentAt);
  }

  consentOf(email: string): string | undefined {
    return this.subscribers.get(email);
  }
}
