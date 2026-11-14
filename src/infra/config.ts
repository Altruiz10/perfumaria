import { z } from "zod";

/**
 * Environment → typed configuration, one loader per concern so a part of the
 * system only ever fails for its own missing setting (the catalogue needs no
 * database secret, and `next build` needs neither). Pure functions: every rule
 * below is unit-tested. The only module that reads provider variables.
 *
 * S6: secrets are server-only — nothing here may ever carry a NEXT_PUBLIC_ prefix.
 *
 * Choosing a backend is explicit in production. A forgotten variable must stop the
 * store, not silently fall back to an in-memory database or to payments that
 * approve everything.
 */

type Env = Record<string, string | undefined>;
interface Mode {
  production: boolean;
}

const optional = z.string().trim().min(1).optional();

export class ConfigError extends Error {
  constructor(message: string) {
    super(`Invalid configuration: ${message}`);
    this.name = "ConfigError";
  }
}

function parse<T extends z.ZodType>(schema: T, env: Env): z.infer<T> {
  const parsed = schema.safeParse(env);
  if (!parsed.success) {
    // Names of the offending variables only: values may be secrets.
    const names = [...new Set(parsed.error.issues.map((i) => i.path.join(".")))].join(", ");
    throw new ConfigError(`check ${names}`);
  }
  return parsed.data;
}

// --------------------------------------------------------------- persistence

export type PersistenceConfig = { kind: "memory" } | { kind: "supabase"; url: string; serviceRoleKey: string };

const persistenceEnv = z.object({
  PERSISTENCE: z.enum(["memory", "supabase"]).optional(),
  SUPABASE_URL: z.url().optional(),
  SUPABASE_SERVICE_ROLE_KEY: optional,
});

export function loadPersistenceConfig(env: Env, { production }: Mode): PersistenceConfig {
  const e = parse(persistenceEnv, env);
  const kind = e.PERSISTENCE ?? (production ? undefined : "memory");
  if (!kind) throw new ConfigError("PERSISTENCE must be set to 'supabase' (or 'memory' for a demo) in production");
  if (kind === "memory") return { kind };
  if (!e.SUPABASE_URL || !e.SUPABASE_SERVICE_ROLE_KEY) {
    throw new ConfigError("PERSISTENCE=supabase requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
  }
  return { kind, url: e.SUPABASE_URL, serviceRoleKey: e.SUPABASE_SERVICE_ROLE_KEY };
}

// ------------------------------------------------------------------ payments

export type PaymentConfig = { kind: "fake" } | { kind: "mercadopago"; accessToken: string; webhookSecret: string };

const paymentEnv = z.object({
  PAYMENT_GATEWAY: z.enum(["fake", "mercadopago"]).optional(),
  MERCADOPAGO_ACCESS_TOKEN: optional,
  MERCADOPAGO_WEBHOOK_SECRET: optional,
});

export function loadPaymentConfig(env: Env, { production }: Mode): PaymentConfig {
  const e = parse(paymentEnv, env);
  const kind = e.PAYMENT_GATEWAY ?? (production ? undefined : "fake");
  if (!kind) throw new ConfigError("PAYMENT_GATEWAY must be set to 'mercadopago' (or 'fake' for a demo) in production");
  if (kind === "fake") return { kind };
  if (!e.MERCADOPAGO_ACCESS_TOKEN || !e.MERCADOPAGO_WEBHOOK_SECRET) {
    throw new ConfigError("PAYMENT_GATEWAY=mercadopago requires MERCADOPAGO_ACCESS_TOKEN and MERCADOPAGO_WEBHOOK_SECRET");
  }
  return { kind, accessToken: e.MERCADOPAGO_ACCESS_TOKEN, webhookSecret: e.MERCADOPAGO_WEBHOOK_SECRET };
}
