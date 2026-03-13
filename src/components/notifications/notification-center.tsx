"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { formatDateTime } from "@/lib/feed/client";
import { useBrowserNotificationPermission } from "@/components/notifications/use-browser-notification-permission";
import { useNotificationCenter } from "@/components/notifications/use-notification-center";
import { useNotificationPreferencesStore } from "@/store/use-notification-preferences-store";

function getNotificationClasses(type: "official_alert" | "official_guidance"): string {
  if (type === "official_alert") {
    return "border-rose-300 bg-rose-50/95 text-rose-950";
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

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const canSendBrowserNotification =
      browserNotificationsEnabled &&
      isSupported &&
      permission === "granted" &&
      document.visibilityState !== "visible";

    for (const notification of notifications) {
      if (browserSeenNotificationIdsRef.current.has(notification.id)) {
        continue;
      }

      browserSeenNotificationIdsRef.current.add(notification.id);

      if (!canSendBrowserNotification) {
        continue;
      }

      try {
        const browserNotification = new window.Notification(notification.title, {
          body: notification.body,
          tag: notification.id,
        });

        browserNotification.onclick = () => {
          window.focus();
          browserNotification.close();
        };
      } catch {
        continue;
      }
    }
  }, [browserNotificationsEnabled, isSupported, notifications, permission]);

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
              <p className="mt-1 line-clamp-2 text-xs text-current/90">{notification.body}</p>

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
