import {
  Map,
  MapControls,
  MapMarker,
  MapRoute,
  MarkerContent,
  MarkerLabel,
  MarkerPopup,
} from "@/components/ui/map";
import type { PrioritizedWatchedLocation } from "@/lib/map/watch-priority";
import type { MapOverlayFixtures } from "@/lib/schemas/map-overlays";
import type { MapAlertMarker } from "@/lib/schemas/map";
import { AlertTriangle, Clock3, Hospital, House, MapPin } from "lucide-react";
import { Fragment } from "react";

type CrisisMapProps = {
  center: [number, number];
  alertMarkers: MapAlertMarker[];
  prioritizedWatchedLocations: PrioritizedWatchedLocation[];
  mapControlLabels: {
    zoomIn: string;
    zoomOut: string;
    locate: string;
    fullscreen: string;
    resetBearing: string;
  };
  mapUnavailable: {
    title: string;
    body: string;
  };
  watchRadiusLabel: string;
  watchlistPriorityLabel: string;
  watchlistTopPriorityLabel: string;
  watchlistNearbyAlertsLabel: string;
  watchlistHighestSeverityLabel: string;
  watchlistNearestAlertLabel: string;
  overlays: MapOverlayFixtures;
  overlayVisibility: {
    shelters: boolean;
    roadClosures: boolean;
    hospitals: boolean;
  };
  overlayStatusLabel: string;
  overlayLastUpdatedLabel: string;
  overlayRoadReasonLabel: string;
  overlayEmergencyRoomLabel: string;
};

function formatAlertLocation(marker: MapAlertMarker): string {
  return marker.locationName ?? marker.city ?? marker.region ?? marker.sourceName;
}

function formatPublishedAt(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function getRoadClosureColor(status: "active" | "partial" | "cleared"): string {
  if (status === "active") {
    return "#b91c1c";
  }

  if (status === "partial") {
    return "#b45309";
  }

  return "#475569";
}

function getRoadClosureDashArray(status: "active" | "partial" | "cleared"): [number, number] {
  if (status === "partial") {
    return [2, 2];
  }

  if (status === "cleared") {
    return [1, 3];
  }

  return [1, 0];
}

function getRoadClosureAnchorCoordinate(coordinates: [number, number][]): [number, number] {
  return coordinates[Math.floor(coordinates.length / 2)] ?? coordinates[0] ?? [35.2137, 31.7683];
}

export function CrisisMap({
  center,
  alertMarkers,
  prioritizedWatchedLocations,
  mapControlLabels,
  mapUnavailable,
  watchRadiusLabel,
  watchlistPriorityLabel,
  watchlistTopPriorityLabel,
  watchlistNearbyAlertsLabel,
  watchlistHighestSeverityLabel,
  watchlistNearestAlertLabel,
  overlays,
  overlayVisibility,
  overlayStatusLabel,
  overlayLastUpdatedLabel,
  overlayRoadReasonLabel,
  overlayEmergencyRoomLabel,
}: CrisisMapProps) {
  return (
    <Map
      center={center}
      zoom={7.2}
      fallback={
        <div className="flex h-full items-center justify-center p-4 sm:p-6">
          <div className="max-w-sm rounded-2xl border border-md3-outline-variant/20 bg-md3-surface-container/95 p-5 text-center shadow-lg backdrop-blur">
            <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-amber-500/12 text-amber-300">
              <AlertTriangle className="size-6" />
            </div>
            <p className="font-[family-name:var(--font-label)] text-sm font-bold uppercase tracking-[0.18em] text-md3-on-surface">
              {mapUnavailable.title}
            </p>
            <p className="mt-2 text-sm leading-6 text-md3-on-surface-variant">
              {mapUnavailable.body}
            </p>
          </div>
        </div>
      }
    >
      <MapControls
        position="bottom-end"
        showZoom
        showCompass
        showFullscreen
        labels={mapControlLabels}
      />

      {overlayVisibility.roadClosures
        ? overlays.roadClosures.map((roadClosure) => {
            const [longitude, latitude] = getRoadClosureAnchorCoordinate(roadClosure.coordinates);

            return (
              <Fragment key={roadClosure.id}>
                <MapRoute
                  id={`road-closure-${roadClosure.id}`}
                  coordinates={roadClosure.coordinates}
                  color={getRoadClosureColor(roadClosure.status)}
                  width={4}
                  opacity={0.85}
                  dashArray={getRoadClosureDashArray(roadClosure.status)}
                />
                <MapMarker longitude={longitude} latitude={latitude}>
                  <MarkerContent>
                    <div className="rounded-full border border-slate-400 bg-slate-200 p-1.5 shadow">
                      <span className="block size-2 rounded-full bg-slate-800" />
                    </div>
                  </MarkerContent>

                  <MarkerLabel className="font-semibold text-slate-900">{roadClosure.name}</MarkerLabel>

                  <MarkerPopup closeButton>
                    <div className="w-64 space-y-2 rounded-md border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-950/92">
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{roadClosure.name}</p>
                      <p className="text-xs text-slate-700 dark:text-slate-300">
                        {overlayStatusLabel}: {roadClosure.status}
                      </p>
                      {roadClosure.reason ? (
                        <p className="text-xs text-slate-700 dark:text-slate-300">
                          {overlayRoadReasonLabel}: {roadClosure.reason}
                        </p>
                      ) : null}
                      <p className="text-xs text-slate-700 dark:text-slate-300">
                        {overlayLastUpdatedLabel}: {formatPublishedAt(roadClosure.lastUpdatedAt)}
                      </p>
                    </div>
                  </MarkerPopup>
                </MapMarker>
              </Fragment>
            );
          })
        : null}

      {overlayVisibility.shelters
        ? overlays.shelters.map((shelter) => (
            <MapMarker key={shelter.id} longitude={shelter.longitude} latitude={shelter.latitude}>
              <MarkerContent>
                <div className="rounded-full border border-sky-300 bg-sky-100 p-1.5 shadow">
                  <House className="size-4 text-sky-700" />
                </div>
              </MarkerContent>

              <MarkerLabel className="font-semibold text-sky-900">{shelter.name}</MarkerLabel>

              <MarkerPopup closeButton>
                <div className="w-64 space-y-2 rounded-md border border-sky-200 bg-white p-3 dark:border-sky-800/70 dark:bg-slate-950/92">
                  <p className="text-sm font-semibold text-sky-900 dark:text-sky-100">{shelter.name}</p>
                  <p className="text-xs text-slate-700 dark:text-slate-300">
                    {overlayStatusLabel}: {shelter.status}
                  </p>
                  <p className="text-xs text-slate-700 dark:text-slate-300">
                    {shelter.city ?? shelter.region ?? "IL"}
                  </p>
                  <p className="text-xs text-slate-700 dark:text-slate-300">
                    {overlayLastUpdatedLabel}: {formatPublishedAt(shelter.lastUpdatedAt)}
                  </p>
                </div>
              </MarkerPopup>
            </MapMarker>
          ))
        : null}

      {overlayVisibility.hospitals
        ? overlays.hospitals.map((hospital) => (
            <MapMarker key={hospital.id} longitude={hospital.longitude} latitude={hospital.latitude}>
              <MarkerContent>
                <div className="rounded-full border border-emerald-300 bg-emerald-100 p-1.5 shadow">
                  <Hospital className="size-4 text-emerald-700" />
                </div>
              </MarkerContent>

              <MarkerLabel className="font-semibold text-emerald-900">{hospital.name}</MarkerLabel>

              <MarkerPopup closeButton>
                <div className="w-64 space-y-2 rounded-md border border-emerald-200 bg-white p-3 dark:border-emerald-800/70 dark:bg-slate-950/92">
                  <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">{hospital.name}</p>
                  <p className="text-xs text-slate-700 dark:text-slate-300">
                    {overlayStatusLabel}: {hospital.status}
                  </p>
                  <p className="text-xs text-slate-700 dark:text-slate-300">
                    {hospital.city ?? hospital.region ?? "IL"}
                  </p>
                  {hospital.hasEmergencyRoom ? (
                    <p className="text-xs text-slate-700 dark:text-slate-300">{overlayEmergencyRoomLabel}</p>
                  ) : null}
                  <p className="text-xs text-slate-700 dark:text-slate-300">
                    {overlayLastUpdatedLabel}: {formatPublishedAt(hospital.lastUpdatedAt)}
                  </p>
                </div>
              </MarkerPopup>
            </MapMarker>
          ))
        : null}

      {prioritizedWatchedLocations.map((item) => (
        <MapMarker
          key={item.location.id}
          longitude={item.location.longitude}
          latitude={item.location.latitude}
        >
          <MarkerContent>
            <div
              className={`relative rounded-full p-1.5 shadow ${
                item.rank === 1
                  ? "border border-amber-500 bg-amber-200 ring-2 ring-amber-300"
                  : item.rank
                    ? "border border-amber-400 bg-amber-100 ring-1 ring-amber-200"
                    : "border border-amber-300 bg-amber-100"
              }`}
            >
              <MapPin className="size-4 text-amber-800" />
              {item.rank ? (
                <span className="absolute -top-2 -end-2 inline-flex size-4 items-center justify-center rounded-full border border-amber-500 bg-amber-50 text-[10px] font-bold text-amber-900">
                  {item.rank}
                </span>
              ) : null}
            </div>
          </MarkerContent>

          <MarkerLabel className="font-semibold text-amber-900">{item.location.name}</MarkerLabel>

          <MarkerPopup closeButton>
            <div className="w-60 space-y-1 rounded-md border border-amber-200 bg-white p-3 dark:border-amber-800/70 dark:bg-slate-950/92">
              <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">{item.location.name}</p>
              <p className="text-xs text-slate-700 dark:text-slate-300">
                {watchRadiusLabel}: {item.location.radiusKm.toFixed(1)} km
              </p>
              <p className="text-xs text-slate-700 dark:text-slate-300">
                {item.location.city ?? item.location.region ?? item.location.country}
              </p>
              {item.rank ? (
                <p className="text-xs font-semibold text-amber-900 dark:text-amber-100">
                  {item.rank === 1
                    ? watchlistTopPriorityLabel
                    : `${watchlistPriorityLabel} #${item.rank}`}
                </p>
              ) : null}
              {item.matchedAlertCount > 0 ? (
                <>
                  <p className="text-xs text-slate-700 dark:text-slate-300">
                    {item.matchedAlertCount} {watchlistNearbyAlertsLabel}
                  </p>
                  <p className="text-xs text-slate-700 dark:text-slate-300">
                    {watchlistHighestSeverityLabel}: {item.highestSeverity}
                  </p>
                  <p className="text-xs text-slate-700 dark:text-slate-300">
                    {watchlistNearestAlertLabel}: {item.nearestAlertDistanceKm?.toFixed(1)} km
                  </p>
                </>
              ) : null}
            </div>
          </MarkerPopup>
        </MapMarker>
      ))}

      {alertMarkers.map((marker) => (
        <MapMarker key={marker.id} longitude={marker.longitude} latitude={marker.latitude}>
          <MarkerContent>
            <div className="rounded-full border border-rose-300 bg-rose-100 p-1.5 shadow">
              <AlertTriangle className="size-4 text-rose-700" />
            </div>
          </MarkerContent>

          <MarkerLabel className="font-semibold text-rose-800">
            {formatAlertLocation(marker)}
          </MarkerLabel>

          <MarkerPopup closeButton>
            <div className="w-64 space-y-2 rounded-md border border-rose-200 bg-white p-3 dark:border-rose-800/70 dark:bg-slate-950/92">
              <p className="text-sm font-semibold text-rose-900 dark:text-rose-100">{marker.title}</p>
              <p className="text-xs text-slate-700 dark:text-slate-300">{formatAlertLocation(marker)}</p>
              {marker.message ? <p className="text-xs text-slate-700 dark:text-slate-300">{marker.message}</p> : null}
              <div className="flex items-center gap-1 text-[11px] text-slate-600 dark:text-slate-400">
                <Clock3 className="size-3" />
                <span>{formatPublishedAt(marker.publishedAt)}</span>
              </div>
            </div>
          </MarkerPopup>
        </MapMarker>
      ))}
    </Map>
  );
}
