"use client";

import { useEffect, useRef, useState } from "react";
import { useSupabaseSourceHealthRealtime } from "@/components/layout/use-supabase-source-health-realtime";
import { LocaleSwitcher } from "@/components/i18n/locale-switcher";
import { BrowserNotificationOptIn } from "@/components/notifications/browser-notification-opt-in";
import {
  apiErrorSchema,
  dashboardOverviewRequestBodySchema,
  dashboardOverviewApiResponseSchema,
} from "@/lib/schemas/api-responses";
import type { DashboardOverviewRequestBody } from "@/lib/schemas/api-responses";
import type {
  AlertFeedItem,
  DashboardOverview,
  NewsFeedItem,
  OfficialUpdateFeedItem,
  SourceHealthOverview,
  SourceHealthStatus,
  SourceHealthType,
} from "@/lib/schemas/feed";
import {
  formatDateTime,
  getAlertLocation,
  getLiveStreamsData,
  getSourceHealthData,
  SOURCE_HEALTH_FETCH_INTERVAL_MS,
  STREAMS_FETCH_INTERVAL_MS,
  TAB_FETCH_INTERVALS,
  type AsyncState,
} from "@/lib/feed/client";
import { useLiveFeedTabs } from "@/components/feed/use-live-feed-tabs";
import { StreamPanel } from "@/components/streams/stream-panel";
import { useWatchlistStore } from "@/store/use-watchlist-store";

type AppShellContent = {
  title: string;
  subtitle: string;
  regionFilterLabel: string;
  regionFilterAll: string;
  locationSearchLabel: string;
  locationSearchPlaceholder: string;
  filterNoMatches: string;
  tickerLabel: string;
  tickerFallback: string;
  tickerTypes: {
    alert: string;
    official: string;
    news: string;
  };
  tickerBreakingTag: string;
  latestAlertTitle: string;
  latestAlertEmpty: string;
  alertMessageFallback: string;
  officialTitle: string;
  officialEmpty: string;
  watchlistTitle: string;
  watchlistEmpty: string;
  watchlistMatchSuffix: string;
  feedTitle: string;
  feedTabs: {
    alerts: string;
    news: string;
    official: string;
  };
  statusLoading: string;
  statusError: string;
  noFeedItems: string;
  updatedLabel: string;
  sourceLabel: string;
  publishedLabel: string;
  severityLabel: string;
  locationLabel: string;
  streamTitle: string;
  streamSubtitle: string;
  streamContextLabel: string;
  streamEmpty: string;
  streamWatchLabel: string;
  sourceHealthTitle: string;
  sourceHealthOverallLabel: string;
  sourceHealthTypes: {
    officialAlerts: string;
    officialGuidance: string;
    rssNews: string;
  };
  sourceHealthStatuses: {
    healthy: string;
    degraded: string;
    down: string;
    unknown: string;
  };
};

type AppShellProps = {
  content: AppShellContent;
};

const ALL_REGIONS_FILTER_VALUE = "__all_regions__";
const OVERVIEW_REALTIME_REFRESH_DEBOUNCE_MS = 400;
const SOURCE_HEALTH_REALTIME_REFRESH_DEBOUNCE_MS = 600;

function getApiErrorMessage(payload: unknown, fallback: string): string {
  const parsedError = apiErrorSchema.safeParse(payload);
  return parsedError.success ? parsedError.data.error : fallback;
}

const sourceHealthTypeOrder: SourceHealthType[] = [
  "official_alerts",
  "official_guidance",
  "rss_news",
];

function getSourceHealthStatusClasses(status: SourceHealthStatus): string {
  if (status === "healthy") {
    return "border-emerald-300 bg-emerald-50 text-emerald-800";
  }

  if (status === "degraded") {
    return "border-amber-300 bg-amber-50 text-amber-900";
  }

  if (status === "down") {
    return "border-rose-300 bg-rose-50 text-rose-800";
  }

  return "border-zinc-300 bg-zinc-100 text-zinc-700";
}

async function getDashboardOverviewData(
  watchedLocations: DashboardOverviewRequestBody["watchedLocations"],
): Promise<DashboardOverview> {
  const requestBody = dashboardOverviewRequestBodySchema.parse({
    watchedLocations,
  });
  const response = await fetch("/api/dashboard/overview", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
    cache: "no-store",
  });
  const payload: unknown = await response.json();

  if (!response.ok) {
    throw new Error(
      getApiErrorMessage(payload, "Failed to load dashboard overview"),
    );
  }

  const parsed = dashboardOverviewApiResponseSchema.safeParse(payload);

  if (!parsed.success) {
    throw new Error("Invalid dashboard overview payload");
  }

  return parsed.data.data;
}

function getSourceHealthStatusLabel(
  status: SourceHealthStatus,
  labels: AppShellContent["sourceHealthStatuses"],
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

type TickerItem = {
  id: string;
  type: "alert" | "official" | "news";
  title: string;
  sourceName: string | null;
  severity: string | null;
  region: string | null;
  locationName: string | null;
  isBreaking: boolean;
};

function getTickerItemTypeClasses(itemType: TickerItem["type"]): string {
  if (itemType === "alert") {
    return "border-rose-300 bg-rose-100 text-rose-900";
  }

  if (itemType === "official") {
    return "border-sky-300 bg-sky-100 text-sky-900";
  }

  return "border-zinc-300 bg-zinc-100 text-zinc-900";
}

function buildTickerItems(overview: DashboardOverview | null): TickerItem[] {
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
        overview.latestAlert.locationName ?? overview.latestAlert.city ?? overview.latestAlert.region,
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

function normalizeFilterText(value: string): string {
  return value.trim().toLowerCase();
}

function matchesRegionFilter(region: string | null, selectedRegion: string): boolean {
  if (selectedRegion === ALL_REGIONS_FILTER_VALUE) {
    return true;
  }

  if (!region) {
    return false;
  }

  return normalizeFilterText(region) === normalizeFilterText(selectedRegion);
}

function matchesSearchFilter(searchQuery: string, values: Array<string | null | undefined>): boolean {
  if (!searchQuery) {
    return true;
  }

  return values.some((value) => {
    if (!value) {
      return false;
    }

    return normalizeFilterText(value).includes(searchQuery);
  });
}

function matchesAlertFilters(
  item: AlertFeedItem,
  selectedRegion: string,
  searchQuery: string,
): boolean {
  return (
    matchesRegionFilter(item.region, selectedRegion) &&
    matchesSearchFilter(searchQuery, [
      item.title,
      item.message,
      item.sourceName,
      item.locationName,
      item.city,
      item.region,
    ])
  );
}

function matchesNewsFilters(
  item: NewsFeedItem,
  selectedRegion: string,
  searchQuery: string,
): boolean {
  return (
    matchesRegionFilter(item.region, selectedRegion) &&
    matchesSearchFilter(searchQuery, [item.title, item.summary, item.sourceName, item.region])
  );
}

function matchesOfficialFilters(
  item: OfficialUpdateFeedItem,
  selectedRegion: string,
  searchQuery: string,
): boolean {
  return (
    matchesRegionFilter(item.region, selectedRegion) &&
    matchesSearchFilter(searchQuery, [item.title, item.body, item.sourceName, item.region])
  );
}


function UpdatedAtLabel({
  updatedLabel,
  lastUpdated,
}: {
  updatedLabel: string;
  lastUpdated: number | null;
}) {
  if (!lastUpdated) {
    return null;
  }

  return (
    <p className="mt-3 text-xs text-slate-500">
      {updatedLabel}: {formatDateTime(lastUpdated)}
    </p>
  );
}

export function AppShell({ content }: AppShellProps) {
  const watchedLocations = useWatchlistStore((state) => state.watchedLocations);
  const [selectedRegion, setSelectedRegion] = useState<string>(ALL_REGIONS_FILTER_VALUE);
  const [locationSearchQuery, setLocationSearchQuery] = useState("");
  const [overviewRefreshNonce, setOverviewRefreshNonce] = useState(0);
  const [sourceHealthRefreshNonce, setSourceHealthRefreshNonce] = useState(0);
  const [overviewState, setOverviewState] = useState<
    AsyncState<DashboardOverview | null>
  >({
    data: null,
    isLoading: true,
    errorMessage: null,
    lastUpdated: null,
  });
  const [sourceHealthState, setSourceHealthState] = useState<
    AsyncState<SourceHealthOverview | null>
  >({
    data: null,
    isLoading: true,
    errorMessage: null,
    lastUpdated: null,
  });
  const [streamsState, setStreamsState] = useState<
    AsyncState<DashboardOverview["activeStreams"]>
  >({
    data: [],
    isLoading: true,
    errorMessage: null,
    lastUpdated: null,
  });
  const overviewRealtimeRefreshTimerRef = useRef<number | null>(null);
  const sourceHealthRealtimeRefreshTimerRef = useRef<number | null>(null);
  const {
    activeTab,
    setActiveTab,
    alertsState,
    newsState,
    officialState,
    activeFeedState,
    shouldShowFeedLoading,
    shouldShowFeedError,
  } = useLiveFeedTabs({
    statusErrorMessage: content.statusError,
    onFeedRealtimeChange: () => {
      if (overviewRealtimeRefreshTimerRef.current !== null) {
        window.clearTimeout(overviewRealtimeRefreshTimerRef.current);
      }

      overviewRealtimeRefreshTimerRef.current = window.setTimeout(() => {
        setOverviewRefreshNonce((previousValue) => previousValue + 1);
        overviewRealtimeRefreshTimerRef.current = null;
      }, OVERVIEW_REALTIME_REFRESH_DEBOUNCE_MS);
    },
  });

  useEffect(() => {
    return () => {
      if (overviewRealtimeRefreshTimerRef.current !== null) {
        window.clearTimeout(overviewRealtimeRefreshTimerRef.current);
      }

      if (sourceHealthRealtimeRefreshTimerRef.current !== null) {
        window.clearTimeout(sourceHealthRealtimeRefreshTimerRef.current);
      }
    };
  }, []);

  useSupabaseSourceHealthRealtime({
    onSourceHealthEvent: () => {
      if (sourceHealthRealtimeRefreshTimerRef.current !== null) {
        window.clearTimeout(sourceHealthRealtimeRefreshTimerRef.current);
      }

      sourceHealthRealtimeRefreshTimerRef.current = window.setTimeout(() => {
        setSourceHealthRefreshNonce((previousValue) => previousValue + 1);
        sourceHealthRealtimeRefreshTimerRef.current = null;
      }, SOURCE_HEALTH_REALTIME_REFRESH_DEBOUNCE_MS);
    },
  });

  useEffect(() => {
    let isActive = true;

    const loadOverview = async () => {
      setOverviewState((prevState) => ({
        ...prevState,
        isLoading: true,
        errorMessage: null,
      }));

      try {
        const data = await getDashboardOverviewData(watchedLocations);

        if (!isActive) {
          return;
        }

        setOverviewState({
          data,
          isLoading: false,
          errorMessage: null,
          lastUpdated: Date.now(),
        });
      } catch (error) {
        if (!isActive) {
          return;
        }

        void error;

        setOverviewState((prevState) => ({
          ...prevState,
          isLoading: false,
          errorMessage: content.statusError,
        }));
      }
    };

    void loadOverview();

    const intervalId = window.setInterval(() => {
      void loadOverview();
    }, TAB_FETCH_INTERVALS.alerts);

    return () => {
      isActive = false;
      window.clearInterval(intervalId);
    };
  }, [content.statusError, overviewRefreshNonce, watchedLocations]);

  useEffect(() => {
    let isActive = true;

    const loadSourceHealth = async () => {
      setSourceHealthState((prevState) => {
        if (prevState.data) {
          return {
            ...prevState,
            errorMessage: null,
          };
        }

        return {
          ...prevState,
          isLoading: true,
          errorMessage: null,
        };
      });

      try {
        const data = await getSourceHealthData();

        if (!isActive) {
          return;
        }

        setSourceHealthState({
          data,
          isLoading: false,
          errorMessage: null,
          lastUpdated: Date.now(),
        });
      } catch (error) {
        if (!isActive) {
          return;
        }

        void error;

        setSourceHealthState((prevState) => ({
          ...prevState,
          isLoading: false,
          errorMessage: content.statusError,
        }));
      }
    };

    void loadSourceHealth();

    const intervalId = window.setInterval(() => {
      void loadSourceHealth();
    }, SOURCE_HEALTH_FETCH_INTERVAL_MS);

    return () => {
      isActive = false;
      window.clearInterval(intervalId);
    };
  }, [content.statusError, sourceHealthRefreshNonce]);

  useEffect(() => {
    let isActive = true;

    const loadStreams = async () => {
      setStreamsState((prevState) => ({
        ...prevState,
        isLoading: true,
        errorMessage: null,
      }));

      try {
        const data = await getLiveStreamsData(3);

        if (!isActive) {
          return;
        }

        setStreamsState({
          data,
          isLoading: false,
          errorMessage: null,
          lastUpdated: Date.now(),
        });
      } catch (error) {
        if (!isActive) {
          return;
        }

        void error;

        setStreamsState((prevState) => ({
          ...prevState,
          isLoading: false,
          errorMessage: content.statusError,
        }));
      }
    };

    void loadStreams();

    const intervalId = window.setInterval(() => {
      void loadStreams();
    }, STREAMS_FETCH_INTERVAL_MS);

    return () => {
      isActive = false;
      window.clearInterval(intervalId);
    };
  }, [content.statusError]);

  const latestAlert = overviewState.data?.latestAlert ?? null;
  const latestOfficialUpdate = overviewState.data?.latestOfficialUpdate ?? null;
  const watchedLocationMatches = overviewState.data?.watchedLocationMatches ?? [];
  const tickerItems = buildTickerItems(overviewState.data);
  const normalizedLocationSearchQuery = normalizeFilterText(locationSearchQuery);
  const hasActiveFilters =
    selectedRegion !== ALL_REGIONS_FILTER_VALUE || normalizedLocationSearchQuery.length > 0;
  const availableRegions = Array.from(
    new Set(
      [
        overviewState.data?.latestAlert?.region,
        overviewState.data?.latestOfficialUpdate?.region,
        ...((overviewState.data?.topNews ?? []).map((item) => item.region)),
        ...alertsState.data.map((item) => item.region),
        ...newsState.data.map((item) => item.region),
        ...officialState.data.map((item) => item.region),
      ].filter((region): region is string => Boolean(region && region.trim())),
    ),
  ).sort((left, right) => left.localeCompare(right));
  const filteredLatestAlert =
    latestAlert && matchesAlertFilters(latestAlert, selectedRegion, normalizedLocationSearchQuery)
      ? latestAlert
      : null;
  const filteredLatestOfficialUpdate =
    latestOfficialUpdate &&
    matchesOfficialFilters(
      latestOfficialUpdate,
      selectedRegion,
      normalizedLocationSearchQuery,
    )
      ? latestOfficialUpdate
      : null;
  const filteredTickerItems = tickerItems.filter((item) => {
    return (
      matchesRegionFilter(item.region, selectedRegion) &&
      matchesSearchFilter(normalizedLocationSearchQuery, [
        item.title,
        item.sourceName,
        item.severity,
        item.locationName,
        item.region,
      ])
    );
  });
  const filteredWatchedLocationMatches = watchedLocationMatches.filter((match) => {
    return matchesSearchFilter(normalizedLocationSearchQuery, [match.locationName]);
  });
  const filteredAlerts = alertsState.data.filter((item) =>
    matchesAlertFilters(item, selectedRegion, normalizedLocationSearchQuery),
  );
  const filteredNews = newsState.data.filter((item) =>
    matchesNewsFilters(item, selectedRegion, normalizedLocationSearchQuery),
  );
  const filteredOfficial = officialState.data.filter((item) =>
    matchesOfficialFilters(item, selectedRegion, normalizedLocationSearchQuery),
  );
  const activeTabFilteredCount =
    activeTab === "alerts"
      ? filteredAlerts.length
      : activeTab === "news"
        ? filteredNews.length
        : filteredOfficial.length;
  const sourceHealthCategories = sourceHealthState.data?.categories ?? [];
  const sourceHealthCategoriesByType = new Map(
    sourceHealthCategories.map((category) => [category.sourceType, category]),
  );
  const overallSourceHealthStatus = sourceHealthState.data?.overallStatus ?? "unknown";
  const sourceHealthTypeLabels: Record<SourceHealthType, string> = {
    official_alerts: content.sourceHealthTypes.officialAlerts,
    official_guidance: content.sourceHealthTypes.officialGuidance,
    rss_news: content.sourceHealthTypes.rssNews,
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_15%_15%,#f7f5ef_0%,#f3efe3_28%,#f9f7f2_65%,#f6f3ea_100%)] text-slate-900">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 pb-10 pt-6 md:px-6">
        <header className="rounded-2xl border border-amber-200/70 bg-white/80 px-5 py-4 shadow-[0_12px_30px_-22px_rgba(15,23,42,0.45)] backdrop-blur">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-950 md:text-3xl">
                {content.title}
              </h1>
              <p className="mt-1 text-sm text-slate-700 md:text-base">{content.subtitle}</p>
            </div>

            <div className="flex flex-wrap items-start gap-3">
              <BrowserNotificationOptIn className="min-w-[190px]" />
              <LocaleSwitcher className="min-w-[130px]" />
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-zinc-200/80 bg-zinc-50/90 px-3 py-3">
            <div className="grid gap-3 md:grid-cols-[220px_minmax(0,1fr)_auto] md:items-end">
              <div className="space-y-1">
                <label
                  htmlFor="dashboard-region-filter"
                  className="block text-xs font-semibold uppercase tracking-wide text-zinc-700"
                >
                  {content.regionFilterLabel}
                </label>
                <select
                  id="dashboard-region-filter"
                  value={selectedRegion}
                  onChange={(event) => {
                    setSelectedRegion(event.target.value);
                  }}
                  className="h-9 w-full rounded-md border border-zinc-300 bg-white px-2 text-sm text-zinc-900"
                >
                  <option value={ALL_REGIONS_FILTER_VALUE}>{content.regionFilterAll}</option>
                  {availableRegions.map((region) => (
                    <option key={region} value={region}>
                      {region}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="dashboard-location-search"
                  className="block text-xs font-semibold uppercase tracking-wide text-zinc-700"
                >
                  {content.locationSearchLabel}
                </label>
                <input
                  id="dashboard-location-search"
                  type="search"
                  value={locationSearchQuery}
                  onChange={(event) => {
                    setLocationSearchQuery(event.target.value);
                  }}
                  placeholder={content.locationSearchPlaceholder}
                  className="h-9 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-500"
                />
              </div>

              <p className="text-xs text-slate-600 md:text-end">
                {content.updatedLabel}: {overviewState.lastUpdated ? formatDateTime(overviewState.lastUpdated) : content.statusLoading}
              </p>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-zinc-200/80 bg-zinc-50/90 px-3 py-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-700">
                {content.sourceHealthTitle}
              </p>
              <span
                className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${getSourceHealthStatusClasses(overallSourceHealthStatus)}`}
              >
                {content.sourceHealthOverallLabel}: {getSourceHealthStatusLabel(overallSourceHealthStatus, content.sourceHealthStatuses)}
              </span>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {sourceHealthTypeOrder.map((sourceType) => {
                const category = sourceHealthCategoriesByType.get(sourceType);
                const status = category?.status ?? "unknown";

                return (
                  <span
                    key={sourceType}
                    className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${getSourceHealthStatusClasses(status)}`}
                  >
                    {sourceHealthTypeLabels[sourceType]}: {getSourceHealthStatusLabel(status, content.sourceHealthStatuses)}
                  </span>
                );
              })}
            </div>

            {sourceHealthState.errorMessage ? (
              <p className="mt-2 text-xs text-rose-700">{content.statusError}</p>
            ) : null}

            <UpdatedAtLabel
              updatedLabel={content.updatedLabel}
              lastUpdated={sourceHealthState.lastUpdated}
            />
          </div>
        </header>

        <section className="rounded-xl border border-amber-300/80 bg-amber-50/90 px-4 py-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-amber-900">
            {content.tickerLabel}
          </p>

          {filteredTickerItems.length === 0 ? (
            <p className="text-sm font-medium text-amber-950">
              {hasActiveFilters && tickerItems.length > 0
                ? content.filterNoMatches
                : content.tickerFallback}
            </p>
          ) : (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {filteredTickerItems.map((item) => {
                const tickerTypeLabel = content.tickerTypes[item.type];

                return (
                  <article
                    key={item.id}
                    className="w-[280px] shrink-0 rounded-lg border border-amber-200 bg-white/80 px-3 py-2"
                  >
                    <div className="mb-1 flex flex-wrap items-center gap-1.5">
                      <span
                        className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold ${getTickerItemTypeClasses(item.type)}`}
                      >
                        {tickerTypeLabel}
                      </span>

                      {item.isBreaking ? (
                        <span className="inline-flex rounded-full border border-amber-300 bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-900">
                          {content.tickerBreakingTag}
                        </span>
                      ) : null}

                      {item.severity ? (
                        <span className="inline-flex rounded-full border border-slate-300 bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                          {content.severityLabel}: {item.severity}
                        </span>
                      ) : null}
                    </div>

                    <p className="line-clamp-2 text-sm font-semibold text-slate-900">
                      {item.title}
                    </p>

                    {item.sourceName ? (
                      <p className="mt-1 text-xs text-slate-700">
                        {content.sourceLabel}: {item.sourceName}
                      </p>
                    ) : null}
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <main className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
          <section className="grid gap-4">
            <StreamPanel
              content={{
                title: content.streamTitle,
                subtitle: content.streamSubtitle,
                contextLabel: content.streamContextLabel,
                empty: content.streamEmpty,
                watchLabel: content.streamWatchLabel,
                sourceLabel: content.sourceLabel,
                updatedLabel: content.updatedLabel,
                statusLoading: content.statusLoading,
              }}
              streamsState={streamsState}
            />

            <article className="rounded-2xl border border-rose-300/70 bg-rose-50 p-5">
              <h2 className="text-base font-semibold text-rose-900">
                {content.latestAlertTitle}
              </h2>

              {overviewState.isLoading && !latestAlert ? (
                <p className="mt-2 text-sm text-rose-900/80">{content.statusLoading}</p>
              ) : filteredLatestAlert ? (
                <div className="mt-2 space-y-2 text-sm text-rose-950">
                  <p className="font-semibold">{filteredLatestAlert.title}</p>
                  <p>
                    {filteredLatestAlert.message?.trim().length
                      ? filteredLatestAlert.message
                      : content.alertMessageFallback}
                  </p>
                  <div className="grid gap-1 rounded-lg border border-rose-200/80 bg-white/70 px-3 py-2 text-xs text-rose-950/90 sm:grid-cols-2">
                    <p>
                      {content.locationLabel}: {getAlertLocation(filteredLatestAlert)}
                    </p>
                    <p>
                      {content.sourceLabel}: {filteredLatestAlert.sourceName}
                    </p>
                    <p>
                      {content.severityLabel}: {filteredLatestAlert.severity}
                    </p>
                    <p>
                      {content.publishedLabel}: {formatDateTime(filteredLatestAlert.publishedAt)}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="mt-2 text-sm text-rose-950">
                  {hasActiveFilters && latestAlert ? content.filterNoMatches : content.latestAlertEmpty}
                </p>
              )}

              {overviewState.errorMessage ? (
                <p className="mt-3 text-xs text-rose-800">{overviewState.errorMessage}</p>
              ) : null}

              <UpdatedAtLabel
                updatedLabel={content.updatedLabel}
                lastUpdated={overviewState.lastUpdated}
              />
            </article>

            <article className="rounded-2xl border border-sky-300/70 bg-sky-50 p-5">
              <h2 className="text-base font-semibold text-sky-900">
                {content.officialTitle}
              </h2>

              {overviewState.isLoading && !latestOfficialUpdate ? (
                <p className="mt-2 text-sm text-sky-900/80">{content.statusLoading}</p>
              ) : filteredLatestOfficialUpdate ? (
                <div className="mt-2 space-y-2 text-sm text-sky-950">
                  <p className="font-semibold">{filteredLatestOfficialUpdate.title}</p>
                  <p>{filteredLatestOfficialUpdate.body}</p>
                  <div className="grid gap-1 rounded-lg border border-sky-200/80 bg-white/70 px-3 py-2 text-xs text-sky-950/90 sm:grid-cols-2">
                    <p>
                      {content.sourceLabel}: {filteredLatestOfficialUpdate.sourceName}
                    </p>
                    <p>
                      {content.publishedLabel}: {formatDateTime(filteredLatestOfficialUpdate.publishedAt)}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="mt-2 text-sm text-sky-950">
                  {hasActiveFilters && latestOfficialUpdate ? content.filterNoMatches : content.officialEmpty}
                </p>
              )}

              {overviewState.errorMessage ? (
                <p className="mt-3 text-xs text-sky-800">{overviewState.errorMessage}</p>
              ) : null}

              <UpdatedAtLabel
                updatedLabel={content.updatedLabel}
                lastUpdated={overviewState.lastUpdated}
              />
            </article>

            <article className="rounded-2xl border border-zinc-300/80 bg-zinc-50 p-5">
              <h2 className="text-base font-semibold text-zinc-900">
                {content.watchlistTitle}
              </h2>

              {overviewState.isLoading && watchedLocationMatches.length === 0 ? (
                <p className="mt-2 text-sm text-zinc-800">{content.statusLoading}</p>
              ) : filteredWatchedLocationMatches.length > 0 ? (
                <ul className="mt-2 space-y-2 text-sm text-zinc-900">
                  {filteredWatchedLocationMatches.map((match, index) => (
                    <li
                      key={`${match.locationName}-${match.alertCount}`}
                      className="rounded-lg border border-zinc-200 bg-white px-3 py-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium">{match.locationName}</p>
                        <span className="inline-flex rounded-full border border-zinc-300 bg-zinc-100 px-2 py-0.5 text-[11px] font-semibold text-zinc-700">
                          #{index + 1}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-zinc-700">
                        {match.alertCount} {content.watchlistMatchSuffix}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-zinc-800">
                  {hasActiveFilters && watchedLocationMatches.length > 0
                    ? content.filterNoMatches
                    : content.watchlistEmpty}
                </p>
              )}

              {overviewState.errorMessage ? (
                <p className="mt-3 text-xs text-zinc-700">{overviewState.errorMessage}</p>
              ) : null}

              <UpdatedAtLabel
                updatedLabel={content.updatedLabel}
                lastUpdated={overviewState.lastUpdated}
              />
            </article>
          </section>

          <aside className="order-last w-full rounded-2xl border border-zinc-300/80 bg-white/85 p-5 shadow-[0_14px_30px_-24px_rgba(15,23,42,0.45)] lg:order-none">
            <h2 className="text-base font-semibold text-slate-900">{content.feedTitle}</h2>

            <div
              className="mt-3 grid grid-cols-3 gap-2"
              role="tablist"
              aria-label={content.feedTitle}
            >
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === "alerts"}
                onClick={() => {
                  setActiveTab("alerts");
                }}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                  activeTab === "alerts"
                    ? "border-rose-300 bg-rose-100 text-rose-900"
                    : "border-zinc-300 bg-zinc-100 text-zinc-900 hover:bg-zinc-200"
                }`}
              >
                {content.feedTabs.alerts}
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === "news"}
                onClick={() => {
                  setActiveTab("news");
                }}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                  activeTab === "news"
                    ? "border-zinc-300 bg-zinc-200 text-zinc-950"
                    : "border-zinc-300 bg-zinc-100 text-zinc-900 hover:bg-zinc-200"
                }`}
              >
                {content.feedTabs.news}
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === "official"}
                onClick={() => {
                  setActiveTab("official");
                }}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                  activeTab === "official"
                    ? "border-sky-300 bg-sky-100 text-sky-900"
                    : "border-zinc-300 bg-zinc-100 text-zinc-900 hover:bg-zinc-200"
                }`}
              >
                {content.feedTabs.official}
              </button>
            </div>

            <div className="mt-4 flex flex-col gap-2 lg:h-[560px]" role="tabpanel">
              {shouldShowFeedLoading ? (
                <p className="text-sm text-slate-700">{content.statusLoading}</p>
              ) : null}

              {shouldShowFeedError ? (
                <p className="text-sm text-rose-700">{content.statusError}</p>
              ) : null}

              <div className="min-h-0 lg:flex-1 lg:overflow-y-auto lg:pe-1">
                {!shouldShowFeedLoading &&
                !shouldShowFeedError &&
                activeTabFilteredCount === 0 ? (
                  <p className="text-sm text-slate-700">
                    {hasActiveFilters ? content.filterNoMatches : content.noFeedItems}
                  </p>
                ) : null}

                {!shouldShowFeedLoading && !shouldShowFeedError && activeTab === "alerts" ? (
                  <ul className="space-y-2">
                    {filteredAlerts.map((item) => (
                      <li key={item.id} className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2">
                        <p className="text-sm font-semibold text-rose-950">{item.title}</p>
                        <p className="mt-1 text-xs text-rose-900/90">
                          {content.locationLabel}: {getAlertLocation(item)}
                        </p>
                        <p className="text-xs text-rose-900/90">
                          {content.publishedLabel}: {formatDateTime(item.publishedAt)}
                        </p>
                      </li>
                    ))}
                  </ul>
                ) : null}

                {!shouldShowFeedLoading && !shouldShowFeedError && activeTab === "news" ? (
                  <ul className="space-y-2">
                    {filteredNews.map((item) => (
                      <li key={item.id} className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2">
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm font-semibold text-zinc-950 underline-offset-2 hover:underline"
                        >
                          {item.title}
                        </a>
                        <p className="mt-1 text-xs text-zinc-700">
                          {content.sourceLabel}: {item.sourceName}
                        </p>
                        <p className="text-xs text-zinc-700">
                          {content.publishedLabel}: {formatDateTime(item.publishedAt)}
                        </p>
                      </li>
                    ))}
                  </ul>
                ) : null}

                {!shouldShowFeedLoading && !shouldShowFeedError && activeTab === "official" ? (
                  <ul className="space-y-2">
                    {filteredOfficial.map((item) => (
                      <li key={item.id} className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2">
                        <p className="text-sm font-semibold text-sky-950">{item.title}</p>
                        <p className="mt-1 text-xs text-sky-900/90">{item.body}</p>
                        <p className="mt-1 text-xs text-sky-900/90">
                          {content.publishedLabel}: {formatDateTime(item.publishedAt)}
                        </p>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>

              <UpdatedAtLabel
                updatedLabel={content.updatedLabel}
                lastUpdated={activeFeedState.lastUpdated}
              />
            </div>
          </aside>
        </main>
      </div>
    </div>
  );
}

export type { AppShellContent };
