"use client";

import { motion, useReducedMotion } from "framer-motion";
import { formatDateTime, getAlertLocation } from "@/lib/feed/client";
import type { AlertFeedItem } from "@/lib/schemas/feed";

type AlertHeroContent = {
  latestAlertTitle: string;
  latestAlertEmpty: string;
  alertMessageFallback: string;
  filterNoMatches: string;
  locationLabel: string;
  sourceLabel: string;
  severityLabel: string;
  publishedLabel: string;
  statusLoading: string;
  updatedLabel: string;
};

type AlertHeroProps = {
  content: AlertHeroContent;
  filteredLatestAlert: AlertFeedItem | null;
  rawLatestAlert: AlertFeedItem | null;
  isLoading: boolean;
  errorMessage: string | null;
  lastUpdated: number | null;
  hasActiveFilters: boolean;
};

export function AlertHero({
  content,
  filteredLatestAlert,
  rawLatestAlert,
  isLoading,
  errorMessage,
  lastUpdated,
  hasActiveFilters,
}: AlertHeroProps) {
  const prefersReducedMotion = useReducedMotion();
  const hasAlert = Boolean(filteredLatestAlert);

  return (
    <motion.article
      initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.12 }}
      className={`relative min-h-48 overflow-hidden px-5 pb-5 pt-4 ${
        hasAlert
          ? "border-s-4 border-rose-500 bg-gradient-to-br from-[oklch(0.18_0.06_15)] to-[oklch(0.12_0.04_20)]"
          : "bg-[var(--surface-raised)]"
      }`}
      style={
        hasAlert && !prefersReducedMotion
          ? {
              boxShadow: "inset 0 0 30px oklch(0.55 0.22 15 / 8%), 0 0 20px oklch(0.55 0.22 15 / 5%)",
            }
          : undefined
      }
    >
      <h2 className="font-[family-name:var(--font-display)] text-base font-semibold text-rose-100 dark:text-rose-100">
        {content.latestAlertTitle}
      </h2>

      {isLoading && !rawLatestAlert ? (
        <p className="mt-2 text-sm text-rose-200/80">{content.statusLoading}</p>
      ) : filteredLatestAlert ? (
        <div className="mt-3 space-y-3 text-sm">
          <p className="font-[family-name:var(--font-display)] text-lg font-bold text-rose-50">
            {filteredLatestAlert.title}
          </p>
          <p className="text-rose-100/90">
            {filteredLatestAlert.message?.trim().length
              ? filteredLatestAlert.message
              : content.alertMessageFallback}
          </p>
          <div className="grid gap-1 rounded-sm border border-rose-800/40 bg-black/20 px-3 py-2 text-xs text-rose-200 sm:grid-cols-2">
            <p>
              {content.locationLabel}: {getAlertLocation(filteredLatestAlert)}
            </p>
            <p>
              {content.sourceLabel}: {filteredLatestAlert.sourceName}
            </p>
            <p>
              {content.severityLabel}: {filteredLatestAlert.severity}
            </p>
            <p>
              {content.publishedLabel}: {formatDateTime(filteredLatestAlert.publishedAt)}
            </p>
          </div>
        </div>
      ) : (
        <div className="mt-4 flex items-center gap-2">
          {!hasActiveFilters && !rawLatestAlert ? (
            <>
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M3.5 7L6 9.5L10.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <p className="text-sm text-slate-300">{content.latestAlertEmpty}</p>
            </>
          ) : (
            <p className="text-sm text-slate-400">
              {hasActiveFilters && rawLatestAlert
                ? content.filterNoMatches
                : content.latestAlertEmpty}
            </p>
          )}
        </div>
      )}

      {errorMessage ? (
        <p className="mt-3 text-xs text-rose-300">{errorMessage}</p>
      ) : null}

      {lastUpdated ? (
        <p className="mt-3 text-xs text-slate-500">
          {content.updatedLabel}: {formatDateTime(lastUpdated)}
        </p>
      ) : null}
    </motion.article>
  );
}

export type { AlertHeroContent };
