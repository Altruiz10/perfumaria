"use client";

import Link from "next/link";
import { useI18n } from "@/components/providers/AppProviders";
import { localizePath } from "@/i18n/routes";

export default function NotFound() {
  const { locale, dict } = useI18n();
  return (
    <div className="container-lux flex min-h-[60vh] flex-col items-center justify-center py-24 text-center">
      <p className="eyebrow">404</p>
      <h1 className="display mt-5 text-5xl md:text-6xl">{dict.notFound.title}</h1>
      <p className="mt-5 text-ink-soft">{dict.notFound.body}</p>
      <Link href={localizePath(locale, "/")} className="btn btn-primary mt-10">
        {dict.notFound.cta}
      </Link>
    </div>
  );
}
