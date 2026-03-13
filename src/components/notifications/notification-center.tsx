"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { formatDateTime } from "@/lib/feed/client";
import { useBrowserNotificationPermission } from "@/components/notifications/use-browser-notification-permission";
import { useNotificationCenter } from "@/components/notifications/use-notification-center";
import { useNotificationPreferencesStore } from "@/store/use-notification-preferences-store";

const ALERT_AUTO_DISMISS_MS = 20_000;
const GUIDANCE_AUTO_DISMISS_MS = 12_000;

function getNotificationClasses(type: "official_alert" | "official_guidance"): string {
  if (type === "official_alert") {
    return "border-red-700 bg-red-600/95 text-red-50";
  }

  return "border-sky-300 bg-sky-50/95 text-sky-950";
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
  const browserSeenNotificationIdsRef = useRef<Set<string>>(new Set());
  const dismissTimeoutsRef = useRef<Map<string, number>>(new Map());
  const [visibilityState, setVisibilityState] = useState<DocumentVisibilityState>(() => {
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
        const browserNotification = new window.Notification(notification.title, {
          body: notification.body,
          tag: notification.id,
          requireInteraction: true,
        });

        browserSeenNotificationIdsRef.current.add(notification.id);

        browserNotification.onerror = () => {
          browserSeenNotificationIdsRef.current.delete(notification.id);

          if (process.env.NODE_ENV !== "test") {
            console.warn("[notifications] Browser notification failed after dispatch.");
          }
        };

        browserNotification.onclick = () => {
          window.focus();
          browserNotification.close();
        };
      } catch (error) {
        if (process.env.NODE_ENV !== "test") {
          const reason = error instanceof Error ? error.message : "Unknown browser notification error";
          console.warn(`[notifications] Browser notification dispatch failed: ${reason}`);
        }

        continue;
      }
    }
  }, [browserNotificationsEnabled, isSupported, notifications, permission, visibilityState]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const activeNotificationIds = new Set(notifications.map((notification) => notification.id));

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

    for (const [notificationId, timeoutId] of dismissTimeoutsRef.current.entries()) {
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

  if (notifications.length === 0) {
    return null;
  }

  return (
    <section
      aria-live="polite"
      className="pointer-events-none fixed inset-x-4 top-4 z-50 mx-auto w-full max-w-md"
    >
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-700">
        {t("title")}
      </p>

      <ul className="space-y-2">
        {notifications.map((notification) => {
          const typeLabel =
            notification.type === "official_alert"
              ? t("alertLabel")
              : t("officialLabel");

          return (
            <li
              key={notification.id}
              className={`pointer-events-auto rounded-xl border px-3 py-2 shadow-[0_16px_28px_-22px_rgba(15,23,42,0.65)] backdrop-blur ${getNotificationClasses(notification.type)}`}
            >
              <div className="flex items-start justify-between gap-3">
                <span className="inline-flex rounded-full border border-current/30 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide">
                  {typeLabel}
                </span>

                <button
                  type="button"
                  onClick={() => {
                    dismissNotification(notification.id);
                  }}
                  className="rounded-md px-1.5 py-0.5 text-xs text-current/80 hover:bg-white/60 hover:text-current"
                  aria-label={t("dismissLabel")}
                >
                  {t("dismissLabel")}
                </button>
              </div>

              <p className="mt-1 text-sm font-semibold">{notification.title}</p>

              {notification.location ? (
                <p
                  className={
                    notification.type === "official_alert"
                      ? "mt-2 inline-flex rounded-md border border-red-100/40 bg-red-900/35 px-2 py-1 text-[11px] font-semibold tracking-wide text-red-50"
                      : "mt-2 inline-flex rounded-md border border-sky-300/60 bg-sky-100/80 px-2 py-1 text-[11px] font-semibold tracking-wide text-sky-900"
                  }
                >
                  {t("locationLabel")}: {notification.location}
                </p>
              ) : null}

              <p className="mt-2 line-clamp-2 text-xs text-current/90">{notification.body}</p>

              <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-current/80">
                {notification.severity ? (
                  <span>
                    {t("severityLabel")}: {notification.severity}
                  </span>
                ) : null}
                <span>{formatDateTime(notification.publishedAt)}</span>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
