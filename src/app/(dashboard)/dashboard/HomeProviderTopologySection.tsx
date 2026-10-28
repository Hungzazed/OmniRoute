"use client";

import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";

import { Card } from "@/shared/components";
import { useLiveRequests } from "@/hooks/useLiveDashboard";
import { selectActiveRequests } from "../home/topologyUtils";

const ProviderTopology = dynamic(() => import("../home/ProviderTopology"), { ssr: false });

type TopologyProvider = {
  id: string;
  provider: string;
  name?: string;
  /** Connection-health base state, so the topology can colour a node at rest. */
  status?: "active" | "error" | "idle";
};

export function HomeProviderTopologySection({
  providers,
  lastProvider,
  errorProvider,
  enabled = true,
}: {
  providers: TopologyProvider[];
  lastProvider: string;
  errorProvider: string;
  enabled?: boolean;
}) {
  const t = useTranslations("home");
  // #4596: gate the live-WS connection so it only opens while the topology
  // section is actually shown on the home page.
  const { activeRequests: liveActiveRequests } = useLiveRequests({ enabled });
  const activeRequests = selectActiveRequests(liveActiveRequests);
  const activeProviderCount = new Set(activeRequests.map(({ provider }) => provider)).size;

  return (
    <Card className="rounded-xl border border-border/40 bg-surface/80 backdrop-blur-md p-4 sm:p-5 shadow-xs">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4">
        <div>
          <h2 className="text-sm sm:text-base font-semibold tracking-tight text-text-main">
            {t("providerTopology")}
          </h2>
          <p className="text-xs text-text-muted mt-0.5">
            {t("activeError", { active: activeProviderCount, errors: errorProvider ? 1 : 0 })}
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs text-text-muted">
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-emerald-500" />
            {t("topologyLegendActive")}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-amber-500" />
            {t("topologyLegendRecent")}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-rose-500" />
            {t("topologyLegendError")}
          </span>
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <ProviderTopology
          providers={providers}
          activeRequests={activeRequests}
          lastProvider={lastProvider}
          errorProvider={errorProvider}
        />
      </div>
    </Card>
  );
}
