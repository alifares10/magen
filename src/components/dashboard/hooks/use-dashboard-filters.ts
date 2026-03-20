"use client";

import { useState } from "react";
import type { AlertFeedItem, NewsFeedItem, OfficialUpdateFeedItem } from "@/lib/schemas/feed";
import type { FeedTabKey } from "@/lib/feed/client";
import type { TickerItem } from "@/lib/feed/filters";
import {
  ALL_REGIONS_FILTER_VALUE,
  normalizeFilterText,
  matchesAlertFilters,
  matchesNewsFilters,
  matchesOfficialFilters,
  matchesRegionFilter,
  matchesSearchFilter,
} from "@/lib/feed/filters";

type WatchedLocationMatch = {
  locationName: string;
  alertCount: number;
};

type UseDashboardFiltersOptions = {
  alertsData: AlertFeedItem[];
  newsData: NewsFeedItem[];
  officialData: OfficialUpdateFeedItem[];
  latestAlert: AlertFeedItem | null;
  latestOfficialUpdate: OfficialUpdateFeedItem | null;
  watchedLocationMatches: WatchedLocationMatch[];
  tickerItems: TickerItem[];
  topNews: Array<{ region: string | null }>;
  activeTab: FeedTabKey;
};

export function useDashboardFilters({
  alertsData,
  newsData,
  officialData,
  latestAlert,
  latestOfficialUpdate,
  watchedLocationMatches,
  tickerItems,
  topNews,
  activeTab,
}: UseDashboardFiltersOptions) {
  const [selectedRegion, setSelectedRegion] = useState<string>(ALL_REGIONS_FILTER_VALUE);
  const [locationSearchQuery, setLocationSearchQuery] = useState("");

  const normalizedLocationSearchQuery = normalizeFilterText(locationSearchQuery);
  const hasActiveFilters =
    selectedRegion !== ALL_REGIONS_FILTER_VALUE || normalizedLocationSearchQuery.length > 0;

  const availableRegions = Array.from(
    new Set(
      [
        latestAlert?.region,
        latestOfficialUpdate?.region,
        ...topNews.map((item) => item.region),
        ...alertsData.map((item) => item.region),
        ...newsData.map((item) => item.region),
        ...officialData.map((item) => item.region),
      ].filter((region): region is string => Boolean(region && region.trim())),
    ),
  ).sort((left, right) => left.localeCompare(right));

  const filteredLatestAlert =
    latestAlert &&
    matchesAlertFilters(latestAlert, selectedRegion, normalizedLocationSearchQuery)
      ? latestAlert
      : null;

  const filteredLatestOfficialUpdate =
    latestOfficialUpdate &&
    matchesOfficialFilters(latestOfficialUpdate, selectedRegion, normalizedLocationSearchQuery)
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

  const filteredAlerts = alertsData.filter((item) =>
    matchesAlertFilters(item, selectedRegion, normalizedLocationSearchQuery),
  );
  const filteredNews = newsData.filter((item) =>
    matchesNewsFilters(item, selectedRegion, normalizedLocationSearchQuery),
  );
  const filteredOfficial = officialData.filter((item) =>
    matchesOfficialFilters(item, selectedRegion, normalizedLocationSearchQuery),
  );

  const activeTabFilteredCount =
    activeTab === "alerts"
      ? filteredAlerts.length
      : activeTab === "news"
        ? filteredNews.length
        : filteredOfficial.length;

  return {
    selectedRegion,
    setSelectedRegion,
    locationSearchQuery,
    setLocationSearchQuery,
    hasActiveFilters,
    availableRegions,
    filteredLatestAlert,
    filteredLatestOfficialUpdate,
    filteredTickerItems,
    filteredWatchedLocationMatches,
    filteredAlerts,
    filteredNews,
    filteredOfficial,
    activeTabFilteredCount,
  };
}
