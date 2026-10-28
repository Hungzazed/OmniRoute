/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { Button, Input, Toggle } from "@/shared/components";
import Icon from "@/shared/components/Icon";
import { useTheme } from "@/shared/hooks/useTheme";
import { useIsElectron } from "@/shared/hooks/useElectron";
import {
  COMBO_CONFIG_MODE_SETTING_KEY,
  normalizeComboConfigMode,
  type ComboConfigMode,
} from "@/shared/constants/comboConfigMode";
import { cn } from "@/shared/utils/cn";
import AccountEmailVisibilitySetting from "./AccountEmailVisibilitySetting";

export default function AppearanceTab() {
  const { theme, setTheme, isDark } = useTheme();
  const t = useTranslations("settings");

  const isElectron = useIsElectron();
  const [autostartEnabled, setAutostartEnabled] = useState(false);
  const logoFileRef = useRef<HTMLInputElement>(null);
  const faviconFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isElectron && window.electronAPI) {
      window.electronAPI.getAutostartStatus().then(setAutostartEnabled).catch(console.error);
    }
  }, [isElectron]);

  const [settings, setSettings] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [uploadError, setUploadError] = useState<{
    target: "logo" | "favicon";
    message: string;
  } | null>(null);

  const showQuickStartOnHome = settings.showQuickStartOnHome !== false;
  const showProviderTopologyOnHome = settings.showProviderTopologyOnHome !== false;
  const autoRefreshProviderQuota = settings.autoRefreshProviderQuota === true;
  const autoRefreshProviderQuotaInterval = Number.isFinite(
    settings.autoRefreshProviderQuotaInterval
  )
    ? Number(settings.autoRefreshProviderQuotaInterval)
    : 180;
  const comboConfigMode = normalizeComboConfigMode(settings[COMBO_CONFIG_MODE_SETTING_KEY]);
  const showCloudflaredTunnel = settings.hideEndpointCloudflaredTunnel !== true;
  const showTailscaleFunnel = settings.hideEndpointTailscaleFunnel !== true;
  const showNgrokTunnel = settings.hideEndpointNgrokTunnel !== true;

  const getSettingsLabel = (key: string, fallback: string) =>
    typeof t.has === "function" && t.has(key) ? t(key) : fallback;

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        setSettings(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const updateSetting = async (key: string, value: any) => {
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: value }),
      });
      if (res.ok) {
        setSettings((prev) => ({ ...prev, [key]: value }));
      }
    } catch (err) {
      console.error("Failed to update", key, err);
    }
  };

  const comboConfigModeOptions: Array<{
    id: ComboConfigMode;
    icon: string;
    title: string;
    description: string;
  }> = [
    {
      id: "guided",
      icon: "route",
      title: getSettingsLabel("comboConfigModeGuided", "Guided"),
      description: getSettingsLabel(
        "comboConfigModeGuidedDesc",
        "Step-by-step wizard for configuring models and weights."
      ),
    },
    {
      id: "expert",
      icon: "tune",
      title: getSettingsLabel("comboConfigModeExpert", "Expert"),
      description: getSettingsLabel(
        "comboConfigModeExpertDesc",
        "Unified single-screen view with raw model IDs and full control."
      ),
    },
  ];

  const quotaRefreshInterval = Number.isFinite(autoRefreshProviderQuotaInterval)
    ? Math.min(3600, Math.max(10, Math.floor(autoRefreshProviderQuotaInterval)))
    : 180;

  return (
    <div className="space-y-8">
      {/* Group 1: Appearance & Theme (Visual Previews) */}
      <section className="space-y-2">
        <div className="px-1">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground select-none">
            {getSettingsLabel("themeSection", "Theme & Appearance")}
          </h3>
        </div>

        <div className="rounded-xl border border-border/40 bg-card overflow-hidden shadow-none divide-y divide-border/40">
          {/* Visual Theme Selection Cards */}
          <div className="p-4 sm:p-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {/* Light Theme Card */}
              <button
                type="button"
                onClick={() => setTheme("light")}
                className={cn(
                  "group relative flex flex-col items-center gap-2.5 p-3 rounded-xl border text-left transition-all duration-150",
                  theme === "light"
                    ? "border-accent ring-2 ring-accent/25 bg-accent/5 shadow-xs"
                    : "border-border/50 hover:border-border hover:bg-surface-muted/40"
                )}
              >
                {/* Visual Window - Light */}
                <div className="w-full h-24 rounded-lg border border-zinc-200/90 bg-white overflow-hidden shadow-xs flex flex-col pointer-events-none select-none">
                  <div className="h-4 bg-zinc-100 border-b border-zinc-200/80 px-2 flex items-center gap-1 shrink-0">
                    <div className="size-1.5 rounded-full bg-red-400" />
                    <div className="size-1.5 rounded-full bg-amber-400" />
                    <div className="size-1.5 rounded-full bg-emerald-400" />
                  </div>
                  <div className="flex-1 flex p-2 gap-1.5 bg-zinc-50/70">
                    <div className="w-1/3 bg-zinc-100 rounded flex flex-col gap-1 p-1">
                      <div className="h-1.5 w-3/4 bg-zinc-300 rounded-xs" />
                      <div className="h-1.5 w-1/2 bg-zinc-200 rounded-xs" />
                      <div className="h-1.5 w-2/3 bg-zinc-200 rounded-xs" />
                    </div>
                    <div className="flex-1 bg-white rounded border border-zinc-200/60 p-1.5 flex flex-col gap-1">
                      <div className="h-2 w-2/5 bg-blue-500 rounded-xs" />
                      <div className="h-1.5 w-full bg-zinc-200 rounded-xs" />
                      <div className="h-1.5 w-4/5 bg-zinc-100 rounded-xs" />
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs font-medium text-foreground">
                  <span
                    className={cn(
                      "size-2 rounded-full transition-colors",
                      theme === "light"
                        ? "bg-accent ring-2 ring-accent/30"
                        : "border border-muted-foreground/60"
                    )}
                  />
                  <span>{t("themeLight")}</span>
                </div>
              </button>

              {/* Dark Theme Card */}
              <button
                type="button"
                onClick={() => setTheme("dark")}
                className={cn(
                  "group relative flex flex-col items-center gap-2.5 p-3 rounded-xl border text-left transition-all duration-150",
                  theme === "dark"
                    ? "border-accent ring-2 ring-accent/25 bg-accent/5 shadow-xs"
                    : "border-border/50 hover:border-border hover:bg-surface-muted/40"
                )}
              >
                {/* Visual Window - Dark */}
                <div className="w-full h-24 rounded-lg border border-zinc-800 bg-zinc-950 overflow-hidden shadow-xs flex flex-col pointer-events-none select-none">
                  <div className="h-4 bg-zinc-900 border-b border-zinc-800 px-2 flex items-center gap-1 shrink-0">
                    <div className="size-1.5 rounded-full bg-zinc-700" />
                    <div className="size-1.5 rounded-full bg-zinc-700" />
                    <div className="size-1.5 rounded-full bg-zinc-700" />
                  </div>
                  <div className="flex-1 flex p-2 gap-1.5 bg-zinc-950">
                    <div className="w-1/3 bg-zinc-900 rounded flex flex-col gap-1 p-1">
                      <div className="h-1.5 w-3/4 bg-zinc-700 rounded-xs" />
                      <div className="h-1.5 w-1/2 bg-zinc-800 rounded-xs" />
                      <div className="h-1.5 w-2/3 bg-zinc-800 rounded-xs" />
                    </div>
                    <div className="flex-1 bg-zinc-900 rounded border border-zinc-800 p-1.5 flex flex-col gap-1">
                      <div className="h-2 w-2/5 bg-blue-500 rounded-xs" />
                      <div className="h-1.5 w-full bg-zinc-700 rounded-xs" />
                      <div className="h-1.5 w-4/5 bg-zinc-800 rounded-xs" />
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs font-medium text-foreground">
                  <span
                    className={cn(
                      "size-2 rounded-full transition-colors",
                      theme === "dark"
                        ? "bg-accent ring-2 ring-accent/30"
                        : "border border-muted-foreground/60"
                    )}
                  />
                  <span>{t("themeDark")}</span>
                </div>
              </button>

              {/* Auto / System Theme Card */}
              <button
                type="button"
                onClick={() => setTheme("system")}
                className={cn(
                  "group relative flex flex-col items-center gap-2.5 p-3 rounded-xl border text-left transition-all duration-150",
                  theme === "system"
                    ? "border-accent ring-2 ring-accent/25 bg-accent/5 shadow-xs"
                    : "border-border/50 hover:border-border hover:bg-surface-muted/40"
                )}
              >
                {/* Visual Window - Auto Split */}
                <div className="w-full h-24 rounded-lg border border-zinc-400/30 overflow-hidden shadow-xs flex flex-col pointer-events-none select-none relative">
                  <div className="absolute inset-0 flex">
                    {/* Left half - Light */}
                    <div className="w-1/2 h-full bg-white flex flex-col border-r border-zinc-300 dark:border-zinc-700">
                      <div className="h-4 bg-zinc-100 border-b border-zinc-200 px-1.5 flex items-center gap-1 shrink-0">
                        <div className="size-1.5 rounded-full bg-red-400" />
                        <div className="size-1.5 rounded-full bg-amber-400" />
                      </div>
                      <div className="flex-1 p-1.5 flex flex-col gap-1 bg-zinc-50">
                        <div className="h-1.5 w-3/4 bg-zinc-300 rounded-xs" />
                        <div className="h-1.5 w-1/2 bg-zinc-200 rounded-xs" />
                        <div className="h-2 w-4/5 bg-blue-500 rounded-xs mt-1" />
                      </div>
                    </div>
                    {/* Right half - Dark */}
                    <div className="w-1/2 h-full bg-zinc-950 flex flex-col">
                      <div className="h-4 bg-zinc-900 border-b border-zinc-800 px-1.5 flex items-center justify-end gap-1 shrink-0">
                        <div className="size-1.5 rounded-full bg-zinc-700" />
                      </div>
                      <div className="flex-1 p-1.5 flex flex-col gap-1 bg-zinc-900">
                        <div className="h-1.5 w-3/4 bg-zinc-700 rounded-xs" />
                        <div className="h-1.5 w-1/2 bg-zinc-800 rounded-xs" />
                        <div className="h-2 w-4/5 bg-blue-500 rounded-xs mt-1" />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs font-medium text-foreground">
                  <span
                    className={cn(
                      "size-2 rounded-full transition-colors",
                      theme === "system"
                        ? "bg-accent ring-2 ring-accent/30"
                        : "border border-muted-foreground/60"
                    )}
                  />
                  <span>{t("themeSystem")}</span>
                </div>
              </button>
            </div>
          </div>

          {/* Quick Dark Mode Switch */}
          <div className="flex items-center justify-between gap-4 px-4 py-3.5 hover:bg-surface-muted/30 transition-colors">
            <div>
              <p className="text-sm font-medium text-foreground">{t("darkMode")}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{t("switchThemes")}</p>
            </div>
            <Toggle
              checked={isDark}
              onChange={() => setTheme(isDark ? "light" : "dark")}
              ariaLabel={t("darkMode")}
            />
          </div>
        </div>
      </section>

      {/* Group 2: Home Dashboard Views */}
      <section className="space-y-2">
        <div className="px-1">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground select-none">
            {getSettingsLabel("homePinProviderQuotaToHome", "Home Dashboard Views")}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">{t("homePinnedSectionsDesc")}</p>
        </div>

        <div className="rounded-xl border border-border/40 bg-card overflow-hidden shadow-none divide-y divide-border/40">
          <div className="flex items-center justify-between gap-4 px-4 py-3.5 hover:bg-surface-muted/30 transition-colors">
            <div className="min-w-0 flex-1 pr-4">
              <p className="text-sm font-medium text-foreground">
                {getSettingsLabel("homeQuickStart", "Quick Start Panel")}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {getSettingsLabel(
                  "homeQuickStartDesc",
                  "Show the Quick Start panel on the Home page."
                )}
              </p>
            </div>
            <Toggle
              checked={showQuickStartOnHome}
              ariaLabel={getSettingsLabel("homeQuickStart", "Quick Start Panel")}
              onChange={async (checked) => {
                await updateSetting("showQuickStartOnHome", checked);
              }}
              disabled={loading}
            />
          </div>

          <div className="flex items-center justify-between gap-4 px-4 py-3.5 hover:bg-surface-muted/30 transition-colors">
            <div className="min-w-0 flex-1 pr-4">
              <p className="text-sm font-medium text-foreground">
                {getSettingsLabel("homeProviderTopology", "Provider Topology")}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {getSettingsLabel(
                  "homeProviderTopologyDesc",
                  "Show the Provider Topology on the Home page."
                )}
              </p>
            </div>
            <Toggle
              checked={showProviderTopologyOnHome}
              ariaLabel={getSettingsLabel("homeProviderTopology", "Provider Topology")}
              onChange={async (checked) => {
                await updateSetting("showProviderTopologyOnHome", checked);
              }}
              disabled={loading}
            />
          </div>
        </div>
      </section>

      {/* Group 3: Endpoint Tunnels Visibility */}
      <section className="space-y-2">
        <div className="px-1">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground select-none">
            {getSettingsLabel("endpointTunnelVisibility", "Endpoint Tunnels")}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {getSettingsLabel(
              "endpointTunnelVisibilityDesc",
              "Hide tunnel controls from the Endpoint page without changing tunnel state."
            )}
          </p>
        </div>

        <div className="rounded-xl border border-border/40 bg-card overflow-hidden shadow-none divide-y divide-border/40">
          <div className="flex items-center justify-between gap-4 px-4 py-3.5 hover:bg-surface-muted/30 transition-colors">
            <div className="min-w-0 flex-1 pr-4">
              <p className="text-sm font-medium text-foreground">
                {getSettingsLabel("showCloudflareTunnel", "Cloudflare Quick Tunnel")}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {getSettingsLabel(
                  "showCloudflareTunnelDesc",
                  "Show Cloudflare Quick Tunnel controls on the Endpoint page."
                )}
              </p>
            </div>
            <Toggle
              checked={showCloudflaredTunnel}
              ariaLabel={getSettingsLabel("showCloudflareTunnel", "Cloudflare Quick Tunnel")}
              onChange={(checked) => updateSetting("hideEndpointCloudflaredTunnel", !checked)}
              disabled={loading}
            />
          </div>

          <div className="flex items-center justify-between gap-4 px-4 py-3.5 hover:bg-surface-muted/30 transition-colors">
            <div className="min-w-0 flex-1 pr-4">
              <p className="text-sm font-medium text-foreground">
                {getSettingsLabel("showTailscaleFunnel", "Tailscale Funnel")}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {getSettingsLabel(
                  "showTailscaleFunnelDesc",
                  "Show Tailscale Funnel controls on the Endpoint page."
                )}
              </p>
            </div>
            <Toggle
              checked={showTailscaleFunnel}
              ariaLabel={getSettingsLabel("showTailscaleFunnel", "Tailscale Funnel")}
              onChange={(checked) => updateSetting("hideEndpointTailscaleFunnel", !checked)}
              disabled={loading}
            />
          </div>

          <div className="flex items-center justify-between gap-4 px-4 py-3.5 hover:bg-surface-muted/30 transition-colors">
            <div className="min-w-0 flex-1 pr-4">
              <p className="text-sm font-medium text-foreground">
                {getSettingsLabel("showNgrokTunnel", "ngrok Tunnel")}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {getSettingsLabel(
                  "showNgrokTunnelDesc",
                  "Show ngrok Tunnel controls on the Endpoint page."
                )}
              </p>
            </div>
            <Toggle
              checked={showNgrokTunnel}
              ariaLabel={getSettingsLabel("showNgrokTunnel", "ngrok Tunnel")}
              onChange={(checked) => updateSetting("hideEndpointNgrokTunnel", !checked)}
              disabled={loading}
            />
          </div>
        </div>
      </section>

      {/* Group 4: Combo Configuration Mode */}
      <section className="space-y-2">
        <div className="px-1">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground select-none">
            {getSettingsLabel("comboConfigMode", "Combo Configuration Mode")}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {getSettingsLabel(
              "comboConfigModeDesc",
              "Choose how the combo create and edit dialog is organized."
            )}
          </p>
        </div>

        <div className="rounded-xl border border-border/40 bg-card overflow-hidden shadow-none p-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {comboConfigModeOptions.map((option) => {
              const active = comboConfigMode === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => updateSetting(COMBO_CONFIG_MODE_SETTING_KEY, option.id)}
                  disabled={loading}
                  className={cn(
                    "flex items-start gap-3 p-3.5 rounded-lg border text-left transition-all duration-150",
                    active
                      ? "border-accent ring-1 ring-accent/30 bg-accent/5 shadow-xs"
                      : "border-border/40 hover:border-border hover:bg-surface-muted/30"
                  )}
                >
                  <span
                    className={cn(
                      "flex size-8 shrink-0 items-center justify-center rounded-md transition-colors",
                      active
                        ? "bg-accent text-accent-foreground"
                        : "bg-surface-muted text-muted-foreground"
                    )}
                  >
                    <Icon name={option.icon} size={16} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-semibold text-foreground">{option.title}</p>
                      {active && (
                        <span className="size-1.5 rounded-full bg-accent" />
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-normal">
                      {option.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Group 5: Provider Quota Refresh */}
      <section className="space-y-2">
        <div className="px-1">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground select-none">
            {getSettingsLabel("providerQuotaAutoRefresh", "Provider Quota Auto-Refresh")}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {getSettingsLabel(
              "providerQuotaAutoRefreshDesc",
              "Refresh the Provider Limits view automatically while it stays open."
            )}
          </p>
        </div>

        <div className="rounded-xl border border-border/40 bg-card overflow-hidden shadow-none divide-y divide-border/40">
          <div className="flex items-center justify-between gap-4 px-4 py-3.5 hover:bg-surface-muted/30 transition-colors">
            <div className="min-w-0 flex-1 pr-4">
              <p className="text-sm font-medium text-foreground">
                {getSettingsLabel("providerQuotaAutoRefreshToggle", "Automatic Refresh")}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {getSettingsLabel(
                  "providerQuotaAutoRefreshToggleDesc",
                  "Refresh the quota view periodically while the page is visible."
                )}
              </p>
            </div>
            <Toggle
              checked={autoRefreshProviderQuota}
              ariaLabel={getSettingsLabel("providerQuotaAutoRefreshToggle", "Automatic refresh")}
              onChange={async (checked) => {
                if (checked && !settings.autoRefreshProviderQuotaInterval) {
                  await updateSetting("autoRefreshProviderQuotaInterval", 180);
                }
                await updateSetting("autoRefreshProviderQuota", checked);
              }}
              disabled={loading}
            />
          </div>

          <div className="flex items-center justify-between gap-4 px-4 py-3.5 hover:bg-surface-muted/30 transition-colors">
            <div className="min-w-0 flex-1 pr-4">
              <p className="text-sm font-medium text-foreground">
                {getSettingsLabel("providerQuotaAutoRefreshInterval", "Refresh Interval")}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {getSettingsLabel(
                  "providerQuotaAutoRefreshIntervalDesc",
                  "How often the quota view should refresh, in seconds."
                )}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Input
                type="number"
                aria-label={getSettingsLabel(
                  "providerQuotaAutoRefreshInterval",
                  "Refresh interval"
                )}
                min={10}
                max={3600}
                step={10}
                value={quotaRefreshInterval}
                onChange={async (e) => {
                  const next = Math.min(3600, Math.max(10, Number(e.target.value) || 180));
                  await updateSetting("autoRefreshProviderQuotaInterval", next);
                }}
                disabled={loading || !autoRefreshProviderQuota}
                className="w-24 shrink-0"
              />
              <span className="text-xs text-muted-foreground select-none">{t("seconds")}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Group 6: Privacy & Logs */}
      <section className="space-y-2">
        <div className="px-1">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground select-none">
            {getSettingsLabel("privacyAndLogs", "Privacy & System Logs")}
          </h3>
        </div>

        <div className="rounded-xl border border-border/40 bg-card overflow-hidden shadow-none divide-y divide-border/40">
          <AccountEmailVisibilitySetting />

          <div className="flex items-center justify-between gap-4 px-4 py-3.5 hover:bg-surface-muted/30 transition-colors">
            <div className="min-w-0 flex-1 pr-4">
              <p className="text-sm font-medium text-foreground">{t("hideHealthLogs")}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{t("hideHealthLogsDesc")}</p>
            </div>
            <Toggle
              checked={settings.hideHealthCheckLogs === true}
              ariaLabel={t("hideHealthLogs")}
              onChange={() => updateSetting("hideHealthCheckLogs", !settings.hideHealthCheckLogs)}
              disabled={loading}
            />
          </div>
        </div>
      </section>

      {/* Group 7: Branding & Whitelabeling */}
      <section className="space-y-2">
        <div className="px-1">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground select-none">
            {t("whitelabeling")}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">{t("whitelabelingDesc")}</p>
        </div>

        <div className="rounded-xl border border-border/40 bg-card overflow-hidden shadow-none divide-y divide-border/40">
          {/* App Name */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-4 py-3.5 hover:bg-surface-muted/30 transition-colors">
            <div className="min-w-0 flex-1 pr-4">
              <p className="text-sm font-medium text-foreground">{t("appName")}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{t("appNameDesc")}</p>
            </div>
            <Input
              type="text"
              aria-label={t("appName")}
              value={settings.instanceName || "OmniRoute"}
              onChange={(e) => updateSetting("instanceName", e.target.value)}
              placeholder="OmniRoute"
              maxLength={100}
              className="w-full sm:w-56 shrink-0"
            />
          </div>

          {/* Custom Logo */}
          <div className="px-4 py-3.5 space-y-3 hover:bg-surface-muted/30 transition-colors">
            <div>
              <p className="text-sm font-medium text-foreground">{t("customLogo")}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{t("customLogoDesc")}</p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <Input
                type="text"
                aria-label={t("customLogo")}
                value={settings.customLogoUrl || ""}
                onChange={(e) => updateSetting("customLogoUrl", e.target.value)}
                className="flex-1"
                placeholder="https://example.com/logo.png"
                maxLength={2000}
              />
              <div className="flex items-center gap-2 shrink-0">
                <Input
                  ref={logoFileRef}
                  type="file"
                  aria-label={t("uploadLogo")}
                  accept="image/png,image/jpeg,image/svg+xml,image/gif,image/webp"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      if (file.size > 500 * 1024) {
                        setUploadError({ target: "logo", message: t("logoFileTooLarge") });
                        return;
                      }
                      const validTypes = [
                        "image/png",
                        "image/jpeg",
                        "image/svg+xml",
                        "image/gif",
                        "image/webp",
                      ];
                      if (!validTypes.includes(file.type)) {
                        setUploadError({ target: "logo", message: t("invalidLogoFileType") });
                        return;
                      }
                      setUploadError(null);
                      const reader = new FileReader();
                      reader.onerror = () => {
                        setUploadError({ target: "logo", message: t("failedToReadFile") });
                      };
                      reader.onload = (event) => {
                        const base64 = event.target?.result as string;
                        updateSetting("customLogoBase64", base64);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="hidden"
                  tabIndex={-1}
                />
                <Button
                  variant="outline"
                  size="sm"
                  icon="upload"
                  onClick={() => logoFileRef.current?.click()}
                >
                  {t("uploadLogo")}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    updateSetting("customLogoUrl", "");
                    updateSetting("customLogoBase64", "");
                  }}
                >
                  {t("resetLogo")}
                </Button>
              </div>
            </div>

            {uploadError?.target === "logo" && (
              <p role="alert" className="text-xs text-rose-500 font-medium">
                {uploadError.message}
              </p>
            )}

            {(settings.customLogoBase64 || settings.customLogoUrl) && (
              <div className="flex items-center gap-3 p-2.5 bg-surface-muted/50 rounded-lg border border-border/40 w-fit">
                <img
                  src={settings.customLogoBase64 || settings.customLogoUrl}
                  alt={t("appearanceLogoPreviewAlt")}
                  className="h-8 w-auto max-w-[160px] rounded object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
                <span className="text-[11px] text-muted-foreground">{t("logoPreview")}</span>
              </div>
            )}
          </div>

          {/* Custom Favicon */}
          <div className="px-4 py-3.5 space-y-3 hover:bg-surface-muted/30 transition-colors">
            <div>
              <p className="text-sm font-medium text-foreground">{t("customFavicon")}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{t("customFaviconDesc")}</p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <Input
                type="text"
                aria-label={t("customFavicon")}
                value={settings.customFaviconUrl || ""}
                onChange={(e) => updateSetting("customFaviconUrl", e.target.value)}
                className="flex-1"
                placeholder="https://example.com/favicon.ico"
                maxLength={2000}
              />
              <div className="flex items-center gap-2 shrink-0">
                <Input
                  ref={faviconFileRef}
                  type="file"
                  aria-label={t("uploadFavicon")}
                  accept="image/png,image/x-icon,image/svg+xml,image/gif,image/webp"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      if (file.size > 50 * 1024) {
                        setUploadError({
                          target: "favicon",
                          message: t("faviconFileTooLarge"),
                        });
                        return;
                      }
                      const validTypes = [
                        "image/png",
                        "image/x-icon",
                        "image/svg+xml",
                        "image/gif",
                        "image/webp",
                      ];
                      if (!validTypes.includes(file.type)) {
                        setUploadError({
                          target: "favicon",
                          message: t("invalidFaviconFileType"),
                        });
                        return;
                      }
                      setUploadError(null);
                      const reader = new FileReader();
                      reader.onerror = () => {
                        setUploadError({ target: "favicon", message: t("failedToReadFile") });
                      };
                      reader.onload = (event) => {
                        const base64 = event.target?.result as string;
                        updateSetting("customFaviconBase64", base64);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="hidden"
                  tabIndex={-1}
                />
                <Button
                  variant="outline"
                  size="sm"
                  icon="upload"
                  onClick={() => faviconFileRef.current?.click()}
                >
                  {t("uploadFavicon")}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    updateSetting("customFaviconUrl", "");
                    updateSetting("customFaviconBase64", "");
                  }}
                >
                  {t("resetFavicon")}
                </Button>
              </div>
            </div>

            {uploadError?.target === "favicon" && (
              <p role="alert" className="text-xs text-rose-500 font-medium">
                {uploadError.message}
              </p>
            )}

            {(settings.customFaviconBase64 || settings.customFaviconUrl) && (
              <div className="flex items-center gap-3 p-2 bg-surface-muted/50 rounded-lg border border-border/40 w-fit">
                <img
                  src={settings.customFaviconBase64 || settings.customFaviconUrl}
                  alt={t("appearanceFaviconPreviewAlt")}
                  className="size-6 rounded object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
                <span className="text-[11px] text-muted-foreground">{t("faviconPreview")}</span>
              </div>
            )}
          </div>

          {/* Electron Start on Login */}
          {isElectron && (
            <div className="flex items-center justify-between gap-4 px-4 py-3.5 hover:bg-surface-muted/30 transition-colors">
              <div className="min-w-0 flex-1 pr-4">
                <p className="text-sm font-medium text-foreground">{t("startOnLogin")}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{t("startOnLoginDesc")}</p>
              </div>
              <Toggle
                checked={autostartEnabled}
                ariaLabel={t("startOnLogin")}
                onChange={async (checked) => {
                  if (checked) {
                    const success = await window.electronAPI?.enableAutostart();
                    if (success) setAutostartEnabled(true);
                  } else {
                    const success = await window.electronAPI?.disableAutostart();
                    if (success) setAutostartEnabled(false);
                  }
                }}
              />
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
