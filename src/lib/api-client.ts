import { CSRF_COOKIE, CSRF_HEADER } from "./csrf-constants";
import { readCookieClient } from "./storage";

/** Same-origin JSON POST carrying the CSRF double-submit token (S3). */
export async function postJson<T>(url: string, body: unknown): Promise<{ status: number; data: T | null }> {
  const res = await fetch(url, {
    method: "POST",
    credentials: "same-origin",
    headers: {
      "content-type": "application/json",
      [CSRF_HEADER]: readCookieClient(CSRF_COOKIE) ?? "",
    },
    body: JSON.stringify(body),
  });
  let data: T | null = null;
  try {
    data = (await res.json()) as T;
  } catch {
    data = null;
  }
  return { status: res.status, data };
}
