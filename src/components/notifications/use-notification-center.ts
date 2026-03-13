"use client";

import { useEffect, useRef, useState } from "react";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  alertNotificationRowSchema,
  inAppNotificationSchema,
  officialNotificationRowSchema,
  type InAppNotification,
  type NotificationType,
} from "@/lib/schemas/notifications";

type NotificationRealtimeTable = "alerts" | "official_updates";

type UseNotificationCenterOptions = {
  enabled?: boolean;
  maxItems?: number;
  alertFallbackBody: string;
  officialFallbackBody: string;
};

const DEFAULT_MAX_ITEMS = 6;

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
    severity: parsedNewRow.data.severity,
    publishedAt: parsedNewRow.data.published_at,
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

  const dismissNotification = (notificationId: string) => {
    setNotifications((previousNotifications) =>
      previousNotifications.filter((notification) => notification.id !== notificationId),
    );
  };

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

    const enqueueNotification = (notification: InAppNotification | null) => {
      if (!notification || seenNotificationIdsRef.current.has(notification.id)) {
        return;
      }

      seenNotificationIdsRef.current.add(notification.id);

      setNotifications((previousNotifications) => {
        const orderedNotifications = [...previousNotifications, notification].sort(compareNotifications);
        return orderedNotifications.slice(0, maxItems);
      });
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
            enqueueNotification(buildAlertNotification(typedPayload, alertFallbackBody));
            return;
          }

          enqueueNotification(buildOfficialNotification(typedPayload, officialFallbackBody));
        },
      );
    };

    subscribeToTable("alerts", "INSERT");
    subscribeToTable("alerts", "UPDATE");
    subscribeToTable("official_updates", "INSERT");
    subscribeToTable("official_updates", "UPDATE");

    void channel.subscribe();

    return () => {
      void supabaseClient.removeChannel(channel);
    };
  }, [alertFallbackBody, enabled, maxItems, officialFallbackBody]);

  return {
    notifications,
    dismissNotification,
  };
}

export { compareNotifications };
