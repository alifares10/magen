import { describe, expect, it } from "vitest";
import {
  dashboardOverviewRequestBodySchema,
  liveStreamsApiResponseSchema,
  sourceHealthApiResponseSchema,
} from "@/lib/schemas/api-responses";

describe("dashboardOverviewRequestBodySchema", () => {
  it("accepts valid watched locations", () => {
    const parsed = dashboardOverviewRequestBodySchema.safeParse({
      watchedLocations: [
        {
          name: "Tel Aviv",
          latitude: 32.0853,
          longitude: 34.7818,
          radiusKm: 25,
          country: "IL",
          region: "Center",
          city: "Tel Aviv",
        },
      ],
    });

    expect(parsed.success).toBe(true);
    if (!parsed.success) {
      return;
    }

    expect(parsed.data.watchedLocations).toHaveLength(1);
    expect(parsed.data.watchedLocations[0]?.name).toBe("Tel Aviv");
  });

  it("rejects invalid coordinates and radius", () => {
    const parsed = dashboardOverviewRequestBodySchema.safeParse({
      watchedLocations: [
        {
          name: "Bad Coordinates",
          latitude: 132.0853,
          longitude: 34.7818,
          radiusKm: 0,
          country: "IL",
          region: null,
          city: null,
        },
      ],
    });

    expect(parsed.success).toBe(false);
  });
});

describe("sourceHealthApiResponseSchema", () => {
  it("accepts valid source health payload", () => {
    const parsed = sourceHealthApiResponseSchema.safeParse({
      data: {
        overallStatus: "healthy",
        updatedAt: "2026-03-06T14:25:11.000+00:00",
        categories: [
          {
            sourceType: "official_alerts",
            status: "healthy",
            activeSourceCount: 1,
            healthySourceCount: 1,
            failingSourceCount: 0,
            staleSourceCount: 0,
            missingRunSourceCount: 0,
            lastRunAt: "2026-03-06T14:25:11.000+00:00",
            lastError: null,
          },
        ],
      },
      meta: {
        pollIntervalMs: 60_000,
      },
    });

    expect(parsed.success).toBe(true);
  });
});

describe("liveStreamsApiResponseSchema", () => {
  it("accepts valid live stream payload", () => {
    const parsed = liveStreamsApiResponseSchema.safeParse({
      data: [
        {
          id: "4f7f241c-c857-4974-bf8e-d6dcff5f1fa7",
          sourceId: "db5b5b97-2fbe-4ffa-84fc-cf50eaf91306",
          sourceName: "Internal Manual Streams",
          title: "Live Stream Broadcast",
          description: null,
          platform: "youtube",
          embedUrl: "https://www.youtube.com/embed/gmtlJ_m2r5A",
          watchUrl: "https://www.youtube.com/watch?v=gmtlJ_m2r5A",
          region: null,
          country: "IL",
          sortOrder: 1,
        },
      ],
      meta: {
        count: 1,
        limit: 3,
      },
    });

    expect(parsed.success).toBe(true);
  });
});
