import { getTranslations } from "next-intl/server";
import { AppShell } from "@/components/layout/app-shell";

export async function LocalizedDashboardShell() {
  const t = await getTranslations("app");

  return (
    <AppShell
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
        feedTabs: {
          alerts: t("feedTabs.alerts"),
          news: t("feedTabs.news"),
          official: t("feedTabs.official"),
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
        streamSubtitle: t("streamSubtitle"),
        streamContextLabel: t("streamContextLabel"),
        streamEmpty: t("streamEmpty"),
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
      }}
    />
  );
}
