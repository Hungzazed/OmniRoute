"use client";

import { useState, useCallback } from "react";
import Icon from "@/shared/components/Icon";
import { cn } from "@/shared/utils/cn";

export interface CodeSnippetBoxProps {
  code: string;
  language?: string;
  title?: string;
  copyLabel?: string;
  copiedLabel?: string;
  className?: string;
}

/**
 * Apple Minimalist Code Snippet Box
 * Flat monospaced code container with neutral background (bg-surface-muted / dark slate),
 * subtle 1px border, and a refined Copy button with smooth checkmark feedback.
 */
export default function CodeSnippetBox({
  code,
  language = "cURL",
  title,
  copyLabel = "Copy",
  copiedLabel = "Copied",
  className,
}: CodeSnippetBoxProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback if clipboard API fails
      try {
        const textArea = document.createElement("textarea");
        textArea.value = code;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // Silent fail
      }
    }
  }, [code]);

  return (
    <div
      className={cn(
        "group relative rounded-xl border border-border/50 bg-surface-muted/80 dark:bg-[#161618] overflow-hidden text-left",
        className
      )}
    >
      {/* Snippet Header */}
      <div className="flex items-center justify-between px-3.5 py-2 border-b border-border/40 bg-surface/50 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono font-medium uppercase tracking-wider text-text-muted">
            {title || language}
          </span>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          aria-label={copied ? copiedLabel : copyLabel}
          className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all duration-150",
            copied
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              : "text-text-muted hover:text-text-main hover:bg-surface border border-transparent hover:border-border/40"
          )}
        >
          <Icon
            name={copied ? "check" : "content_copy"}
            size={13}
            className={cn(
              "transition-transform duration-150",
              copied ? "scale-110 text-emerald-600 dark:text-emerald-400" : ""
            )}
          />
          <span>{copied ? copiedLabel : copyLabel}</span>
        </button>
      </div>

      {/* Code Area */}
      <pre className="p-3.5 text-[12.5px] font-mono leading-relaxed text-text-main dark:text-zinc-200 overflow-x-auto whitespace-pre select-all scrollbar-thin">
        <code>{code}</code>
      </pre>
    </div>
  );
}
