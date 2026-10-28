"use client";

import { useCallback, useSyncExternalStore } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import Button from "@/shared/components/Button";

const DISMISS_STORAGE_KEY = "omniroute-first-run-readiness-dismissed";

type FirstRunReadinessCardProps = {
  setupComplete: boolean;
};

// #9985: dismissal lives in localStorage, read via useSyncExternalStore — keeps
// the component free of setState-in-effect cascades and hydration-safe (server
// snapshot treats the card as dismissed; the client corrects after hydration).
const readinessListeners = new Set<() => void>();

function subscribeReadiness(onStoreChange: () => void): () => void {
  readinessListeners.add(onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    readinessListeners.delete(onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

function isReadinessDismissed(): boolean {
  try {
    return localStorage.getItem(DISMISS_STORAGE_KEY) === "true";
  } catch {
    // Storage unavailable (private mode etc.) — never show the nagging card.
    return true;
  }
}

function getServerSnapshot(): boolean {
  return true;
}

/**
 * Soft entry path for first-run users. Replaces the hard redirect to
 * /dashboard/onboarding so returning users can dismiss and stay on Home.
 * Styled following Apple Minimalist callout standards.
 */
export default function FirstRunReadinessCard({ setupComplete }: FirstRunReadinessCardProps) {
  const t = useTranslations("home");
  const dismissed = useSyncExternalStore(
    subscribeReadiness,
    isReadinessDismissed,
    getServerSnapshot
  );

  const dismiss = useCallback(() => {
    try {
      localStorage.setItem(DISMISS_STORAGE_KEY, "true");
    } catch {
      // ignore storage failures; still hide for this session
    }
    for (const listener of readinessListeners) listener();
  }, []);

  if (setupComplete || dismissed) return null;

  const steps = [
    t("readinessStep1"),
    t("readinessStep2"),
    t("readinessStep3"),
    t("readinessStep4"),
  ];

  return (
    <div
      role="region"
      aria-label={t("readinessTitle")}
      className="mb-4 relative flex flex-col gap-3.5 rounded-xl border border-border/40 bg-surface/80 backdrop-blur-md p-4 sm:p-5 shadow-xs transition-colors"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <span className="block text-[11px] font-semibold uppercase tracking-wider text-primary">
            {t("readinessEyebrow")}
          </span>
          <h2 className="mt-0.5 text-base font-semibold tracking-tight text-text-main">
            {t("readinessTitle")}
          </h2>
          <p className="mt-1 text-xs text-text-muted leading-relaxed">{t("readinessSubtitle")}</p>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          icon="close"
          onClick={dismiss}
          aria-label={t("readinessDismiss")}
          className="text-text-muted hover:text-text-main shrink-0 -mt-1 -mr-1"
        />
      </div>

      <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
        {steps.map((label, index) => (
          <li
            key={label}
            className="flex items-center gap-2 rounded-lg border border-border/30 bg-surface-subtle/40 px-3 py-2 text-text-main transition-colors"
          >
            <span className="inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary font-mono">
              {index + 1}
            </span>
            <span className="truncate font-medium">{label}</span>
          </li>
        ))}
      </ol>

      <div className="flex items-center gap-2 pt-0.5">
        <Link
          href="/dashboard/onboarding"
          className="inline-flex items-center justify-center rounded-lg bg-primary px-3.5 py-1.5 text-xs font-medium text-primary-foreground shadow-xs transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
        >
          {t("readinessContinue")}
        </Link>
        <Button
          variant="ghost"
          size="sm"
          onClick={dismiss}
          className="text-xs text-text-muted hover:text-text-main"
        >
          {t("readinessDismiss")}
        </Button>
      </div>
    </div>
  );
}
