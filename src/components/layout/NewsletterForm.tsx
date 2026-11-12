"use client";

import { useId, useState } from "react";
import { useI18n } from "@/components/providers/AppProviders";
import { ArrowIcon } from "@/components/ui/icons";
import { postJson } from "@/lib/api-client";

export function NewsletterForm() {
  const { dict } = useI18n();
  const id = useId();
  const [state, setState] = useState<"idle" | "sending" | "ok" | "error">("idle");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setState("sending");
    const { status } = await postJson("/api/newsletter", {
      email: String(fd.get("email") ?? ""),
      consent: fd.get("consent") === "on",
      website: String(fd.get("website") ?? ""),
    });
    setState(status === 201 ? "ok" : "error");
  }

  if (state === "ok") {
    return (
      <p role="status" className="display text-2xl text-on-dark">
        {dict.footer.subscribed}
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="w-full">
      <div className="flex items-end gap-3 border-b border-white/30 focus-within:border-white">
        <label htmlFor={`${id}-e`} className="sr-only">
          {dict.footer.emailLabel}
        </label>
        <input
          id={`${id}-e`}
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder={dict.footer.emailLabel}
          className="w-full bg-transparent py-3 text-base text-on-dark placeholder:text-white/60 focus:outline-none"
        />
        <button
          type="submit"
          disabled={state === "sending"}
          aria-label={dict.footer.subscribe}
          className="grid h-11 w-11 shrink-0 place-items-center text-on-dark transition-transform hover:translate-x-1"
        >
          <ArrowIcon />
        </button>
      </div>
      {/* honeypot */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
      <label className="mt-4 flex cursor-pointer items-start gap-3 text-xs leading-relaxed text-white/75">
        <input type="checkbox" name="consent" required className="mt-0.5 h-4 w-4 shrink-0 accent-[#c9a56b]" />
        {dict.footer.marketingConsent}
      </label>
      {state === "error" && (
        <p role="alert" className="mt-3 text-xs text-[#f2b8b5]">
          {dict.footer.newsletterError}
        </p>
      )}
    </form>
  );
}
