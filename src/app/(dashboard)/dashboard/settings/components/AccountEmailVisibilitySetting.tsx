"use client";

import { useTranslations } from "next-intl";
import { useShallow } from "zustand/react/shallow";
import { Toggle } from "@/shared/components";
import useEmailPrivacyStore from "@/store/emailPrivacyStore";

export default function AccountEmailVisibilitySetting() {
  const t = useTranslations("settings");
  const { emailsVisible, setEmailsVisible } = useEmailPrivacyStore(
    useShallow((state) => ({
      emailsVisible: state.emailsVisible,
      setEmailsVisible: state.setEmailsVisible,
    }))
  );

  const label = (key: string, fallback: string) =>
    typeof t.has === "function" && t.has(key) ? t(key) : fallback;

  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3.5 hover:bg-surface-muted/30 transition-colors">
      <div className="min-w-0 flex-1 pr-4">
        <p className="text-sm font-medium text-foreground">
          {label("accountEmailVisibility", "Account email visibility")}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5 leading-normal">
          {label(
            "accountEmailVisibilityDesc",
            "Show full account emails across providers, combos, logs, quota, and playground screens. Turn this off to mask them by default."
          )}
        </p>
      </div>
      <div className="shrink-0">
        <Toggle
          checked={emailsVisible}
          onChange={setEmailsVisible}
          ariaLabel={label("accountEmailVisibility", "Account email visibility")}
        />
      </div>
    </div>
  );
}
