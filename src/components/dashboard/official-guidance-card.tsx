"use client";

import { motion, useReducedMotion } from "framer-motion";
import { formatDateTime } from "@/lib/feed/client";
import type { OfficialUpdateFeedItem } from "@/lib/schemas/feed";

type OfficialGuidanceContent = {
  officialTitle: string;
  officialEmpty: string;
  filterNoMatches: string;
  sourceLabel: string;
  publishedLabel: string;
  statusLoading: string;
  updatedLabel: string;
  statusError: string;
};

type OfficialGuidanceCardProps = {
  content: OfficialGuidanceContent;
  filteredLatestOfficialUpdate: OfficialUpdateFeedItem | null;
  rawLatestOfficialUpdate: OfficialUpdateFeedItem | null;
  isLoading: boolean;
  errorMessage: string | null;
  lastUpdated: number | null;
  hasActiveFilters: boolean;
};

export function OfficialGuidanceCard({
  content,
  filteredLatestOfficialUpdate,
  rawLatestOfficialUpdate,
  isLoading,
  errorMessage,
  lastUpdated,
  hasActiveFilters,
}: OfficialGuidanceCardProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.article
      initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.18 }}
      className="border-t border-[var(--border-panel)] bg-[var(--surface-raised)] p-5"
    >
      <h2 className="font-[family-name:var(--font-display)] text-base font-semibold text-sky-300 dark:text-sky-300">
        {content.officialTitle}
      </h2>

      {isLoading && !rawLatestOfficialUpdate ? (
        <p className="mt-2 text-sm text-sky-200/80">{content.statusLoading}</p>
      ) : filteredLatestOfficialUpdate ? (
        <div className="mt-2 space-y-2 text-sm text-sky-100">
          <p className="font-semibold">{filteredLatestOfficialUpdate.title}</p>
          <p className="text-sky-200/90">{filteredLatestOfficialUpdate.body}</p>
          <div className="grid gap-1 rounded-sm border border-sky-800/30 bg-black/15 px-3 py-2 text-xs text-sky-200 sm:grid-cols-2">
            <p>
              {content.sourceLabel}: {filteredLatestOfficialUpdate.sourceName}
            </p>
            <p>
              {content.publishedLabel}:{" "}
              {formatDateTime(filteredLatestOfficialUpdate.publishedAt)}
            </p>
          </div>
        </div>
      ) : (
        <p className="mt-2 text-sm text-slate-400">
          {hasActiveFilters && rawLatestOfficialUpdate
            ? content.filterNoMatches
            : content.officialEmpty}
        </p>
      )}

      {errorMessage ? (
        <p className="mt-3 text-xs text-sky-300">{errorMessage}</p>
      ) : null}

      {lastUpdated ? (
        <p className="mt-3 text-xs text-slate-500">
          {content.updatedLabel}: {formatDateTime(lastUpdated)}
        </p>
      ) : null}
    </motion.article>
  );
}

export type { OfficialGuidanceContent };
