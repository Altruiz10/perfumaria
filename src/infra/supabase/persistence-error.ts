/**
 * Thrown when Supabase rejects an operation. Carries the operation name and
 * Postgres/PostgREST code only: the provider's message can echo row values
 * (e.g. a unique-violation detail contains the e-mail), and C5 forbids that in logs.
 */
export class PersistenceError extends Error {
  readonly code: string;

  constructor(operation: string, code: string | undefined) {
    super(`persistence_failed:${operation}`);
    this.name = "PersistenceError";
    this.code = code ?? "unknown";
  }
}
