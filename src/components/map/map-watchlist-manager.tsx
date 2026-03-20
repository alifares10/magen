import type { PrioritizedWatchedLocation } from "@/lib/map/watch-priority";
import type { MapAlertMarker, WatchedLocationMarker } from "@/lib/schemas/map";

type MapWatchlistManagerContent = {
  title: string;
  description: string;
  suggestedTitle: string;
  suggestedEmptyBody: string;
  suggestedAlertsLabel: string;
  addWatchActionLabel: string;
  watchingBadgeLabel: string;
  currentTitle: string;
  currentEmptyBody: string;
  removeWatchActionLabel: string;
  watchRadiusLabel: string;
  watchlistPriorityLabel: string;
  watchlistTopPriorityLabel: string;
  watchlistNearbyAlertsLabel: string;
};

type MapWatchlistManagerProps = {
  content: MapWatchlistManagerContent;
  alertMarkers: MapAlertMarker[];
  watchedLocations: WatchedLocationMarker[];
  prioritizedWatchedLocations: PrioritizedWatchedLocation[];
  onAddWatchedLocation: (
    location: Omit<WatchedLocationMarker, "id"> & {
      id?: string;
    },
  ) => void;
  onRemoveWatchedLocation: (id: string) => void;
};

type WatchCandidate = WatchedLocationMarker & {
  alertCount: number;
};

function toCoordinateToken(value: number): string {
  return value.toFixed(4);
}

function toCandidateId(name: string, latitude: number, longitude: number): string {
  return `${encodeURIComponent(name.trim().toLowerCase())}-${toCoordinateToken(latitude)}-${toCoordinateToken(longitude)}`;
}

function getCandidateName(marker: MapAlertMarker): string {
  return marker.locationName ?? marker.city ?? marker.region ?? marker.sourceName;
}

function mapAlertMarkersToWatchCandidates(alertMarkers: MapAlertMarker[]): WatchCandidate[] {
  const candidatesByKey = new Map<string, WatchCandidate>();

  for (const marker of alertMarkers) {
    const name = getCandidateName(marker);
    const id = toCandidateId(name, marker.latitude, marker.longitude);
    const key = `${id}-${marker.region ?? ""}-${marker.city ?? ""}`;
    const existingCandidate = candidatesByKey.get(key);

    if (existingCandidate) {
      existingCandidate.alertCount += 1;
      continue;
    }

    candidatesByKey.set(key, {
      id,
      name,
      latitude: marker.latitude,
      longitude: marker.longitude,
      radiusKm: 15,
      country: "IL",
      region: marker.region,
      city: marker.city,
      alertCount: 1,
    });
  }

  return [...candidatesByKey.values()].sort((a, b) => b.alertCount - a.alertCount);
}

function isSameLocation(left: WatchedLocationMarker, right: WatchedLocationMarker): boolean {
  return (
    left.name.trim().toLowerCase() === right.name.trim().toLowerCase() &&
    toCoordinateToken(left.latitude) === toCoordinateToken(right.latitude) &&
    toCoordinateToken(left.longitude) === toCoordinateToken(right.longitude)
  );
}

function getExistingWatchedLocation(
  candidate: WatchCandidate,
  watchedLocations: WatchedLocationMarker[],
): WatchedLocationMarker | null {
  return (
    watchedLocations.find(
      (location) => location.id === candidate.id || isSameLocation(location, candidate),
    ) ?? null
  );
}

function getCandidateAreaLabel(candidate: WatchCandidate): string {
  return candidate.city ?? candidate.region ?? candidate.country;
}

export function MapWatchlistManager({
  content,
  alertMarkers,
  watchedLocations,
  prioritizedWatchedLocations,
  onAddWatchedLocation,
  onRemoveWatchedLocation,
}: MapWatchlistManagerProps) {
  const watchCandidates = mapAlertMarkersToWatchCandidates(alertMarkers);

  return (
    <section className="grid gap-4 md:grid-cols-2">
      {/* Suggested locations */}
      <article className="rounded-lg border border-[var(--border-panel)] bg-[var(--surface-raised)] p-4">
        <h2 className="font-[family-name:var(--font-display)] text-sm font-semibold text-amber-600 dark:text-amber-300">{content.title}</h2>
        <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">{content.description}</p>

        <p className="mt-3 text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          {content.suggestedTitle}
        </p>

        {watchCandidates.length === 0 ? (
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{content.suggestedEmptyBody}</p>
        ) : (
          <ul className="mt-2 text-sm">
            {watchCandidates.map((candidate) => {
              const existingWatchedLocation = getExistingWatchedLocation(
                candidate,
                watchedLocations,
              );

              return (
                <li
                  key={candidate.id}
                  className="flex items-start justify-between gap-3 border-b border-[var(--border-panel)] px-1 py-2.5 last:border-b-0"
                >
                  <div>
                    <p className="font-medium text-slate-900 dark:text-slate-100">{candidate.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{getCandidateAreaLabel(candidate)}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {candidate.alertCount} {content.suggestedAlertsLabel}
                    </p>
                  </div>

                  {existingWatchedLocation ? (
                    <span className="inline-flex rounded-sm border border-emerald-700/40 bg-emerald-950/30 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 dark:border-emerald-700/40 dark:bg-emerald-950/30 dark:text-emerald-400">
                      {content.watchingBadgeLabel}
                    </span>
                  ) : (
                    <button
                      type="button"
                      aria-label={`${content.addWatchActionLabel} ${candidate.name}`}
                      className="rounded-sm border border-amber-300 bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-900 hover:bg-amber-200 dark:border-amber-700/50 dark:bg-amber-950/40 dark:text-amber-300 dark:hover:bg-amber-900/50"
                      onClick={() => {
                        onAddWatchedLocation(candidate);
                      }}
                    >
                      {content.addWatchActionLabel}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </article>

      {/* Current watched locations */}
      <article className="rounded-lg border border-[var(--border-panel)] bg-[var(--surface-raised)] p-4">
        <h2 className="font-[family-name:var(--font-display)] text-sm font-semibold text-slate-800 dark:text-slate-100">{content.currentTitle}</h2>

        {watchedLocations.length === 0 ? (
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{content.currentEmptyBody}</p>
        ) : (
          <ul className="mt-2 text-sm">
            {prioritizedWatchedLocations.map((item) => (
              <li
                key={item.location.id}
                className="flex items-start justify-between gap-3 border-b border-[var(--border-panel)] px-1 py-2.5 last:border-b-0"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-slate-900 dark:text-slate-100">{item.location.name}</p>
                    {item.rank ? (
                      <span className="inline-flex rounded-sm border border-amber-700/50 bg-amber-950/40 px-1.5 py-0.5 text-[10px] font-semibold text-amber-400 dark:text-amber-300">
                        {item.rank === 1
                          ? content.watchlistTopPriorityLabel
                          : `${content.watchlistPriorityLabel} #${item.rank}`}
                      </span>
                    ) : null}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {content.watchRadiusLabel}: {item.location.radiusKm.toFixed(1)} km
                  </p>
                  {item.rank ? (
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {item.matchedAlertCount} {content.watchlistNearbyAlertsLabel}
                    </p>
                  ) : null}
                </div>

                <button
                  type="button"
                  aria-label={`${content.removeWatchActionLabel} ${item.location.name}`}
                  className="rounded-sm border border-[var(--border-panel)] bg-[var(--surface-raised)] px-2 py-0.5 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                  onClick={() => {
                    onRemoveWatchedLocation(item.location.id);
                  }}
                >
                  {content.removeWatchActionLabel}
                </button>
              </li>
            ))}
          </ul>
        )}
      </article>
    </section>
  );
}

export type { MapWatchlistManagerContent };
