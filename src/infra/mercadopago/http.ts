export interface MercadoPagoHttp {
  post<T>(path: string, body: unknown, idempotencyKey: string): Promise<T>;
  /** Resolves null on 404 (an id we cannot see, e.g. a dashboard test notification). */
  get<T>(path: string): Promise<T | null>;
}

/** Status only: response bodies carry payer data and must not reach logs (C5). */
export class MercadoPagoError extends Error {
  readonly code: string;
  constructor(operation: string, status: number) {
    super(`mercadopago_request_failed:${operation}`);
    this.name = "MercadoPagoError";
    this.code = String(status);
  }
}

export interface HttpOptions {
  accessToken: string;
  baseUrl?: string;
  fetch?: typeof fetch;
  timeoutMs?: number;
}

export function createMercadoPagoHttp({
  accessToken,
  baseUrl = "https://api.mercadopago.com",
  fetch: doFetch = fetch,
  timeoutMs = 10_000,
}: HttpOptions): MercadoPagoHttp {
  const headers = { authorization: `Bearer ${accessToken}`, "content-type": "application/json" };

  return {
    async post<T>(path: string, body: unknown, idempotencyKey: string): Promise<T> {
      const res = await doFetch(`${baseUrl}${path}`, {
        method: "POST",
        headers: { ...headers, "x-idempotency-key": idempotencyKey },
        body: JSON.stringify(body),
        cache: "no-store",
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (!res.ok) throw new MercadoPagoError(`POST ${path}`, res.status);
      return (await res.json()) as T;
    },

    async get<T>(path: string): Promise<T | null> {
      const res = await doFetch(`${baseUrl}${path}`, {
        method: "GET",
        headers,
        cache: "no-store",
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (res.status === 404) return null;
      if (!res.ok) throw new MercadoPagoError(`GET ${path}`, res.status);
      return (await res.json()) as T;
    },
  };
}
