import { SectionI18nProvider } from "@/i18n/SectionI18nProvider";
import sectionNamespaces from "@/i18n/routeNamespaces.generated.json";
import SettingsLayoutShell from "./components/SettingsLayoutShell";

/**
 * Per-section i18n provider — serves only the namespaces this section's
 * client components actually use (see scripts/i18n/generate-route-namespaces.mjs).
 * Hosts the Apple Minimalist macOS-style settings layout.
 */
export default function SettingsSectionLayout({ children }: { children: React.ReactNode }) {
  return (
    <SectionI18nProvider namespaces={sectionNamespaces.sections["settings"]}>
      <SettingsLayoutShell>{children}</SettingsLayoutShell>
    </SectionI18nProvider>
  );
}
