import type { DashboardOverview, SourceHealthStatus } from "@/lib/schemas/feed";
import type { TickerItem } from "@/lib/feed/filters";

export function buildTickerItems(overview: DashboardOverview | null): TickerItem[] {
  if (!overview) {
    return [];
  }

  const items: TickerItem[] = [];

  if (overview.latestAlert) {
    items.push({
      id: `alert-${overview.latestAlert.id}`,
      type: "alert",
      title: overview.latestAlert.title,
      sourceName: overview.latestAlert.sourceName,
      severity: overview.latestAlert.severity,
      region: overview.latestAlert.region,
      locationName:
        overview.latestAlert.locationName ??
        overview.latestAlert.city ??
        overview.latestAlert.region,
      isBreaking: true,
    });
  }

  if (overview.latestOfficialUpdate) {
    items.push({
      id: `official-${overview.latestOfficialUpdate.id}`,
      type: "official",
      title: overview.latestOfficialUpdate.title,
      sourceName: overview.latestOfficialUpdate.sourceName,
      severity: overview.latestOfficialUpdate.severity,
      region: overview.latestOfficialUpdate.region,
      locationName: overview.latestOfficialUpdate.region,
      isBreaking: true,
    });
  }

  const breakingNewsItems = overview.topNews.filter((item) => item.isBreaking);
  const prioritizedNewsItems =
    breakingNewsItems.length > 0 ? breakingNewsItems : overview.topNews;

  for (const newsItem of prioritizedNewsItems.slice(0, 4)) {
    items.push({
      id: `news-${newsItem.id}`,
      type: "news",
      title: newsItem.title,
      sourceName: newsItem.sourceName,
      severity: newsItem.severity,
      region: newsItem.region,
      locationName: newsItem.region,
      isBreaking: newsItem.isBreaking,
    });
  }

  return items;
}

export function getSourceHealthStatusLabel(
  status: SourceHealthStatus,
  labels: { healthy: string; degraded: string; down: string; unknown: string },
): string {
  if (status === "healthy") {
    return labels.healthy;
  }

  if (status === "degraded") {
    return labels.degraded;
  }

  if (status === "down") {
    return labels.down;
  }

  return labels.unknown;
}
