"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Button, Input, Select } from "@/shared/components";
import { parseNonNegativeInt } from "./catalogUrlState";

// Shared building blocks of the model and combo filter panels (kit Field + Input/Select
// adapters: the label is a <label htmlFor> above the control).

function humanize(value: string): string {
  return value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replaceAll(/[_-]+/g, " ")
    .replace(/^\w/, (first) => first.toUpperCase());
}

/** Search box, result count and the "clear filters" action above the filter grid. */
export function FilterSearchRow({
  label,
  placeholder,
  query,
  onQueryChange,
  totalCount,
  countLabel,
  hasActiveFilters,
  onClear,
}: {
  label: string;
  placeholder: string;
  query: string;
  onQueryChange: (query: string) => void;
  totalCount: number;
  countLabel: string;
  hasActiveFilters: boolean;
  onClear: () => void;
}) {
  const t = useTranslations("modelCatalog");

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
      <Input
        label={label}
        icon="search"
        placeholder={placeholder}
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        className="min-w-0 flex-1 [&_.ci-field__label]:!text-xs [&_.ci-field__label]:!font-medium [&_.ci-field__label]:!text-text-muted [&_.ci-input-shell]:!bg-surface-muted [&_.ci-input-shell]:!border-border/40 [&_.ci-input-shell]:!rounded-lg [&_.ci-input-shell]:!h-9 [&_.ci-input-shell]:!min-h-9 [&_.ci-input-shell]:focus-within:!border-border-strong [&_.ci-input-shell]:transition-all [&_.ci-input-shell__icon]:!text-text-muted"
        inputClassName="!bg-transparent !text-sm placeholder:!text-text-muted/60"
      />

      <div className="flex items-center gap-3">
        <span className="text-xs font-medium text-text-muted tabular-nums">
          {totalCount} {countLabel}
        </span>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="h-8 rounded-lg px-2.5 text-xs font-medium text-text-muted hover:text-text-main transition-colors"
          >
            {t("clearFilters")}
          </Button>
        )}
      </div>
    </div>
  );
}

export function FilterSelect({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <Select
      label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="gap-1 [&_.ci-field__label]:!text-xs [&_.ci-field__label]:!font-medium [&_.ci-field__label]:!text-text-muted"
      selectClassName="!bg-surface-muted !border-border/40 !rounded-lg !h-8 !min-h-8 !text-xs !py-0 transition-colors focus:!border-border-strong focus:!ring-1 focus:!ring-border-strong cursor-pointer"
    >
      {children}
    </Select>
  );
}

/** One option per value, labelled with the humanized value. */
export function HumanizedOptions({ values }: { values: string[] }) {
  return (
    <>
      {values.map((value) => (
        <option key={value} value={value}>
          {humanize(value)}
        </option>
      ))}
    </>
  );
}

/** The health-test result choices shared by the model and combo filters. */
export function TestResultOptions() {
  const t = useTranslations("modelCatalog");

  return (
    <>
      <option value="all">{t("allResults")}</option>
      <option value="untested">{t("untested")}</option>
      <option value="ok">{t("statusOk")}</option>
      <option value="slow">{t("statusSlow")}</option>
      <option value="error">{t("statusError")}</option>
    </>
  );
}

/** A numeric filter: empty or invalid input clears it (see `parseNonNegativeInt`). */
export function FilterNumberInput({
  label,
  min,
  step,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  min: number;
  step?: number;
  placeholder: string;
  value: number | undefined;
  onChange: (value: number | undefined) => void;
}) {
  return (
    <Input
      type="number"
      label={label}
      min={min}
      step={step}
      placeholder={placeholder}
      value={value ?? ""}
      onChange={(e) => onChange(parseNonNegativeInt(e.target.value))}
      className="gap-1 [&_.ci-field__label]:!text-xs [&_.ci-field__label]:!font-medium [&_.ci-field__label]:!text-text-muted [&_.ci-input-shell]:!bg-surface-muted [&_.ci-input-shell]:!border-border/40 [&_.ci-input-shell]:!rounded-lg [&_.ci-input-shell]:!h-8 [&_.ci-input-shell]:!min-h-8 [&_.ci-input-shell]:focus-within:!border-border-strong transition-all"
      inputClassName="!bg-transparent !text-xs tabular-nums"
    />
  );
}
