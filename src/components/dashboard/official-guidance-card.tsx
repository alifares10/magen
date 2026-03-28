"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Info, CheckCircle } from "lucide-react";
import { formatDateTime } from "@/lib/feed/client";
import type { OfficialUpdateFeedItem } from "@/lib/schemas/feed";
import { stripHtml } from "@/lib/strip-html";

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
      className="rounded-xl border-e-4 border-md3-primary bg-md3-surface-container-low p-6"
    >
      <div className="mb-4 flex items-center gap-3">
        <Info className="h-5 w-5 text-md3-primary" />
        <h2 className="text-lg font-bold text-md3-on-surface">
          {content.officialTitle}
        </h2>
      </div>

      {isLoading && !rawLatestOfficialUpdate ? (
        <p className="text-sm text-md3-on-surface-variant">{content.statusLoading}</p>
      ) : filteredLatestOfficialUpdate ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <p className="font-semibold text-md3-on-surface">{filteredLatestOfficialUpdate.title}</p>
            <p className="mt-2 text-sm leading-relaxed text-md3-on-surface-variant">
              {stripHtml(filteredLatestOfficialUpdate.body)}
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3 rounded border border-md3-outline-variant/10 bg-md3-surface-container p-2">
              <CheckCircle className="h-4 w-4 text-md3-on-surface" />
              <span className="font-[family-name:var(--font-label)] text-xs uppercase">
                {content.sourceLabel}: {filteredLatestOfficialUpdate.sourceName}
              </span>
            </div>
            <div className="flex items-center gap-3 rounded border border-md3-outline-variant/10 bg-md3-surface-container p-2">
              <CheckCircle className="h-4 w-4 text-md3-on-surface" />
              <span className="font-[family-name:var(--font-label)] text-xs uppercase">
                {content.publishedLabel}: {formatDateTime(filteredLatestOfficialUpdate.publishedAt)}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-sm text-md3-outline">
          {hasActiveFilters && rawLatestOfficialUpdate
            ? content.filterNoMatches
            : content.officialEmpty}
        </p>
      )}

      {errorMessage ? (
        <p className="mt-3 text-xs text-md3-error">{errorMessage}</p>
      ) : null}

      {lastUpdated ? (
        <p className="mt-3 text-xs text-md3-outline">
          {content.updatedLabel}: {formatDateTime(lastUpdated)}
        </p>
      ) : null}
    </motion.article>
  );
}

export type { OfficialGuidanceContent };
