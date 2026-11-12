import { notFound } from "next/navigation";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

/**
 * Auth placeholder. Plan: Auth.js (or provider of choice) with httpOnly session
 * cookie, server-side session checks in account layout, rate-limited login route.
 */
export default async function LoginPage({ params }: PageProps<"/[lang]/account/login">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const a = getDictionary(lang).account;
  return (
    <div className="max-w-md">
      <h2 className="display text-4xl">{a.login}</h2>
      <p className="mt-3 text-sm text-muted">{a.loginDesc}</p>
      <form className="mt-8 space-y-6">
        <div>
          <label htmlFor="login-email" className="field-label">
            {a.email}
          </label>
          <input id="login-email" type="email" autoComplete="email" disabled className="field" />
        </div>
        <div>
          <label htmlFor="login-password" className="field-label">
            {a.password}
          </label>
          <input id="login-password" type="password" autoComplete="current-password" disabled className="field" />
        </div>
        <button type="button" disabled className="btn btn-primary w-full">
          {a.signIn} · {a.comingSoon}
        </button>
      </form>
    </div>
  );
}
