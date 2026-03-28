"use client";

import { useEffect, useRef, useState } from "react";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  getAlertsData,
  getOfficialUpdatesData,
} from "@/lib/feed/client";
import type { AlertFeedItem, OfficialUpdateFeedItem } from "@/lib/schemas/feed";
import {
  alertNotificationRowSchema,
  inAppNotificationSchema,
  officialNotificationRowSchema,
  type InAppNotification,
  type NotificationType,
} from "@/lib/schemas/notifications";
import { useNotificationRuntimeStore } from "@/store/use-notification-runtime-store";

type NotificationRealtimeTable = "alerts" | "official_updates";

type UseNotificationCenterOptions = {
  enabled?: boolean;
  maxItems?: number;
  alertFallbackBody: string;
  officialFallbackBody: string;
};

type RealtimeSubscriptionStatus =
  | "SUBSCRIBED"
  | "TIMED_OUT"
  | "CLOSED"
  | "CHANNEL_ERROR";

const DEFAULT_MAX_ITEMS = 6;
const FALLBACK_POLL_INTERVAL_MS = 25_000;
const REALTIME_CONNECT_GRACE_PERIOD_MS = 8_000;

function getNotificationPriority(type: NotificationType): number {
  if (type === "official_alert") {
    return 2;
  }

  return 1;
}

function compareNotifications(left: InAppNotification, right: InAppNotification): number {
  const priorityDelta = getNotificationPriority(right.type) - getNotificationPriority(left.type);

  if (priorityDelta !== 0) {
    return priorityDelta;
  }

  return right.createdAt - left.createdAt;
}

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

function normalizeLocationSegment(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalizedValue = value.trim();
  return normalizedValue.length > 0 ? normalizedValue : null;
}

function pickAlertLocation(input: {
  locationName?: unknown;
  city?: unknown;
  region?: unknown;
  country?: unknown;
}): string | null {
  return (
    normalizeLocationSegment(input.locationName) ??
    normalizeLocationSegment(input.city) ??
    normalizeLocationSegment(input.region) ??
    normalizeLocationSegment(input.country) ??
    null
  );
}

function buildAlertNotification(
  payload: RealtimePostgresChangesPayload<Record<string, unknown>>,
  fallbackBody: string,
): InAppNotification | null {
  const parsedNewRow = alertNotificationRowSchema.safeParse(payload.new);

  if (!parsedNewRow.success) {
    return null;
  }

  if (payload.eventType === "INSERT" && parsedNewRow.data.status !== "active") {
    return null;
  }

  if (payload.eventType === "UPDATE") {
    const previousStatus = getRecordField(payload.old, "status");

    if (parsedNewRow.data.status !== "active" || previousStatus === "active") {
      return null;
    }
  }

  const notification = inAppNotificationSchema.safeParse({
    id: `official_alert-${parsedNewRow.data.id}`,
    type: "official_alert",
    title: parsedNewRow.data.title,
    body:
      parsedNewRow.data.message && parsedNewRow.data.message.trim().length > 0
        ? parsedNewRow.data.message
        : fallbackBody,
    location: pickAlertLocation({
      locationName: parsedNewRow.data.location_name,
      city: parsedNewRow.data.city,
      region: parsedNewRow.data.region,
      country: parsedNewRow.data.country,
    }),
    severity: parsedNewRow.data.severity,
    publishedAt: parsedNewRow.data.published_at,
    createdAt: Date.now(),
  });

  if (!notification.success) {
    return null;
  }

  return notification.data;
}

function buildOfficialNotification(
  payload: RealtimePostgresChangesPayload<Record<string, unknown>>,
  fallbackBody: string,
): InAppNotification | null {
  const parsedNewRow = officialNotificationRowSchema.safeParse(payload.new);

  if (!parsedNewRow.success) {
    return null;
  }

  if (payload.eventType === "INSERT" && !parsedNewRow.data.is_active) {
    return null;
  }

  if (payload.eventType === "UPDATE") {
    const previousIsActive = getRecordField(payload.old, "is_active");

    if (!parsedNewRow.data.is_active || previousIsActive === true) {
      return null;
    }
  }

  const notification = inAppNotificationSchema.safeParse({
    id: `official_guidance-${parsedNewRow.data.id}`,
    type: "official_guidance",
    title: parsedNewRow.data.title,
    body:
      parsedNewRow.data.body && parsedNewRow.data.body.trim().length > 0
        ? parsedNewRow.data.body
        : fallbackBody,
    location: null,
    severity: parsedNewRow.data.severity,
    publishedAt: parsedNewRow.data.published_at,
    createdAt: Date.now(),
  });

  if (!notification.success) {
    return null;
  }

  return notification.data;
}

function buildNotificationFromAlertFeedItem(
  item: AlertFeedItem,
  fallbackBody: string,
): InAppNotification | null {
  if (item.status !== "active") {
    return null;
  }

  const notification = inAppNotificationSchema.safeParse({
    id: `official_alert-${item.id}`,
    type: "official_alert",
    title: item.title,
    body: item.message && item.message.trim().length > 0 ? item.message : fallbackBody,
    location: pickAlertLocation({
      locationName: item.locationName,
      city: item.city,
      region: item.region,
      country: item.country,
    }),
    severity: item.severity,
    publishedAt: item.publishedAt,
    createdAt: Date.now(),
  });

  if (!notification.success) {
    return null;
  }

  return notification.data;
}

function buildNotificationFromOfficialFeedItem(
  item: OfficialUpdateFeedItem,
  fallbackBody: string,
): InAppNotification | null {
  if (!item.isActive) {
    return null;
  }

  const notification = inAppNotificationSchema.safeParse({
    id: `official_guidance-${item.id}`,
    type: "official_guidance",
    title: item.title,
    body: item.body && item.body.trim().length > 0 ? item.body : fallbackBody,
    location: null,
    severity: item.severity,
    publishedAt: item.publishedAt,
    createdAt: Date.now(),
  });

  if (!notification.success) {
    return null;
  }

  return notification.data;
}

export function useNotificationCenter({
  enabled = true,
  maxItems = DEFAULT_MAX_ITEMS,
  alertFallbackBody,
  officialFallbackBody,
}: UseNotificationCenterOptions) {
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const seenNotificationIdsRef = useRef<Set<string>>(new Set());
  const knownAlertIdsRef = useRef<Set<string>>(new Set());
  const knownOfficialUpdateIdsRef = useRef<Set<string>>(new Set());
  const didInitializeFallbackSnapshotRef = useRef(false);
  const setRuntimeState = useNotificationRuntimeStore((state) => state.setRuntimeState);

  const dismissNotification = (notificationId: string) => {
    setNotifications((previousNotifications) =>
      previousNotifications.filter((notification) => notification.id !== notificationId),
    );
  };

  useEffect(() => {
    if (!enabled) {
      setRuntimeState({
        deliveryMode: "disabled",
        errorMessage: null,
      });
      return;
    }

    setRuntimeState({
      deliveryMode: "connecting",
      errorMessage: null,
    });

    let supabaseClient: ReturnType<typeof createSupabaseBrowserClient> | null = null;
    let isDisposed = false;
    let fallbackPollInterval: number | null = null;
    let fallbackPollInFlight = false;
    let connectionGraceTimer: number | null = null;

    try {
      supabaseClient = createSupabaseBrowserClient();
    } catch (error) {
      const reason = error instanceof Error ? error.message : "Supabase client initialization failed";

      setRuntimeState({
        deliveryMode: "error",
        errorMessage: reason,
      });

      if (process.env.NODE_ENV !== "test") {
        console.error(`[notifications] Failed to initialize Supabase realtime client: ${reason}`);
      }

      return;
    }

    const enqueueNotification = (notification: InAppNotification | null) => {
      if (isDisposed || !notification || seenNotificationIdsRef.current.has(notification.id)) {
        return;
      }

      seenNotificationIdsRef.current.add(notification.id);

      setNotifications((previousNotifications) => {
        const orderedNotifications = [...previousNotifications, notification].sort(compareNotifications);
        return orderedNotifications.slice(0, maxItems);
      });
    };

    const stopFallbackPolling = () => {
      if (fallbackPollInterval !== null) {
        window.clearInterval(fallbackPollInterval);
        fallbackPollInterval = null;
      }
    };

    const runFallbackPollingCycle = async () => {
      if (isDisposed || fallbackPollInFlight) {
        return;
      }

      fallbackPollInFlight = true;

      try {
        const [alerts, officialUpdates] = await Promise.all([
          getAlertsData(20, { activeOnly: true }),
          getOfficialUpdatesData({ limit: 20, activeOnly: true }),
        ]);

        if (isDisposed) {
          return;
        }

        const activeAlerts = alerts.filter((item) => item.status === "active");
        const activeOfficialUpdates = officialUpdates.filter((item) => item.isActive);

        if (!didInitializeFallbackSnapshotRef.current) {
          didInitializeFallbackSnapshotRef.current = true;

          for (const item of activeAlerts) {
            knownAlertIdsRef.current.add(item.id);
          }

          for (const item of activeOfficialUpdates) {
            knownOfficialUpdateIdsRef.current.add(item.id);
          }

          return;
        }

        for (const item of activeAlerts) {
          if (knownAlertIdsRef.current.has(item.id)) {
            continue;
          }

          knownAlertIdsRef.current.add(item.id);
          enqueueNotification(buildNotificationFromAlertFeedItem(item, alertFallbackBody));
        }

        for (const item of activeOfficialUpdates) {
          if (knownOfficialUpdateIdsRef.current.has(item.id)) {
            continue;
          }

          knownOfficialUpdateIdsRef.current.add(item.id);
          enqueueNotification(buildNotificationFromOfficialFeedItem(item, officialFallbackBody));
        }
      } catch (error) {
        const reason = error instanceof Error ? error.message : "Fallback notification polling failed";

        setRuntimeState({
          deliveryMode: "fallback_polling",
          errorMessage: reason,
        });

        if (process.env.NODE_ENV !== "test") {
          console.error(`[notifications] Fallback polling failed: ${reason}`);
        }
      } finally {
        fallbackPollInFlight = false;
      }
    };

    const ensureFallbackPolling = (reason: string) => {
      setRuntimeState({
        deliveryMode: "fallback_polling",
        errorMessage: reason,
      });

      if (fallbackPollInterval !== null) {
        return;
      }

      void runFallbackPollingCycle();
      fallbackPollInterval = window.setInterval(() => {
        void runFallbackPollingCycle();
      }, FALLBACK_POLL_INTERVAL_MS);
    };

    const channel = supabaseClient.channel("notification-center-realtime");

    const subscribeToTable = (table: NotificationRealtimeTable, event: "INSERT" | "UPDATE") => {
      channel.on(
        "postgres_changes",
        {
          event,
          schema: "public",
          table,
        },
        (payload) => {
          const typedPayload = payload as RealtimePostgresChangesPayload<Record<string, unknown>>;

          if (table === "alerts") {
            const notification = buildAlertNotification(typedPayload, alertFallbackBody);

            if (notification) {
              const alertId = notification.id.replace("official_alert-", "");
              knownAlertIdsRef.current.add(alertId);
            }

            enqueueNotification(notification);
            return;
          }

          const notification = buildOfficialNotification(typedPayload, officialFallbackBody);

          if (notification) {
            const updateId = notification.id.replace("official_guidance-", "");
            knownOfficialUpdateIdsRef.current.add(updateId);
          }

          enqueueNotification(notification);
        },
      );
    };

    subscribeToTable("alerts", "INSERT");
    subscribeToTable("alerts", "UPDATE");
    subscribeToTable("official_updates", "INSERT");
    subscribeToTable("official_updates", "UPDATE");

    connectionGraceTimer = window.setTimeout(() => {
      ensureFallbackPolling("Realtime connection did not confirm in time. Using fallback polling.");
    }, REALTIME_CONNECT_GRACE_PERIOD_MS);

    void channel.subscribe((status, error) => {
      const typedStatus = status as RealtimeSubscriptionStatus;
      const reason = error?.message ?? `Notification realtime status: ${typedStatus}`;

      if (typedStatus === "SUBSCRIBED") {
        if (connectionGraceTimer !== null) {
          window.clearTimeout(connectionGraceTimer);
          connectionGraceTimer = null;
        }

        stopFallbackPolling();
        setRuntimeState({
          deliveryMode: "realtime",
          errorMessage: null,
        });
        return;
      }

      if (typedStatus === "CHANNEL_ERROR" || typedStatus === "TIMED_OUT") {
        ensureFallbackPolling(reason);

        if (process.env.NODE_ENV !== "test") {
          console.error(`[notifications] Realtime status ${typedStatus}. ${reason}`);
        }
      }
    });

    return () => {
      isDisposed = true;

      if (connectionGraceTimer !== null) {
        window.clearTimeout(connectionGraceTimer);
        connectionGraceTimer = null;
      }

      stopFallbackPolling();
      void supabaseClient.removeChannel(channel);
    };
  }, [alertFallbackBody, enabled, maxItems, officialFallbackBody, setRuntimeState]);

  return {
    notifications,
    dismissNotification,
  };
}

export { compareNotifications };
