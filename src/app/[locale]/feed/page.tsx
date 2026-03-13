import { getTranslations } from "next-intl/server";
import { LiveFeedPage } from "@/components/feed/live-feed-page";

export default async function LocalizedFeedPage() {
  const t = await getTranslations("feedPage");

  return (
    <LiveFeedPage
      content={{
        title: t("title"),
        description: t("description"),
        latestAlertTitle: t("latestAlertTitle"),
        latestAlertEmpty: t("latestAlertEmpty"),
        feedTabs: {
          alerts: t("feedTabs.alerts"),
          news: t("feedTabs.news"),
          official: t("feedTabs.official"),
        },
        statusLoading: t("statusLoading"),
        statusError: t("statusError"),
        noFeedItems: t("noFeedItems"),
        sourceLabel: t("sourceLabel"),
        publishedLabel: t("publishedLabel"),
        severityLabel: t("severityLabel"),
        locationLabel: t("locationLabel"),
        updatedLabel: t("updatedLabel"),
      }}
    />
  );
}
