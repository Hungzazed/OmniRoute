"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { DataTableFooter } from "@omniroute/ui-kit/data-table-shell";
import { TableCell, TableHead } from "@omniroute/ui-kit/table";
import { Button, Checkbox } from "@/shared/components";

// Cells and footer shared by the model and combo catalog tables (kit Table cells, Checkbox
// adapter, kit DataTableFooter).

/** A column heading without sorting. */
export function PlainHeading({ children }: { children: ReactNode }) {
  return (
    <TableHead scope="col" className="px-4 py-3 text-xs font-medium text-text-muted select-none">
      {children}
    </TableHead>
  );
}

/** The right-aligned heading above the per-row test buttons. */
export function ActionsHeading() {
  const t = useTranslations("modelCatalog");
  return (
    <TableHead
      scope="col"
      className="px-4 py-3 text-right text-xs font-medium text-text-muted select-none"
    >
      {t("actions")}
    </TableHead>
  );
}

/** Page-wide selection checkbox; `indeterminate` marks a partly selected page. */
export function SelectAllHeaderCell({
  checked,
  indeterminate,
  onToggle,
  label,
}: {
  checked: boolean;
  indeterminate: boolean;
  onToggle: () => void;
  label: string;
}) {
  return (
    <TableHead scope="col" className="w-10 px-4 py-3">
      {/* The adapter forwards `indeterminate` as the kit prop (not a ref callback: the kit
          effect would overwrite a ref-set value). */}
      <Checkbox
        checked={checked}
        indeterminate={indeterminate}
        onChange={onToggle}
        aria-label={label}
      />
    </TableHead>
  );
}

export function SelectRowCell({
  checked,
  onToggle,
  label,
}: {
  checked: boolean;
  onToggle: () => void;
  label: string;
}) {
  return (
    <TableCell className="w-10 px-4 py-3.5 align-middle">
      <Checkbox checked={checked} onChange={onToggle} aria-label={label} />
    </TableCell>
  );
}

/** Result summary (the children) plus previous/next paging under a catalog table. */
export function CatalogTableFooter({
  page,
  pageCount,
  onPrevious,
  onNext,
  children,
}: {
  page: number;
  pageCount: number;
  onPrevious: () => void;
  onNext: () => void;
  children: ReactNode;
}) {
  const t = useTranslations("modelCatalog");
  return (
    <DataTableFooter
      className="border-t border-border/40 px-4 py-3 bg-surface/30"
      metadata={
        <p className="text-xs text-text-muted" aria-live="polite">
          {children}
        </p>
      }
      pagination={
        <div className="flex items-center gap-2.5">
          <span className="text-xs text-text-muted">{t("page", { page, pageCount })}</span>
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={onPrevious}
            className="h-7 rounded-lg px-2.5 text-xs font-medium border-border/40 hover:bg-surface-muted transition-colors"
          >
            {t("previous")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= pageCount}
            onClick={onNext}
            className="h-7 rounded-lg px-2.5 text-xs font-medium border-border/40 hover:bg-surface-muted transition-colors"
          >
            {t("next")}
          </Button>
        </div>
      }
    />
  );
}
