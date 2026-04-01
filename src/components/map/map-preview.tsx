"use client";

import { useState, useSyncExternalStore } from "react";
import { CrisisMap } from "@/components/map/crisis-map";
import { MapLegend } from "@/components/map/map-legend";
import { MapOverlayControls } from "@/components/map/map-overlay-controls";
import { MapStatusBar, type MapStatusBarContent } from "@/components/map/map-status-bar";
import { MapWatchlistManager, type MapWatchlistManagerContent } from "@/components/map/map-watchlist-manager";
import { CommandBar, type CommandBarContent } from "@/components/dashboard/command-bar";
import { MobileBottomNav, type MobileBottomNavContent } from "@/components/navigation/mobile-bottom-nav";
import { useSourceHealth } from "@/components/dashboard/hooks/use-source-health";
import { getPrioritizedWatchedLocations } from "@/lib/map/watch-priority";
import type { MapOverlayFixtures } from "@/lib/schemas/map-overlays";
import type { MapAlertMarker, WatchedLocationMarker } from "@/lib/schemas/map";
import { useWatchlistStore } from "@/store/use-watchlist-store";

type MapPreviewContent = {
  commandBar: CommandBarContent;
  bottomNav: MobileBottomNavContent;
  statusBar: MapStatusBarContent;
  statusError: string;
  mapLayersTitle: string;
  alertZonesLabel?: string;
  alertsLegend: string;
  sheltersLegend: string;
  hospitalsLegend: string;
  overlaySheltersToggleLabel: string;
  overlayRoadClosuresToggleLabel: string;
  overlayHospitalsToggleLabel: string;
  overlayStatusLabel: string;
  overlayLastUpdatedLabel: string;
  overlayRoadReasonLabel: string;
  overlayEmergencyRoomLabel: string;
  mapControlsLabels: {
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
  watchlist: MapWatchlistManagerContent;
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

function getDesktopMediaQueryList() {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return null;
  }

  return window.matchMedia("(min-width: 768px)");
}

function subscribeToDesktopBreakpoint(callback: () => void) {
  const mediaQueryList = getDesktopMediaQueryList();

  if (!mediaQueryList) {
    return () => undefined;
  }

  mediaQueryList.addEventListener("change", callback);

  return () => {
    mediaQueryList.removeEventListener("change", callback);
  };
}

function getDesktopBreakpointSnapshot() {
  return getDesktopMediaQueryList()?.matches ?? false;
}

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
  const watchedLocations = useWatchlistStore((state) => state.watchedLocations);
  const removeWatchedLocation = useWatchlistStore(
    (state) => state.removeWatchedLocation,
  );
  const [overlayVisibility, setOverlayVisibility] = useState({
    shelters: true,
    roadClosures: true,
    hospitals: true,
  });
  const [isMobileLayersOpen, setIsMobileLayersOpen] = useState(false);
  const isDesktop = useSyncExternalStore(
    subscribeToDesktopBreakpoint,
    getDesktopBreakpointSnapshot,
    () => false,
  );
  const mapCenter = getMapCenter(alertMarkers, watchedLocations);
  const prioritizedWatchedLocations = getPrioritizedWatchedLocations(
    watchedLocations,
    alertMarkers,
  );

  const { overallSourceHealthStatus } = useSourceHealth({
    statusErrorMessage: content.statusError,
  });

  const affectedWatchlistCount = prioritizedWatchedLocations.filter(
    (item) => item.rank !== null,
  ).length;
  const isOverlayControlsCollapsed = !isDesktop && !isMobileLayersOpen;

  return (
    <div className="flex h-screen flex-col bg-md3-surface pt-14 pb-16 text-md3-on-surface md:pb-0">
      {/* Shared CommandBar */}
      <CommandBar
        content={content.commandBar}
        overallSourceHealthStatus={overallSourceHealthStatus}
        activeHref="/map"
      />

      {/* Full-screen map with floating panels */}
      <div className="relative flex-1">
        {/* Map fills all available space */}
        <CrisisMap
          center={mapCenter}
          alertMarkers={alertMarkers}
          prioritizedWatchedLocations={prioritizedWatchedLocations}
          mapControlLabels={content.mapControlsLabels}
          mapUnavailable={content.mapUnavailable}
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

        {/* Floating: Status bar (top-start) */}
        <div className="absolute inset-x-4 top-4 z-10 md:inset-x-auto md:start-4">
          <MapStatusBar
            content={content.statusBar}
            alertCount={alertMarkers.length}
            affectedWatchlistCount={affectedWatchlistCount}
          />
        </div>

        {/* Floating: Map layers (bottom-start) */}
        <div className="absolute inset-x-4 bottom-20 z-10 md:inset-x-auto md:bottom-4 md:start-4">
          <MapOverlayControls
            title={content.mapLayersTitle}
            collapsed={isOverlayControlsCollapsed}
            onToggleCollapsed={
              isDesktop
                ? undefined
                : () => {
                    setIsMobileLayersOpen((currentValue) => !currentValue);
                  }
            }
            sheltersLabel={content.overlaySheltersToggleLabel}
            roadClosuresLabel={content.overlayRoadClosuresToggleLabel}
            hospitalsLabel={content.overlayHospitalsToggleLabel}
            alertZonesLabel={content.alertZonesLabel}
            visibility={overlayVisibility}
            onToggleShelters={() => {
              setOverlayVisibility((prev) => ({
                ...prev,
                shelters: !prev.shelters,
              }));
            }}
            onToggleRoadClosures={() => {
              setOverlayVisibility((prev) => ({
                ...prev,
                roadClosures: !prev.roadClosures,
              }));
            }}
            onToggleHospitals={() => {
              setOverlayVisibility((prev) => ({
                ...prev,
                hospitals: !prev.hospitals,
              }));
            }}
          />
        </div>

        {/* Floating: Legend (bottom-center) */}
        <div className="absolute inset-x-4 bottom-4 z-10 md:inset-x-auto md:bottom-4 md:start-1/2 md:-translate-x-1/2">
          <MapLegend
            alertsLabel={content.alertsLegend}
            sheltersLabel={content.sheltersLegend}
            hospitalsLabel={content.hospitalsLegend}
          />
        </div>

        {/* Floating: Watchlist (top-end) */}
        <div className="absolute top-4 z-10 end-4">
          <MapWatchlistManager
            content={content.watchlist}
            watchedLocations={watchedLocations}
            prioritizedWatchedLocations={prioritizedWatchedLocations}
            onRemoveWatchedLocation={removeWatchedLocation}
          />
        </div>
      </div>

      {/* Mobile bottom nav */}
      <MobileBottomNav content={content.bottomNav} activeHref="/map" />
    </div>
  );
}

export type { MapPreviewContent };
