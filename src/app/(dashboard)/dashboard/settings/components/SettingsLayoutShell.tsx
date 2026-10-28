"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import Icon from "@/shared/components/Icon";
import { cn } from "@/shared/utils/cn";
import { matchesSearch } from "@/shared/utils/turkishText";

export interface SettingsNavItem {
  id: string;
  href: string;
  titleKey: string;
  fallbackTitle: string;
  subtitleKey?: string;
  icon: string;
  category: "general" | "ai" | "system";
}

export const SETTINGS_NAV_ITEMS: SettingsNavItem[] = [
  // General Category
  {
    id: "general",
    href: "/dashboard/settings/general",
    titleKey: "settingsGeneral",
    fallbackTitle: "Storage & Backups",
    subtitleKey: "settingsGeneralSubtitle",
    icon: "tune",
    category: "general",
  },
  {
    id: "appearance",
    href: "/dashboard/settings/appearance",
    titleKey: "settingsAppearance",
    fallbackTitle: "Appearance",
    subtitleKey: "settingsAppearanceSubtitle",
    icon: "palette",
    category: "general",
  },
  {
    id: "sidebar",
    href: "/dashboard/settings/sidebar",
    titleKey: "settingsSidebar",
    fallbackTitle: "Sidebar Navigation",
    subtitleKey: "settingsSidebarSubtitle",
    icon: "view_sidebar",
    category: "general",
  },

  // AI & Routing Category
  {
    id: "ai",
    href: "/dashboard/settings/ai",
    titleKey: "settingsAi",
    fallbackTitle: "AI & Models",
    subtitleKey: "settingsAiSubtitle",
    icon: "auto_awesome",
    category: "ai",
  },
  {
    id: "modality-bridge",
    href: "/dashboard/settings/modality-bridge",
    titleKey: "settingsModalityBridge",
    fallbackTitle: "Modality Bridge",
    subtitleKey: "settingsModalityBridgeSubtitle",
    icon: "image_search",
    category: "ai",
  },
  {
    id: "routing",
    href: "/dashboard/settings/routing",
    titleKey: "globalRouting",
    fallbackTitle: "Global Routing",
    subtitleKey: "globalRoutingSubtitle",
    icon: "route",
    category: "ai",
  },
  {
    id: "resilience",
    href: "/dashboard/settings/resilience",
    titleKey: "settingsResilience",
    fallbackTitle: "Resilience & Breakers",
    subtitleKey: "settingsResilienceSubtitle",
    icon: "health_and_safety",
    category: "ai",
  },

  // System & Security Category
  {
    id: "security",
    href: "/dashboard/settings/security",
    titleKey: "settingsSecurity",
    fallbackTitle: "Security & Auth",
    subtitleKey: "settingsSecuritySubtitle",
    icon: "shield",
    category: "system",
  },
  {
    id: "access-tokens",
    href: "/dashboard/settings/access-tokens",
    titleKey: "settingsAccessTokens",
    fallbackTitle: "Access Tokens",
    subtitleKey: "settingsAccessTokensSubtitle",
    icon: "key",
    category: "system",
  },
  {
    id: "feature-flags",
    href: "/dashboard/settings/feature-flags",
    titleKey: "settingsFeatureFlags",
    fallbackTitle: "Feature Flags",
    subtitleKey: "settingsFeatureFlagsSubtitle",
    icon: "flag",
    category: "system",
  },
  {
    id: "cache",
    href: "/dashboard/settings/cache",
    titleKey: "settingsCache",
    fallbackTitle: "Cache & Storage",
    subtitleKey: "settingsCacheSubtitle",
    icon: "memory",
    category: "system",
  },
  {
    id: "advanced",
    href: "/dashboard/settings/advanced",
    titleKey: "settingsAdvanced",
    fallbackTitle: "Advanced",
    subtitleKey: "settingsAdvancedSubtitle",
    icon: "engineering",
    category: "system",
  },
];

interface SettingsLayoutShellProps {
  children: React.ReactNode;
}

export default function SettingsLayoutShell({ children }: SettingsLayoutShellProps) {
  const pathname = usePathname();
  const tSidebar = useTranslations("sidebar");
  const tCommon = useTranslations("common");
  const [filterQuery, setFilterQuery] = useState("");

  const getItemLabel = useCallback(
    (item: SettingsNavItem): string => {
      try {
        if (typeof tSidebar.has === "function" && tSidebar.has(item.titleKey)) {
          return tSidebar(item.titleKey);
        }
      } catch {
        // Fallback below
      }
      return item.fallbackTitle;
    },
    [tSidebar]
  );

  const isItemActive = (href: string): boolean => {
    if (!pathname) return false;
    if (pathname === href) return true;
    if (href === "/dashboard/settings/general" && pathname === "/dashboard/settings") return true;
    return false;
  };

  const filteredItems = useMemo(() => {
    if (!filterQuery.trim()) return SETTINGS_NAV_ITEMS;
    return SETTINGS_NAV_ITEMS.filter((item) => {
      const label = getItemLabel(item);
      return (
        matchesSearch(label, filterQuery) ||
        matchesSearch(item.id, filterQuery) ||
        matchesSearch(item.fallbackTitle, filterQuery)
      );
    });
  }, [filterQuery, getItemLabel]);

  const categories = useMemo(() => {
    const general = filteredItems.filter((item) => item.category === "general");
    const ai = filteredItems.filter((item) => item.category === "ai");
    const system = filteredItems.filter((item) => item.category === "system");

    return [
      { id: "general", label: "General", items: general },
      { id: "ai", label: "Intelligence & Routing", items: ai },
      { id: "system", label: "System & Security", items: system },
    ].filter((cat) => cat.items.length > 0);
  }, [filteredItems]);

  return (
    <div className="w-full max-w-7xl mx-auto py-2">
      {/* Mobile / Tablet Horizontal Navigation Bar */}
      <div className="lg:hidden mb-6">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2.5 scrollbar-none border-b border-border/40">
          {SETTINGS_NAV_ITEMS.map((item) => {
            const active = isItemActive(item.href);
            return (
              <Link
                key={item.id}
                href={item.href}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors",
                  active
                    ? "bg-accent/15 text-accent font-semibold border border-accent/25"
                    : "bg-surface-muted text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon
                  name={item.icon}
                  size={14}
                  className={cn(active ? "text-accent" : "text-muted-foreground")}
                />
                <span>{getItemLabel(item)}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Main 2-Column macOS System Settings Layout */}
      <div className="flex flex-col lg:flex-row lg:gap-8 items-start">
        {/* macOS Style Secondary Settings Sidebar */}
        <aside className="hidden lg:block w-60 shrink-0">
          <div className="sticky top-4 space-y-4">
            {/* Sidebar Search Bar */}
            <div className="relative">
              <Icon
                name="search"
                size={14}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
              />
              <input
                type="text"
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                placeholder={
                  (typeof tCommon.has === "function" && tCommon.has("search")
                    ? tCommon("search")
                    : "Search settings...") || "Search settings..."
                }
                className="w-full pl-8 pr-7 py-1.5 text-xs bg-surface-muted/60 border border-border/40 rounded-lg placeholder:text-muted-foreground/60 text-foreground focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-all"
              />
              {filterQuery && (
                <button
                  type="button"
                  onClick={() => setFilterQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground p-0.5"
                  aria-label="Clear search"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Categorized Settings Navigation List */}
            <nav className="space-y-4">
              {categories.map((cat) => (
                <div key={cat.id} className="space-y-1">
                  <p className="px-2.5 text-[10px] font-semibold tracking-wider text-muted-foreground/70 uppercase select-none">
                    {cat.label}
                  </p>
                  <div className="space-y-0.5">
                    {cat.items.map((item) => {
                      const active = isItemActive(item.href);
                      return (
                        <Link
                          key={item.id}
                          href={item.href}
                          className={cn(
                            "group flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-all duration-150",
                            active
                              ? "bg-accent/10 text-accent font-semibold"
                              : "text-foreground/80 hover:bg-surface-muted hover:text-foreground"
                          )}
                        >
                          <Icon
                            name={item.icon}
                            size={16}
                            className={cn(
                              "transition-colors shrink-0",
                              active
                                ? "text-accent"
                                : "text-muted-foreground group-hover:text-foreground"
                            )}
                          />
                          <span className="truncate">{getItemLabel(item)}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}

              {categories.length === 0 && (
                <div className="px-3 py-6 text-center text-xs text-muted-foreground">
                  No matching settings found
                </div>
              )}
            </nav>
          </div>
        </aside>

        {/* Settings Content Area */}
        <main className="flex-1 min-w-0 w-full max-w-4xl pb-12">{children}</main>
      </div>
    </div>
  );
}
