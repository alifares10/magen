"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { formatDateTime } from "@/lib/feed/client";
import { useBrowserNotificationPermission } from "@/components/notifications/use-browser-notification-permission";
import { useNotificationCenter } from "@/components/notifications/use-notification-center";
import Toaster, { type ToasterRef } from "@/components/ui/toast";
import { useNotificationPreferencesStore } from "@/store/use-notification-preferences-store";

const ALERT_AUTO_DISMISS_MS = 20_000;
const GUIDANCE_AUTO_DISMISS_MS = 12_000;

function getToastVariant(type: "official_alert" | "official_guidance") {
  if (type === "official_alert") {
    return "error" as const;
  }

  return "default" as const;
}

export function NotificationCenter() {
  const t = useTranslations("notifications");
  const browserNotificationsEnabled = useNotificationPreferencesStore(
    (state) => state.browserNotificationsEnabled,
  );
  const { isSupported, permission } = useBrowserNotificationPermission();
  const { notifications, dismissNotification } = useNotificationCenter({
    alertFallbackBody: t("alertFallbackBody"),
    officialFallbackBody: t("officialFallbackBody"),
  });
  const toasterRef = useRef<ToasterRef>(null);
  const browserSeenNotificationIdsRef = useRef<Set<string>>(new Set());
  const toastShownNotificationIdsRef = useRef<Set<string>>(new Set());
  const dismissTimeoutsRef = useRef<Map<string, number>>(new Map());
  const [visibilityState, setVisibilityState] =
    useState<DocumentVisibilityState>(() => {
      if (typeof document === "undefined") {
        return "visible";
      }

      return document.visibilityState;
    });

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const onVisibilityChange = () => {
      setVisibilityState(document.visibilityState);
    };

    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const canSendBrowserNotification =
      browserNotificationsEnabled &&
      isSupported &&
      permission === "granted" &&
      visibilityState !== "visible";

    for (const notification of notifications) {
      if (browserSeenNotificationIdsRef.current.has(notification.id)) {
        continue;
      }

      if (!canSendBrowserNotification) {
        continue;
      }

      try {
        const browserNotification = new window.Notification(
          notification.title,
          {
            body: notification.body,
            tag: notification.id,
            requireInteraction: true,
          },
        );

        browserSeenNotificationIdsRef.current.add(notification.id);

        browserNotification.onerror = () => {
          browserSeenNotificationIdsRef.current.delete(notification.id);

          if (process.env.NODE_ENV !== "test") {
            console.warn(
              "[notifications] Browser notification failed after dispatch.",
            );
          }
        };

        browserNotification.onclick = () => {
          window.focus();
          browserNotification.close();
        };
      } catch (error) {
        if (process.env.NODE_ENV !== "test") {
          const reason =
            error instanceof Error
              ? error.message
              : "Unknown browser notification error";
          console.warn(
            `[notifications] Browser notification dispatch failed: ${reason}`,
          );
        }

        continue;
      }
    }
  }, [
    browserNotificationsEnabled,
    isSupported,
    notifications,
    permission,
    visibilityState,
  ]);

  useEffect(() => {
    for (const notification of notifications) {
      if (toastShownNotificationIdsRef.current.has(notification.id)) {
        continue;
      }

      const primaryText = notification.location ?? notification.title;
      const detailParts = notification.location
        ? [notification.title, notification.body]
        : [notification.body];

      if (notification.severity) {
        detailParts.push(`${t("severityLabel")}: ${notification.severity}`);
      }

      detailParts.push(formatDateTime(notification.publishedAt));

      toasterRef.current?.show({
        title: primaryText,
        message: detailParts.join(" · "),
        variant: getToastVariant(notification.type),
        duration:
          notification.type === "official_alert"
            ? ALERT_AUTO_DISMISS_MS
            : GUIDANCE_AUTO_DISMISS_MS,
        position: "top-center",
        dismissLabel: t("dismissLabel"),
        onDismiss: () => {
          const timeoutId = dismissTimeoutsRef.current.get(notification.id);

          if (typeof timeoutId === "number") {
            window.clearTimeout(timeoutId);
            dismissTimeoutsRef.current.delete(notification.id);
          }

          dismissNotification(notification.id);
        },
      });

      toastShownNotificationIdsRef.current.add(notification.id);
    }
  }, [dismissNotification, notifications, t]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const activeNotificationIds = new Set(
      notifications.map((notification) => notification.id),
    );

    for (const notification of notifications) {
      if (dismissTimeoutsRef.current.has(notification.id)) {
        continue;
      }

      const autoDismissMs =
        notification.type === "official_alert"
          ? ALERT_AUTO_DISMISS_MS
          : GUIDANCE_AUTO_DISMISS_MS;

      const timeoutId = window.setTimeout(() => {
        dismissTimeoutsRef.current.delete(notification.id);
        dismissNotification(notification.id);
      }, autoDismissMs);

      dismissTimeoutsRef.current.set(notification.id, timeoutId);
    }

    for (const [
      notificationId,
      timeoutId,
    ] of dismissTimeoutsRef.current.entries()) {
      if (activeNotificationIds.has(notificationId)) {
        continue;
      }

      window.clearTimeout(timeoutId);
      dismissTimeoutsRef.current.delete(notificationId);
    }
  }, [dismissNotification, notifications]);

  useEffect(() => {
    const dismissTimeouts = dismissTimeoutsRef.current;

    return () => {
      for (const timeoutId of dismissTimeouts.values()) {
        window.clearTimeout(timeoutId);
      }

      dismissTimeouts.clear();
    };
  }, []);

  return <Toaster ref={toasterRef} defaultPosition="top-center" />;
}
