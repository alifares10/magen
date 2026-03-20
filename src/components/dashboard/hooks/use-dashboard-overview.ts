"use client";

import { useEffect, useRef, useState } from "react";
import {
  apiErrorSchema,
  dashboardOverviewRequestBodySchema,
  dashboardOverviewApiResponseSchema,
} from "@/lib/schemas/api-responses";
import type { DashboardOverviewRequestBody } from "@/lib/schemas/api-responses";
import type { DashboardOverview } from "@/lib/schemas/feed";
import { TAB_FETCH_INTERVALS, type AsyncState } from "@/lib/feed/client";
import { useLiveFeedTabs } from "@/components/feed/use-live-feed-tabs";
import { useWatchlistStore } from "@/store/use-watchlist-store";
import { buildTickerItems } from "@/lib/feed/transforms";

const OVERVIEW_REALTIME_REFRESH_DEBOUNCE_MS = 400;

function getApiErrorMessage(payload: unknown, fallback: string): string {
  const parsedError = apiErrorSchema.safeParse(payload);
  return parsedError.success ? parsedError.data.error : fallback;
}

async function getDashboardOverviewData(
  watchedLocations: DashboardOverviewRequestBody["watchedLocations"],
): Promise<DashboardOverview> {
  const requestBody = dashboardOverviewRequestBodySchema.parse({
    watchedLocations,
  });
  const response = await fetch("/api/dashboard/overview", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody),
    cache: "no-store",
  });
  const payload: unknown = await response.json();

  if (!response.ok) {
    throw new Error(getApiErrorMessage(payload, "Failed to load dashboard overview"));
  }

  const parsed = dashboardOverviewApiResponseSchema.safeParse(payload);

  if (!parsed.success) {
    throw new Error("Invalid dashboard overview payload");
  }

  return parsed.data.data;
}

type UseDashboardOverviewOptions = {
  statusErrorMessage: string;
};

export function useDashboardOverview({ statusErrorMessage }: UseDashboardOverviewOptions) {
  const watchedLocations = useWatchlistStore((state) => state.watchedLocations);
  const [overviewRefreshNonce, setOverviewRefreshNonce] = useState(0);
  const [overviewState, setOverviewState] = useState<AsyncState<DashboardOverview | null>>({
    data: null,
    isLoading: true,
    errorMessage: null,
    lastUpdated: null,
  });
  const overviewRealtimeRefreshTimerRef = useRef<number | null>(null);

  const feedTabs = useLiveFeedTabs({
    statusErrorMessage,
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
    };
  }, []);

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
          errorMessage: statusErrorMessage,
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
  }, [statusErrorMessage, overviewRefreshNonce, watchedLocations]);

  const latestAlert = overviewState.data?.latestAlert ?? null;
  const latestOfficialUpdate = overviewState.data?.latestOfficialUpdate ?? null;
  const watchedLocationMatches = overviewState.data?.watchedLocationMatches ?? [];
  const tickerItems = buildTickerItems(overviewState.data);

  return {
    overviewState,
    latestAlert,
    latestOfficialUpdate,
    watchedLocationMatches,
    tickerItems,
    feedTabs,
  };
}
