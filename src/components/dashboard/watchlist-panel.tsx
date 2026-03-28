"use client";

import { motion, useReducedMotion } from "framer-motion";
import { PlusCircle } from "lucide-react";

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
    <motion.section
      initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.24 }}
      className="flex flex-1 flex-col overflow-y-auto rounded-lg bg-md3-surface-container-low p-4"
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-[family-name:var(--font-label)] text-[10px] uppercase tracking-[0.2em] text-md3-outline">
          {content.watchlistTitle}
        </h3>
        <PlusCircle className="h-4 w-4 cursor-pointer text-md3-outline transition-colors hover:text-md3-on-surface" />
      </div>

      {isLoading && rawWatchedLocationMatches.length === 0 ? (
        <p className="text-xs text-md3-outline">{content.statusLoading}</p>
      ) : filteredWatchedLocationMatches.length > 0 ? (
        <div className="space-y-2">
          {filteredWatchedLocationMatches.map((match) => (
            <div
              key={`${match.locationName}-${match.alertCount}`}
              className="cursor-pointer rounded bg-md3-surface-container p-3 transition-colors hover:bg-md3-surface-container-high"
            >
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs font-bold text-md3-on-surface">{match.locationName}</span>
                {match.alertCount > 0 ? (
                  <span className="rounded bg-md3-error-container px-1.5 text-[10px] font-bold text-md3-error">
                    {match.alertCount}
                  </span>
                ) : (
                  <span className="font-[family-name:var(--font-label)] text-[10px] uppercase text-md3-outline">
                    Clear
                  </span>
                )}
              </div>
              <p className="font-[family-name:var(--font-label)] text-[10px] uppercase text-md3-outline">
                {match.alertCount > 0
                  ? `${match.alertCount} ${content.watchlistMatchSuffix}`
                  : "No activity"}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-md3-outline">
          {hasActiveFilters && rawWatchedLocationMatches.length > 0
            ? content.filterNoMatches
            : content.watchlistEmpty}
        </p>
      )}
    </motion.section>
  );
}

export type { WatchlistPanelContent };
