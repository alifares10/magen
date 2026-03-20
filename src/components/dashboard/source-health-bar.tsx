"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { SourceHealthStatus, SourceHealthType } from "@/lib/schemas/feed";
import { formatDateTime } from "@/lib/feed/client";
import { getSourceHealthStatusLabel } from "@/lib/feed/transforms";
import { sourceHealthTypeOrder } from "@/components/dashboard/hooks/use-source-health";

type SourceHealthBarContent = {
  sourceHealthTitle: string;
  sourceHealthOverallLabel: string;
  sourceHealthTypes: {
    officialAlerts: string;
    officialGuidance: string;
    rssNews: string;
  };
  sourceHealthStatuses: {
    healthy: string;
    degraded: string;
    down: string;
    unknown: string;
  };
  statusError: string;
  updatedLabel: string;
};

type SourceHealthBarProps = {
  content: SourceHealthBarContent;
  sourceHealthCategoriesByType: Map<SourceHealthType, { sourceType: SourceHealthType; status: SourceHealthStatus }>;
  overallSourceHealthStatus: SourceHealthStatus;
  errorMessage: string | null;
  lastUpdated: number | null;
};

const healthDotColor: Record<SourceHealthStatus, string> = {
  healthy: "bg-emerald-400",
  degraded: "bg-amber-400",
  down: "bg-rose-500",
  unknown: "bg-slate-500",
};

export function SourceHealthBar({
  content,
  sourceHealthCategoriesByType,
  errorMessage,
  lastUpdated,
}: SourceHealthBarProps) {
  const prefersReducedMotion = useReducedMotion();
  const sourceHealthTypeLabels: Record<SourceHealthType, string> = {
    official_alerts: content.sourceHealthTypes.officialAlerts,
    official_guidance: content.sourceHealthTypes.officialGuidance,
    rss_news: content.sourceHealthTypes.rssNews,
  };

  return (
    <motion.div
      initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.06 }}
      className="flex flex-col gap-3 border-b border-[var(--border-panel)] bg-[var(--surface-raised)] p-4"
    >
      <h2 className="font-[family-name:var(--font-display)] text-xs font-semibold uppercase tracking-wider text-slate-400">
        {content.sourceHealthTitle}
      </h2>

      <div className="flex flex-col gap-2">
        {sourceHealthTypeOrder.map((sourceType) => {
          const category = sourceHealthCategoriesByType.get(sourceType);
          const status = category?.status ?? "unknown";

          return (
            <div key={sourceType} className="flex items-center justify-between gap-2 text-xs">
              <span className="text-slate-400">{sourceHealthTypeLabels[sourceType]}</span>
              <span className="flex items-center gap-1.5">
                <motion.span
                  className={`inline-block h-1.5 w-1.5 rounded-full ${healthDotColor[status]}`}
                  animate={
                    status === "healthy" && !prefersReducedMotion
                      ? { scale: [1, 1.3, 1] }
                      : undefined
                  }
                  transition={
                    status === "healthy"
                      ? { duration: 2, repeat: Infinity, ease: "easeInOut" }
                      : undefined
                  }
                />
                <span className="text-slate-300">
                  {getSourceHealthStatusLabel(status, content.sourceHealthStatuses)}
                </span>
              </span>
            </div>
          );
        })}
      </div>

      {errorMessage ? (
        <p className="text-xs text-rose-400">{content.statusError}</p>
      ) : null}

      {lastUpdated ? (
        <p className="text-[10px] text-slate-600">
          {content.updatedLabel}: {formatDateTime(lastUpdated)}
        </p>
      ) : null}
    </motion.div>
  );
}

export type { SourceHealthBarContent };
