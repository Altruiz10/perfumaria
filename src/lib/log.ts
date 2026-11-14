/**
 * C5: logs carry event names and opaque codes only — never customer data, never
 * provider response bodies. Fields are restricted to primitives to make that hard to violate.
 */
type Field = string | number | boolean | null | undefined;

export function logEvent(scope: string, event: string, fields: Record<string, Field> = {}): void {
  console.error(JSON.stringify({ scope, event, ...fields }));
}

/** Error class + code only: provider and database messages may echo personal data. */
export function errorFields(error: unknown): Record<string, Field> {
  if (error && typeof error === "object") {
    const { name, code } = error as { name?: unknown; code?: unknown };
    return {
      error: typeof name === "string" ? name : "Error",
      code: typeof code === "string" || typeof code === "number" ? code : undefined,
    };
  }
  return { error: "unknown" };
}
