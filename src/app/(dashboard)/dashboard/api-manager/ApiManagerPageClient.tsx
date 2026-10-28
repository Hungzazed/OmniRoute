"use client";

import Icon from "@/shared/components/Icon";

import { useState, useEffect, useMemo, useCallback, useRef, useId } from "react";
import Link from "next/link";
import { Alert } from "@omniroute/ui-kit/alert";
import { PageHeader } from "@omniroute/ui-kit/page-header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@omniroute/ui-kit/table";
import Button from "@/shared/components/Button";
import Card from "@/shared/components/Card";
import Input from "@/shared/components/Input";
import { CardSkeleton } from "@/shared/components/Loading";
import Modal from "@/shared/components/Modal";
import Toggle from "@/shared/components/Toggle";
import { useCopyToClipboard } from "@/shared/hooks/useCopyToClipboard";
import { useLocale, useTranslations } from "next-intl";
import { matchesSearch } from "@/shared/utils/turkishText";
import { cn } from "@/shared/utils/cn";
import ApiKeyFilterBar from "./components/ApiKeyFilterBar";
import CodeSnippetBox from "./components/CodeSnippetBox";
import {
  isKeyActive,
  isExpired,
  isRestricted as isKeyRestricted,
  computeApiKeyCounts,
  formatProviderModelPermissionSummary,
  formatUsdCost,
  restoreProviderScopeSelection,
  toggleKeyVisibility,
} from "./apiManagerPageUtils";
import type { KeyStatus, KeyType } from "./apiManagerPageUtils";
import { readActiveOnlyPreference, writeActiveOnlyPreference } from "./apiManagerPageStorage";
import { buildApiKeyCreateScopes } from "./apiManagerScopes";
import { extractApiErrorMessage } from "@/shared/http/apiErrorMessage";
import { hasProviderQuotaBypassScope } from "@/shared/constants/apiKeyPolicyScopes";
import RoutingEntryLink from "@/shared/components/routing/RoutingEntryLink";
import { ALL_COMBOS_ACCESS_RULE } from "@/shared/constants/comboAccess";

// Constants for validation
const MAX_KEY_NAME_LENGTH = 200;

// Sanitize user input to prevent XSS
function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, "")
    .replace(/"/g, "")
    .replace(/'/g, "")
    .trim()
    .slice(0, MAX_KEY_NAME_LENGTH);
}

// Validate key name
function validateKeyName(
  name: string,
  t: (key: string, values?: Record<string, unknown>) => string
): { valid: boolean; error?: string } {
  if (!name || !name.trim()) {
    return { valid: false, error: t("keyNameRequired") };
  }
  if (name.length > MAX_KEY_NAME_LENGTH) {
    return { valid: false, error: t("keyNameTooLong", { max: MAX_KEY_NAME_LENGTH }) };
  }
  // Allow Unicode letters (accented chars), numbers, spaces, hyphens, underscores
  if (!/^[\p{L}\p{N}_\-\s]+$/u.test(name)) {
    return {
      valid: false,
      error: t("keyNameInvalid"),
    };
  }
  return { valid: true };
}

interface AccessSchedule {
  enabled: boolean;
  from: string;
  until: string;
  days: number[];
  tz: string;
}

type StreamDefaultMode = "legacy" | "json";

interface ApiKey {
  id: string;
  name: string;
  key: string;
  allowedModels: string[] | null;
  /** Public shape: "all" | "restricted". Absent on legacy keys. */
  modelAccessMode?: "all" | "restricted" | null;
  blockedModels?: string[] | null;
  allowedCombos: string[] | null;
  allowedConnections: string[] | null;
  noLog?: boolean;
  autoResolve?: boolean;
  isActive?: boolean;
  throttleDelayMs?: number | null;
  isBanned?: boolean;
  expiresAt?: string | null;
  maxSessions?: number;
  accessSchedule?: AccessSchedule | null;
  rateLimits?: Array<{ limit: number; window: number }> | null;
  scopes?: string[];
  allowedEndpoints?: string[];
  streamDefaultMode?: StreamDefaultMode;
  compressionEnabled?: boolean;
  allowAutoCombos?: boolean;
  allowCcDiscoveryAliases?: boolean;
  catalogScope?: string;
  disableNonPublicModels?: boolean;
  allowUsageCommand?: boolean;
  chaosModeEnabled?: boolean;
  usageLimitEnabled?: boolean;
  dailyUsageLimitUsd?: number | null;
  weeklyUsageLimitUsd?: number | null;
  allowedQuotas?: string[] | null;
  createdAt: string;
}

interface KeyUsageStats {
  totalRequests: number;
  totalCost: number;
  lastUsed: string | null;
}

export default function ApiManagerPageClient() {
  const t = useTranslations("apiManager");
  const tc = useTranslations("common");
  const locale = useLocale();
  const newKeyNameInputId = useId();
  const createKeyFormRef = useRef<HTMLDivElement | null>(null);
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyManageEnabled, setNewKeyManageEnabled] = useState(false);
  const [newKeySelfUsageEnabled, setNewKeySelfUsageEnabled] = useState(true);
  const [newKeyAccountQuotaEnabled, setNewKeyAccountQuotaEnabled] = useState(false);
  const [newKeyAllowUsageCommand, setNewKeyAllowUsageCommand] = useState(false);
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [usageStats, setUsageStats] = useState<Record<string, KeyUsageStats>>({});
  const [sessionCounts, setSessionCounts] = useState<Record<string, number>>({});
  const [deviceCounts, setDeviceCounts] = useState<Record<string, number>>({});
  const [allowKeyReveal, setAllowKeyReveal] = useState(false);
  // Per-row API key visibility toggle (eye / eye-off). Keys default to masked.
  // Map id -> fully revealed key string fetched on demand from /api/keys/{id}/reveal.
  const [revealedKeys, setRevealedKeys] = useState<Map<string, string>>(new Map());
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const createKeyNameFieldRef = useRef<HTMLDivElement | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [activeOnly, setActiveOnly] = useState(false);
  const [statusFilter, setStatusFilter] = useState<KeyStatus | null>(null);
  const [typeFilter, setTypeFilter] = useState<KeyType | null>(null);
  const [quotaPoolGroup, setQuotaPoolGroup] = useState<Record<string, string>>({});
  const [showQuickStart, setShowQuickStart] = useState(false);
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "http://localhost:20128";

  const { copied, copy } = useCopyToClipboard();

  const scrollCreateKeyFormToTop = useCallback(() => {
    const scrollContainer = createKeyFormRef.current?.parentElement;
    if (scrollContainer instanceof HTMLElement) {
      scrollContainer.scrollTop = 0;
    }

    const input = document.getElementById(newKeyNameInputId);
    input?.scrollIntoView({ block: "nearest", inline: "nearest" });
    input?.focus({ preventScroll: true });
  }, [newKeyNameInputId]);

  useEffect(() => {
    if (!showAddModal || !nameError) return;
    requestAnimationFrame(() => {
      createKeyNameFieldRef.current?.scrollIntoView({ block: "center", behavior: "instant" });
    });
  }, [nameError, showAddModal]);

  useEffect(() => {
    // Hydrate the persisted preference after mount, behind an async boundary
    // (react-hooks/set-state-in-effect) — same post-hydration timing as before.
    void (async () => {
      await Promise.resolve();
      setActiveOnly(readActiveOnlyPreference());
    })();
  }, []);

  useEffect(() => {
    writeActiveOnlyPreference(activeOnly);
  }, [activeOnly]);

  useEffect(() => {
    let cancelled = false;
    const loadQuotaGroups = async () => {
      try {
        const [poolsRes, groupsRes] = await Promise.all([
          fetch("/api/quota/pools"),
          fetch("/api/quota/groups"),
        ]);
        if (!poolsRes.ok || !groupsRes.ok) return;
        const poolsData = await poolsRes.json();
        const groupsData = await groupsRes.json();
        const pools: Array<{ id: string; groupId: string }> = Array.isArray(poolsData.pools)
          ? poolsData.pools
          : [];
        const groups: Array<{ id: string; name: string }> = Array.isArray(groupsData.groups)
          ? groupsData.groups
          : [];
        const groupNameById: Record<string, string> = {};
        for (const g of groups) {
          groupNameById[g.id] = g.name;
        }
        const map: Record<string, string> = {};
        for (const p of pools) {
          if (groupNameById[p.groupId]) {
            map[p.id] = groupNameById[p.groupId];
          }
        }
        if (!cancelled) setQuotaPoolGroup(map);
      } catch {
        // fail open — quota group chips simply won't render
      }
    };
    loadQuotaGroups();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!showAddModal || !nameError) return;

    const timeout = window.setTimeout(() => {
      scrollCreateKeyFormToTop();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [showAddModal, nameError, scrollCreateKeyFormToTop]);

  const fetchUsageStats = async (apiKeys: ApiKey[]) => {
    if (apiKeys.length === 0) return;
    try {
      // view=apiKeys returns only per-key lifetime totals and last use, computed
      // server-side in one query; the full analytics report blocks the server for
      // seconds on large usage histories.
      const res = await fetch("/api/usage/analytics?range=all&view=apiKeys");
      const totals: Array<{
        apiKeyId: string;
        requests: number;
        cost: number;
        lastUsed: string | null;
      }> = res.ok ? (await res.json()).byApiKey || [] : [];
      const totalsById = new Map(totals.map((entry) => [entry.apiKeyId, entry]));
      const stats: Record<string, KeyUsageStats> = {};
      for (const key of apiKeys) {
        const entry = totalsById.get(key.id);
        const cost = Number(entry?.cost);
        stats[key.id] = {
          totalRequests: Number(entry?.requests) || 0,
          totalCost: Number.isFinite(cost) ? cost : 0,
          lastUsed: entry?.lastUsed || null,
        };
      }
      setUsageStats(stats);
    } catch (e) {
      console.log("Error fetching usage stats:", e);
    }
  };

  const fetchSessionCounts = async (apiKeys: ApiKey[]) => {
    if (apiKeys.length === 0) {
      setSessionCounts({});
      return;
    }
    try {
      const res = await fetch("/api/sessions");
      if (!res.ok) return;
      const data = await res.json();
      const byApiKeyRaw =
        data && typeof data.byApiKey === "object" && !Array.isArray(data.byApiKey)
          ? data.byApiKey
          : {};
      const normalized: Record<string, number> = {};
      for (const key of apiKeys) {
        const value = byApiKeyRaw[key.id];
        normalized[key.id] =
          typeof value === "number" && Number.isFinite(value) && value > 0 ? value : 0;
      }
      setSessionCounts(normalized);
    } catch (error) {
      console.log("Error fetching session counts:", error);
    }
  };

  // Per-key device/connection counts (port of upstream 9router#931, thanks
  // @mugnimaestra). One lightweight GET per key against
  // /api/keys/[id]/devices — device counts are in-memory + TTL-evicted, so
  // this is a much smaller payload than session data.
  const fetchDeviceCounts = async (apiKeys: ApiKey[]) => {
    if (apiKeys.length === 0) {
      setDeviceCounts({});
      return;
    }
    try {
      const results = await Promise.all(
        apiKeys.map(async (key) => {
          try {
            const res = await fetch(`/api/keys/${encodeURIComponent(key.id)}/devices`);
            if (!res.ok) return [key.id, 0] as const;
            const data = await res.json();
            const count =
              typeof data?.count === "number" && Number.isFinite(data.count) ? data.count : 0;
            return [key.id, count] as const;
          } catch {
            return [key.id, 0] as const;
          }
        })
      );
      setDeviceCounts(Object.fromEntries(results));
    } catch (error) {
      console.log("Error fetching device counts:", error);
    }
  };

  // fetchData calls the three per-key fetchers above — declared after them so the
  // calls are not TDZ reads (react-hooks/immutability).
  const fetchData = async () => {
    try {
      const res = await fetch("/api/keys");
      if (res.ok) {
        const data = await res.json();
        setKeys(data.keys || []);
        setAllowKeyReveal(data.allowKeyReveal === true);
        // Fetch usage stats after keys are loaded
        fetchUsageStats(data.keys || []);
        fetchSessionCounts(data.keys || []);
        fetchDeviceCounts(data.keys || []);
      }
    } catch (error) {
      console.log("Error fetching keys:", error);
    } finally {
      setLoading(false);
    }
  };

  // Initial dashboard load — placed after the fetcher declarations so the effect does
  // not read them in their TDZ (react-hooks/immutability), behind an async boundary
  // (react-hooks/set-state-in-effect).
  useEffect(() => {
    void (async () => {
      await fetchData();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initial dashboard load only
  }, []);

  const clearPageError = useCallback(() => setPageError(null), []);

  const keyCounts = useMemo(() => computeApiKeyCounts(keys), [keys]);

  const filteredKeys = useMemo(() => {
    let list = keys;

    // 1. activeOnly toggle (shortcut for the most common case)
    if (activeOnly) {
      list = list.filter(isKeyActive);
    }

    // 2. status chip filter
    if (statusFilter === "active") list = list.filter(isKeyActive);
    else if (statusFilter === "disabled") list = list.filter((k) => k.isActive === false);
    else if (statusFilter === "banned") list = list.filter((k) => k.isBanned === true);
    else if (statusFilter === "expired") list = list.filter(isExpired);

    // 3. type chip filter
    if (typeFilter === "manage") list = list.filter((k) => k.scopes?.includes("manage"));
    else if (typeFilter === "restricted") list = list.filter(isKeyRestricted);
    else if (typeFilter === "standard")
      list = list.filter((k) => !k.scopes?.includes("manage") && !isKeyRestricted(k));

    // 4. search query (case-insensitive substring on name and key)
    if (searchQuery.trim()) {
      list = list.filter(
        (k) => matchesSearch(k.name, searchQuery) || matchesSearch(k.key, searchQuery)
      );
    }

    return list;
  }, [keys, activeOnly, statusFilter, typeFilter, searchQuery]);

  const isFiltered =
    activeOnly || statusFilter !== null || typeFilter !== null || searchQuery.trim() !== "";

  const isQuotaKey = (k: ApiKey) => Array.isArray(k.allowedQuotas) && k.allowedQuotas.length > 0;
  const quotaKeys = filteredKeys.filter(isQuotaKey);
  const normalKeys = filteredKeys.filter((k) => !isQuotaKey(k));

  const quotaGroupsForKey = (k: ApiKey): string[] => {
    if (!Array.isArray(k.allowedQuotas)) return [];
    const seen = new Set<string>();
    const result: string[] = [];
    for (const poolId of k.allowedQuotas) {
      const groupName = quotaPoolGroup[poolId];
      if (groupName && !seen.has(groupName)) {
        seen.add(groupName);
        result.push(groupName);
      }
    }
    return result;
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setActiveOnly(false);
    setStatusFilter(null);
    setTypeFilter(null);
  };

  const handleCreateKey = async () => {
    // Validate raw input first, then sanitize
    const validation = validateKeyName(newKeyName, t);
    if (!validation.valid) {
      scrollCreateKeyFormToTop();
      setNameError(validation.error || t("invalidKeyName"));
      return;
    }
    const sanitizedName = sanitizeInput(newKeyName);

    setIsSubmitting(true);
    setNameError(null);
    setCreateError(null);

    try {
      const res = await fetch("/api/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: sanitizedName,
          scopes: buildApiKeyCreateScopes({
            manageEnabled: newKeyManageEnabled,
            selfUsageEnabled: newKeySelfUsageEnabled,
            selfAccountQuotaEnabled: newKeyAccountQuotaEnabled,
          }),
          allowUsageCommand: newKeyAllowUsageCommand,
        }),
      });
      const data = await res.json();

      if (res.ok) {
        setCreatedKey(data.key);
        await fetchData();
        setNewKeyName("");
        setNewKeyManageEnabled(false);
        setNewKeySelfUsageEnabled(true);
        setNewKeyAccountQuotaEnabled(false);
        setNewKeyAllowUsageCommand(false);
        setShowAddModal(false);
      } else {
        setCreateError(extractApiErrorMessage(data, t("failedCreateKey")));
      }
    } catch (error) {
      console.error("Error creating key:", error);
      setCreateError(t("failedCreateKeyRetry"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteKey = async (id: string) => {
    if (!id || typeof id !== "string" || !/^[a-zA-Z0-9_-]+$/.test(id)) {
      setPageError(t("invalidKeyId"));
      return;
    }

    if (!confirm(t("deleteConfirm"))) return;

    setIsSubmitting(true);
    clearPageError();

    try {
      const res = await fetch(`/api/keys/${encodeURIComponent(id)}`, { method: "DELETE" });
      if (res.ok) {
        setKeys((prev) => prev.filter((k) => k.id !== id));
        // Clean up any cached reveal/visibility state for this key.
        setRevealedKeys((prev) => {
          if (!prev.has(id)) return prev;
          const next = new Map(prev);
          next.delete(id);
          return next;
        });
        setVisibleKeys((prev) => (prev.has(id) ? toggleKeyVisibility(prev, id) : prev));
      } else {
        const data = await res.json();
        setPageError(extractApiErrorMessage(data, t("failedDeleteKey")));
      }
    } catch (error) {
      console.error("Error deleting key:", error);
      setPageError(t("failedDeleteKeyRetry"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegenerateKey = async (id: string) => {
    if (!id) return;
    if (!confirm(t("regenerateConfirm"))) return;

    setIsSubmitting(true);
    clearPageError();

    try {
      const res = await fetch(`/api/keys/${encodeURIComponent(id)}/regenerate`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setCreatedKey(data.key);
        await fetchData();
      } else {
        setPageError(extractApiErrorMessage(data, t("failedRegenerateKey")));
      }
    } catch (error) {
      console.error("Error regenerating key:", error);
      setPageError(t("failedRegenerateKeyRetry"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyExistingKey = async (keyId: string) => {
    if (!keyId) return;

    try {
      const res = await fetch(`/api/keys/${encodeURIComponent(keyId)}/reveal`);
      if (!res.ok) {
        console.log("Error revealing key:", await res.text());
        return;
      }

      const data = await res.json();
      if (typeof data?.key === "string") {
        // Cache the revealed value so a subsequent show-toggle does not refetch.
        setRevealedKeys((prev) => {
          const next = new Map(prev);
          next.set(keyId, data.key);
          return next;
        });
        await copy(data.key, `existing_key_${keyId}`);
      }
    } catch (error) {
      console.log("Error copying existing key:", error);
    }
  };

  /**
   * Toggle the visibility of one key inline (eye / eye-off button).
   * Lazy-fetches the full key from /api/keys/{id}/reveal on the FIRST show,
   * then caches it in `revealedKeys` so re-toggling is instant. Hiding only
   * flips the visibility set — the cached reveal stays so a re-show is free.
   */
  const handleToggleKeyVisibility = async (keyId: string) => {
    if (!keyId) return;
    const isCurrentlyVisible = visibleKeys.has(keyId);

    if (!isCurrentlyVisible && !revealedKeys.has(keyId)) {
      try {
        const res = await fetch(`/api/keys/${encodeURIComponent(keyId)}/reveal`);
        if (!res.ok) {
          console.log("Error revealing key:", await res.text());
          return;
        }
        const data = await res.json();
        if (typeof data?.key !== "string") return;
        setRevealedKeys((prev) => {
          const next = new Map(prev);
          next.set(keyId, data.key);
          return next;
        });
      } catch (error) {
        console.log("Error revealing key:", error);
        return;
      }
    }

    setVisibleKeys((prev) => toggleKeyVisibility(prev, keyId));
  };

  if (loading) {
    // The skeleton cards are aria-hidden, so without this status wrapper the page
    // has no accessible content at all until /api/keys settles (#12066).
    return (
      <div className="flex flex-col gap-8" role="status" aria-live="polite" aria-busy="true">
        <span className="sr-only">{tc("loading")}</span>
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Error Banner */}
      {pageError && (
        <Alert
          variant="critical"
          icon={<Icon name="error" />}
          description={pageError}
          dismissLabel={tc("close")}
          onDismiss={clearPageError}
        />
      )}

      {/* Purpose-first Page Header */}
      <div className="flex flex-col gap-3">
        <PageHeader
          compact
          title={t("keyManagement")}
          description={t("keyManagementDesc")}
          actions={
            <Button
              onClick={() => setShowAddModal(true)}
              icon="add"
              className="bg-[#007AFF] text-white hover:bg-[#0071E3] rounded-lg font-medium shadow-none transition-colors border-0 shrink-0"
            >
              {t("createKey")}
            </Button>
          }
        />
        <div
          className="flex flex-wrap items-center gap-2 text-xs text-text-muted"
          aria-label={t("requestFlowAria")}
        >
          <span className="rounded-full border border-border/40 bg-surface-muted/60 px-2.5 py-1 font-medium text-text-secondary">
            {t("requestFlowYourApp")}
          </span>
          <Icon name="arrow_forward" className="text-sm text-text-muted/60" />
          <span className="rounded-full border border-border/40 bg-surface-muted/60 px-2.5 py-1 font-medium text-text-secondary">
            {t("requestFlowApiKey")}
          </span>
          <Icon name="arrow_forward" className="text-sm text-text-muted/60" />
          <span className="rounded-full border border-border/40 bg-surface-muted/60 px-2.5 py-1 font-medium text-text-secondary">
            {t("requestFlowOmniRoute")}
          </span>
        </div>
      </div>

      <RoutingEntryLink />

      {/* Quick Start / cURL Snippet Card */}
      <Card padding="sm" className="border-border/40 bg-surface shadow-none">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon name="terminal" size={16} className="text-text-muted" />
              <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                cURL Integration Example
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowQuickStart(!showQuickStart)}
              className="text-xs text-text-muted hover:text-text-main flex items-center gap-1 font-medium transition-colors"
            >
              <span>{showQuickStart ? tc("close") : "Show Snippet"}</span>
              <Icon name={showQuickStart ? "expand_less" : "expand_more"} size={16} />
            </button>
          </div>
          {showQuickStart && (
            <CodeSnippetBox
              title="cURL Request Example"
              language="cURL"
              copyLabel={tc("copy")}
              copiedLabel={tc("copied")}
              code={`curl ${baseUrl}/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -d '{
    "model": "gpt-4o",
    "messages": [
      {
        "role": "user",
        "content": "Hello OmniRoute!"
      }
    ]
  }'`}
            />
          )}
        </div>
      </Card>

      {/* Filter Bar — shown when there are keys */}
      {keys.length > 0 && (
        <ApiKeyFilterBar
          counts={keyCounts}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          activeOnly={activeOnly}
          onActiveOnlyChange={setActiveOnly}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          typeFilter={typeFilter}
          onTypeChange={setTypeFilter}
        />
      )}

      {/* Keys List Card */}
      <Card className="border-border/40 bg-surface shadow-none">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-4 border-b border-border/40">
          <div>
            <h2 className="text-[15px] font-semibold tracking-tight text-text-main flex items-center gap-2">
              {t("registeredKeys")}
              <span className="text-xs font-normal text-text-muted tabular-nums">
                {isFiltered
                  ? `(${t("shownOf", { shown: filteredKeys.length, total: keys.length })})`
                  : `(${keys.length})`}
              </span>
            </h2>
            <p className="text-xs text-text-muted mt-0.5">
              {keys.length === 1
                ? t("keyRegistered", { count: keys.length })
                : t("keysRegistered", { count: keys.length })}
              {" — "}
              {t("keysSecurityNote")}
            </p>
          </div>
          <Button
            icon="add"
            onClick={() => {
              setNameError(null);
              setCreateError(null);
              clearPageError();
              setShowAddModal(true);
            }}
            className="bg-[#007AFF] text-white hover:bg-[#0071E3] rounded-lg font-medium shadow-none transition-colors border-0 shrink-0"
          >
            {t("createKey")}
          </Button>
        </div>

        {keys.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-border/60 rounded-xl bg-surface-muted/20">
            <div className="inline-flex items-center justify-center size-12 rounded-full bg-surface-muted text-text-muted mb-3 border border-border/40">
              <Icon name="vpn_key" size={24} />
            </div>
            <p className="text-text-main font-semibold mb-1 text-sm">{t("noKeys")}</p>
            <p className="text-xs text-text-muted mb-4 max-w-sm mx-auto">{t("noKeysDesc")}</p>
            <Button
              icon="add"
              onClick={() => {
                setNameError(null);
                setCreateError(null);
                setShowAddModal(true);
              }}
              className="bg-[#007AFF] text-white hover:bg-[#0071E3] rounded-lg font-medium shadow-none border-0 transition-colors"
            >
              {t("createFirstKey")}
            </Button>
          </div>
        ) : filteredKeys.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-border/60 rounded-xl bg-surface-muted/20">
            <div className="inline-flex items-center justify-center size-12 rounded-full bg-surface-muted text-text-muted mb-3 border border-border/40">
              <Icon name="search_off" size={24} />
            </div>
            <p className="text-text-main font-semibold mb-2 text-sm">{t("emptyFilterTitle")}</p>
            <Button onClick={handleClearFilters} variant="outline" size="sm" className="rounded-lg">
              {t("emptyFilterClear")}
            </Button>
          </div>
        ) : (
          (() => {
            const renderKeyRow = (key: ApiKey) => {
              const stats = usageStats[key.id];
              const isRestricted = isKeyRestricted(key);
              const isModelRestricted =
                key.modelAccessMode === "restricted" ||
                (Array.isArray(key.allowedModels) && key.allowedModels.length > 0);
              const { providerWildcards, exactModels } = restoreProviderScopeSelection(
                Array.isArray(key.allowedModels) ? key.allowedModels : []
              );
              const providerCount = providerWildcards.length;
              const modelCount = exactModels.length;
              const hasComboRestrictions =
                Array.isArray(key.allowedCombos) &&
                !key.allowedCombos.includes(ALL_COMBOS_ACCESS_RULE);
              const hasConnectionRestrictions =
                Array.isArray(key.allowedConnections) && key.allowedConnections.length > 0;
              const hasExclusiveLeaseScope =
                Array.isArray(key.scopes) && key.scopes.includes("lease:exclusive");
              const noLogEnabled = key.noLog === true;
              const keyIsActive = key.isActive !== false; // default true
              const throttleDelayMs =
                typeof key.throttleDelayMs === "number" && key.throttleDelayMs > 0
                  ? key.throttleDelayMs
                  : 0;
              const hasThrottle = throttleDelayMs > 0;
              const hasManageScope = Array.isArray(key.scopes) && key.scopes.includes("manage");
              const hasProviderQuotaBypass = hasProviderQuotaBypassScope(key.scopes);
              const hasJsonStreamDefault = key.streamDefaultMode === "json";
              const hasLocalUsageCommand = key.allowUsageCommand === true;
              const maxSessions = typeof key.maxSessions === "number" ? key.maxSessions : 0;
              const hasSessionLimit = maxSessions > 0;
              const activeSessions = sessionCounts[key.id] || 0;
              const deviceCount = deviceCounts[key.id] || 0;
              const hasSchedule = key.accessSchedule?.enabled === true;
              const keyIsQuota = isQuotaKey(key);
              const groups = quotaGroupsForKey(key);
              const visibleGroups = groups.slice(0, 3);
              const extraGroupCount = groups.length - visibleGroups.length;
              return (
                <TableRow
                  key={key.id}
                  className="group hover:bg-surface-muted/40 transition-colors"
                >
                  <TableCell className="max-w-48 font-medium">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "size-2 rounded-full shrink-0",
                          !keyIsActive || key.isBanned
                            ? "bg-rose-500"
                            : isRestricted
                              ? "bg-amber-500"
                              : "bg-emerald-500"
                        )}
                        title={
                          !keyIsActive ? t("disabled") : isRestricted ? "Restricted" : "Active"
                        }
                      />
                      <span
                        className="text-sm font-semibold truncate text-text-main"
                        title={key.name}
                      >
                        {key.name}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-64">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-muted/70 dark:bg-zinc-800/60 border border-border/40">
                      <code className="text-xs font-mono text-text-main dark:text-zinc-200 truncate select-all">
                        {visibleKeys.has(key.id) ? (revealedKeys.get(key.id) ?? key.key) : key.key}
                      </code>
                      {allowKeyReveal ? (
                        <div className="flex items-center gap-0.5 ml-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleToggleKeyVisibility(key.id)}
                            className="p-1 rounded text-text-muted hover:text-text-main hover:bg-surface transition-colors"
                            title={visibleKeys.has(key.id) ? t("hideKey") : t("showKey")}
                            aria-label={visibleKeys.has(key.id) ? t("hideKey") : t("showKey")}
                            aria-pressed={visibleKeys.has(key.id)}
                          >
                            <Icon
                              name={visibleKeys.has(key.id) ? "visibility_off" : "visibility"}
                              size={14}
                            />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCopyExistingKey(key.id)}
                            className="p-1 rounded text-text-muted hover:text-text-main hover:bg-surface transition-colors"
                            title={tc("copy")}
                            aria-label={tc("copy")}
                          >
                            <Icon
                              name={copied === `existing_key_${key.id}` ? "check" : "content_copy"}
                              size={14}
                              className={
                                copied === `existing_key_${key.id}` ? "text-emerald-500" : ""
                              }
                            />
                          </button>
                        </div>
                      ) : (
                        <span
                          className="p-1 text-text-muted/40 shrink-0 cursor-help"
                          title={t("keyOnlyAvailableAtCreation")}
                        >
                          <Icon name="lock" size={13} />
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap items-center gap-1.5 max-w-sm">
                      {/* QUOTA differentiation chips — prepended before existing badges */}
                      {keyIsQuota && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20 text-[11px] font-medium">
                          {t("quotaModeOnly")}
                        </span>
                      )}
                      {keyIsQuota &&
                        visibleGroups.map((groupName) => (
                          <span
                            key={groupName}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-muted text-text-secondary border border-border/40 text-[11px] font-medium truncate max-w-[120px]"
                          >
                            {groupName}
                          </span>
                        ))}
                      {keyIsQuota && extraGroupCount > 0 && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-surface-muted text-text-muted border border-border/40 text-[11px] font-medium">
                          +{extraGroupCount}
                        </span>
                      )}
                      {/* Existing badges */}
                      {isModelRestricted ? (
                        <Link
                          href={`/dashboard/api-manager/${encodeURIComponent(key.id)}/access?tab=models`}
                          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-[11px] font-medium hover:bg-amber-500/20 transition-colors"
                        >
                          <Icon name="lock" size={12} />
                          {formatProviderModelPermissionSummary(providerCount, modelCount, t, tc)}
                        </Link>
                      ) : (
                        <Link
                          href={`/dashboard/api-manager/${encodeURIComponent(key.id)}/access?tab=models`}
                          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-surface-muted text-text-secondary border border-border/40 text-[11px] font-medium hover:text-text-main transition-colors"
                        >
                          <Icon name="lock_open" size={12} />
                          {t("allModels")}
                        </Link>
                      )}
                      {hasConnectionRestrictions && (
                        <Link
                          href={`/dashboard/api-manager/${encodeURIComponent(key.id)}/access?tab=connections`}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-muted text-text-secondary border border-border/40 text-[11px] font-medium hover:text-text-main transition-colors"
                        >
                          <Icon name="cable" size={12} />
                          {key.allowedConnections!.length} conn
                        </Link>
                      )}
                      {hasExclusiveLeaseScope && (
                        <Link
                          href={`/dashboard/api-manager/${encodeURIComponent(key.id)}/access`}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20 text-[11px] font-medium hover:bg-violet-500/20 transition-colors"
                        >
                          <Icon name="key_vertical" size={12} />
                          {t("exclusiveLease")}
                        </Link>
                      )}
                      {hasComboRestrictions && (
                        <Link
                          href={`/dashboard/api-manager/${encodeURIComponent(key.id)}/access?tab=combos`}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-muted text-text-secondary border border-border/40 text-[11px] font-medium hover:text-text-main transition-colors"
                        >
                          <Icon name="hub" size={12} />
                          {key.allowedCombos!.length} combos
                        </Link>
                      )}
                      {noLogEnabled && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-muted text-text-muted border border-border/40 text-[11px] font-medium">
                          <Icon name="visibility_off" size={11} />
                          No-Log
                        </span>
                      )}
                      {key.autoResolve && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-muted text-text-muted border border-border/40 text-[11px] font-medium">
                          <Icon name="auto_fix_high" size={11} />
                          Auto-Resolve
                        </span>
                      )}
                      {hasJsonStreamDefault && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-muted text-text-muted border border-border/40 text-[11px] font-medium">
                          <Icon name="data_object" size={11} />
                          {t("streamDefaultBadge")}
                        </span>
                      )}
                      {hasLocalUsageCommand && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-muted text-text-muted border border-border/40 text-[11px] font-medium">
                          <Icon name="terminal" size={11} />
                          {t("localUsageCommandBadge")}
                        </span>
                      )}
                      {key.usageLimitEnabled === true && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[11px] font-medium">
                          <Icon name="paid" size={11} />
                          USD quota
                        </span>
                      )}
                      {hasProviderQuotaBypass && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-[11px] font-medium">
                          <Icon name="alt_route" size={11} />
                          Bypass quota
                        </span>
                      )}
                      {hasSessionLimit && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-muted text-text-muted border border-border/40 text-[11px] font-medium">
                          <Icon name="group" size={11} />
                          {activeSessions}/{maxSessions} sess
                        </span>
                      )}
                      {deviceCount > 0 && (
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-muted text-text-muted border border-border/40 text-[11px] font-medium"
                          title={t("devicesTooltip", { count: deviceCount })}
                        >
                          <Icon name="devices" size={11} />
                          {t("devicesCount", { count: deviceCount })}
                        </span>
                      )}
                      {hasThrottle && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-[11px] font-medium">
                          <Icon name="speed" size={11} />+{throttleDelayMs}ms
                        </span>
                      )}
                      {hasManageScope && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-[11px] font-medium">
                          <Icon name="admin_panel_settings" size={11} />
                          manage
                        </span>
                      )}
                      {!keyIsActive && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-[11px] font-medium">
                          <Icon name="block" size={11} />
                          {t("disabled")}
                        </span>
                      )}
                      {hasSchedule && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-[11px] font-medium">
                          <Icon name="schedule" size={11} />
                          {t("scheduleActive")}
                        </span>
                      )}
                      {key.isBanned && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 text-[11px] font-bold">
                          <Icon name="gavel" size={11} />
                          BANNED
                        </span>
                      )}
                      {key.expiresAt && new Date(key.expiresAt).getTime() < Date.now() && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-muted text-text-muted border border-border/40 text-[11px] font-medium">
                          <Icon name="event_busy" size={11} />
                          EXPIRED
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col justify-center">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-sm font-semibold tabular-nums text-text-main">
                          {(stats?.totalRequests ?? 0).toLocaleString(locale)}
                        </span>
                        <span className="text-text-muted font-normal text-xs">{t("reqs")}</span>
                        {(stats?.totalCost ?? 0) > 0 && (
                          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium tabular-nums ml-1">
                            {formatUsdCost(stats?.totalCost ?? 0, locale)}
                          </span>
                        )}
                      </div>
                      {key.usageLimitEnabled === true && (
                        <div className="text-[11px] text-text-muted mt-0.5 tabular-nums">
                          {key.dailyUsageLimitUsd != null && (
                            <span>Limit: ${key.dailyUsageLimitUsd}/day</span>
                          )}
                          {key.weeklyUsageLimitUsd != null && (
                            <span className="ml-1.5">(${key.weeklyUsageLimitUsd}/wk)</span>
                          )}
                        </div>
                      )}
                      <div className="text-[11px] text-text-muted mt-0.5">
                        {stats?.lastUsed ? (
                          <span>
                            {t("lastUsedOn", {
                              date: new Date(stats.lastUsed).toLocaleDateString(locale),
                            })}
                          </span>
                        ) : (
                          <span className="italic">{t("neverUsed")}</span>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-text-muted tabular-nums whitespace-nowrap">
                    {new Date(key.createdAt).toLocaleDateString(locale, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </TableCell>
                  {/* Actions column */}
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <a
                        href={`/dashboard/costs?range=all&apiKeyIds=${encodeURIComponent(key.id)}&groupBy=model`}
                        className="p-1.5 hover:bg-surface-muted rounded-md text-text-muted hover:text-emerald-600 dark:hover:text-emerald-400 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all inline-flex items-center justify-center"
                        title={`View costs for ${key.name}`}
                        aria-label={`View costs for ${key.name}`}
                      >
                        <Icon name="payments" size={17} />
                      </a>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleRegenerateKey(key.id)}
                        className="text-text-muted hover:text-amber-600 dark:hover:text-amber-400 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 rounded-md"
                        title={t("regenerateKey")}
                        aria-label={t("regenerateKey")}
                        icon="refresh"
                      />
                      <Link
                        href={`/dashboard/api-manager/${encodeURIComponent(key.id)}/access`}
                        className="p-1.5 hover:bg-surface-muted rounded-md text-text-muted hover:text-[#007AFF] opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all inline-flex items-center justify-center"
                        title={t("editPermissions")}
                      >
                        <Icon name="tune" size={17} />
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleDeleteKey(key.id)}
                        className="text-text-muted hover:text-rose-600 dark:hover:text-rose-400 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 rounded-md"
                        title={t("deleteKey")}
                        aria-label={t("deleteKey")}
                        icon="delete"
                      />
                    </div>
                  </TableCell>
                </TableRow>
              );
            };

            const tableHeader = (
              <TableHeader>
                <TableRow className="border-b border-border/40 bg-surface-muted/30">
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                    {t("name")}
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                    {t("key")}
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                    {t("permissions")}
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                    {t("usage")}
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                    {t("created")}
                  </TableHead>
                  <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-text-muted">
                    {t("actions")}
                  </TableHead>
                </TableRow>
              </TableHeader>
            );

            return (
              <div className="flex flex-col gap-4">
                {normalKeys.length > 0 && (
                  <div>
                    {/* Normal keys section heading */}
                    <div className="flex items-center gap-2 mb-2">
                      <Icon name="vpn_key" className="text-base text-text-muted" />
                      <span className="text-sm font-medium text-text-main">
                        {t("normalKeysSection")}
                      </span>
                      <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-surface-muted border border-border/40 text-[11px] font-semibold text-text-muted tabular-nums">
                        {normalKeys.length}
                      </span>
                    </div>
                    <Table scrollbarLabel={t("normalKeysSection")}>
                      {tableHeader}
                      <TableBody>{normalKeys.map(renderKeyRow)}</TableBody>
                    </Table>
                  </div>
                )}
                {quotaKeys.length > 0 && (
                  <div>
                    {/* Quota keys section heading */}
                    <div className="flex items-center gap-2 mb-2">
                      <Icon name="toll" className="text-base text-violet-500" />
                      <span className="text-sm font-medium text-text-main">
                        {t("quotaKeysSection")}
                      </span>
                      <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-surface-muted border border-border/40 text-[11px] font-semibold text-text-muted tabular-nums">
                        {quotaKeys.length}
                      </span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20 text-[11px] font-semibold">
                        {t("quotaPill")}
                      </span>
                    </div>
                    <Table scrollbarLabel={t("quotaKeysSection")}>
                      {tableHeader}
                      <TableBody>{quotaKeys.map(renderKeyRow)}</TableBody>
                    </Table>
                  </div>
                )}
              </div>
            );
          })()
        )}
      </Card>

      {/* Add Key Modal */}
      <Modal
        isOpen={showAddModal}
        title={t("createKey")}
        bodyClassName="p-6 max-h-[calc(100vh-150px)] overflow-y-auto"
        onClose={() => {
          setShowAddModal(false);
          setNewKeyName("");
          setNewKeyManageEnabled(false);
          setNewKeySelfUsageEnabled(true);
          setNewKeyAccountQuotaEnabled(false);
          setNewKeyAllowUsageCommand(false);
          setNameError(null);
          setCreateError(null);
        }}
      >
        <div ref={createKeyFormRef} className="flex flex-col gap-4">
          <div ref={createKeyNameFieldRef}>
            <Input
              label={t("keyName")}
              id={newKeyNameInputId}
              value={newKeyName}
              onChange={(e) => {
                setNewKeyName(e.target.value);
                setNameError(null);
              }}
              placeholder={t("keyNamePlaceholder")}
              maxLength={MAX_KEY_NAME_LENGTH}
              error={nameError}
              autoFocus
              hint={t("keyNameDesc")}
            />
          </div>
          <div className="flex items-start justify-between gap-3 p-3.5 rounded-xl border border-border/40 bg-surface-muted/40">
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium text-text-main">{t("managementAccess")}</p>
              <p className="text-xs text-text-muted">{t("managementAccessDesc")}</p>
            </div>
            <Toggle
              size="sm"
              className="shrink-0"
              checked={newKeyManageEnabled}
              onChange={setNewKeyManageEnabled}
              ariaLabel={t("managementAccess")}
            />
          </div>
          <div className="flex flex-col gap-3 p-3.5 rounded-xl border border-border/40 bg-surface-muted/40">
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium text-text-main">{t("selfServiceVisibility")}</p>
              <p className="text-xs text-text-muted">{t("selfServiceVisibilityDesc")}</p>
            </div>
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-col gap-1">
                <p className="text-sm text-text-main">{t("ownUsageVisibility")}</p>
                <p className="text-xs text-text-muted">{t("ownUsageVisibilityDesc")}</p>
              </div>
              <Toggle
                size="sm"
                className="shrink-0"
                checked={newKeySelfUsageEnabled}
                onChange={() =>
                  setNewKeySelfUsageEnabled((prev) => {
                    if (prev) setNewKeyAccountQuotaEnabled(false);
                    return !prev;
                  })
                }
                ariaLabel={t("ownUsageVisibility")}
              />
            </div>
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-col gap-1">
                <p className="text-sm text-text-main">{t("sharedAccountQuotaVisibility")}</p>
                <p className="text-xs text-text-muted">{t("sharedAccountQuotaVisibilityDesc")}</p>
              </div>
              <Toggle
                size="sm"
                className="shrink-0"
                checked={newKeyAccountQuotaEnabled}
                disabled={!newKeySelfUsageEnabled}
                onChange={setNewKeyAccountQuotaEnabled}
                ariaLabel={t("sharedAccountQuotaVisibility")}
              />
            </div>
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-col gap-1">
                <p className="text-sm text-text-main">{t("localUsageCommand")}</p>
                <p className="text-xs text-text-muted">{t("localUsageCommandDesc")}</p>
              </div>
              <Toggle
                size="sm"
                className="shrink-0"
                checked={newKeyAllowUsageCommand}
                onChange={setNewKeyAllowUsageCommand}
                ariaLabel={t("localUsageCommand")}
              />
            </div>
          </div>
          {createError && (
            <Alert
              variant="critical"
              icon={<Icon name="error" />}
              description={createError}
              dismissLabel={tc("close")}
              onDismiss={() => setCreateError(null)}
            />
          )}
          <div className="flex gap-2 pt-2 border-t border-border/40">
            <Button
              onClick={() => {
                setShowAddModal(false);
                setNewKeyName("");
                setNewKeyManageEnabled(false);
                setNewKeySelfUsageEnabled(true);
                setNewKeyAccountQuotaEnabled(false);
                setNewKeyAllowUsageCommand(false);
                setNameError(null);
                setCreateError(null);
              }}
              variant="ghost"
              fullWidth
            >
              {tc("cancel")}
            </Button>
            <Button
              onClick={handleCreateKey}
              fullWidth
              disabled={!newKeyName.trim()}
              loading={isSubmitting}
              className="bg-[#007AFF] text-white hover:bg-[#0071E3] rounded-lg font-medium shadow-none border-0 transition-colors"
            >
              {t("createKey")}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Created Key Modal */}
      <Modal isOpen={!!createdKey} title={t("keyCreated")} onClose={() => setCreatedKey(null)}>
        <div className="flex flex-col gap-4">
          <Alert
            variant="success"
            icon={<Icon name="check_circle" />}
            title={t("keyCreatedSuccess")}
            description={t("keyCreatedNote")}
            dismissLabel={tc("close")}
          />
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-text-muted">{t("apiKey")}</span>
            <div className="flex items-center justify-between p-3 rounded-xl bg-surface-muted border border-border/50">
              <code className="font-mono text-xs text-text-main truncate select-all font-semibold">
                {createdKey}
              </code>
              <Button
                variant="secondary"
                size="sm"
                icon={copied === "created_key" ? "check" : "content_copy"}
                onClick={() => copy(createdKey, "created_key")}
                className="shrink-0 ml-2"
              >
                {copied === "created_key" ? tc("copied") : tc("copy")}
              </Button>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-text-muted">cURL Request Example</span>
            <CodeSnippetBox
              title="cURL Request Example"
              language="cURL"
              copyLabel={tc("copy")}
              copiedLabel={tc("copied")}
              code={`curl ${baseUrl}/v1/chat/completions \\
  -H "Authorization: Bearer ${createdKey || "YOUR_API_KEY"}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "gpt-4o",
    "messages": [
      {
        "role": "user",
        "content": "Hello OmniRoute!"
      }
    ]
  }'`}
            />
          </div>
          <Button
            onClick={() => setCreatedKey(null)}
            fullWidth
            className="bg-[#007AFF] text-white hover:bg-[#0071E3] rounded-lg font-medium shadow-none border-0 transition-colors"
          >
            {t("done")}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
