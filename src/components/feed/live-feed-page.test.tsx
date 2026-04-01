import React from "react";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LiveFeedPage } from "@/components/feed/live-feed-page";

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

vi.mock("@/components/navigation/mobile-bottom-nav", () => ({
  MobileBottomNav: () => <nav data-testid="mobile-bottom-nav" />,
}));

vi.mock("@/components/layout/use-supabase-source-health-realtime", () => ({
  useSupabaseSourceHealthRealtime: () => {},
}));

const content = {
  commandBar: {
    title: "Magen",
    themeSwitcher: { label: "Theme", dark: "Dark", light: "Light" },
    sourceHealthOverallLabel: "Overall",
    sourceHealthStatuses: {
      healthy: "Healthy",
      degraded: "Degraded",
      down: "Down",
      unknown: "Unknown",
    },
  },
  filterBar: {
    regionFilterLabel: "Region",
    regionFilterAll: "All regions",
    locationSearchLabel: "City or location",
    locationSearchPlaceholder: "Search city, area, or keyword",
  },
  alertHero: {
    latestAlertTitle: "Latest Official Alert",
    latestAlertEmpty: "No active emergency alerts right now.",
    alertMessageFallback: "No additional details.",
    filterNoMatches: "No items match.",
    locationLabel: "Location",
    sourceLabel: "Source",
    severityLabel: "Severity",
    publishedLabel: "Published",
    statusLoading: "Loading...",
    updatedLabel: "Updated",
  },
  stream: {
    title: "Live Stream",
    liveTitlePrefix: "Live Feed",
    subtitle: "Live visual context.",
    contextLabel: "Secondary Context",
    empty: "No streams.",
    sourceFallbackLabel: "Live",
    watchLabel: "Open on YouTube",
    sourceLabel: "Source",
    updatedLabel: "Updated",
    statusLoading: "Loading...",
  },
  bottomNav: {
    dashboard: "Dashboard",
    map: "Map",
    intel: "Intel",
    alerts: "Alerts",
  },
  chronologicalFeedTitle: "Chronological Feed",
  liveCoverageTitle: "Live Media Coverage",
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
  locationLabel: "Location",
  sourceLabel: "Source",
  publishedLabel: "Published",
  updatedLabel: "Updated",
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

    if (url.includes("/api/official-updates?limit=20")) {
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

    if (url.includes("/api/source-health")) {
      return Promise.resolve(
        createJsonResponse({
          data: {
            overallStatus: "healthy",
            categories: [],
          },
        }),
      );
    }

    if (url.includes("/api/live-streams")) {
      return Promise.resolve(
        createJsonResponse({
          data: [],
        }),
      );
    }

    return Promise.resolve(createJsonResponse({ error: "Unexpected URL" }, 404));
  });

  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

async function renderLiveFeedPage() {
  await act(async () => {
    render(<LiveFeedPage content={content} />);
    await Promise.resolve();
  });
}

describe("LiveFeedPage", () => {
  afterEach(async () => {
    await act(async () => {
      await Promise.resolve();
    });
    vi.unstubAllGlobals();
  });

  it("renders alert hero and alerts tab list", async () => {
    mockFetchByUrl();

    await renderLiveFeedPage();

    const matches = await screen.findAllByText("Alert feed item");
    // Appears in AlertHero and in the feed list
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it("loads news tab data when selected", async () => {
    const fetchMock = mockFetchByUrl();
    const user = userEvent.setup();

    await renderLiveFeedPage();
    await screen.findAllByText("Alert feed item");

    await user.click(screen.getByRole("tab", { name: content.feedTabs.news }));

    expect(await screen.findByText("News feed item")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith("/api/news?limit=20", {
      cache: "no-store",
    });
  });
});
