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
  healthy: "bg-emerald-500",
  degraded: "bg-md3-secondary",
  down: "bg-rose-500",
  unknown: "bg-md3-outline",
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
    <motion.section
      initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.06 }}
      className="rounded-lg bg-md3-surface-container-low p-4"
    >
      <h3 className="mb-4 font-[family-name:var(--font-label)] text-[10px] uppercase tracking-[0.2em] text-md3-outline">
        {content.sourceHealthTitle}
      </h3>

      <ul className="space-y-3">
        {sourceHealthTypeOrder.map((sourceType) => {
          const category = sourceHealthCategoriesByType.get(sourceType);
          const status = category?.status ?? "unknown";

          return (
            <li key={sourceType} className="flex items-center justify-between">
              <span className="text-xs font-medium text-md3-on-surface">
                {sourceHealthTypeLabels[sourceType]}
              </span>
              <motion.span
                className={`inline-block h-2 w-2 rounded-full ${healthDotColor[status]}`}
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
                title={getSourceHealthStatusLabel(status, content.sourceHealthStatuses)}
              />
            </li>
          );
        })}
      </ul>

      {errorMessage ? (
        <p className="mt-3 text-xs text-md3-error">{content.statusError}</p>
      ) : null}

      {lastUpdated ? (
        <p className="mt-3 text-[10px] text-md3-outline">
          {content.updatedLabel}: {formatDateTime(lastUpdated)}
        </p>
      ) : null}
    </motion.section>
  );
}

export type { SourceHealthBarContent };
