import { getTranslations } from "next-intl/server";
import { LiveFeedPage } from "@/components/feed/live-feed-page";

export default async function LocalizedFeedPage() {
  const t = await getTranslations("feedPage");

  return (
    <LiveFeedPage
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
          subtitle: t("streamSubtitle"),
          contextLabel: t("streamContextLabel"),
          empty: t("streamEmpty"),
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
        feedTabs: {
          alerts: t("feedTabs.alerts"),
          news: t("feedTabs.news"),
          official: t("feedTabs.official"),
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
