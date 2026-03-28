import { PlusCircle } from "lucide-react";
import type { PrioritizedWatchedLocation } from "@/lib/map/watch-priority";
import type { WatchedLocationMarker } from "@/lib/schemas/map";

type MapWatchlistManagerContent = {
  title: string;
  addLabel: string;
  activeAlertBadge: string;
  emptyBody: string;
  removeActionLabel: string;
  watchRadiusLabel: string;
  watchlistPriorityLabel: string;
  watchlistTopPriorityLabel: string;
  watchlistNearbyAlertsLabel: string;
};

type MapWatchlistManagerProps = {
  content: MapWatchlistManagerContent;
  watchedLocations: WatchedLocationMarker[];
  prioritizedWatchedLocations: PrioritizedWatchedLocation[];
  onRemoveWatchedLocation: (id: string) => void;
};

export function MapWatchlistManager({
  content,
  watchedLocations,
  prioritizedWatchedLocations,
  onRemoveWatchedLocation,
}: MapWatchlistManagerProps) {
  return (
    <section className="hidden w-72 rounded-lg bg-md3-surface-container-low/90 backdrop-blur-sm md:block">
      {/* Header */}
      <div className="flex items-center justify-between p-3 pb-2">
        <h2 className="font-[family-name:var(--font-label)] text-[10px] font-bold uppercase tracking-[0.2em] text-md3-on-surface-variant">
          {content.title}
        </h2>
        <button
          type="button"
          className="flex items-center gap-1 rounded-md bg-md3-primary/15 px-2 py-1 text-md3-primary transition-colors hover:bg-md3-primary/25"
        >
          <PlusCircle className="h-3.5 w-3.5" />
          <span className="font-[family-name:var(--font-label)] text-[10px] font-bold uppercase tracking-widest">
            {content.addLabel}
          </span>
        </button>
      </div>

      {/* Location cards */}
      <div className="max-h-[calc(100vh-10rem)] space-y-1.5 overflow-y-auto px-3 pb-3">
        {watchedLocations.length === 0 ? (
          <p className="px-1 py-4 text-center text-xs text-md3-outline">
            {content.emptyBody}
          </p>
        ) : (
          prioritizedWatchedLocations.map((item) => (
            <div
              key={item.location.id}
              className={`rounded-md p-3 transition-colors ${
                item.matchedAlertCount > 0
                  ? "bg-md3-surface-container-high"
                  : "bg-md3-surface-container"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-md3-on-surface">
                    {item.location.name}
                  </p>
                  <p className="text-xs text-md3-on-surface-variant">
                    {item.location.city ?? item.location.region ?? item.location.country}
                  </p>
                </div>
                <button
                  type="button"
                  aria-label={`${content.removeActionLabel} ${item.location.name}`}
                  className="shrink-0 rounded px-1.5 py-0.5 text-[10px] text-md3-outline transition-colors hover:text-md3-on-surface"
                  onClick={() => {
                    onRemoveWatchedLocation(item.location.id);
                  }}
                >
                  {content.removeActionLabel}
                </button>
              </div>

              {item.matchedAlertCount > 0 ? (
                <div className="mt-2 flex items-center gap-2">
                  <span className="rounded bg-md3-error-container px-1.5 py-0.5 font-[family-name:var(--font-label)] text-[10px] font-bold uppercase tracking-wider text-md3-error">
                    {content.activeAlertBadge}
                  </span>
                </div>
              ) : null}

              {item.rank ? (
                <p className="mt-1 text-[10px] text-md3-on-surface-variant">
                  {item.rank === 1
                    ? content.watchlistTopPriorityLabel
                    : `${content.watchlistPriorityLabel} #${item.rank}`}
                  {" \u00B7 "}
                  {item.matchedAlertCount} {content.watchlistNearbyAlertsLabel}
                </p>
              ) : null}
            </div>
          ))
        )}
      </div>
    </section>
  );
}

export type { MapWatchlistManagerContent };
