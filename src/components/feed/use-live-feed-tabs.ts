"use client";

import { useEffect, useRef, useState } from "react";
import {
  useSupabaseFeedRealtime,
  type FeedRealtimeEvent,
} from "@/components/feed/use-supabase-feed-realtime";
import {
  getAlertsData,
  getNewsData,
  getOfficialUpdatesData,
  TAB_FETCH_INTERVALS,
  type AsyncState,
  type FeedTabKey,
} from "@/lib/feed/client";
import type {
  AlertFeedItem,
  NewsFeedItem,
  OfficialUpdateFeedItem,
} from "@/lib/schemas/feed";

type UseLiveFeedTabsOptions = {
  statusErrorMessage: string;
  initialActiveTab?: FeedTabKey;
  initialAlertsLoading?: boolean;
  onFeedRealtimeChange?: (event: FeedRealtimeEvent) => void;
};

const REALTIME_REFRESH_DEBOUNCE_MS = 400;

function getTabKeyFromRealtimeTable(table: FeedRealtimeEvent["table"]): FeedTabKey {
  if (table === "alerts") {
    return "alerts";
  }

  if (table === "news_items") {
    return "news";
  }

  return "official";
}

export function useLiveFeedTabs({
  statusErrorMessage,
  initialActiveTab = "alerts",
  initialAlertsLoading = false,
  onFeedRealtimeChange,
}: UseLiveFeedTabsOptions) {
  const [activeTab, setActiveTab] = useState<FeedTabKey>(initialActiveTab);
  const [refreshNonce, setRefreshNonce] = useState(0);
  const [alertsState, setAlertsState] = useState<AsyncState<AlertFeedItem[]>>({
    data: [],
    isLoading: initialAlertsLoading,
    errorMessage: null,
    lastUpdated: null,
  });
  const [newsState, setNewsState] = useState<AsyncState<NewsFeedItem[]>>({
    data: [],
    isLoading: false,
    errorMessage: null,
    lastUpdated: null,
  });
  const [officialState, setOfficialState] = useState<
    AsyncState<OfficialUpdateFeedItem[]>
  >({
    data: [],
    isLoading: false,
    errorMessage: null,
    lastUpdated: null,
  });
  const activeTabRef = useRef(activeTab);
  const realtimeRefreshTimerRef = useRef<number | null>(null);
  const silentRefreshRef = useRef(false);
  const inFlightFetchByTabRef = useRef<Record<FeedTabKey, boolean>>({
    alerts: false,
    news: false,
    official: false,
  });

  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

  useEffect(() => {
    return () => {
      if (realtimeRefreshTimerRef.current !== null) {
        window.clearTimeout(realtimeRefreshTimerRef.current);
      }
    };
  }, []);

  useSupabaseFeedRealtime({
    onFeedEvent: (event) => {
      if (onFeedRealtimeChange) {
        onFeedRealtimeChange(event);
      }

      if (getTabKeyFromRealtimeTable(event.table) !== activeTabRef.current) {
        return;
      }

      if (realtimeRefreshTimerRef.current !== null) {
        window.clearTimeout(realtimeRefreshTimerRef.current);
      }

      realtimeRefreshTimerRef.current = window.setTimeout(() => {
        silentRefreshRef.current = true;
        setRefreshNonce((previousValue) => previousValue + 1);
        realtimeRefreshTimerRef.current = null;
      }, REALTIME_REFRESH_DEBOUNCE_MS);
    },
  });

  useEffect(() => {
    let isActive = true;

    const loadActiveTab = async () => {
      const shouldUseSilentRefresh = silentRefreshRef.current;
      silentRefreshRef.current = false;

      if (activeTab === "alerts") {
        if (inFlightFetchByTabRef.current.alerts) {
          return;
        }

        inFlightFetchByTabRef.current.alerts = true;

        if (!shouldUseSilentRefresh) {
          setAlertsState((prevState) => ({
            ...prevState,
            isLoading: true,
            errorMessage: null,
          }));
        }

        try {
          const data = await getAlertsData();

          if (!isActive) {
            return;
          }

          setAlertsState({
            data,
            isLoading: false,
            errorMessage: null,
            lastUpdated: Date.now(),
          });
        } catch (error) {
          if (!isActive) {
            return;
          }

          setAlertsState((prevState) => ({
            ...prevState,
            isLoading: false,
            errorMessage:
              error instanceof Error ? error.message : statusErrorMessage,
          }));
        } finally {
          inFlightFetchByTabRef.current.alerts = false;
        }

        return;
      }

      if (activeTab === "news") {
        if (inFlightFetchByTabRef.current.news) {
          return;
        }

        inFlightFetchByTabRef.current.news = true;

        if (!shouldUseSilentRefresh) {
          setNewsState((prevState) => ({
            ...prevState,
            isLoading: true,
            errorMessage: null,
          }));
        }

        try {
          const data = await getNewsData();

          if (!isActive) {
            return;
          }

          setNewsState({
            data,
            isLoading: false,
            errorMessage: null,
            lastUpdated: Date.now(),
          });
        } catch (error) {
          if (!isActive) {
            return;
          }

          setNewsState((prevState) => ({
            ...prevState,
            isLoading: false,
            errorMessage:
              error instanceof Error ? error.message : statusErrorMessage,
          }));
        } finally {
          inFlightFetchByTabRef.current.news = false;
        }

        return;
      }

      if (inFlightFetchByTabRef.current.official) {
        return;
      }

      inFlightFetchByTabRef.current.official = true;

      if (!shouldUseSilentRefresh) {
        setOfficialState((prevState) => ({
          ...prevState,
          isLoading: true,
          errorMessage: null,
        }));
      }

      try {
        const data = await getOfficialUpdatesData();

        if (!isActive) {
          return;
        }

        setOfficialState({
          data,
          isLoading: false,
          errorMessage: null,
          lastUpdated: Date.now(),
        });
      } catch (error) {
        if (!isActive) {
          return;
        }

        setOfficialState((prevState) => ({
          ...prevState,
          isLoading: false,
          errorMessage:
            error instanceof Error ? error.message : statusErrorMessage,
        }));
      } finally {
        inFlightFetchByTabRef.current.official = false;
      }
    };

    void loadActiveTab();

    const intervalId = window.setInterval(() => {
      void loadActiveTab();
    }, TAB_FETCH_INTERVALS[activeTab]);

    return () => {
      isActive = false;
      window.clearInterval(intervalId);
    };
  }, [activeTab, refreshNonce, statusErrorMessage]);

  const activeFeedState =
    activeTab === "alerts"
      ? alertsState
      : activeTab === "news"
        ? newsState
        : officialState;

  const shouldShowFeedLoading =
    activeFeedState.isLoading && activeFeedState.data.length === 0;
  const shouldShowFeedError =
    Boolean(activeFeedState.errorMessage) && activeFeedState.data.length === 0;

  return {
    activeTab,
    setActiveTab,
    alertsState,
    newsState,
    officialState,
    activeFeedState,
    shouldShowFeedLoading,
    shouldShowFeedError,
  };
}
