import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MapPreview } from "@/components/map/map-preview";
import {
  mapHospitalRowsToOverlays,
  mapRoadClosureRowsToOverlays,
  mapShelterRowsToOverlays,
} from "@/lib/db/map-overlays";
import { useWatchlistStore } from "@/store/use-watchlist-store";

vi.mock("@/components/i18n/locale-switcher", () => ({
  LocaleSwitcher: () => <div data-testid="locale-switcher" />,
}));

vi.mock("@/components/notifications/browser-notification-opt-in", () => ({
  BrowserNotificationOptIn: () => <div data-testid="browser-notification-opt-in" />,
}));

vi.mock("@/components/dashboard/command-bar", () => ({
  CommandBar: ({ activeHref }: { activeHref?: string }) => (
    <div data-testid="command-bar" data-active-href={activeHref} />
  ),
}));

vi.mock("@/components/navigation/mobile-bottom-nav", () => ({
  MobileBottomNav: ({ activeHref }: { activeHref?: string }) => (
    <div data-testid="mobile-bottom-nav" data-active-href={activeHref} />
  ),
}));

vi.mock("@/components/dashboard/hooks/use-source-health", () => ({
  useSourceHealth: () => ({
    sourceHealthState: { data: null, isLoading: false, errorMessage: null, lastUpdated: null },
    sourceHealthCategoriesByType: new Map(),
    overallSourceHealthStatus: "unknown" as const,
  }),
}));

vi.mock("@/components/ui/map", () => {
  return {
    Map: ({
      children,
      center,
    }: {
      children: React.ReactNode;
      center: [number, number];
    }) => (
      <div data-testid="map-root" data-center={`${center[0]},${center[1]}`}>
        {children}
      </div>
    ),
    MapControls: ({
      position,
      labels,
    }: {
      position?: string;
      labels?: {
        zoomIn: string;
        zoomOut: string;
        locate: string;
        fullscreen: string;
        resetBearing: string;
      };
    }) => (
      <div
        data-testid="map-controls"
        data-position={position}
        data-zoom-in-label={labels?.zoomIn}
        data-zoom-out-label={labels?.zoomOut}
        data-locate-label={labels?.locate}
        data-fullscreen-label={labels?.fullscreen}
        data-reset-bearing-label={labels?.resetBearing}
      />
    ),
    MapMarker: ({
      children,
      longitude,
      latitude,
    }: {
      children: React.ReactNode;
      longitude: number;
      latitude: number;
    }) => (
      <div data-testid="map-marker" data-longitude={longitude} data-latitude={latitude}>
        {children}
      </div>
    ),
    MarkerContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    MarkerLabel: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
    MarkerPopup: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    MapRoute: ({ coordinates }: { coordinates: [number, number][] }) => (
      <div data-testid="map-route" data-coordinate-count={coordinates.length} />
    ),
  };
});

vi.mock("@/store/use-watchlist-store", async () => {
  const { create } = await import("zustand");

  type MockWatchedLocation = {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    radiusKm: number;
    country: string;
    region: string | null;
    city: string | null;
  };

  const useWatchlistStore = create<{
    watchedLocations: MockWatchedLocation[];
    addWatchedLocation: (location: Omit<MockWatchedLocation, "id"> & { id?: string }) => void;
    removeWatchedLocation: (id: string) => void;
    clearWatchedLocations: () => void;
  }>((set) => ({
    watchedLocations: [],
    addWatchedLocation: (location) => {
      const id =
        location.id ??
        `${location.name.toLowerCase()}-${location.latitude.toFixed(4)}-${location.longitude.toFixed(4)}`;

      set((state) => ({
        watchedLocations: [
          ...state.watchedLocations.filter((item) => item.id !== id),
          {
            ...location,
            id,
          },
        ],
      }));
    },
    removeWatchedLocation: (id) => {
      set((state) => ({
        watchedLocations: state.watchedLocations.filter((location) => location.id !== id),
      }));
    },
    clearWatchedLocations: () => {
      set({ watchedLocations: [] });
    },
  }));

  return { useWatchlistStore };
});

const content = {
  commandBar: {
    title: "Magen",
    themeSwitcher: { label: "Theme", dark: "Dark", light: "Light" },
    sourceHealthOverallLabel: "Overall",
    sourceHealthStatuses: {
      healthy: "Active",
      degraded: "Degraded",
      down: "Down",
      unknown: "Unknown",
    },
  },
  bottomNav: {
    dashboard: "Dashboard",
    map: "Map",
    intel: "Intel",
    alerts: "Alerts",
  },
  statusBar: {
    activeAlertsLabel: "Active Alerts",
    watchedAreasAffectedLabel: "Watched Areas Affected",
  },
  statusError: "Failed to load source health",
  mapLayersTitle: "MAP LAYERS",
  alertZonesLabel: "Alert Zones",
  alertsLegend: "Alert",
  sheltersLegend: "Shelter",
  hospitalsLegend: "Hospital",
  overlaySheltersToggleLabel: "Shelters",
  overlayRoadClosuresToggleLabel: "Road Closures",
  overlayHospitalsToggleLabel: "Hospitals",
  overlayStatusLabel: "Status",
  overlayLastUpdatedLabel: "Last updated",
  overlayRoadReasonLabel: "Reason",
  overlayEmergencyRoomLabel: "Emergency room available",
  mapControlsLabels: {
    zoomIn: "Zoom in",
    zoomOut: "Zoom out",
    locate: "Find my location",
    fullscreen: "Toggle fullscreen",
    resetBearing: "Reset bearing to north",
  },
  mapUnavailable: {
    title: "Map unavailable",
    body: "The map surface could not load on this device right now.",
  },
  watchRadiusLabel: "Radius",
  watchlist: {
    title: "WATCHLIST",
    addLabel: "Add",
    activeAlertBadge: "Active Alert Zone",
    emptyBody: "No watched locations yet.",
    removeActionLabel: "Remove",
    watchRadiusLabel: "Radius",
    watchlistPriorityLabel: "Priority",
    watchlistTopPriorityLabel: "Top priority",
    watchlistNearbyAlertsLabel: "nearby alerts",
  },
  watchlistPriorityLabel: "Priority",
  watchlistTopPriorityLabel: "Top priority",
  watchlistNearbyAlertsLabel: "nearby alerts",
  watchlistHighestSeverityLabel: "Highest severity",
  watchlistNearestAlertLabel: "Nearest alert",
};

const emptyOverlays = {
  shelters: [],
  roadClosures: [],
  hospitals: [],
};

const sampleOverlays = {
  shelters: [
    {
      id: "shelter-1",
      name: "Shelter A",
      longitude: 34.7818,
      latitude: 32.0853,
      status: "open" as const,
      region: "Center",
      city: "Tel Aviv",
      lastUpdatedAt: "2026-03-07T10:00:00.000+00:00",
    },
  ],
  roadClosures: [
    {
      id: "closure-1",
      name: "Road Closure A",
      status: "active" as const,
      reason: "Security",
      coordinates: [
        [34.78, 32.07],
        [34.79, 32.08],
      ] as [number, number][],
      lastUpdatedAt: "2026-03-07T10:00:00.000+00:00",
    },
  ],
  hospitals: [
    {
      id: "hospital-1",
      name: "Hospital A",
      longitude: 34.79,
      latitude: 32.08,
      status: "open" as const,
      hasEmergencyRoom: true,
      region: "Center",
      city: "Tel Aviv",
      lastUpdatedAt: "2026-03-07T10:00:00.000+00:00",
    },
  ],
};

const dbBackedOverlays = {
  shelters: mapShelterRowsToOverlays([
    {
      id: "f2af468f-3a53-434a-a6b4-cf7a5300d91e",
      external_id: "shelter-db-1",
      name: "Shelter from DB",
      status: "open",
      region: "Center",
      city: "Tel Aviv",
      lat: 32.0853,
      lng: 34.7818,
      last_updated_at: "2026-03-09T10:40:00.000+00:00",
    },
  ]),
  roadClosures: mapRoadClosureRowsToOverlays([
    {
      id: "6e0576a3-df3c-4374-b216-5f6f020974ff",
      external_id: "closure-db-1",
      name: "Road Closure from DB",
      status: "active",
      reason: "Security",
      coordinates: [
        [34.78, 32.07],
        [34.79, 32.08],
      ] as [number, number][],
      last_updated_at: "2026-03-09T10:42:00.000+00:00",
    },
  ]),
  hospitals: mapHospitalRowsToOverlays([
    {
      id: "01697f74-4799-42b8-b341-c57f70c7402f",
      external_id: "hospital-db-1",
      name: "Hospital from DB",
      status: "open",
      has_emergency_room: true,
      region: "Center",
      city: "Tel Aviv",
      lat: 32.082,
      lng: 34.79,
      last_updated_at: "2026-03-09T10:45:00.000+00:00",
    },
  ]),
};

const alertMarkers = [
  {
    id: "93e9816a-1290-4231-9802-5f92a74ae34e",
    sourceId: "4ecff52f-a39f-452f-8e5f-8f4a0fa6bcbe",
    sourceName: "Home Front Command",
    title: "Alert in Tel Aviv",
    message: "Take shelter",
    alertType: "rocket",
    severity: "critical" as const,
    status: "active",
    region: "Center",
    city: "Tel Aviv",
    locationName: "Tel Aviv",
    longitude: 34.7818,
    latitude: 32.0853,
    publishedAt: "2026-03-07T10:00:00.000+00:00",
  },
  {
    id: "5ff8fb92-f772-4479-9987-96f1e1a5f73d",
    sourceId: "4ecff52f-a39f-452f-8e5f-8f4a0fa6bcbe",
    sourceName: "Home Front Command",
    title: "Alert in Ashdod",
    message: null,
    alertType: "rocket",
    severity: "high" as const,
    status: "active",
    region: "South",
    city: "Ashdod",
    locationName: "Ashdod",
    longitude: 34.6504,
    latitude: 31.8014,
    publishedAt: "2026-03-07T09:55:00.000+00:00",
  },
];

describe("MapPreview", () => {
  beforeEach(() => {
    useWatchlistStore.setState({ watchedLocations: [] });
  });

  it("renders shared command bar and status bar with alert counts", () => {
    render(<MapPreview content={content} alertMarkers={alertMarkers} overlays={emptyOverlays} />);

    expect(screen.getByTestId("command-bar")).toHaveAttribute("data-active-href", "/map");
    expect(screen.getByTestId("mobile-bottom-nav")).toHaveAttribute("data-active-href", "/map");
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText(content.statusBar.activeAlertsLabel)).toBeInTheDocument();
    expect(screen.getByText(content.statusBar.watchedAreasAffectedLabel)).toBeInTheDocument();
  });

  it("renders map with correct center from alert markers", () => {
    render(<MapPreview content={content} alertMarkers={alertMarkers} overlays={emptyOverlays} />);

    expect(screen.getByTestId("map-root")).toHaveAttribute("data-center", "34.7818,32.0853");
    expect(screen.getByTestId("map-controls")).toHaveAttribute("data-position", "bottom-end");
    expect(screen.getByTestId("map-controls")).toHaveAttribute(
      "data-zoom-in-label",
      content.mapControlsLabels.zoomIn,
    );
  });

  it("renders map legend and overlay controls", () => {
    render(<MapPreview content={content} alertMarkers={[]} overlays={emptyOverlays} />);

    expect(screen.getByText(content.alertsLegend)).toBeInTheDocument();
    expect(screen.getByText(content.sheltersLegend)).toBeInTheDocument();
    expect(screen.getByText(content.hospitalsLegend)).toBeInTheDocument();
    expect(screen.getByText(content.mapLayersTitle)).toBeInTheDocument();
  });

  it("centers on first watched location when no alert markers exist", () => {
    useWatchlistStore.setState({
      watchedLocations: [
        {
          id: "beer-sheva-31.2529-34.7915",
          name: "Beer Sheva",
          latitude: 31.2529,
          longitude: 34.7915,
          radiusKm: 10,
          country: "IL",
          region: "South",
          city: "Beer Sheva",
        },
      ],
    });

    render(<MapPreview content={content} alertMarkers={[]} overlays={emptyOverlays} />);

    expect(screen.getByTestId("map-root")).toHaveAttribute("data-center", "34.7915,31.2529");
  });

  it("falls back to default map center with empty alerts and watchlist", () => {
    render(<MapPreview content={content} alertMarkers={[]} overlays={emptyOverlays} />);

    expect(screen.getByTestId("map-root")).toHaveAttribute("data-center", "35.2137,31.7683");
    expect(screen.getByText(content.watchlist.emptyBody)).toBeInTheDocument();
  });

  it("removes a watched location from the watchlist panel", async () => {
    const user = userEvent.setup();

    useWatchlistStore.setState({
      watchedLocations: [
        {
          id: "haifa-32.7940-34.9896",
          name: "Haifa",
          latitude: 32.794,
          longitude: 34.9896,
          radiusKm: 12,
          country: "IL",
          region: "North",
          city: "Haifa",
        },
      ],
    });

    render(<MapPreview content={content} alertMarkers={alertMarkers} overlays={emptyOverlays} />);

    await user.click(screen.getByRole("button", { name: "Remove Haifa" }));

    expect(screen.getByText(content.watchlist.emptyBody)).toBeInTheDocument();
  });

  it("shows watched-area prioritization cues across map surfaces", () => {
    useWatchlistStore.setState({
      watchedLocations: [
        {
          id: "ashdod-31.8014-34.6435",
          name: "Ashdod",
          latitude: 31.8014,
          longitude: 34.6435,
          radiusKm: 16,
          country: "IL",
          region: "South",
          city: "Ashdod",
        },
        {
          id: "tel-aviv-32.0853-34.7818",
          name: "Tel Aviv",
          latitude: 32.0853,
          longitude: 34.7818,
          radiusKm: 18,
          country: "IL",
          region: "Center",
          city: "Tel Aviv",
        },
      ],
    });

    render(<MapPreview content={content} alertMarkers={alertMarkers} overlays={emptyOverlays} />);

    expect(screen.getAllByText(content.watchlistTopPriorityLabel).length).toBeGreaterThan(0);
    expect(screen.getAllByText(`${content.watchlistHighestSeverityLabel}: critical`).length).toBeGreaterThan(0);
    expect(screen.getAllByText(`${content.watchlistHighestSeverityLabel}: high`).length).toBeGreaterThan(
      0,
    );
  });

  it("toggles shelter, road closure, and hospital overlays", async () => {
    const user = userEvent.setup();

    render(<MapPreview content={content} alertMarkers={[]} overlays={sampleOverlays} />);

    await user.click(screen.getByRole("button", { name: content.mapLayersTitle }));

    expect(screen.getAllByTestId("map-marker")).toHaveLength(3);
    expect(screen.getAllByTestId("map-route")).toHaveLength(1);

    await user.click(screen.getByRole("switch", { name: content.overlaySheltersToggleLabel }));
    expect(screen.getAllByTestId("map-marker")).toHaveLength(2);

    await user.click(screen.getByRole("switch", { name: content.overlayRoadClosuresToggleLabel }));
    expect(screen.queryByTestId("map-route")).not.toBeInTheDocument();
    expect(screen.getAllByTestId("map-marker")).toHaveLength(1);

    await user.click(screen.getByRole("switch", { name: content.overlayHospitalsToggleLabel }));
    expect(screen.queryAllByTestId("map-marker")).toHaveLength(0);
  });

  it("starts with mobile map layers collapsed and expands on demand", async () => {
    const user = userEvent.setup();

    render(<MapPreview content={content} alertMarkers={[]} overlays={sampleOverlays} />);

    const toggleButton = screen.getByRole("button", { name: content.mapLayersTitle });

    expect(toggleButton).toHaveAttribute("aria-expanded", "false");
    expect(
      screen.queryByRole("switch", { name: content.overlaySheltersToggleLabel }),
    ).not.toBeInTheDocument();

    await user.click(toggleButton);

    expect(toggleButton).toHaveAttribute("aria-expanded", "true");
    expect(
      screen.getByRole("switch", { name: content.overlaySheltersToggleLabel }),
    ).toBeInTheDocument();
  });

  it("renders DB-backed overlays while keeping official alerts visible", () => {
    render(<MapPreview content={content} alertMarkers={alertMarkers} overlays={dbBackedOverlays} />);

    expect(screen.getAllByTestId("map-route")).toHaveLength(1);
    expect(screen.getAllByTestId("map-marker")).toHaveLength(5);
    expect(screen.getByText(alertMarkers[0].title)).toBeInTheDocument();
    expect(screen.getAllByText("Shelter from DB").length).toBeGreaterThan(0);
  });
});
