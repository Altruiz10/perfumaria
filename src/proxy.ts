import { NextResponse, type NextRequest } from "next/server";
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, negotiateLocale } from "@/i18n/config";
import { resolveRequest } from "@/i18n/routes";
import { CSRF_COOKIE } from "@/lib/csrf-constants";
import { buildCsp, generateToken } from "@/lib/security";

/**
 * Network boundary (Next 16 "proxy", formerly middleware):
 *  1. locale negotiation + translated URLs (ADR-001)
 *  2. per-request CSP nonce (S1, ADR-002)
 *  3. CSRF double-submit cookie (S3)
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const cookieLocale = request.cookies.get(LOCALE_COOKIE)?.value;
  const preferred = isLocale(cookieLocale)
    ? cookieLocale
    : negotiateLocale(request.headers.get("accept-language"), DEFAULT_LOCALE);

  const decision = resolveRequest(pathname, preferred);
  if (decision.type === "redirect") {
    const url = new URL(`${decision.to}${search}`, request.url);
    return NextResponse.redirect(url, 307);
  }

  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const isHttps =
    request.nextUrl.protocol === "https:" || request.headers.get("x-forwarded-proto") === "https";
  const csp = buildCsp(nonce, { isDev: process.env.NODE_ENV === "development", upgradeInsecure: isHttps });

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response =
    decision.type === "rewrite"
      ? NextResponse.rewrite(new URL(`${decision.to}${search}`, request.url), { request: { headers: requestHeaders } })
      : NextResponse.next({ request: { headers: requestHeaders } });

  response.headers.set("Content-Security-Policy", csp);

  if (!request.cookies.get(CSRF_COOKIE)) {
    response.cookies.set(CSRF_COOKIE, generateToken(), {
      httpOnly: false, // double-submit: client script echoes it in a header
      sameSite: "strict",
      secure: isHttps,
      path: "/",
    });
  }
  return response;
}

export const config = {
  matcher: [
    // Prefetches are NOT skipped (unlike the CSP guide's example): translated URLs
    // must be rewritten for prefetch requests too, or they 404 (ADR-001).
    "/((?!api|_next/static|_next/image|images|fonts|favicon.ico|icon|apple-icon|robots.txt|sitemap.xml|manifest.webmanifest|.*\\..*).*)",
  ],
};
