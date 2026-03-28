"use client";

import { useState } from "react";
import type { AlertFeedItem, NewsFeedItem, OfficialUpdateFeedItem } from "@/lib/schemas/feed";
import type { FeedTabKey } from "@/lib/feed/client";
import {
  ALL_REGIONS_FILTER_VALUE,
  normalizeFilterText,
  matchesAlertFilters,
  matchesNewsFilters,
  matchesOfficialFilters,
} from "@/lib/feed/filters";

type UseFeedPageFiltersOptions = {
  alertsData: AlertFeedItem[];
  newsData: NewsFeedItem[];
  officialData: OfficialUpdateFeedItem[];
  activeTab: FeedTabKey;
};

export function useFeedPageFilters({
  alertsData,
  newsData,
  officialData,
  activeTab,
}: UseFeedPageFiltersOptions) {
  const [selectedRegion, setSelectedRegion] = useState<string>(ALL_REGIONS_FILTER_VALUE);
  const [locationSearchQuery, setLocationSearchQuery] = useState("");

  const normalizedLocationSearchQuery = normalizeFilterText(locationSearchQuery);
  const hasActiveFilters =
    selectedRegion !== ALL_REGIONS_FILTER_VALUE || normalizedLocationSearchQuery.length > 0;

  const availableRegions = Array.from(
    new Set(
      [
        ...alertsData.map((item) => item.region),
        ...newsData.map((item) => item.region),
        ...officialData.map((item) => item.region),
      ].filter((region): region is string => Boolean(region && region.trim())),
    ),
  ).sort((left, right) => left.localeCompare(right));

  const filteredAlerts = alertsData.filter((item) =>
    matchesAlertFilters(item, selectedRegion, normalizedLocationSearchQuery),
  );
  const filteredNews = newsData.filter((item) =>
    matchesNewsFilters(item, selectedRegion, normalizedLocationSearchQuery),
  );
  const filteredOfficial = officialData.filter((item) =>
    matchesOfficialFilters(item, selectedRegion, normalizedLocationSearchQuery),
  );

  const filteredLatestAlert = filteredAlerts[0] ?? null;
  const rawLatestAlert = alertsData[0] ?? null;

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
    rawLatestAlert,
    filteredAlerts,
    filteredNews,
    filteredOfficial,
    activeTabFilteredCount,
  };
}
