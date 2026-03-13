import {
  alertsApiResponseSchema,
  apiErrorSchema,
  liveStreamsApiResponseSchema,
  newsApiResponseSchema,
  officialUpdatesApiResponseSchema,
  sourceHealthApiResponseSchema,
} from "@/lib/schemas/api-responses";
import type {
  AlertFeedItem,
  LiveStreamOverviewItem,
  NewsFeedItem,
  OfficialUpdateFeedItem,
  SourceHealthOverview,
} from "@/lib/schemas/feed";

export type FeedTabKey = "alerts" | "news" | "official";

export type AsyncState<T> = {
  data: T;
  isLoading: boolean;
  errorMessage: string | null;
  lastUpdated: number | null;
};

export const TAB_FETCH_INTERVALS: Record<FeedTabKey, number> = {
  alerts: 30_000,
  news: 60_000,
  official: 60_000,
};

export const SOURCE_HEALTH_FETCH_INTERVAL_MS = 60_000;
export const STREAMS_FETCH_INTERVAL_MS = 180_000;

export function formatDateTime(value: number | string): string {
  const date = typeof value === "number" ? new Date(value) : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  const locale =
    typeof document === "undefined" ? undefined : document.documentElement.lang || undefined;

  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function getAlertLocation(item: AlertFeedItem): string {
  return item.locationName ?? item.city ?? item.region ?? item.country;
}

function getApiErrorMessage(payload: unknown, fallback: string): string {
  const parsedError = apiErrorSchema.safeParse(payload);
  return parsedError.success ? parsedError.data.error : fallback;
}

export async function getAlertsData(limit = 20): Promise<AlertFeedItem[]> {
  const response = await fetch(`/api/alerts?limit=${limit}`, { cache: "no-store" });
  const payload: unknown = await response.json();

  if (!response.ok) {
    throw new Error(getApiErrorMessage(payload, "Failed to load alerts feed"));
  }

  const parsed = alertsApiResponseSchema.safeParse(payload);

  if (!parsed.success) {
    throw new Error("Invalid alerts feed payload");
  }

  return parsed.data.data;
}

export async function getNewsData(): Promise<NewsFeedItem[]> {
  const response = await fetch("/api/news?limit=20", { cache: "no-store" });
  const payload: unknown = await response.json();

  if (!response.ok) {
    throw new Error(getApiErrorMessage(payload, "Failed to load news feed"));
  }

  const parsed = newsApiResponseSchema.safeParse(payload);

  if (!parsed.success) {
    throw new Error("Invalid news feed payload");
  }

  return parsed.data.data;
}

export async function getOfficialUpdatesData(): Promise<OfficialUpdateFeedItem[]> {
  const response = await fetch("/api/official-updates?limit=20", {
    cache: "no-store",
  });
  const payload: unknown = await response.json();

  if (!response.ok) {
    throw new Error(
      getApiErrorMessage(payload, "Failed to load official updates feed"),
    );
  }

  const parsed = officialUpdatesApiResponseSchema.safeParse(payload);

  if (!parsed.success) {
    throw new Error("Invalid official updates feed payload");
  }

  return parsed.data.data;
}

export async function getSourceHealthData(): Promise<SourceHealthOverview> {
  const response = await fetch("/api/source-health", { cache: "no-store" });
  const payload: unknown = await response.json();

  if (!response.ok) {
    throw new Error(getApiErrorMessage(payload, "Failed to load source health"));
  }

  const parsed = sourceHealthApiResponseSchema.safeParse(payload);

  if (!parsed.success) {
    throw new Error("Invalid source health payload");
  }

  return parsed.data.data;
}

export async function getLiveStreamsData(limit = 3): Promise<LiveStreamOverviewItem[]> {
  const response = await fetch(`/api/live-streams?limit=${limit}`, {
    cache: "no-store",
  });
  const payload: unknown = await response.json();

  if (!response.ok) {
    throw new Error(getApiErrorMessage(payload, "Failed to load live streams"));
  }

  const parsed = liveStreamsApiResponseSchema.safeParse(payload);

  if (!parsed.success) {
    throw new Error("Invalid live streams payload");
  }

  return parsed.data.data;
}
