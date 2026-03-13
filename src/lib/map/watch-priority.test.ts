import { describe, expect, it } from "vitest";
import { getPrioritizedWatchedLocations } from "@/lib/map/watch-priority";
import type { MapAlertMarker, WatchedLocationMarker } from "@/lib/schemas/map";

const watchedLocations: WatchedLocationMarker[] = [
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
    id: "haifa-32.7940-34.9896",
    name: "Haifa",
    latitude: 32.794,
    longitude: 34.9896,
    radiusKm: 10,
    country: "IL",
    region: "North",
    city: "Haifa",
  },
];

const alertMarkers: MapAlertMarker[] = [
  {
    id: "93e9816a-1290-4231-9802-5f92a74ae34e",
    sourceId: "4ecff52f-a39f-452f-8e5f-8f4a0fa6bcbe",
    sourceName: "Home Front Command",
    title: "Alert in Tel Aviv",
    message: null,
    alertType: "rocket",
    severity: "critical",
    status: "active",
    region: "Center",
    city: "Tel Aviv",
    locationName: "Tel Aviv",
    longitude: 34.7818,
    latitude: 32.0853,
    publishedAt: "2026-03-09T10:00:00.000+00:00",
  },
  {
    id: "5ff8fb92-f772-4479-9987-96f1e1a5f73d",
    sourceId: "4ecff52f-a39f-452f-8e5f-8f4a0fa6bcbe",
    sourceName: "Home Front Command",
    title: "Alert in Ashdod",
    message: null,
    alertType: "rocket",
    severity: "high",
    status: "active",
    region: "South",
    city: "Ashdod",
    locationName: "Ashdod",
    longitude: 34.6504,
    latitude: 31.8014,
    publishedAt: "2026-03-09T09:55:00.000+00:00",
  },
  {
    id: "8fcbb4f5-4cd0-4e50-b303-b16d6d30f492",
    sourceId: "4ecff52f-a39f-452f-8e5f-8f4a0fa6bcbe",
    sourceName: "Home Front Command",
    title: "Second alert in Ashdod",
    message: null,
    alertType: "rocket",
    severity: "medium",
    status: "active",
    region: "South",
    city: "Ashdod",
    locationName: "Ashdod",
    longitude: 34.651,
    latitude: 31.802,
    publishedAt: "2026-03-09T09:50:00.000+00:00",
  },
];

describe("getPrioritizedWatchedLocations", () => {
  it("ranks watched locations by matched severity, count, and distance", () => {
    const prioritized = getPrioritizedWatchedLocations(watchedLocations, alertMarkers);

    expect(prioritized[0]?.location.name).toBe("Tel Aviv");
    expect(prioritized[0]?.rank).toBe(1);
    expect(prioritized[0]?.highestSeverity).toBe("critical");
    expect(prioritized[0]?.matchedAlertCount).toBe(1);
    expect(prioritized[0]?.nearestAlertDistanceKm).toBeCloseTo(0, 4);

    expect(prioritized[1]?.location.name).toBe("Ashdod");
    expect(prioritized[1]?.rank).toBe(2);
    expect(prioritized[1]?.highestSeverity).toBe("high");
    expect(prioritized[1]?.matchedAlertCount).toBe(2);

    expect(prioritized[2]?.location.name).toBe("Haifa");
    expect(prioritized[2]?.rank).toBeNull();
    expect(prioritized[2]?.highestSeverity).toBeNull();
    expect(prioritized[2]?.matchedAlertCount).toBe(0);
    expect(prioritized[2]?.nearestAlertDistanceKm).toBeNull();
  });

  it("returns empty list when watchlist is empty", () => {
    const prioritized = getPrioritizedWatchedLocations([], alertMarkers);

    expect(prioritized).toEqual([]);
  });
});
