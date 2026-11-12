"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { useConsent, useI18n, useUI } from "@/components/providers/AppProviders";
import { Drawer } from "@/components/ui/Drawer";
import { CloseIcon } from "@/components/ui/icons";
import { localizePath } from "@/i18n/routes";

/** C1–C4: granular, off by default, revocable from the footer ("cookies" panel). */
export function CookieBanner() {
  const { locale, dict } = useI18n();
  const { ready, decided, consent, save } = useConsent();
  const { panel, open, close } = useUI();
  const d = dict.cookies;

  const showBanner = ready && !decided && panel !== "cookies";

  return (
    <>
      {showBanner && (
        <section
          role="region"
          aria-label={d.dialog}
          className="animate-fade-up fixed inset-x-0 bottom-0 z-50 border-t border-line bg-bg/97 shadow-[0_-20px_60px_-30px_rgba(0,0,0,.4)] backdrop-blur-xl md:inset-x-auto md:right-6 md:bottom-6 md:max-w-md md:border"
          data-testid="cookie-banner"
        >
          <div className="px-5 pt-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] md:p-7">
            <p className="display text-2xl leading-tight">{d.title}</p>
            <p className="mt-3 text-sm leading-relaxed text-ink-soft">
              {d.body}{" "}
              <Link href={localizePath(locale, "/cookies")} className="underline underline-offset-4">
                {d.policy}
              </Link>
            </p>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <button type="button" className="btn btn-outline px-3" onClick={() => save({ analytics: false, marketing: false })}>
                {d.rejectAll}
              </button>
              <button
                type="button"
                className="btn btn-primary px-3"
                onClick={() => save({ analytics: true, marketing: true })}
                data-testid="cookie-accept"
              >
                {d.acceptAll}
              </button>
            </div>
            <button type="button" onClick={() => open("cookies")} className="caps mt-3 w-full py-2 text-ink-soft hover:text-ink">
              {d.customize}
            </button>
          </div>
        </section>
      )}
      <Drawer open={panel === "cookies"} onClose={close} side="right" label={d.dialog}>
        <CookiePreferences
          key={consent?.updatedAt ?? "none"}
          initial={{ analytics: consent?.analytics ?? false, marketing: consent?.marketing ?? false }}
          onSave={(c) => {
            save(c);
            close();
          }}
          onClose={close}
        />
      </Drawer>
    </>
  );
}

function CookiePreferences({
  initial,
  onSave,
  onClose,
}: {
  initial: { analytics: boolean; marketing: boolean };
  onSave: (c: { analytics: boolean; marketing: boolean }) => void;
  onClose: () => void;
}) {
  const { dict } = useI18n();
  const d = dict.cookies;
  // Reset on new consent is handled by the parent's `key`.
  const [choice, setChoice] = useState(initial);

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center justify-between border-b border-line px-5 md:h-20 md:px-7">
        <h2 className="display text-2xl">{d.dialog}</h2>
        <button type="button" onClick={onClose} aria-label={d.close} className="-mr-3 grid h-11 w-11 place-items-center">
          <CloseIcon size={22} />
        </button>
      </div>
      <div className="flex-1 space-y-6 overflow-y-auto px-5 py-6 md:px-7">
        <p className="text-sm leading-relaxed text-ink-soft">{d.body}</p>
        <Toggle label={d.necessary} desc={d.necessaryDesc} checked disabled badge={d.alwaysOn} />
        <Toggle
          label={d.analytics}
          desc={d.analyticsDesc}
          checked={choice.analytics}
          onChange={(v) => setChoice((c) => ({ ...c, analytics: v }))}
        />
        <Toggle
          label={d.marketing}
          desc={d.marketingDesc}
          checked={choice.marketing}
          onChange={(v) => setChoice((c) => ({ ...c, marketing: v }))}
        />
      </div>
      <div className="grid grid-cols-2 gap-2 border-t border-line px-5 pt-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] md:px-7">
        <button type="button" className="btn btn-outline px-3" onClick={() => onSave({ analytics: false, marketing: false })}>
          {d.rejectAll}
        </button>
        <button type="button" className="btn btn-primary px-3" onClick={() => onSave(choice)}>
          {d.save}
        </button>
      </div>
    </div>
  );
}

function Toggle({
  label,
  desc,
  checked,
  disabled,
  badge,
  onChange,
}: {
  label: string;
  desc: string;
  checked: boolean;
  disabled?: boolean;
  badge?: string;
  onChange?: (v: boolean) => void;
}) {
  const id = useId();
  return (
    <div className="flex items-start justify-between gap-6 border-b border-line pb-6">
      <div>
        <label htmlFor={id} className="caps text-ink">
          {label}
        </label>
        <p id={`${id}-d`} className="mt-2 text-sm leading-relaxed text-muted">
          {desc}
        </p>
      </div>
      {badge ? (
        <span className="shrink-0 text-xs text-gold-ink">{badge}</span>
      ) : null}
      <input
        id={id}
        type="checkbox"
        role="switch"
        aria-describedby={`${id}-d`}
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.checked)}
        className={`relative mt-1 h-6 w-11 shrink-0 cursor-pointer appearance-none rounded-full border border-line bg-surface-2 transition-colors duration-300 before:absolute before:top-0.5 before:left-0.5 before:h-4.5 before:w-4.5 before:rounded-full before:bg-bg before:shadow before:transition-transform before:duration-300 checked:border-ink checked:bg-ink checked:before:translate-x-5 disabled:cursor-not-allowed disabled:opacity-60 ${badge ? "sr-only" : ""}`}
      />
    </div>
  );
}
