"use client";

import { useEffect, useState } from "react";
import type { DashboardOverview } from "@/lib/schemas/feed";
import {
  getLiveStreamsData,
  STREAMS_FETCH_INTERVAL_MS,
  type AsyncState,
} from "@/lib/feed/client";

type UseStreamsOptions = {
  statusErrorMessage: string;
  initialData?: DashboardOverview["activeStreams"];
  initialDataLoadedAt?: number | null;
};

export function useStreams({
  statusErrorMessage,
  initialData = [],
  initialDataLoadedAt = null,
}: UseStreamsOptions) {
  const [streamsState, setStreamsState] = useState<
    AsyncState<DashboardOverview["activeStreams"]>
  >({
    data: initialData,
    isLoading: initialData.length === 0,
    errorMessage: null,
    lastUpdated: initialData.length > 0 ? initialDataLoadedAt : null,
  });

  useEffect(() => {
    let isActive = true;

    const loadStreams = async () => {
      setStreamsState((prevState) => ({
        ...prevState,
        isLoading: prevState.data.length === 0,
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
          errorMessage: statusErrorMessage,
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
  }, [statusErrorMessage]);

  return { streamsState };
}
