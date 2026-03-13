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
    <Map center={center} zoom={7.2}>
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
                    <div className="w-64 space-y-2 rounded-md border border-slate-200 bg-white p-3">
                      <p className="text-sm font-semibold text-slate-900">{roadClosure.name}</p>
                      <p className="text-xs text-slate-700">
                        {overlayStatusLabel}: {roadClosure.status}
                      </p>
                      {roadClosure.reason ? (
                        <p className="text-xs text-slate-700">
                          {overlayRoadReasonLabel}: {roadClosure.reason}
                        </p>
                      ) : null}
                      <p className="text-xs text-slate-700">
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
                <div className="w-64 space-y-2 rounded-md border border-sky-200 bg-white p-3">
                  <p className="text-sm font-semibold text-sky-900">{shelter.name}</p>
                  <p className="text-xs text-slate-700">
                    {overlayStatusLabel}: {shelter.status}
                  </p>
                  <p className="text-xs text-slate-700">
                    {shelter.city ?? shelter.region ?? "IL"}
                  </p>
                  <p className="text-xs text-slate-700">
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
                <div className="w-64 space-y-2 rounded-md border border-emerald-200 bg-white p-3">
                  <p className="text-sm font-semibold text-emerald-900">{hospital.name}</p>
                  <p className="text-xs text-slate-700">
                    {overlayStatusLabel}: {hospital.status}
                  </p>
                  <p className="text-xs text-slate-700">
                    {hospital.city ?? hospital.region ?? "IL"}
                  </p>
                  {hospital.hasEmergencyRoom ? (
                    <p className="text-xs text-slate-700">{overlayEmergencyRoomLabel}</p>
                  ) : null}
                  <p className="text-xs text-slate-700">
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
            <div className="w-60 space-y-1 rounded-md border border-amber-200 bg-white p-3">
              <p className="text-sm font-semibold text-amber-900">{item.location.name}</p>
              <p className="text-xs text-slate-700">
                {watchRadiusLabel}: {item.location.radiusKm.toFixed(1)} km
              </p>
              <p className="text-xs text-slate-700">
                {item.location.city ?? item.location.region ?? item.location.country}
              </p>
              {item.rank ? (
                <p className="text-xs font-semibold text-amber-900">
                  {item.rank === 1
                    ? watchlistTopPriorityLabel
                    : `${watchlistPriorityLabel} #${item.rank}`}
                </p>
              ) : null}
              {item.matchedAlertCount > 0 ? (
                <>
                  <p className="text-xs text-slate-700">
                    {item.matchedAlertCount} {watchlistNearbyAlertsLabel}
                  </p>
                  <p className="text-xs text-slate-700">
                    {watchlistHighestSeverityLabel}: {item.highestSeverity}
                  </p>
                  <p className="text-xs text-slate-700">
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
            <div className="w-64 space-y-2 rounded-md border border-rose-200 bg-white p-3">
              <p className="text-sm font-semibold text-rose-900">{marker.title}</p>
              <p className="text-xs text-slate-700">{formatAlertLocation(marker)}</p>
              {marker.message ? <p className="text-xs text-slate-700">{marker.message}</p> : null}
              <div className="flex items-center gap-1 text-[11px] text-slate-600">
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
