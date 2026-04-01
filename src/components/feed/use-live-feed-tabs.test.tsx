import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useLiveFeedTabs } from "@/components/feed/use-live-feed-tabs";

type MockRealtimeEvent = {
  table: "alerts" | "news_items" | "official_updates";
  event: "INSERT" | "UPDATE";
};

let realtimeEventHandler: ((event: MockRealtimeEvent) => void) | null = null;

vi.mock("@/components/feed/use-supabase-feed-realtime", () => {
  return {
    useSupabaseFeedRealtime: ({
      onFeedEvent,
    }: {
      onFeedEvent: (event: MockRealtimeEvent) => void;
    }) => {
      realtimeEventHandler = onFeedEvent;
    },
  };
});

function createJsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

describe("useLiveFeedTabs", () => {
  beforeEach(() => {
    realtimeEventHandler = null;
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("fetches alerts by default and fetches news on tab switch", async () => {
    const fetchMock = vi.fn((input: string | URL | Request) => {
      const url = String(input);

      if (url.includes("/api/alerts?limit=20")) {
        return Promise.resolve(
          createJsonResponse({
            data: [
              {
                id: "2930c4f6-4f57-49f4-9ccb-6959d4a54bf8",
                sourceId: "d530d3f4-bf45-47a4-a6dd-893026f8858d",
                sourceName: "Home Front Command",
                title: "Alert feed item",
                message: null,
                alertType: "rocket",
                severity: "high",
                status: "active",
                country: "IL",
                region: "South",
                city: "Sderot",
                locationName: null,
                latitude: 31.522,
                longitude: 34.595,
                publishedAt: "2026-03-06T14:22:11.000+00:00",
              },
            ],
            meta: {
              count: 1,
              limit: 20,
            },
          }),
        );
      }

      if (url.includes("/api/news?limit=20")) {
        return Promise.resolve(
          createJsonResponse({
            data: [
              {
                id: "60ffb5e8-2725-4e7a-99f1-49711dddca26",
                sourceId: "d530d3f4-bf45-47a4-a6dd-893026f8858d",
                sourceName: "Times of Israel",
                title: "News feed item",
                summary: "Summary",
                url: "https://example.com/news/2",
                author: null,
                topic: null,
                region: null,
                country: "IL",
                language: "en",
                severity: null,
                imageUrl: null,
                isBreaking: false,
                publishedAt: "2026-03-06T14:23:11.000+00:00",
              },
            ],
            meta: {
              count: 1,
              limit: 20,
            },
          }),
        );
      }

      return Promise.resolve(createJsonResponse({ error: "Unexpected URL" }, 404));
    });

    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() =>
      useLiveFeedTabs({
        statusErrorMessage: "Could not load live data right now.",
      }),
    );

    await waitFor(() => {
      expect(result.current.alertsState.data).toHaveLength(1);
    });

    expect(fetchMock).toHaveBeenCalledWith("/api/alerts?limit=20", {
      cache: "no-store",
    });

    await act(async () => {
      result.current.setActiveTab("news");
    });

    await waitFor(() => {
      expect(result.current.newsState.data).toHaveLength(1);
    });

    expect(fetchMock).toHaveBeenCalledWith("/api/news?limit=20", {
      cache: "no-store",
    });
  });

  it("surfaces api error message for failed tab fetch", async () => {
    const fetchMock = vi.fn((input: string | URL | Request) => {
      const url = String(input);

      if (url.includes("/api/news?limit=20")) {
        return Promise.resolve(createJsonResponse({ error: "News unavailable" }, 500));
      }

      return Promise.resolve(createJsonResponse({ error: "Unexpected URL" }, 404));
    });

    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() =>
      useLiveFeedTabs({
        statusErrorMessage: "Could not load live data right now.",
        initialActiveTab: "news",
      }),
    );

    await waitFor(() => {
      expect(result.current.shouldShowFeedError).toBe(true);
    });

    expect(result.current.newsState.errorMessage).toBe("News unavailable");
  });

  it("refreshes active tab when realtime event arrives", async () => {
    let alertVersion = 1;
    const fetchMock = vi.fn((input: string | URL | Request) => {
      const url = String(input);

      if (url.includes("/api/alerts?limit=20")) {
        return Promise.resolve(
          createJsonResponse({
            data: [
              {
                id: "2930c4f6-4f57-49f4-9ccb-6959d4a54bf8",
                sourceId: "d530d3f4-bf45-47a4-a6dd-893026f8858d",
                sourceName: "Home Front Command",
                title: `Alert feed item v${alertVersion}`,
                message: null,
                alertType: "rocket",
                severity: "high",
                status: "active",
                country: "IL",
                region: "South",
                city: "Sderot",
                locationName: null,
                latitude: 31.522,
                longitude: 34.595,
                publishedAt: "2026-03-06T14:22:11.000+00:00",
              },
            ],
            meta: {
              count: 1,
              limit: 20,
            },
          }),
        );
      }

      return Promise.resolve(createJsonResponse({ error: "Unexpected URL" }, 404));
    });

    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() =>
      useLiveFeedTabs({
        statusErrorMessage: "Could not load live data right now.",
      }),
    );

    await waitFor(() => {
      expect(result.current.alertsState.data[0]?.title).toBe("Alert feed item v1");
    });

    alertVersion = 2;

    await act(async () => {
      realtimeEventHandler?.({ table: "alerts", event: "INSERT" });
      await new Promise((resolve) => {
        window.setTimeout(resolve, 450);
      });
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(result.current.alertsState.data[0]?.title).toBe("Alert feed item v2");
    });
  });

  it("uses seeded initial feed data without showing an empty loading state", async () => {
    const fetchMock = vi.fn(
      () =>
        new Promise<Response>(() => {
          // Intentionally unresolved to verify seeded state renders immediately.
        }),
    );

    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() =>
      useLiveFeedTabs({
        statusErrorMessage: "Could not load live data right now.",
        initialAlertsLoading: true,
        initialAlertsData: [
          {
            id: "2930c4f6-4f57-49f4-9ccb-6959d4a54bf8",
            sourceId: "d530d3f4-bf45-47a4-a6dd-893026f8858d",
            sourceName: "Home Front Command",
            title: "Seeded alert item",
            message: null,
            alertType: "rocket",
            severity: "high",
            status: "active",
            country: "IL",
            region: "South",
            city: "Sderot",
            locationName: null,
            latitude: 31.522,
            longitude: 34.595,
            publishedAt: "2026-03-06T14:22:11.000+00:00",
          },
        ],
        initialDataLoadedAt: 123,
      }),
    );

    expect(result.current.alertsState.data[0]?.title).toBe("Seeded alert item");
    expect(result.current.alertsState.lastUpdated).toBe(123);
    expect(result.current.shouldShowFeedLoading).toBe(false);
  });
});
