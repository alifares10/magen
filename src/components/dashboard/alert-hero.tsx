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
      className={`relative min-h-48 overflow-hidden rounded-xl p-6 ${
        hasAlert
          ? "border-e-4 border-md3-error bg-md3-surface-container-high shadow-[0_0_40px_-10px_rgba(255,180,171,0.15)]"
          : "flex flex-col justify-center bg-md3-surface-container-low"
      }`}
    >
      {/* Alert present state */}
      {isLoading && !rawLatestAlert ? (
        <p className="text-sm text-md3-on-surface-variant">{content.statusLoading}</p>
      ) : filteredLatestAlert ? (
        <div className="relative z-10">
          <div className="mb-6 flex items-start justify-between">
            <div className="flex flex-col gap-1">
              <span className="inline-block w-fit bg-md3-error-container px-2 py-1 font-[family-name:var(--font-sans)] text-[10px] font-black uppercase tracking-widest text-md3-error">
                {content.latestAlertTitle}
              </span>
              <h1 className="mt-2 text-3xl font-black tracking-tighter lg:text-4xl">
                {filteredLatestAlert.title}
              </h1>
              <p className="mt-1 font-[family-name:var(--font-label)] text-sm uppercase tracking-wide text-md3-on-surface-variant">
                {getAlertLocation(filteredLatestAlert)}
              </p>
            </div>
            <div className="text-end">
              <p className="font-mono text-2xl font-bold text-md3-error lg:text-3xl">
                {formatDateTime(filteredLatestAlert.publishedAt)}
              </p>
              <p className="font-[family-name:var(--font-label)] text-[10px] uppercase tracking-widest text-md3-outline">
                UTC+3 (ISR)
              </p>
            </div>
          </div>

          {/* Stats grid */}
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-lg bg-md3-surface-container p-4">
              <p className="font-[family-name:var(--font-label)] text-[10px] uppercase text-md3-outline">
                {content.locationLabel}: {getAlertLocation(filteredLatestAlert)}
              </p>
            </div>
            <div className="rounded-lg bg-md3-surface-container p-4">
              <p className="font-[family-name:var(--font-label)] text-[10px] uppercase text-md3-outline">
                {content.severityLabel}: <span className="text-md3-secondary">{filteredLatestAlert.severity}</span>
              </p>
            </div>
            <div className="rounded-lg bg-md3-surface-container p-4">
              <p className="font-[family-name:var(--font-label)] text-[10px] uppercase text-md3-outline">
                {content.sourceLabel}: {filteredLatestAlert.sourceName}
              </p>
            </div>
          </div>

          {/* Message */}
          <p className="text-sm leading-relaxed text-md3-on-surface-variant">
            {filteredLatestAlert.message?.trim().length
              ? filteredLatestAlert.message
              : content.alertMessageFallback}
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-3 py-6">
          {!hasActiveFilters && !rawLatestAlert ? (
            <>
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
                <svg width="24" height="24" viewBox="0 0 14 14" fill="none">
                  <path d="M3.5 7L6 9.5L10.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <p className="font-[family-name:var(--font-label)] text-sm uppercase tracking-wide text-md3-on-surface-variant">
                {content.latestAlertEmpty}
              </p>
            </>
          ) : (
            <p className="text-sm text-md3-outline">
              {hasActiveFilters && rawLatestAlert
                ? content.filterNoMatches
                : content.latestAlertEmpty}
            </p>
          )}
        </div>
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

export type { AlertHeroContent };
