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
        title: t("title"),
        description: t("description"),
        legendTitle: t("legendTitle"),
        alertsLegend: t("alertsLegend"),
        watchlistLegend: t("watchlistLegend"),
        sheltersLegend: t("sheltersLegend"),
        roadClosuresLegend: t("roadClosuresLegend"),
        hospitalsLegend: t("hospitalsLegend"),
        overlayControlsTitle: t("overlayControlsTitle"),
        overlaySheltersToggleLabel: t("overlaySheltersToggleLabel"),
        overlayRoadClosuresToggleLabel: t("overlayRoadClosuresToggleLabel"),
        overlayHospitalsToggleLabel: t("overlayHospitalsToggleLabel"),
        overlayStatusLabel: t("overlayStatusLabel"),
        overlayLastUpdatedLabel: t("overlayLastUpdatedLabel"),
        overlayRoadReasonLabel: t("overlayRoadReasonLabel"),
        overlayEmergencyRoomLabel: t("overlayEmergencyRoomLabel"),
        alertsEmptyTitle: t("alertsEmptyTitle"),
        alertsEmptyBody: t("alertsEmptyBody"),
        alertsCountLabel: t("alertsCountLabel"),
        watchlistEmptyTitle: t("watchlistEmptyTitle"),
        watchlistEmptyBody: t("watchlistEmptyBody"),
        watchlistCountLabel: t("watchlistCountLabel"),
        mapControlsLabels: {
          zoomIn: t("mapControlsLabels.zoomIn"),
          zoomOut: t("mapControlsLabels.zoomOut"),
          locate: t("mapControlsLabels.locate"),
          fullscreen: t("mapControlsLabels.fullscreen"),
          resetBearing: t("mapControlsLabels.resetBearing"),
        },
        watchRadiusLabel: t("watchRadiusLabel"),
        watchlistManagerTitle: t("watchlistManagerTitle"),
        watchlistManagerDescription: t("watchlistManagerDescription"),
        watchlistSuggestedTitle: t("watchlistSuggestedTitle"),
        watchlistSuggestedEmptyBody: t("watchlistSuggestedEmptyBody"),
        watchlistSuggestedAlertsLabel: t("watchlistSuggestedAlertsLabel"),
        watchlistAddActionLabel: t("watchlistAddActionLabel"),
        watchlistWatchingBadgeLabel: t("watchlistWatchingBadgeLabel"),
        watchlistCurrentTitle: t("watchlistCurrentTitle"),
        watchlistCurrentEmptyBody: t("watchlistCurrentEmptyBody"),
        watchlistRemoveActionLabel: t("watchlistRemoveActionLabel"),
        watchlistPriorityTitle: t("watchlistPriorityTitle"),
        watchlistPriorityEmptyBody: t("watchlistPriorityEmptyBody"),
        watchlistPriorityLabel: t("watchlistPriorityLabel"),
        watchlistTopPriorityLabel: t("watchlistTopPriorityLabel"),
        watchlistNearbyAlertsLabel: t("watchlistNearbyAlertsLabel"),
        watchlistHighestSeverityLabel: t("watchlistHighestSeverityLabel"),
        watchlistNearestAlertLabel: t("watchlistNearestAlertLabel"),
        themeSwitcher: {
          label: t("themeSwitcher.label"),
          dark: t("themeSwitcher.dark"),
          light: t("themeSwitcher.light"),
        },
      }}
      alertMarkers={alertMarkers}
      overlays={overlays}
    />
  );
}
