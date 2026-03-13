"use client";

import { CrisisMap } from "@/components/map/crisis-map";
import { LocaleSwitcher } from "@/components/i18n/locale-switcher";
import { BrowserNotificationOptIn } from "@/components/notifications/browser-notification-opt-in";
import { MapLegend } from "@/components/map/map-legend";
import { MapOverlayControls } from "@/components/map/map-overlay-controls";
import { MapPanel } from "@/components/map/map-panel";
import { MapSummaryCards } from "@/components/map/map-summary-cards";
import { MapWatchlistManager } from "@/components/map/map-watchlist-manager";
import { getPrioritizedWatchedLocations } from "@/lib/map/watch-priority";
import type { MapOverlayFixtures } from "@/lib/schemas/map-overlays";
import type { MapAlertMarker, WatchedLocationMarker } from "@/lib/schemas/map";
import { useWatchlistStore } from "@/store/use-watchlist-store";
import { useState } from "react";

type MapPreviewContent = {
  title: string;
  description: string;
  legendTitle: string;
  alertsLegend: string;
  watchlistLegend: string;
  sheltersLegend: string;
  roadClosuresLegend: string;
  hospitalsLegend: string;
  overlayControlsTitle: string;
  overlaySheltersToggleLabel: string;
  overlayRoadClosuresToggleLabel: string;
  overlayHospitalsToggleLabel: string;
  overlayStatusLabel: string;
  overlayLastUpdatedLabel: string;
  overlayRoadReasonLabel: string;
  overlayEmergencyRoomLabel: string;
  alertsEmptyTitle: string;
  alertsEmptyBody: string;
  alertsCountLabel: string;
  watchlistEmptyTitle: string;
  watchlistEmptyBody: string;
  watchlistCountLabel: string;
  mapControlsLabels: {
    zoomIn: string;
    zoomOut: string;
    locate: string;
    fullscreen: string;
    resetBearing: string;
  };
  watchRadiusLabel: string;
  watchlistManagerTitle: string;
  watchlistManagerDescription: string;
  watchlistSuggestedTitle: string;
  watchlistSuggestedEmptyBody: string;
  watchlistSuggestedAlertsLabel: string;
  watchlistAddActionLabel: string;
  watchlistWatchingBadgeLabel: string;
  watchlistCurrentTitle: string;
  watchlistCurrentEmptyBody: string;
  watchlistRemoveActionLabel: string;
  watchlistPriorityTitle: string;
  watchlistPriorityEmptyBody: string;
  watchlistPriorityLabel: string;
  watchlistTopPriorityLabel: string;
  watchlistNearbyAlertsLabel: string;
  watchlistHighestSeverityLabel: string;
  watchlistNearestAlertLabel: string;
};

type MapPreviewProps = {
  content: MapPreviewContent;
  alertMarkers: MapAlertMarker[];
  overlays: MapOverlayFixtures;
};

function getMapCenter(
  alertMarkers: MapAlertMarker[],
  watchedLocations: WatchedLocationMarker[],
): [number, number] {
  const firstAlert = alertMarkers[0];

  if (firstAlert) {
    return [firstAlert.longitude, firstAlert.latitude];
  }

  const firstWatchedLocation = watchedLocations[0];

  if (firstWatchedLocation) {
    return [firstWatchedLocation.longitude, firstWatchedLocation.latitude];
  }

  return [35.2137, 31.7683];
}

export function MapPreview({ content, alertMarkers, overlays }: MapPreviewProps) {
  const watchedLocations = useWatchlistStore((state) => state.watchedLocations);
  const addWatchedLocation = useWatchlistStore((state) => state.addWatchedLocation);
  const removeWatchedLocation = useWatchlistStore((state) => state.removeWatchedLocation);
  const [overlayVisibility, setOverlayVisibility] = useState({
    shelters: true,
    roadClosures: true,
    hospitals: true,
  });
  const mapCenter = getMapCenter(alertMarkers, watchedLocations);
  const prioritizedWatchedLocations = getPrioritizedWatchedLocations(
    watchedLocations,
    alertMarkers,
  );

  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-6 md:px-6">
      <header className="mb-4 flex flex-col gap-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              {content.title}
            </h1>
            <p className="mt-1 text-sm text-slate-600">{content.description}</p>
          </div>

          <div className="flex flex-wrap items-start gap-3">
            <BrowserNotificationOptIn className="min-w-[190px]" />
            <LocaleSwitcher className="min-w-[130px]" />
          </div>
        </div>

        <MapLegend
          title={content.legendTitle}
          alertsLabel={content.alertsLegend}
          watchlistLabel={content.watchlistLegend}
          sheltersLabel={content.sheltersLegend}
          roadClosuresLabel={content.roadClosuresLegend}
          hospitalsLabel={content.hospitalsLegend}
        />

        <MapOverlayControls
          title={content.overlayControlsTitle}
          sheltersLabel={content.overlaySheltersToggleLabel}
          roadClosuresLabel={content.overlayRoadClosuresToggleLabel}
          hospitalsLabel={content.overlayHospitalsToggleLabel}
          visibility={overlayVisibility}
          onToggleShelters={() => {
            setOverlayVisibility((previousVisibility) => ({
              ...previousVisibility,
              shelters: !previousVisibility.shelters,
            }));
          }}
          onToggleRoadClosures={() => {
            setOverlayVisibility((previousVisibility) => ({
              ...previousVisibility,
              roadClosures: !previousVisibility.roadClosures,
            }));
          }}
          onToggleHospitals={() => {
            setOverlayVisibility((previousVisibility) => ({
              ...previousVisibility,
              hospitals: !previousVisibility.hospitals,
            }));
          }}
        />
      </header>

      <MapPanel>
        <CrisisMap
          center={mapCenter}
          alertMarkers={alertMarkers}
          prioritizedWatchedLocations={prioritizedWatchedLocations}
          mapControlLabels={content.mapControlsLabels}
          watchRadiusLabel={content.watchRadiusLabel}
          watchlistPriorityLabel={content.watchlistPriorityLabel}
          watchlistTopPriorityLabel={content.watchlistTopPriorityLabel}
          watchlistNearbyAlertsLabel={content.watchlistNearbyAlertsLabel}
          watchlistHighestSeverityLabel={content.watchlistHighestSeverityLabel}
          watchlistNearestAlertLabel={content.watchlistNearestAlertLabel}
          overlays={overlays}
          overlayVisibility={overlayVisibility}
          overlayStatusLabel={content.overlayStatusLabel}
          overlayLastUpdatedLabel={content.overlayLastUpdatedLabel}
          overlayRoadReasonLabel={content.overlayRoadReasonLabel}
          overlayEmergencyRoomLabel={content.overlayEmergencyRoomLabel}
        />
      </MapPanel>

      <MapWatchlistManager
        content={{
          title: content.watchlistManagerTitle,
          description: content.watchlistManagerDescription,
          suggestedTitle: content.watchlistSuggestedTitle,
          suggestedEmptyBody: content.watchlistSuggestedEmptyBody,
          suggestedAlertsLabel: content.watchlistSuggestedAlertsLabel,
          addWatchActionLabel: content.watchlistAddActionLabel,
          watchingBadgeLabel: content.watchlistWatchingBadgeLabel,
          currentTitle: content.watchlistCurrentTitle,
          currentEmptyBody: content.watchlistCurrentEmptyBody,
          removeWatchActionLabel: content.watchlistRemoveActionLabel,
          watchRadiusLabel: content.watchRadiusLabel,
          watchlistPriorityLabel: content.watchlistPriorityLabel,
          watchlistTopPriorityLabel: content.watchlistTopPriorityLabel,
          watchlistNearbyAlertsLabel: content.watchlistNearbyAlertsLabel,
        }}
        alertMarkers={alertMarkers}
        watchedLocations={watchedLocations}
        prioritizedWatchedLocations={prioritizedWatchedLocations}
        onAddWatchedLocation={addWatchedLocation}
        onRemoveWatchedLocation={removeWatchedLocation}
      />

      <MapSummaryCards
        content={{
          alertsEmptyTitle: content.alertsEmptyTitle,
          alertsEmptyBody: content.alertsEmptyBody,
          alertsCountLabel: content.alertsCountLabel,
          watchlistEmptyTitle: content.watchlistEmptyTitle,
          watchlistEmptyBody: content.watchlistEmptyBody,
          watchlistCountLabel: content.watchlistCountLabel,
          watchlistPriorityTitle: content.watchlistPriorityTitle,
          watchlistPriorityEmptyBody: content.watchlistPriorityEmptyBody,
          watchlistPriorityLabel: content.watchlistPriorityLabel,
          watchlistTopPriorityLabel: content.watchlistTopPriorityLabel,
          watchlistNearbyAlertsLabel: content.watchlistNearbyAlertsLabel,
          watchlistHighestSeverityLabel: content.watchlistHighestSeverityLabel,
          watchlistNearestAlertLabel: content.watchlistNearestAlertLabel,
        }}
        alertCount={alertMarkers.length}
        watchlistCount={watchedLocations.length}
        prioritizedWatchedLocations={prioritizedWatchedLocations}
      />
    </section>
  );
}

export type { MapPreviewContent };
