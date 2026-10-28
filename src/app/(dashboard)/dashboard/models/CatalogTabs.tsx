"use client";

import { Tabs, TabsList, TabsTrigger } from "@omniroute/ui-kit/tabs";
import { cn } from "@/shared/utils/cn";
import type { CatalogTab } from "./catalogUrlState";

const TAB_ORDER: CatalogTab[] = ["models", "combos"];

export function catalogTabId(tab: CatalogTab): string {
  return `tab-${tab}`;
}

export function catalogPanelId(tab: CatalogTab): string {
  return `panel-${tab}`;
}

/**
 * Apple macOS/iOS-style Segmented Control (WAI-ARIA tablist; the kit owns roving
 * tabindex and Arrow/Home/End keyboard navigation).
 * Rendered with clean surface-muted track, subtle border, and raised active segment.
 */
export default function CatalogTabs({
  activeTab,
  onSelect,
  labels,
  ariaLabel,
}: {
  activeTab: CatalogTab;
  onSelect: (tab: CatalogTab) => void;
  labels: Record<CatalogTab, string>;
  ariaLabel: string;
}) {
  return (
    <div className="mt-2 flex items-center">
      <Tabs
        value={activeTab}
        onValueChange={(next) => onSelect(next as CatalogTab)}
        className="inline-flex"
      >
        <TabsList
          aria-label={ariaLabel}
          className="inline-flex h-9 items-center gap-1 rounded-lg bg-surface-muted p-1 border border-border/40 shadow-xs"
        >
          {TAB_ORDER.map((tab) => {
            const isActive = tab === activeTab;
            return (
              <TabsTrigger
                key={tab}
                value={tab}
                id={catalogTabId(tab)}
                aria-controls={isActive ? catalogPanelId(tab) : undefined}
                className={cn(
                  "relative inline-flex h-7 items-center justify-center rounded-md px-3.5 text-xs sm:text-sm font-medium transition-all duration-150 ease-out",
                  isActive
                    ? "!bg-surface !text-text-main !border-transparent shadow-xs font-semibold"
                    : "!bg-transparent !text-text-muted hover:!text-text-main !border-transparent"
                )}
              >
                {labels[tab]}
              </TabsTrigger>
            );
          })}
        </TabsList>
      </Tabs>
    </div>
  );
}
