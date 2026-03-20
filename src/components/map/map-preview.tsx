"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { CrisisMap } from "@/components/map/crisis-map";
import { LocaleSwitcher } from "@/components/i18n/locale-switcher";
import { BrowserNotificationOptIn } from "@/components/notifications/browser-notification-opt-in";
import { ThemeSwitcher } from "@/components/theme/theme-switcher";
import { MapLegend } from "@/components/map/map-legend";
import { MapOverlayControls } from "@/components/map/map-overlay-controls";
import { MapPanel } from "@/components/map/map-panel";
import { MapSummaryCards } from "@/components/map/map-summary-cards";
import { MapWatchlistManager } from "@/components/map/map-watchlist-manager";
import { getPrioritizedWatchedLocations } from "@/lib/map/watch-priority";
import type { MapOverlayFixtures } from "@/lib/schemas/map-overlays";
import type { MapAlertMarker, WatchedLocationMarker } from "@/lib/schemas/map";
import { useWatchlistStore } from "@/store/use-watchlist-store";

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
  themeSwitcher: {
    label: string;
    dark: string;
    light: string;
  };
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

export function MapPreview({
  content,
  alertMarkers,
  overlays,
}: MapPreviewProps) {
  const prefersReducedMotion = useReducedMotion();
  const watchedLocations = useWatchlistStore((state) => state.watchedLocations);
  const addWatchedLocation = useWatchlistStore(
    (state) => state.addWatchedLocation,
  );
  const removeWatchedLocation = useWatchlistStore(
    (state) => state.removeWatchedLocation,
  );
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
    <div className="flex min-h-screen flex-col bg-[var(--background)] text-slate-900 dark:text-slate-100">
      {/* Command Bar */}
      <motion.header
        initial={prefersReducedMotion ? false : { opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="sticky top-0 z-50 border-b border-[var(--border-panel)] bg-[var(--surface-raised)] backdrop-blur"
      >
        {/* Title row */}
        <div className="flex h-12 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <h1 className="font-[family-name:var(--font-display)] text-xs font-bold uppercase tracking-[0.25em] text-slate-400 dark:text-slate-200">
              <span className="text-amber-500 dark:text-amber-400">{content.title}</span>
            </h1>
            <span className="hidden text-xs text-slate-500 md:inline">{content.description}</span>
          </div>

          <div className="flex items-center gap-2">
            <ThemeSwitcher content={content.themeSwitcher} className="text-xs" toggleSize={12} compact />
            <BrowserNotificationOptIn className="text-xs" compact />
            <LocaleSwitcher className="text-xs" compact />
          </div>
        </div>

        {/* Legend + Overlay controls */}
        <div className="flex flex-wrap items-center gap-3 border-t border-[var(--border-panel)] px-4 py-2">
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
        </div>
      </motion.header>

      {/* Scrollable content */}
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.06 }}
        >
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
        </motion.div>

        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.12 }}
        >
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
        </motion.div>

        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.18 }}
        >
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
        </motion.div>
      </div>
    </div>
  );
}

export type { MapPreviewContent };
