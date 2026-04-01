import React from "react";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { useWatchlistStore } from "@/store/use-watchlist-store";

type MockRealtimeEvent = {
  table: "alerts" | "news_items" | "official_updates";
  event: "INSERT" | "UPDATE";
};

type MockSourceHealthRealtimeEvent = {
  table: "sources" | "ingestion_runs";
  event: "INSERT" | "UPDATE" | "DELETE";
};

let realtimeEventHandler: ((event: MockRealtimeEvent) => void) | null = null;
let sourceHealthRealtimeEventHandler:
  | ((event: MockSourceHealthRealtimeEvent) => void)
  | null = null;

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

vi.mock("@/components/layout/use-supabase-source-health-realtime", () => {
  return {
    useSupabaseSourceHealthRealtime: ({
      onSourceHealthEvent,
    }: {
      onSourceHealthEvent: (event: MockSourceHealthRealtimeEvent) => void;
    }) => {
      sourceHealthRealtimeEventHandler = onSourceHealthEvent;
    },
  };
});

vi.mock("@/components/i18n/locale-switcher", () => ({
  LocaleSwitcher: () => <div data-testid="locale-switcher" />,
}));

vi.mock("@/components/notifications/browser-notification-opt-in", () => ({
  BrowserNotificationOptIn: () => <div data-testid="browser-notification-opt-in" />,
}));

vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("@/store/use-watchlist-store", async () => {
  const { create } = await import("zustand");

  const useWatchlistStore = create<{
    watchedLocations: Array<{
      id: string;
      name: string;
      latitude: number;
      longitude: number;
      radiusKm: number;
      country: string;
      region: string | null;
      city: string | null;
    }>;
    addWatchedLocation: () => void;
    removeWatchedLocation: (id: string) => void;
    clearWatchedLocations: () => void;
  }>((set) => ({
    watchedLocations: [],
    addWatchedLocation: () => undefined,
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
  title: "Magen Crisis Monitor",
  subtitle: "Realtime overview",
  regionFilterLabel: "Region",
  regionFilterAll: "All regions",
  locationSearchLabel: "City or location",
  locationSearchPlaceholder: "Search city, area, or keyword",
  filterNoMatches: "No items match the current filters.",
  tickerLabel: "Breaking",
  tickerFallback: "No breaking updates",
  tickerTypes: {
    alert: "Alert",
    official: "Official",
    news: "News",
  },
  tickerBreakingTag: "Breaking",
  latestAlertTitle: "Latest Official Alert",
  latestAlertEmpty: "No active emergency alerts",
  alertMessageFallback: "No additional alert details were provided.",
  officialTitle: "Official Guidance",
  officialEmpty: "No active official guidance",
  watchlistTitle: "Watched Locations",
  watchlistEmpty: "No watched location matches",
  watchlistMatchSuffix: "active alerts",
  feedTitle: "Live Feed",
  viewFullHistoryLabel: "View Full History",
  feedTabs: {
    alerts: "Alerts",
    news: "News",
    official: "Official",
  },
  feedItemTypeLabels: {
    alerts: "Critical",
    official: "Official",
    news: "Update",
  },
  statusLoading: "Loading latest data...",
  statusError: "Could not load live data right now.",
  noFeedItems: "No feed items available.",
  updatedLabel: "Updated",
  sourceLabel: "Source",
  publishedLabel: "Published",
  severityLabel: "Severity",
  locationLabel: "Location",
  streamTitle: "Live Stream",
  streamLiveTitlePrefix: "Live Feed",
  streamSubtitle: "Live visual context from trusted broadcasters.",
  streamContextLabel: "Secondary Context",
  streamEmpty: "No live streams are available right now.",
  streamSourceFallbackLabel: "Live",
  streamWatchLabel: "Open on YouTube",
  sourceHealthTitle: "Source Health",
  sourceHealthOverallLabel: "Overall",
  sourceHealthTypes: {
    officialAlerts: "Official Alerts",
    officialGuidance: "Official Guidance",
    rssNews: "News Sources",
  },
  sourceHealthStatuses: {
    healthy: "Healthy",
    degraded: "Degraded",
    down: "Down",
    unknown: "Unknown",
  },
  themeSwitcher: {
    label: "Theme",
    dark: "Dark",
    light: "Light",
  },
  bottomNav: {
    dashboard: "Dashboard",
    map: "Map",
    intel: "Intel",
    alerts: "Alerts",
  },
};

function createJsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

function mockFetchByUrl() {
  const fetchMock = vi.fn((input: string | URL | Request) => {
    const url = String(input);

    if (url.includes("/api/dashboard/overview")) {
      return Promise.resolve(
        createJsonResponse({
          data: {
            latestAlert: {
              id: "5afde79f-d4f2-4dcf-be9b-2fca2abb3d97",
              sourceId: "d530d3f4-bf45-47a4-a6dd-893026f8858d",
              sourceName: "Home Front Command",
              title: "Latest alert from overview",
              message: "Take shelter",
              alertType: "rocket",
              severity: "critical",
              status: "active",
              country: "IL",
              region: "Center",
              city: "Tel Aviv",
              locationName: "Tel Aviv",
              latitude: 32.0853,
              longitude: 34.7818,
              publishedAt: "2026-03-06T14:18:11.000+00:00",
            },
            latestOfficialUpdate: {
              id: "6f8fbc6c-1af3-42d5-9ea3-47cc69a6adef",
              sourceId: "3abf5464-0b07-4f57-a5ec-596ce3836f80",
              sourceName: "Oref",
              title: "Official guidance headline",
              body: "Stay near protected spaces.",
              updateType: "featured_news",
              severity: "high",
              country: "IL",
              region: "Center",
              isActive: true,
              publishedAt: "2026-03-06T14:20:11.000+00:00",
            },
            topNews: [
              {
                id: "85e70658-07a9-4f84-9f3a-0371ea2f4531",
                sourceId: "d530d3f4-bf45-47a4-a6dd-893026f8858d",
                sourceName: "Times of Israel",
                title: "Top headline from overview",
                summary: "Summary",
                url: "https://example.com/news/1",
                author: null,
                topic: null,
                region: null,
                country: "IL",
                language: "en",
                severity: "medium",
                imageUrl: null,
                isBreaking: true,
                publishedAt: "2026-03-06T14:21:11.000+00:00",
              },
            ],
            activeStreams: [],
            watchedLocationMatches: [
              {
                locationName: "Tel Aviv",
                alertCount: 2,
              },
              {
                locationName: "Haifa",
                alertCount: 1,
              },
            ],
          },
          meta: {
            newsLimit: 5,
            streamLimit: 3,
          },
        }),
      );
    }

    if (url.includes("/api/source-health")) {
      return Promise.resolve(
        createJsonResponse({
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
              {
                sourceType: "official_guidance",
                status: "healthy",
                activeSourceCount: 1,
                healthySourceCount: 1,
                failingSourceCount: 0,
                staleSourceCount: 0,
                missingRunSourceCount: 0,
                lastRunAt: "2026-03-06T14:25:11.000+00:00",
                lastError: null,
              },
              {
                sourceType: "rss_news",
                status: "healthy",
                activeSourceCount: 4,
                healthySourceCount: 4,
                failingSourceCount: 0,
                staleSourceCount: 0,
                missingRunSourceCount: 0,
                lastRunAt: "2026-03-06T14:25:11.000+00:00",
                lastError: null,
              },
            ],
          },
          meta: {
            pollIntervalMs: 60000,
          },
        }),
      );
    }

    if (url.includes("/api/live-streams")) {
      return Promise.resolve(
        createJsonResponse({
          data: [
            {
              id: "4f7f241c-c857-4974-bf8e-d6dcff5f1fa7",
              sourceId: "db5b5b97-2fbe-4ffa-84fc-cf50eaf91306",
              sourceName: "Internal Manual Streams",
              title: "Live Stream Broadcast",
              description: "Live context feed",
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
        }),
      );
    }

    if (url.includes("/api/alerts")) {
      return Promise.resolve(
        createJsonResponse({
          data: [
            {
              id: "2930c4f6-4f57-49f4-9ccb-6959d4a54bf8",
              sourceId: "d530d3f4-bf45-47a4-a6dd-893026f8858d",
              sourceName: "Home Front Command",
              title: "Feed alert item",
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

    if (url.includes("/api/news")) {
      return Promise.resolve(
        createJsonResponse({
          data: [
            {
              id: "60ffb5e8-2725-4e7a-99f1-49711dddca26",
              sourceId: "d530d3f4-bf45-47a4-a6dd-893026f8858d",
              sourceName: "Times of Israel",
              title: "News tab item",
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

    if (url.includes("/api/official-updates")) {
      return Promise.resolve(
        createJsonResponse({
          data: [],
          meta: {
            count: 0,
            limit: 20,
            activeOnly: true,
          },
        }),
      );
    }

    return Promise.resolve(createJsonResponse({ error: "Unexpected URL" }, 404));
  });

  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

async function renderDashboardShell() {
  await act(async () => {
    render(<DashboardShell content={content} />);
    await Promise.resolve();
  });
}

describe("DashboardShell", () => {
  beforeEach(() => {
    realtimeEventHandler = null;
    sourceHealthRealtimeEventHandler = null;
    useWatchlistStore.setState({ watchedLocations: [] });
  });

  afterEach(async () => {
    await act(async () => {
      await Promise.resolve();
    });
    realtimeEventHandler = null;
    sourceHealthRealtimeEventHandler = null;
    vi.unstubAllGlobals();
  });

  it("shows loading state before async data resolves", async () => {
    const fetchMock = vi.fn(
      () => new Promise<Response>(() => {
        return;
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await renderDashboardShell();

    expect(screen.getAllByText(content.statusLoading).length).toBeGreaterThan(0);
  });

  it("renders overview data and default alerts tab", async () => {
    mockFetchByUrl();

    await renderDashboardShell();

    expect(
      (await screen.findAllByText("Latest alert from overview")).length,
    ).toBeGreaterThan(0);
    expect(await screen.findByTitle("Live Stream Broadcast")).toBeInTheDocument();
    expect(screen.getByText("Top headline from overview")).toBeInTheDocument();
    expect(await screen.findByText("Feed alert item")).toBeInTheDocument();
  });

  it("refreshes ticker and right-rail alerts after realtime alert events", async () => {
    let useUpdatedPayload = false;
    const fetchMock = vi.fn((input: string | URL | Request) => {
      const url = String(input);

      if (url.includes("/api/dashboard/overview")) {
        return Promise.resolve(
          createJsonResponse({
            data: {
              latestAlert: {
                id: "5afde79f-d4f2-4dcf-be9b-2fca2abb3d97",
                sourceId: "d530d3f4-bf45-47a4-a6dd-893026f8858d",
                sourceName: "Home Front Command",
                title: useUpdatedPayload
                  ? "Realtime latest alert from overview"
                  : "Latest alert from overview",
                message: "Take shelter",
                alertType: "rocket",
                severity: "critical",
                status: "active",
                country: "IL",
                region: "Center",
                city: "Tel Aviv",
                locationName: "Tel Aviv",
                latitude: 32.0853,
                longitude: 34.7818,
                publishedAt: "2026-03-06T14:18:11.000+00:00",
              },
              latestOfficialUpdate: null,
              topNews: [],
              activeStreams: [],
              watchedLocationMatches: [],
            },
            meta: {
              newsLimit: 5,
              streamLimit: 3,
            },
          }),
        );
      }

      if (url.includes("/api/source-health")) {
        return Promise.resolve(
          createJsonResponse({
            data: {
              overallStatus: "healthy",
              updatedAt: "2026-03-06T14:25:11.000+00:00",
              categories: [],
            },
            meta: {
              pollIntervalMs: 60000,
            },
          }),
        );
      }

      if (url.includes("/api/live-streams")) {
        return Promise.resolve(
          createJsonResponse({
            data: [],
            meta: {
              count: 0,
              limit: 3,
            },
          }),
        );
      }

      if (url.includes("/api/alerts")) {
        return Promise.resolve(
          createJsonResponse({
            data: [
              {
                id: "2930c4f6-4f57-49f4-9ccb-6959d4a54bf8",
                sourceId: "d530d3f4-bf45-47a4-a6dd-893026f8858d",
                sourceName: "Home Front Command",
                title: useUpdatedPayload ? "Feed alert item v2" : "Feed alert item",
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

      if (url.includes("/api/news")) {
        return Promise.resolve(
          createJsonResponse({
            data: [],
            meta: {
              count: 0,
              limit: 20,
            },
          }),
        );
      }

      if (url.includes("/api/official-updates")) {
        return Promise.resolve(
          createJsonResponse({
            data: [],
            meta: {
              count: 0,
              limit: 20,
              activeOnly: true,
            },
          }),
        );
      }

      return Promise.resolve(createJsonResponse({ error: "Unexpected URL" }, 404));
    });

    vi.stubGlobal("fetch", fetchMock);

    await renderDashboardShell();

    expect((await screen.findAllByText("Latest alert from overview")).length).toBeGreaterThan(
      0,
    );
    expect(await screen.findByText("Feed alert item")).toBeInTheDocument();

    useUpdatedPayload = true;

    await act(async () => {
      realtimeEventHandler?.({ table: "alerts", event: "INSERT" });
    });

    expect(
      (await screen.findAllByText("Realtime latest alert from overview", undefined, {
        timeout: 3000,
      })).length,
    ).toBeGreaterThan(0);
    expect(
      await screen.findByText("Feed alert item v2", undefined, {
        timeout: 3000,
      }),
    ).toBeInTheDocument();
  });

  it("refreshes source-health after realtime ingestion events", async () => {
    let sourceHealthDown = false;

    const fetchMock = vi.fn((input: string | URL | Request) => {
      const url = String(input);

      if (url.includes("/api/dashboard/overview")) {
        return Promise.resolve(
          createJsonResponse({
            data: {
              latestAlert: null,
              latestOfficialUpdate: null,
              topNews: [],
              activeStreams: [],
              watchedLocationMatches: [],
            },
            meta: {
              newsLimit: 5,
              streamLimit: 3,
            },
          }),
        );
      }

      if (url.includes("/api/source-health")) {
        return Promise.resolve(
          createJsonResponse({
            data: {
              overallStatus: sourceHealthDown ? "down" : "healthy",
              updatedAt: "2026-03-06T14:25:11.000+00:00",
              categories: [
                {
                  sourceType: "official_alerts",
                  status: sourceHealthDown ? "down" : "healthy",
                  activeSourceCount: 1,
                  healthySourceCount: sourceHealthDown ? 0 : 1,
                  failingSourceCount: sourceHealthDown ? 1 : 0,
                  staleSourceCount: 0,
                  missingRunSourceCount: 0,
                  lastRunAt: "2026-03-06T14:25:11.000+00:00",
                  lastError: sourceHealthDown ? "Worker failed" : null,
                },
                {
                  sourceType: "official_guidance",
                  status: "healthy",
                  activeSourceCount: 1,
                  healthySourceCount: 1,
                  failingSourceCount: 0,
                  staleSourceCount: 0,
                  missingRunSourceCount: 0,
                  lastRunAt: "2026-03-06T14:25:11.000+00:00",
                  lastError: null,
                },
                {
                  sourceType: "rss_news",
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
              pollIntervalMs: 60000,
            },
          }),
        );
      }

      if (url.includes("/api/live-streams")) {
        return Promise.resolve(
          createJsonResponse({
            data: [],
            meta: {
              count: 0,
              limit: 3,
            },
          }),
        );
      }

      if (url.includes("/api/alerts") || url.includes("/api/news")) {
        return Promise.resolve(
          createJsonResponse({
            data: [],
            meta: {
              count: 0,
              limit: 20,
            },
          }),
        );
      }

      if (url.includes("/api/official-updates")) {
        return Promise.resolve(
          createJsonResponse({
            data: [],
            meta: {
              count: 0,
              limit: 20,
              activeOnly: true,
            },
          }),
        );
      }

      return Promise.resolve(createJsonResponse({ error: "Unexpected URL" }, 404));
    });

    vi.stubGlobal("fetch", fetchMock);

    await renderDashboardShell();

    expect((await screen.findAllByText("Healthy")).length).toBeGreaterThan(0);

    sourceHealthDown = true;

    await act(async () => {
      sourceHealthRealtimeEventHandler?.({ table: "ingestion_runs", event: "INSERT" });
    });

    expect(
      (await screen.findAllByText("Down", undefined, { timeout: 3000 })).length,
    ).toBeGreaterThan(0);
  });

  it("renders alert hero with metadata and watchlist matches", async () => {
    mockFetchByUrl();

    await renderDashboardShell();

    expect(
      (await screen.findAllByText("Latest alert from overview")).length,
    ).toBeGreaterThan(0);

    expect(screen.getAllByText("Location: Tel Aviv").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Source: Home Front Command").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Source: Oref").length).toBeGreaterThan(0);

    expect(screen.getAllByText("Tel Aviv").length).toBeGreaterThan(0);
    expect(screen.getAllByText("2 active alerts").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Haifa").length).toBeGreaterThan(0);
    expect(screen.getAllByText("1 active alerts").length).toBeGreaterThan(0);
  });

  it("shows official and watchlist empty states when overview has no matching data", async () => {
    const fetchMock = vi.fn((input: string | URL | Request) => {
      const url = String(input);

      if (url.includes("/api/dashboard/overview")) {
        return Promise.resolve(
          createJsonResponse({
            data: {
              latestAlert: {
                id: "5afde79f-d4f2-4dcf-be9b-2fca2abb3d97",
                sourceId: "d530d3f4-bf45-47a4-a6dd-893026f8858d",
                sourceName: "Home Front Command",
                title: "Latest alert from overview",
                message: null,
                alertType: "rocket",
                severity: "critical",
                status: "active",
                country: "IL",
                region: "Center",
                city: "Tel Aviv",
                locationName: "Tel Aviv",
                latitude: 32.0853,
                longitude: 34.7818,
                publishedAt: "2026-03-06T14:18:11.000+00:00",
              },
              latestOfficialUpdate: null,
              topNews: [],
              activeStreams: [],
              watchedLocationMatches: [],
            },
            meta: {
              newsLimit: 5,
              streamLimit: 3,
            },
          }),
        );
      }

      if (url.includes("/api/source-health")) {
        return Promise.resolve(
          createJsonResponse({
            data: {
              overallStatus: "healthy",
              updatedAt: "2026-03-06T14:25:11.000+00:00",
              categories: [],
            },
            meta: {
              pollIntervalMs: 60000,
            },
          }),
        );
      }

      if (url.includes("/api/live-streams")) {
        return Promise.resolve(
          createJsonResponse({
            data: [],
            meta: {
              count: 0,
              limit: 3,
            },
          }),
        );
      }

      if (url.includes("/api/alerts") || url.includes("/api/news") || url.includes("/api/official-updates")) {
        return Promise.resolve(
          createJsonResponse({
            data: [],
            meta: {
              count: 0,
              limit: 20,
            },
          }),
        );
      }

      return Promise.resolve(createJsonResponse({ error: "Unexpected URL" }, 404));
    });

    vi.stubGlobal("fetch", fetchMock);

    await renderDashboardShell();

    expect((await screen.findAllByText(content.officialEmpty)).length).toBeGreaterThan(0);
    expect(screen.getAllByText(content.watchlistEmpty).length).toBeGreaterThan(0);
    expect(screen.getAllByText(content.alertMessageFallback).length).toBeGreaterThan(0);
  });

  it("fetches and renders news tab data on tab switch", async () => {
    const fetchMock = mockFetchByUrl();
    const user = userEvent.setup();

    await renderDashboardShell();

    await screen.findByText("Feed alert item");
    await user.click(screen.getByRole("tab", { name: content.feedTabs.news }));

    expect(await screen.findByText("News tab item")).toBeInTheDocument();
    expect(
      screen.getByRole("link", {
        name: "News tab item",
      }),
    ).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith("/api/news?limit=20", {
      cache: "no-store",
    });
  });

  it("shows official tab empty state in feed panel", async () => {
    const user = userEvent.setup();
    mockFetchByUrl();

    await renderDashboardShell();

    await screen.findByText("Feed alert item");
    await user.click(screen.getByRole("tab", { name: content.feedTabs.official }));

    expect(await screen.findByText(content.noFeedItems)).toBeInTheDocument();
  });

  it("shows tab-specific feed error and recovers when switching tabs", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn((input: string | URL | Request) => {
      const url = String(input);

      if (url.includes("/api/dashboard/overview")) {
        return Promise.resolve(
          createJsonResponse({
            data: {
              latestAlert: {
                id: "5afde79f-d4f2-4dcf-be9b-2fca2abb3d97",
                sourceId: "d530d3f4-bf45-47a4-a6dd-893026f8858d",
                sourceName: "Home Front Command",
                title: "Latest alert from overview",
                message: "Take shelter",
                alertType: "rocket",
                severity: "critical",
                status: "active",
                country: "IL",
                region: "Center",
                city: "Tel Aviv",
                locationName: "Tel Aviv",
                latitude: 32.0853,
                longitude: 34.7818,
                publishedAt: "2026-03-06T14:18:11.000+00:00",
              },
              latestOfficialUpdate: null,
              topNews: [],
              activeStreams: [],
              watchedLocationMatches: [],
            },
            meta: {
              newsLimit: 5,
              streamLimit: 3,
            },
          }),
        );
      }

      if (url.includes("/api/source-health")) {
        return Promise.resolve(
          createJsonResponse({
            data: {
              overallStatus: "healthy",
              updatedAt: "2026-03-06T14:25:11.000+00:00",
              categories: [],
            },
            meta: {
              pollIntervalMs: 60000,
            },
          }),
        );
      }

      if (url.includes("/api/live-streams")) {
        return Promise.resolve(
          createJsonResponse({
            data: [],
            meta: {
              count: 0,
              limit: 3,
            },
          }),
        );
      }

      if (url.includes("/api/alerts")) {
        return Promise.resolve(
          createJsonResponse({
            data: [
              {
                id: "2930c4f6-4f57-49f4-9ccb-6959d4a54bf8",
                sourceId: "d530d3f4-bf45-47a4-a6dd-893026f8858d",
                sourceName: "Home Front Command",
                title: "Feed alert item",
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

      if (url.includes("/api/news")) {
        return Promise.resolve(createJsonResponse({ error: "News unavailable" }, 500));
      }

      if (url.includes("/api/official-updates")) {
        return Promise.resolve(
          createJsonResponse({
            data: [],
            meta: {
              count: 0,
              limit: 20,
              activeOnly: true,
            },
          }),
        );
      }

      return Promise.resolve(createJsonResponse({ error: "Unexpected URL" }, 404));
    });

    vi.stubGlobal("fetch", fetchMock);

    await renderDashboardShell();

    await screen.findByText("Feed alert item");
    await user.click(screen.getByRole("tab", { name: content.feedTabs.news }));

    expect(await screen.findByText(content.statusError)).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: content.feedTabs.alerts }));

    expect(await screen.findByText("Feed alert item")).toBeInTheDocument();
  });

  it("filters feed items by selected region", async () => {
    const user = userEvent.setup();
    mockFetchByUrl();

    await renderDashboardShell();

    await screen.findByText("Feed alert item");
    await user.selectOptions(
      screen.getByRole("combobox", { name: content.regionFilterLabel }),
      "Center",
    );

    expect(screen.queryByText("Feed alert item")).not.toBeInTheDocument();
    expect(screen.getAllByText(content.filterNoMatches).length).toBeGreaterThan(0);

    await user.selectOptions(
      screen.getByRole("combobox", { name: content.regionFilterLabel }),
      "__all_regions__",
    );

    expect(await screen.findByText("Feed alert item")).toBeInTheDocument();
  });

  it("filters feed items by location search", async () => {
    const user = userEvent.setup();
    mockFetchByUrl();

    await renderDashboardShell();

    await screen.findByText("Feed alert item");
    await user.type(
      screen.getByRole("searchbox", { name: content.locationSearchLabel }),
      "haifa",
    );

    expect(screen.queryByText("Feed alert item")).not.toBeInTheDocument();
    expect(screen.getAllByText(content.filterNoMatches).length).toBeGreaterThan(0);
  });

  it("sends watched locations in overview request body", async () => {
    const fetchMock = mockFetchByUrl();

    useWatchlistStore.setState({
      watchedLocations: [
        {
          id: "tel-aviv-32.0853-34.7818",
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

    await renderDashboardShell();
    await screen.findAllByText("Latest alert from overview");

    const overviewCall = fetchMock.mock.calls.find(([input]) =>
      String(input).includes("/api/dashboard/overview"),
    );
    const requestInit = (overviewCall as unknown[] | undefined)?.[1] as
      | RequestInit
      | undefined;

    expect(requestInit?.method).toBe("POST");
    expect(requestInit?.headers).toEqual({
      "Content-Type": "application/json",
    });

    const parsedBody = JSON.parse(String(requestInit?.body));

    expect(parsedBody.watchedLocations).toHaveLength(1);
    expect(parsedBody.watchedLocations[0]).toMatchObject({
      name: "Tel Aviv",
      radiusKm: 25,
      latitude: 32.0853,
      longitude: 34.7818,
    });
  });

  it("shows localized fallback error when overview fails", async () => {
    const fetchMock = vi.fn((input: string | URL | Request) => {
      const url = String(input);

      if (url.includes("/api/dashboard/overview")) {
        return Promise.resolve(
          createJsonResponse({ error: "Overview unavailable" }, 500),
        );
      }

      if (url.includes("/api/source-health")) {
        return Promise.resolve(
          createJsonResponse({
            data: {
              overallStatus: "unknown",
              updatedAt: "2026-03-06T14:25:11.000+00:00",
              categories: [],
            },
            meta: {
              pollIntervalMs: 60000,
            },
          }),
        );
      }

      if (url.includes("/api/alerts")) {
        return Promise.resolve(
          createJsonResponse({
            data: [],
            meta: {
              count: 0,
              limit: 20,
            },
          }),
        );
      }

      if (url.includes("/api/live-streams")) {
        return Promise.resolve(
          createJsonResponse({
            data: [],
            meta: {
              count: 0,
              limit: 3,
            },
          }),
        );
      }

      return Promise.resolve(createJsonResponse({ error: "Unexpected URL" }, 404));
    });

    vi.stubGlobal("fetch", fetchMock);

    await renderDashboardShell();

    expect((await screen.findAllByText(content.statusError)).length).toBeGreaterThan(0);
    expect(screen.getAllByText(content.latestAlertEmpty).length).toBeGreaterThan(0);
    expect(screen.getAllByText(content.officialEmpty).length).toBeGreaterThan(0);
    expect(screen.getAllByText(content.watchlistEmpty).length).toBeGreaterThan(0);
  });
});
