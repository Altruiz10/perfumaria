import { CSRF_MIN_LENGTH } from "./csrf-constants";

export { sanitizeText } from "./sanitize";

/** S5: JSON-LD safe for inline <script type="application/ld+json">. */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/[\u2028\u2029]/g, (c) => `\\u${c.charCodeAt(0).toString(16)}`);
}

/** S1: per-request nonce CSP. Styles allow inline (React style props); scripts never do in production. */
export function buildCsp(
  nonce: string,
  { isDev, upgradeInsecure = !isDev }: { isDev: boolean; upgradeInsecure?: boolean },
): string {
  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    "script-src": ["'self'", `'nonce-${nonce}'`, "'strict-dynamic'", ...(isDev ? ["'unsafe-eval'"] : [])],
    "style-src": ["'self'", "'unsafe-inline'"],
    "img-src": ["'self'", "data:", "blob:"],
    "font-src": ["'self'"],
    "connect-src": ["'self'", ...(isDev ? ["ws:"] : [])],
    "media-src": ["'self'"],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "frame-ancestors": ["'none'"],
    "manifest-src": ["'self'"],
    "worker-src": ["'self'", "blob:"],
  };
  const csp = Object.entries(directives).map(([k, v]) => `${k} ${v.join(" ")}`);
  if (upgradeInsecure) csp.push("upgrade-insecure-requests");
  return csp.join("; ");
}

/** S2: static security headers (applied to every route via next.config). */
export function securityHeaders(): { key: string; value: string }[] {
  return [
    { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
    {
      key: "Permissions-Policy",
      value: "camera=(), microphone=(), geolocation=(), payment=(self), usb=(), interest-cohort=()",
    },
  ];
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** S3: Origin must match Host, and the double-submit token must match its cookie. */
export function verifyCsrf(input: {
  origin: string | null;
  host: string | null;
  cookieToken: string | null;
  headerToken: string | null;
}): boolean {
  const { origin, host, cookieToken, headerToken } = input;
  if (!origin || !host || !cookieToken || !headerToken) return false;
  let originHost: string;
  try {
    originHost = new URL(origin).host;
  } catch {
    return false;
  }
  if (originHost !== host) return false;
  if (cookieToken.length < CSRF_MIN_LENGTH) return false;
  return constantTimeEqual(cookieToken, headerToken);
}

export function generateToken(bytes = 24): string {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
}
