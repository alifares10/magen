import { getTranslations } from "next-intl/server";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import type { AppLocale } from "@/i18n/routing";
import {
  getAlertsFeed,
  getDashboardOverview,
  getNewsFeed,
  getOfficialUpdatesFeed,
  getSourceHealthOverview,
} from "@/lib/db/feed";

type LocalizedDashboardShellProps = {
  locale: AppLocale;
};

async function loadInitialDashboardData() {
  const [overview, sourceHealth, alerts, news, official] = await Promise.all([
    getDashboardOverview().catch(() => ({
      latestAlert: null,
      latestOfficialUpdate: null,
      topNews: [],
      activeStreams: [],
      watchedLocationMatches: [],
    })),
    getSourceHealthOverview().catch(() => ({
      overallStatus: "unknown" as const,
      updatedAt: new Date(0).toISOString(),
      categories: [],
    })),
    getAlertsFeed({ limit: 20, activeOnly: false }).catch(() => []),
    getNewsFeed(20).catch(() => []),
    getOfficialUpdatesFeed({ limit: 20, activeOnly: true }).catch(() => []),
  ]);

  return {
    overview,
    sourceHealth,
    alerts,
    news,
    official,
    loadedAt: Date.now(),
  };
}

export async function LocalizedDashboardShell({ locale }: LocalizedDashboardShellProps) {
  const [t, initialData] = await Promise.all([
    getTranslations({ locale, namespace: "app" }),
    loadInitialDashboardData(),
  ]);

  return (
    <DashboardShell
      initialData={initialData}
      content={{
        title: t("title"),
        subtitle: t("subtitle"),
        regionFilterLabel: t("regionFilterLabel"),
        regionFilterAll: t("regionFilterAll"),
        locationSearchLabel: t("locationSearchLabel"),
        locationSearchPlaceholder: t("locationSearchPlaceholder"),
        filterNoMatches: t("filterNoMatches"),
        tickerLabel: t("tickerLabel"),
        tickerFallback: t("tickerItem"),
        tickerTypes: {
          alert: t("tickerTypes.alert"),
          official: t("tickerTypes.official"),
          news: t("tickerTypes.news"),
        },
        tickerBreakingTag: t("tickerBreakingTag"),
        latestAlertTitle: t("latestAlertTitle"),
        latestAlertEmpty: t("latestAlertBody"),
        alertMessageFallback: t("alertMessageFallback"),
        officialTitle: t("officialTitle"),
        officialEmpty: t("officialBody"),
        watchlistTitle: t("watchlistTitle"),
        watchlistEmpty: t("watchlistBody"),
        watchlistMatchSuffix: t("watchlistMatchSuffix"),
        feedTitle: t("feedTitle"),
        viewFullHistoryLabel: t("viewFullHistoryLabel"),
        feedTabs: {
          alerts: t("feedTabs.alerts"),
          news: t("feedTabs.news"),
          official: t("feedTabs.official"),
        },
        feedItemTypeLabels: {
          alerts: t("feedItemTypeLabels.alerts"),
          official: t("feedItemTypeLabels.official"),
          news: t("feedItemTypeLabels.news"),
        },
        statusLoading: t("statusLoading"),
        statusError: t("statusError"),
        noFeedItems: t("noFeedItems"),
        updatedLabel: t("updatedLabel"),
        sourceLabel: t("sourceLabel"),
        publishedLabel: t("publishedLabel"),
        severityLabel: t("severityLabel"),
        locationLabel: t("locationLabel"),
        streamTitle: t("streamTitle"),
        streamLiveTitlePrefix: t("streamLiveTitlePrefix"),
        streamSubtitle: t("streamSubtitle"),
        streamContextLabel: t("streamContextLabel"),
        streamEmpty: t("streamEmpty"),
        streamSourceFallbackLabel: t("streamSourceFallbackLabel"),
        streamWatchLabel: t("streamWatchLabel"),
        sourceHealthTitle: t("sourceHealthTitle"),
        sourceHealthOverallLabel: t("sourceHealthOverallLabel"),
        sourceHealthTypes: {
          officialAlerts: t("sourceHealthTypes.officialAlerts"),
          officialGuidance: t("sourceHealthTypes.officialGuidance"),
          rssNews: t("sourceHealthTypes.rssNews"),
        },
        sourceHealthStatuses: {
          healthy: t("sourceHealthStatuses.healthy"),
          degraded: t("sourceHealthStatuses.degraded"),
          down: t("sourceHealthStatuses.down"),
          unknown: t("sourceHealthStatuses.unknown"),
        },
        themeSwitcher: {
          label: t("themeSwitcher.label"),
          dark: t("themeSwitcher.dark"),
          light: t("themeSwitcher.light"),
        },
        bottomNav: {
          dashboard: t("bottomNav.dashboard"),
          map: t("bottomNav.map"),
          intel: t("bottomNav.intel"),
          alerts: t("bottomNav.alerts"),
        },
      }}
    />
  );
}
