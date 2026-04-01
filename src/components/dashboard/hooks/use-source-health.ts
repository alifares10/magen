"use client";

import { useEffect, useRef, useState } from "react";
import { useSupabaseSourceHealthRealtime } from "@/components/layout/use-supabase-source-health-realtime";
import type { SourceHealthOverview, SourceHealthType } from "@/lib/schemas/feed";
import {
  getSourceHealthData,
  SOURCE_HEALTH_FETCH_INTERVAL_MS,
  type AsyncState,
} from "@/lib/feed/client";

const SOURCE_HEALTH_REALTIME_REFRESH_DEBOUNCE_MS = 600;

export const sourceHealthTypeOrder: SourceHealthType[] = [
  "official_alerts",
  "official_guidance",
  "rss_news",
];

type UseSourceHealthOptions = {
  statusErrorMessage: string;
  initialData?: SourceHealthOverview | null;
  initialDataLoadedAt?: number | null;
};

export function useSourceHealth({
  statusErrorMessage,
  initialData = null,
  initialDataLoadedAt = null,
}: UseSourceHealthOptions) {
  const [sourceHealthRefreshNonce, setSourceHealthRefreshNonce] = useState(0);
  const [sourceHealthState, setSourceHealthState] = useState<
    AsyncState<SourceHealthOverview | null>
  >({
    data: initialData,
    isLoading: initialData === null,
    errorMessage: null,
    lastUpdated: initialData ? initialDataLoadedAt : null,
  });
  const sourceHealthRealtimeRefreshTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
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

    const loadSourceHealth = async () => {
      setSourceHealthState((prevState) => {
        if (prevState.data) {
          return { ...prevState, errorMessage: null };
        }

        return { ...prevState, isLoading: true, errorMessage: null };
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
          errorMessage: statusErrorMessage,
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
  }, [statusErrorMessage, sourceHealthRefreshNonce]);

  const sourceHealthCategories = sourceHealthState.data?.categories ?? [];
  const sourceHealthCategoriesByType = new Map(
    sourceHealthCategories.map((category) => [category.sourceType, category]),
  );
  const overallSourceHealthStatus = sourceHealthState.data?.overallStatus ?? "unknown";

  return {
    sourceHealthState,
    sourceHealthCategoriesByType,
    overallSourceHealthStatus,
  };
}
