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
    <div className="mt-4 grid gap-3 md:grid-cols-2">
      <article className="rounded-xl border border-rose-200 bg-rose-50 p-3">
        <p className="text-sm font-semibold text-rose-900">{content.alertsEmptyTitle}</p>
        <p className="mt-1 text-xs text-rose-900/80">
          {alertCount === 0
            ? content.alertsEmptyBody
            : `${content.alertsCountLabel}: ${alertCount}`}
        </p>
      </article>

      <article className="rounded-xl border border-amber-200 bg-amber-50 p-3">
        <p className="text-sm font-semibold text-amber-900">
          {content.watchlistEmptyTitle}
        </p>
        <p className="mt-1 text-xs text-amber-900/80">
          {watchlistCount === 0
            ? content.watchlistEmptyBody
            : `${content.watchlistCountLabel}: ${watchlistCount}`}
        </p>

        {watchlistCount > 0 ? (
          <div className="mt-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-900/80">
              {content.watchlistPriorityTitle}
            </p>

            {rankedLocations.length === 0 ? (
              <p className="mt-1 text-xs text-amber-900/80">{content.watchlistPriorityEmptyBody}</p>
            ) : (
              <ul className="mt-2 space-y-2 text-xs text-amber-950">
                {rankedLocations.slice(0, 3).map((item) => (
                  <li
                    key={item.location.id}
                    className="rounded-lg border border-amber-200/70 bg-white px-2.5 py-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold">{item.location.name}</p>
                      <span className="inline-flex rounded-full border border-amber-300 bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-900">
                        {item.rank === 1
                          ? content.watchlistTopPriorityLabel
                          : `${content.watchlistPriorityLabel} #${item.rank}`}
                      </span>
                    </div>
                    <p className="mt-1 text-amber-900/85">
                      {item.matchedAlertCount} {content.watchlistNearbyAlertsLabel}
                    </p>
                    <p className="text-amber-900/85">
                      {content.watchlistHighestSeverityLabel}: {item.highestSeverity}
                    </p>
                    <p className="text-amber-900/85">
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
