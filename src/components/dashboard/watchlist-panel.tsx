"use client";

import { motion, useReducedMotion } from "framer-motion";

type WatchlistPanelContent = {
  watchlistTitle: string;
  watchlistEmpty: string;
  watchlistMatchSuffix: string;
  filterNoMatches: string;
  statusLoading: string;
  updatedLabel: string;
};

type WatchedLocationMatch = {
  locationName: string;
  alertCount: number;
};

type WatchlistPanelProps = {
  content: WatchlistPanelContent;
  filteredWatchedLocationMatches: WatchedLocationMatch[];
  rawWatchedLocationMatches: WatchedLocationMatch[];
  isLoading: boolean;
  hasActiveFilters: boolean;
};

export function WatchlistPanel({
  content,
  filteredWatchedLocationMatches,
  rawWatchedLocationMatches,
  isLoading,
  hasActiveFilters,
}: WatchlistPanelProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.24 }}
      className="flex-1 overflow-y-auto bg-[var(--surface-raised)] p-4"
    >
      <h2 className="font-[family-name:var(--font-display)] text-xs font-semibold uppercase tracking-wider text-slate-400">
        {content.watchlistTitle}
      </h2>

      {isLoading && rawWatchedLocationMatches.length === 0 ? (
        <p className="mt-2 text-xs text-slate-500">{content.statusLoading}</p>
      ) : filteredWatchedLocationMatches.length > 0 ? (
        <ul className="mt-2 space-y-1">
          {filteredWatchedLocationMatches.map((match) => (
            <li
              key={`${match.locationName}-${match.alertCount}`}
              className="flex items-center justify-between rounded-sm border border-slate-700/40 bg-black/15 px-2 py-1.5 text-xs"
            >
              <span className="text-slate-200">{match.locationName}</span>
              <span className="rounded-sm bg-rose-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-rose-300">
                {match.alertCount} {content.watchlistMatchSuffix}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-xs text-slate-500">
          {hasActiveFilters && rawWatchedLocationMatches.length > 0
            ? content.filterNoMatches
            : content.watchlistEmpty}
        </p>
      )}
    </motion.div>
  );
}

export type { WatchlistPanelContent };
