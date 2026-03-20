import type { PrioritizedWatchedLocation } from "@/lib/map/watch-priority";

type MapSummaryCardsContent = {
  alertsEmptyTitle: string;
  alertsEmptyBody: string;
  alertsCountLabel: string;
  watchlistEmptyTitle: string;
  watchlistEmptyBody: string;
  watchlistCountLabel: string;
  watchlistPriorityTitle: string;
  watchlistPriorityEmptyBody: string;
  watchlistPriorityLabel: string;
  watchlistTopPriorityLabel: string;
  watchlistNearbyAlertsLabel: string;
  watchlistHighestSeverityLabel: string;
  watchlistNearestAlertLabel: string;
};

type MapSummaryCardsProps = {
  content: MapSummaryCardsContent;
  alertCount: number;
  watchlistCount: number;
  prioritizedWatchedLocations: PrioritizedWatchedLocation[];
};

function formatDistance(value: number | null): string {
  if (value === null) {
    return "-";
  }

  return `${value.toFixed(1)} km`;
}

export function MapSummaryCards({
  content,
  alertCount,
  watchlistCount,
  prioritizedWatchedLocations,
}: MapSummaryCardsProps) {
  const rankedLocations = prioritizedWatchedLocations.filter((item) => item.rank !== null);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Alert count */}
      <article className="rounded-lg border border-[var(--border-panel)] border-s-2 border-s-rose-500 bg-[var(--surface-raised)] p-4">
        <p className="font-[family-name:var(--font-display)] text-sm font-semibold text-rose-700 dark:text-rose-100">{content.alertsEmptyTitle}</p>
        <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
          {alertCount === 0
            ? content.alertsEmptyBody
            : `${content.alertsCountLabel}: ${alertCount}`}
        </p>
      </article>

      {/* Watchlist count + priority */}
      <article className="rounded-lg border border-[var(--border-panel)] border-s-2 border-s-amber-500 bg-[var(--surface-raised)] p-4">
        <p className="font-[family-name:var(--font-display)] text-sm font-semibold text-amber-700 dark:text-amber-100">
          {content.watchlistEmptyTitle}
        </p>
        <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
          {watchlistCount === 0
            ? content.watchlistEmptyBody
            : `${content.watchlistCountLabel}: ${watchlistCount}`}
        </p>

        {watchlistCount > 0 ? (
          <div className="mt-3">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              {content.watchlistPriorityTitle}
            </p>

            {rankedLocations.length === 0 ? (
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{content.watchlistPriorityEmptyBody}</p>
            ) : (
              <ul className="mt-2 text-xs">
                {rankedLocations.slice(0, 3).map((item) => (
                  <li
                    key={item.location.id}
                    className="border-b border-[var(--border-panel)] px-1 py-2 last:border-b-0"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-slate-900 dark:text-slate-100">{item.location.name}</p>
                      <span className="inline-flex rounded-sm border border-amber-700/50 bg-amber-950/40 px-1.5 py-0.5 text-[10px] font-semibold text-amber-400 dark:text-amber-300">
                        {item.rank === 1
                          ? content.watchlistTopPriorityLabel
                          : `${content.watchlistPriorityLabel} #${item.rank}`}
                      </span>
                    </div>
                    <p className="mt-1 text-slate-600 dark:text-slate-400">
                      {item.matchedAlertCount} {content.watchlistNearbyAlertsLabel}
                    </p>
                    <p className="text-slate-600 dark:text-slate-400">
                      {content.watchlistHighestSeverityLabel}: {item.highestSeverity}
                    </p>
                    <p className="text-slate-600 dark:text-slate-400">
                      {content.watchlistNearestAlertLabel}: {formatDistance(item.nearestAlertDistanceKm)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : null}
      </article>
    </div>
  );
}

export type { MapSummaryCardsContent };
