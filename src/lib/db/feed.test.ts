import { describe, expect, it } from "vitest";
import {
  buildSourceHealthOverview,
  calculateDistanceInKilometers,
  computeWatchedLocationMatches,
  mapAlertRowsToFeedItems,
  mapLiveStreamRowsToOverviewItems,
  mapNewsRowsToFeedItems,
  mapOfficialUpdateRowsToFeedItems,
} from "@/lib/db/feed";

describe("mapAlertRowsToFeedItems", () => {
  it("maps valid alert rows and skips invalid rows", () => {
    const items = mapAlertRowsToFeedItems([
      {
        id: "5afde79f-d4f2-4dcf-be9b-2fca2abb3d97",
        source_id: "d530d3f4-bf45-47a4-a6dd-893026f8858d",
        title: "Rocket sirens",
        message: "Take shelter",
        alert_type: "rocket",
        severity: "critical",
        status: "active",
        country: "IL",
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
        title: "Missing source",
        message: null,
        alert_type: "rocket",
        severity: "high",
        status: "active",
        country: "IL",
        region: null,
        city: null,
        location_name: null,
        lat: 31.7683,
        lng: 35.2137,
        published_at: "2026-03-06T14:18:11.000+00:00",
        sources: null,
      },
    ]);

    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      title: "Rocket sirens",
      sourceName: "Home Front Command",
      latitude: 32.0853,
      longitude: 34.7818,
    });
  });
});

describe("mapNewsRowsToFeedItems", () => {
  it("maps valid news rows and skips invalid URLs", () => {
    const items = mapNewsRowsToFeedItems([
      {
        id: "85e70658-07a9-4f84-9f3a-0371ea2f4531",
        source_id: "d530d3f4-bf45-47a4-a6dd-893026f8858d",
        title: "Update",
        summary: "Summary",
        url: "https://example.com/news/1",
        author: null,
        topic: null,
        region: null,
        country: "IL",
        language: "en",
        severity: null,
        image_url: null,
        is_breaking: false,
        published_at: "2026-03-06T14:18:11.000+00:00",
        sources: { name: "Times of Israel" },
      },
      {
        id: "60ffb5e8-2725-4e7a-99f1-49711dddca26",
        source_id: "d530d3f4-bf45-47a4-a6dd-893026f8858d",
        title: "Invalid URL",
        summary: null,
        url: "not-a-url",
        author: null,
        topic: null,
        region: null,
        country: "IL",
        language: null,
        severity: null,
        image_url: null,
        is_breaking: false,
        published_at: "2026-03-06T14:18:11.000+00:00",
        sources: { name: "Times of Israel" },
      },
    ]);

    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      title: "Update",
      sourceName: "Times of Israel",
    });
  });
});

describe("mapOfficialUpdateRowsToFeedItems", () => {
  it("maps valid official update rows", () => {
    const items = mapOfficialUpdateRowsToFeedItems([
      {
        id: "6f8fbc6c-1af3-42d5-9ea3-47cc69a6adef",
        source_id: "d530d3f4-bf45-47a4-a6dd-893026f8858d",
        title: "Shelter guidance",
        body: "Stay near a shelter",
        update_type: "guidance",
        severity: "high",
        country: "IL",
        region: "Center",
        is_active: true,
        published_at: "2026-03-06T14:18:11.000+00:00",
        sources: [{ name: "Government Guidance Portal" }],
      },
    ]);

    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      title: "Shelter guidance",
      sourceName: "Government Guidance Portal",
      isActive: true,
    });
  });
});

describe("mapLiveStreamRowsToOverviewItems", () => {
  it("maps live stream rows with nullable source", () => {
    const items = mapLiveStreamRowsToOverviewItems([
      {
        id: "d0d35f53-fad1-4282-ba92-0f2a9be18faf",
        source_id: null,
        title: "Live stream",
        description: null,
        platform: "youtube",
        embed_url: "https://www.youtube.com/embed/abc123",
        watch_url: "https://www.youtube.com/watch?v=abc123",
        region: null,
        country: "IL",
        sort_order: 1,
        sources: null,
      },
    ]);

    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      title: "Live stream",
      sourceId: null,
      sourceName: null,
      sortOrder: 1,
    });
  });
});

describe("calculateDistanceInKilometers", () => {
  it("returns near-zero distance for identical coordinates", () => {
    const distance = calculateDistanceInKilometers(32.0853, 34.7818, 32.0853, 34.7818);

    expect(distance).toBeLessThan(0.001);
  });
});

describe("computeWatchedLocationMatches", () => {
  it("counts active alerts within watched radius and sorts by count", () => {
    const matches = computeWatchedLocationMatches(
      [
        {
          name: "Tel Aviv",
          latitude: 32.0853,
          longitude: 34.7818,
          radiusKm: 30,
          country: "IL",
          region: "Center",
          city: "Tel Aviv",
        },
        {
          name: "Jerusalem",
          latitude: 31.7683,
          longitude: 35.2137,
          radiusKm: 10,
          country: "IL",
          region: "Jerusalem",
          city: "Jerusalem",
        },
      ],
      [
        {
          id: "5afde79f-d4f2-4dcf-be9b-2fca2abb3d97",
          lat: 32.0853,
          lng: 34.7818,
          location_name: "Tel Aviv",
          city: "Tel Aviv",
          region: "Center",
          country: "IL",
        },
        {
          id: "2930c4f6-4f57-49f4-9ccb-6959d4a54bf8",
          lat: 32.1093,
          lng: 34.8555,
          location_name: "Ramat Hasharon",
          city: "Ramat Hasharon",
          region: "Center",
          country: "IL",
        },
        {
          id: "60ffb5e8-2725-4e7a-99f1-49711dddca26",
          lat: 31.7683,
          lng: 35.2137,
          location_name: "Jerusalem",
          city: "Jerusalem",
          region: "Jerusalem",
          country: "IL",
        },
      ],
    );

    expect(matches).toEqual([
      {
        locationName: "Tel Aviv",
        alertCount: 2,
      },
      {
        locationName: "Jerusalem",
        alertCount: 1,
      },
    ]);
  });

  it("skips invalid alert rows and zero-match locations", () => {
    const matches = computeWatchedLocationMatches(
      [
        {
          name: "Beer Sheva",
          latitude: 31.2518,
          longitude: 34.7913,
          radiusKm: 15,
          country: "IL",
          region: "South",
          city: "Beer Sheva",
        },
      ],
      [
        {
          id: "invalid-id",
          lat: 31.2518,
          lng: 34.7913,
          location_name: "Beer Sheva",
          city: "Beer Sheva",
          region: "South",
          country: "IL",
        },
      ],
    );

    expect(matches).toEqual([]);
  });
});

describe("buildSourceHealthOverview", () => {
  it("marks overall health as healthy when all sources are fresh and successful", () => {
    const overview = buildSourceHealthOverview({
      activeSources: [
        {
          id: "d530d3f4-bf45-47a4-a6dd-893026f8858d",
          sourceType: "official_alerts",
        },
        {
          id: "3abf5464-0b07-4f57-a5ec-596ce3836f80",
          sourceType: "official_guidance",
        },
        {
          id: "9e7e2473-2ab4-4b09-b0fd-0df58cabbe8e",
          sourceType: "rss_news",
        },
      ],
      ingestionRuns: [
        {
          sourceId: "d530d3f4-bf45-47a4-a6dd-893026f8858d",
          jobType: "official_alerts",
          status: "success",
          startedAt: "2026-03-06T14:24:11.000+00:00",
          finishedAt: "2026-03-06T14:24:30.000+00:00",
          errorMessage: null,
        },
        {
          sourceId: "3abf5464-0b07-4f57-a5ec-596ce3836f80",
          jobType: "official_guidance",
          status: "success",
          startedAt: "2026-03-06T14:20:11.000+00:00",
          finishedAt: "2026-03-06T14:20:25.000+00:00",
          errorMessage: null,
        },
        {
          sourceId: "9e7e2473-2ab4-4b09-b0fd-0df58cabbe8e",
          jobType: "rss_news",
          status: "success",
          startedAt: "2026-03-06T14:15:11.000+00:00",
          finishedAt: "2026-03-06T14:15:20.000+00:00",
          errorMessage: null,
        },
      ],
      now: new Date("2026-03-06T14:25:00.000+00:00"),
    });

    expect(overview.overallStatus).toBe("healthy");
    expect(overview.categories).toHaveLength(3);
    expect(
      overview.categories.every((category) => category.status === "healthy"),
    ).toBe(true);
  });

  it("marks overall health down when any active category is down", () => {
    const overview = buildSourceHealthOverview({
      activeSources: [
        {
          id: "d530d3f4-bf45-47a4-a6dd-893026f8858d",
          sourceType: "official_alerts",
        },
        {
          id: "03deac45-44ca-4388-bd89-8f5899e02648",
          sourceType: "official_alerts",
        },
        {
          id: "3abf5464-0b07-4f57-a5ec-596ce3836f80",
          sourceType: "official_guidance",
        },
      ],
      ingestionRuns: [
        {
          sourceId: "d530d3f4-bf45-47a4-a6dd-893026f8858d",
          jobType: "official_alerts",
          status: "failed",
          startedAt: "2026-03-06T14:24:11.000+00:00",
          finishedAt: "2026-03-06T14:24:30.000+00:00",
          errorMessage: "HTTP 500",
        },
        {
          sourceId: "03deac45-44ca-4388-bd89-8f5899e02648",
          jobType: "official_alerts",
          status: "failed",
          startedAt: "2026-03-06T14:23:11.000+00:00",
          finishedAt: "2026-03-06T14:23:20.000+00:00",
          errorMessage: "Timeout",
        },
        {
          sourceId: "3abf5464-0b07-4f57-a5ec-596ce3836f80",
          jobType: "official_guidance",
          status: "success",
          startedAt: "2026-03-06T14:20:11.000+00:00",
          finishedAt: "2026-03-06T14:20:25.000+00:00",
          errorMessage: null,
        },
      ],
      now: new Date("2026-03-06T14:25:00.000+00:00"),
    });

    const alertsCategory = overview.categories.find(
      (category) => category.sourceType === "official_alerts",
    );
    const guidanceCategory = overview.categories.find(
      (category) => category.sourceType === "official_guidance",
    );

    expect(alertsCategory?.status).toBe("down");
    expect(alertsCategory?.failingSourceCount).toBe(2);
    expect(guidanceCategory?.status).toBe("healthy");
    expect(overview.overallStatus).toBe("down");
  });
});
