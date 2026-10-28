"use client";

import Button from "@/shared/components/Button";
import { cn } from "@/shared/utils/cn";

interface ApiKeyFilterChipProps {
  label: string;
  count?: number;
  isActive: boolean;
  dotColor?: string | null;
  onClick: () => void;
}

export default function ApiKeyFilterChip({
  label,
  count,
  isActive,
  dotColor,
  onClick,
}: ApiKeyFilterChipProps) {
  return (
    <Button
      variant={isActive ? "primary" : "outline"}
      size="sm"
      aria-pressed={isActive}
      onClick={onClick}
      className={cn(
        "gap-1.5 rounded-full text-xs transition-all duration-150",
        isActive
          ? "bg-[#007AFF] text-white hover:bg-[#0071E3] border-transparent shadow-none font-medium"
          : "bg-surface-muted/60 text-text-secondary hover:text-text-main hover:bg-surface-muted border-border/40 font-normal"
      )}
    >
      {dotColor && <span className={cn("size-1.5 rounded-full shrink-0", dotColor)} />}
      <span>{label}</span>
      {count !== undefined && (
        <span
          className={cn(
            "text-[11px] tabular-nums font-mono",
            isActive ? "text-white/80" : "text-text-muted"
          )}
        >
          {count}
        </span>
      )}
    </Button>
  );
}
