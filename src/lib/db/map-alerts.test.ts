import { describe, expect, it } from "vitest";
import { mapAlertRowsToMarkers } from "@/lib/db/map-alerts";

describe("mapAlertRowsToMarkers", () => {
  it("maps valid rows and skips invalid ones", () => {
    const markers = mapAlertRowsToMarkers([
      {
        id: "5afde79f-d4f2-4dcf-be9b-2fca2abb3d97",
        source_id: "d530d3f4-bf45-47a4-a6dd-893026f8858d",
        title: "Rocket sirens",
        message: "Take shelter",
        alert_type: "rocket",
        severity: "critical",
        status: "active",
        region: "Center",
        city: "Tel Aviv",
        location_name: null,
        lat: 32.0853,
        lng: 34.7818,
        published_at: "2026-03-06T14:18:11.000+00:00",
        sources: { name: "Home Front Command" },
      },
      {
        id: "2930c4f6-4f57-49f4-9ccb-6959d4a54bf8",
        source_id: "d530d3f4-bf45-47a4-a6dd-893026f8858d",
        title: "Missing coordinates",
        message: null,
        alert_type: "rocket",
        severity: "high",
        status: "active",
        region: null,
        city: null,
        location_name: null,
        lat: null,
        lng: 34.7818,
        published_at: "2026-03-06T14:18:11.000+00:00",
        sources: { name: "Home Front Command" },
      },
      {
        id: "f37a6ea9-dadf-42bc-9ad3-94af8efb3139",
        source_id: "d530d3f4-bf45-47a4-a6dd-893026f8858d",
        title: "Missing source",
        message: null,
        alert_type: "rocket",
        severity: "high",
        status: "active",
        region: null,
        city: null,
        location_name: null,
        lat: 31.7683,
        lng: 35.2137,
        published_at: "2026-03-06T14:18:11.000+00:00",
        sources: null,
      },
    ]);

    expect(markers).toHaveLength(1);
    expect(markers[0]).toMatchObject({
      title: "Rocket sirens",
      sourceName: "Home Front Command",
      latitude: 32.0853,
      longitude: 34.7818,
    });
  });
});
