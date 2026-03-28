import { getTranslations } from "next-intl/server";
import { MapPreview } from "@/components/map/map-preview";
import { getMapAlertMarkers } from "@/lib/db/map-alerts";
import { getMapOverlays } from "@/lib/db/map-overlays";

export default async function LocalizedMapPage() {
  const t = await getTranslations("mapPage");
  const alertMarkers = await getMapAlertMarkers();
  const overlays = await getMapOverlays();

  return (
    <MapPreview
      content={{
        commandBar: {
          title: "Magen",
          themeSwitcher: {
            label: t("themeSwitcher.label"),
            dark: t("themeSwitcher.dark"),
            light: t("themeSwitcher.light"),
          },
          sourceHealthOverallLabel: t("sourceHealthOverallLabel"),
          sourceHealthStatuses: {
            healthy: t("sourceHealthStatuses.healthy"),
            degraded: t("sourceHealthStatuses.degraded"),
            down: t("sourceHealthStatuses.down"),
            unknown: t("sourceHealthStatuses.unknown"),
          },
        },
        bottomNav: {
          dashboard: t("bottomNav.dashboard"),
          map: t("bottomNav.map"),
          intel: t("bottomNav.intel"),
          alerts: t("bottomNav.alerts"),
        },
        statusBar: {
          activeAlertsLabel: t("activeAlertsLabel"),
          watchedAreasAffectedLabel: t("watchedAreasAffectedLabel"),
        },
        statusError: t("statusError"),
        mapLayersTitle: t("mapLayersTitle"),
        alertZonesLabel: t("overlayAlertZonesToggleLabel"),
        alertsLegend: t("alertsLegend"),
        sheltersLegend: t("sheltersLegend"),
        hospitalsLegend: t("hospitalsLegend"),
        overlaySheltersToggleLabel: t("overlaySheltersToggleLabel"),
        overlayRoadClosuresToggleLabel: t("overlayRoadClosuresToggleLabel"),
        overlayHospitalsToggleLabel: t("overlayHospitalsToggleLabel"),
        overlayStatusLabel: t("overlayStatusLabel"),
        overlayLastUpdatedLabel: t("overlayLastUpdatedLabel"),
        overlayRoadReasonLabel: t("overlayRoadReasonLabel"),
        overlayEmergencyRoomLabel: t("overlayEmergencyRoomLabel"),
        mapControlsLabels: {
          zoomIn: t("mapControlsLabels.zoomIn"),
          zoomOut: t("mapControlsLabels.zoomOut"),
          locate: t("mapControlsLabels.locate"),
          fullscreen: t("mapControlsLabels.fullscreen"),
          resetBearing: t("mapControlsLabels.resetBearing"),
        },
        watchRadiusLabel: t("watchRadiusLabel"),
        watchlist: {
          title: t("watchlistTitle"),
          addLabel: t("watchlistAddLabel"),
          activeAlertBadge: t("watchlistActiveAlertBadge"),
          emptyBody: t("watchlistEmptyBody"),
          removeActionLabel: t("watchlistRemoveActionLabel"),
          watchRadiusLabel: t("watchRadiusLabel"),
          watchlistPriorityLabel: t("watchlistPriorityLabel"),
          watchlistTopPriorityLabel: t("watchlistTopPriorityLabel"),
          watchlistNearbyAlertsLabel: t("watchlistNearbyAlertsLabel"),
        },
        watchlistPriorityLabel: t("watchlistPriorityLabel"),
        watchlistTopPriorityLabel: t("watchlistTopPriorityLabel"),
        watchlistNearbyAlertsLabel: t("watchlistNearbyAlertsLabel"),
        watchlistHighestSeverityLabel: t("watchlistHighestSeverityLabel"),
        watchlistNearestAlertLabel: t("watchlistNearestAlertLabel"),
      }}
      alertMarkers={alertMarkers}
      overlays={overlays}
    />
  );
}
