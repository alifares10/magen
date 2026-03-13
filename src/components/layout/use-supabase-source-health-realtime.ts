"use client";

import { useEffect, useRef } from "react";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type SourceHealthRealtimeTable = "sources" | "ingestion_runs";

type SourceHealthRealtimeEvent = {
  table: SourceHealthRealtimeTable;
  event: "INSERT" | "UPDATE" | "DELETE";
};

type UseSupabaseSourceHealthRealtimeOptions = {
  onSourceHealthEvent: (event: SourceHealthRealtimeEvent) => void;
  enabled?: boolean;
};

const monitoredSourceTypes = new Set([
  "official_alerts",
  "official_guidance",
  "rss_news",
]);

const monitoredIngestionJobTypes = new Set([
  "official_alerts",
  "official_guidance",
  "rss_news",
]);

function getRecordField(
  record:
    | RealtimePostgresChangesPayload<Record<string, unknown>>["new"]
    | RealtimePostgresChangesPayload<Record<string, unknown>>["old"],
  field: string,
): unknown {
  if (!record || typeof record !== "object") {
    return null;
  }

  return Reflect.get(record, field);
}

function shouldNotifySourcesChange(
  payload: RealtimePostgresChangesPayload<Record<string, unknown>>,
): boolean {
  const nextSourceType = getRecordField(payload.new, "source_type");
  const previousSourceType = getRecordField(payload.old, "source_type");
  const isNextMonitoredType =
    typeof nextSourceType === "string" && monitoredSourceTypes.has(nextSourceType);
  const isPreviousMonitoredType =
    typeof previousSourceType === "string" && monitoredSourceTypes.has(previousSourceType);

  if (!isNextMonitoredType && !isPreviousMonitoredType) {
    return false;
  }

  if (payload.eventType !== "UPDATE") {
    return true;
  }

  const nextIsActive = getRecordField(payload.new, "is_active");
  const previousIsActive = getRecordField(payload.old, "is_active");

  return nextSourceType !== previousSourceType || nextIsActive !== previousIsActive;
}

function shouldNotifyIngestionRunsChange(
  payload: RealtimePostgresChangesPayload<Record<string, unknown>>,
): boolean {
  const jobType = getRecordField(payload.new, "job_type");

  if (typeof jobType !== "string" || !monitoredIngestionJobTypes.has(jobType)) {
    return false;
  }

  const sourceId = getRecordField(payload.new, "source_id");

  if (typeof sourceId !== "string" || sourceId.length === 0) {
    return false;
  }

  const nextStatus = getRecordField(payload.new, "status");

  if (nextStatus !== "success" && nextStatus !== "failed") {
    return false;
  }

  if (payload.eventType !== "UPDATE") {
    return true;
  }

  const previousStatus = getRecordField(payload.old, "status");

  return previousStatus !== nextStatus;
}

export function useSupabaseSourceHealthRealtime({
  onSourceHealthEvent,
  enabled = true,
}: UseSupabaseSourceHealthRealtimeOptions) {
  const onSourceHealthEventRef = useRef(onSourceHealthEvent);

  useEffect(() => {
    onSourceHealthEventRef.current = onSourceHealthEvent;
  }, [onSourceHealthEvent]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let supabaseClient: ReturnType<typeof createSupabaseBrowserClient> | null = null;

    try {
      supabaseClient = createSupabaseBrowserClient();
    } catch (error) {
      const reason = error instanceof Error ? error.message : "Supabase client initialization failed";

      if (process.env.NODE_ENV !== "test") {
        console.error(`[source-health-realtime] Failed to initialize Supabase client: ${reason}`);
      }

      return;
    }

    const channel = supabaseClient.channel("source-health-realtime");

    channel.on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "sources",
      },
      (payload) => {
        const typedPayload = payload as RealtimePostgresChangesPayload<Record<string, unknown>>;

        if (!shouldNotifySourcesChange(typedPayload)) {
          return;
        }

        onSourceHealthEventRef.current({
          table: "sources",
          event: typedPayload.eventType,
        });
      },
    );

    channel.on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "ingestion_runs",
      },
      (payload) => {
        const typedPayload = payload as RealtimePostgresChangesPayload<Record<string, unknown>>;

        if (!shouldNotifyIngestionRunsChange(typedPayload)) {
          return;
        }

        onSourceHealthEventRef.current({
          table: "ingestion_runs",
          event: typedPayload.eventType,
        });
      },
    );

    void channel.subscribe((status, error) => {
      if (
        status === "CHANNEL_ERROR" ||
        status === "TIMED_OUT" ||
        status === "CLOSED"
      ) {
        const reason = error?.message ?? `Source health realtime status: ${status}`;

        if (process.env.NODE_ENV !== "test") {
          console.error(`[source-health-realtime] ${reason}`);
        }
      }
    });

    return () => {
      void supabaseClient.removeChannel(channel);
    };
  }, [enabled]);
}

export type { SourceHealthRealtimeEvent };
