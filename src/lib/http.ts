import { CSRF_COOKIE, CSRF_HEADER } from "./csrf-constants";
import { verifyCsrf } from "./security";

export function readCookie(req: Request, name: string): string | null {
  const header = req.headers.get("cookie");
  if (!header) return null;
  for (const part of header.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return decodeURIComponent(v.join("="));
  }
  return null;
}

/** S3 guard for state-changing route handlers. */
export function isCsrfValid(req: Request): boolean {
  return verifyCsrf({
    origin: req.headers.get("origin"),
    host: req.headers.get("x-forwarded-host") ?? req.headers.get("host"),
    cookieToken: readCookie(req, CSRF_COOKIE),
    headerToken: req.headers.get(CSRF_HEADER),
  });
}

const NO_STORE = { "cache-control": "no-store" };

export function json(body: unknown, status = 200): Response {
  return Response.json(body, { status, headers: NO_STORE });
}

export async function readJson(req: Request, maxBytes = 16_384): Promise<unknown | undefined> {
  const text = await req.text();
  if (text.length > maxBytes) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}
