import { getTranslations } from "next-intl/server";
import { LiveFeedPage } from "@/components/feed/live-feed-page";
import type { AppLocale } from "@/i18n/routing";
import {
  getAlertsFeed,
  getNewsFeed,
  getOfficialUpdatesFeed,
} from "@/lib/db/feed";

export const dynamic = "force-dynamic";

async function loadInitialFeedData() {
  const [alerts, news, official] = await Promise.all([
    getAlertsFeed({ limit: 20 }).catch(() => []),
    getNewsFeed(20).catch(() => []),
    getOfficialUpdatesFeed({ limit: 20, activeOnly: true }).catch(() => []),
  ]);

  return {
    alerts,
    news,
    official,
    loadedAt: Date.now(),
  };
}

type LocalizedFeedPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function LocalizedFeedPage({ params }: LocalizedFeedPageProps) {
  const { locale } = await params;
  const appLocale = locale as AppLocale;
  const [t, initialFeedData] = await Promise.all([
    getTranslations({ locale: appLocale, namespace: "feedPage" }),
    loadInitialFeedData(),
  ]);

  return (
    <LiveFeedPage
      initialFeedData={initialFeedData}
      content={{
        commandBar: {
          title: "Magen",
          themeSwitcher: {
            label: t("themeSwitcher.label"),
            dark: t("themeSwitcher.dark"),
            light: t("themeSwitcher.light"),
          },
          sourceHealthOverallLabel: t("sourceHealthOverallLabel"),
          sourceHealthStatuses: {
            healthy: t("sourceHealthStatuses.healthy"),
            degraded: t("sourceHealthStatuses.degraded"),
            down: t("sourceHealthStatuses.down"),
            unknown: t("sourceHealthStatuses.unknown"),
          },
        },
        filterBar: {
          regionFilterLabel: t("regionFilterLabel"),
          regionFilterAll: t("regionFilterAll"),
          locationSearchLabel: t("locationSearchLabel"),
          locationSearchPlaceholder: t("locationSearchPlaceholder"),
        },
        alertHero: {
          latestAlertTitle: t("latestAlertTitle"),
          latestAlertEmpty: t("latestAlertEmpty"),
          alertMessageFallback: t("alertMessageFallback"),
          filterNoMatches: t("filterNoMatches"),
          locationLabel: t("locationLabel"),
          sourceLabel: t("sourceLabel"),
          severityLabel: t("severityLabel"),
          publishedLabel: t("publishedLabel"),
          statusLoading: t("statusLoading"),
          updatedLabel: t("updatedLabel"),
        },
        stream: {
          title: t("streamTitle"),
          liveTitlePrefix: t("streamLiveTitlePrefix"),
          subtitle: t("streamSubtitle"),
          contextLabel: t("streamContextLabel"),
          empty: t("streamEmpty"),
          sourceFallbackLabel: t("streamSourceFallbackLabel"),
          watchLabel: t("streamWatchLabel"),
          sourceLabel: t("sourceLabel"),
          updatedLabel: t("updatedLabel"),
          statusLoading: t("statusLoading"),
        },
        bottomNav: {
          dashboard: t("bottomNav.dashboard"),
          map: t("bottomNav.map"),
          intel: t("bottomNav.intel"),
          alerts: t("bottomNav.alerts"),
        },
        chronologicalFeedTitle: t("chronologicalFeedTitle"),
        liveCoverageTitle: t("liveCoverageTitle"),
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
        locationLabel: t("locationLabel"),
        sourceLabel: t("sourceLabel"),
        publishedLabel: t("publishedLabel"),
        updatedLabel: t("updatedLabel"),
      }}
    />
  );
}
