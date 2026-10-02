import React from "react";
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CommandBar } from "@/components/dashboard/command-bar";
import { FeedPanel } from "@/components/dashboard/feed-panel";
import { MobileBottomNav } from "@/components/navigation/mobile-bottom-nav";

vi.mock("@/components/i18n/locale-switcher", () => ({
  LocaleSwitcher: () => <div />,
}));
vi.mock("@/components/theme/theme-switcher", () => ({
  ThemeSwitcher: () => <div />,
}));
vi.mock("@/components/notifications/browser-notification-opt-in", () => ({
  BrowserNotificationOptIn: () => <div />,
}));
vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a {...props} href={`/he${href}`} />
  ),
}));

const navigation = { dashboard: "לוח בקרה", map: "מפה", intel: "מידע", alerts: "התראות" };

describe("dashboard navigation", () => {
  it.each(["/dashboard", "/map", "/feed"])("links to real localized pages with one active destination on %s", (activeHref) => {
    render(
      <CommandBar
        activeHref={activeHref}
        overallSourceHealthStatus="unknown"
        content={{
          title: "Magen",
          navigation,
          themeSwitcher: { label: "Theme", dark: "Dark", light: "Light" },
          sourceHealthOverallLabel: "Overall",
          sourceHealthStatuses: { healthy: "Healthy", degraded: "Degraded", down: "Down", unknown: "Unknown" },
        }}
      />,
    );
    const links = within(screen.getByRole("navigation")).getAllByRole("link");
    expect(links.map((link) => link.getAttribute("href"))).toEqual([
      "/he/dashboard", "/he/map", "/he/feed",
    ]);
    expect(links.map((link) => link.textContent)).toEqual([
      navigation.dashboard, navigation.map, navigation.intel,
    ]);
    expect(links.filter((link) => link.getAttribute("aria-current") === "page")).toHaveLength(1);
    expect(links.find((link) => link.getAttribute("aria-current") === "page")).toHaveAttribute("href", `/he${activeHref}`);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.queryByText("Assets")).not.toBeInTheDocument();
    expect(screen.queryByText("Logs")).not.toBeInTheDocument();
  });

  it("gives mobile navigation three distinct destinations and one current page", () => {
    render(<MobileBottomNav content={navigation} activeHref="/dashboard" />);
    const links = screen.getAllByRole("link");
    expect(links.map((link) => link.getAttribute("href"))).toEqual([
      "/he/dashboard", "/he/map", "/he/feed",
    ]);
    expect(links.filter((link) => link.getAttribute("aria-current") === "page")).toHaveLength(1);
  });

  it.each(["alerts", "news", "official"] as const)("opens the full %s feed from the history action", (activeTab) => {
    render(
      <FeedPanel
        activeTab={activeTab}
        setActiveTab={vi.fn()}
        filteredAlerts={[]}
        filteredNews={[]}
        filteredOfficial={[]}
        activeTabFilteredCount={0}
        shouldShowFeedLoading={false}
        shouldShowFeedError={false}
        hasActiveFilters={false}
        lastUpdated={null}
        content={{
          feedTitle: "Live Feed",
          viewFullHistoryLabel: "View Full History",
          feedTabs: { alerts: "Alerts", news: "News", official: "Official" },
          feedItemTypeLabels: { alerts: "Alert", news: "News", official: "Official" },
          statusLoading: "Loading", statusError: "Error", noFeedItems: "Empty",
          filterNoMatches: "No matches", locationLabel: "Location", sourceLabel: "Source",
          publishedLabel: "Published", updatedLabel: "Updated",
        }}
      />,
    );
    expect(screen.getByRole("link", { name: "View Full History" })).toHaveAttribute("href", `/he/feed?tab=${activeTab}`);
  });
});
