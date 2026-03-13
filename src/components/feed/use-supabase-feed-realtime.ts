"use client";

import { useEffect, useRef } from "react";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type FeedRealtimeTable = "alerts" | "news_items" | "official_updates";

type FeedRealtimeEvent = {
  table: FeedRealtimeTable;
  event: "INSERT" | "UPDATE";
};

type UseSupabaseFeedRealtimeOptions = {
  onFeedEvent: (event: FeedRealtimeEvent) => void;
  enabled?: boolean;
};

function getRecordField(
  record: RealtimePostgresChangesPayload<Record<string, unknown>>["new"] | RealtimePostgresChangesPayload<Record<string, unknown>>["old"],
  field: string,
): unknown {
  if (!record || typeof record !== "object") {
    return null;
  }

  return Reflect.get(record, field);
}

function shouldNotifyAlertUpdate(
  payload: RealtimePostgresChangesPayload<Record<string, unknown>>,
): boolean {
  if (payload.eventType !== "UPDATE") {
    return true;
  }

  const nextStatus = getRecordField(payload.new, "status");
  const previousStatus = getRecordField(payload.old, "status");

  return nextStatus !== previousStatus;
}

function shouldNotifyOfficialUpdate(
  payload: RealtimePostgresChangesPayload<Record<string, unknown>>,
): boolean {
  if (payload.eventType !== "UPDATE") {
    return true;
  }

  const nextIsActive = getRecordField(payload.new, "is_active");
  const previousIsActive = getRecordField(payload.old, "is_active");

  return nextIsActive !== previousIsActive;
}

export function useSupabaseFeedRealtime({
  onFeedEvent,
  enabled = true,
}: UseSupabaseFeedRealtimeOptions) {
  const onFeedEventRef = useRef(onFeedEvent);

  useEffect(() => {
    onFeedEventRef.current = onFeedEvent;
  }, [onFeedEvent]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let supabaseClient: ReturnType<typeof createSupabaseBrowserClient> | null = null;

    try {
      supabaseClient = createSupabaseBrowserClient();
    } catch {
      return;
    }

    const channel = supabaseClient.channel("feed-realtime");

    channel.on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "alerts",
      },
      () => {
        onFeedEventRef.current({ table: "alerts", event: "INSERT" });
      },
    );

    channel.on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "alerts",
      },
      (payload) => {
        const typedPayload = payload as RealtimePostgresChangesPayload<Record<string, unknown>>;

        if (shouldNotifyAlertUpdate(typedPayload)) {
          onFeedEventRef.current({ table: "alerts", event: "UPDATE" });
        }
      },
    );

    channel.on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "news_items",
      },
      () => {
        onFeedEventRef.current({ table: "news_items", event: "INSERT" });
      },
    );

    channel.on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "official_updates",
      },
      () => {
        onFeedEventRef.current({ table: "official_updates", event: "INSERT" });
      },
    );

    channel.on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "official_updates",
      },
      (payload) => {
        const typedPayload = payload as RealtimePostgresChangesPayload<Record<string, unknown>>;

        if (shouldNotifyOfficialUpdate(typedPayload)) {
          onFeedEventRef.current({ table: "official_updates", event: "UPDATE" });
        }
      },
    );

    void channel.subscribe();

    return () => {
      void supabaseClient.removeChannel(channel);
    };
  }, [enabled]);
}

export type { FeedRealtimeEvent, FeedRealtimeTable };
