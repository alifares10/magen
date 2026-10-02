"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { Bell, BellOff } from "lucide-react";
import { useBrowserNotificationPermission } from "@/components/notifications/use-browser-notification-permission";
import { useNotificationPreferencesStore } from "@/store/use-notification-preferences-store";
import { useNotificationRuntimeStore } from "@/store/use-notification-runtime-store";

type BrowserNotificationOptInProps = {
  className?: string;
  compact?: boolean;
};

export function BrowserNotificationOptIn({
  className,
  compact,
}: BrowserNotificationOptInProps) {
  const t = useTranslations("notifications");
  const hasHydrated = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );
  const browserNotificationsEnabled = useNotificationPreferencesStore(
    (state) => state.browserNotificationsEnabled,
  );
  const setBrowserNotificationsEnabled = useNotificationPreferencesStore(
    (state) => state.setBrowserNotificationsEnabled,
  );
  const { isSupported, permission, requestPermission } =
    useBrowserNotificationPermission();
  const deliveryMode = useNotificationRuntimeStore((state) => state.deliveryMode);
  const [isRequesting, setIsRequesting] = useState(false);

  useEffect(() => {
    if (
      browserNotificationsEnabled &&
      (!isSupported || permission !== "granted")
    ) {
      setBrowserNotificationsEnabled(false);
    }
  }, [
    browserNotificationsEnabled,
    isSupported,
    permission,
    setBrowserNotificationsEnabled,
  ]);

  const onToggle = async () => {
    if (browserNotificationsEnabled) {
      setBrowserNotificationsEnabled(false);
      return;
    }

    if (!isSupported) {
      return;
    }

    if (permission === "granted") {
      setBrowserNotificationsEnabled(true);
      return;
    }

    if (permission === "denied") {
      return;
    }

    setIsRequesting(true);

    try {
      const nextPermission = await requestPermission();

      if (nextPermission === "granted") {
        setBrowserNotificationsEnabled(true);
      }
    } finally {
      setIsRequesting(false);
    }
  };

  const buttonLabel = browserNotificationsEnabled
    ? t("browserDisableAction")
    : isRequesting
      ? t("browserRequestingAction")
      : t("browserEnableAction");
  const statusText = !hasHydrated
    ? t("browserStatusNeedsPermission")
    : !isSupported
      ? t("browserStatusUnsupported")
      : browserNotificationsEnabled
        ? t("browserStatusEnabled")
        : permission === "denied"
          ? t("browserStatusBlocked")
          : permission === "granted"
            ? t("browserStatusDisabled")
            : t("browserStatusNeedsPermission");
  const deliveryStatusText =
    deliveryMode === "realtime"
      ? t("deliveryStatusRealtime")
      : deliveryMode === "fallback_polling"
        ? t("deliveryStatusFallback")
        : deliveryMode === "error"
          ? t("deliveryStatusError")
          : deliveryMode === "disabled"
            ? t("deliveryStatusDisabled")
            : t("deliveryStatusConnecting");
  const deliveryStatusClassName =
    deliveryMode === "realtime"
      ? "text-emerald-700 dark:text-emerald-300"
      : deliveryMode === "fallback_polling" || deliveryMode === "error"
        ? "text-amber-700 dark:text-amber-300"
        : "text-zinc-600 dark:text-slate-400";

  return (
    <div className={className}>
      {!compact && (
        <p className="block text-xs font-semibold uppercase tracking-wide text-zinc-700 dark:text-zinc-300">
          {t("browserOptInLabel")}
        </p>
      )}

      <button
        type="button"
        aria-label={compact ? `${t("browserOptInLabel")}: ${buttonLabel}` : undefined}
        aria-pressed={browserNotificationsEnabled}
        title={compact ? `${t("browserOptInLabel")}: ${statusText}` : undefined}
        onClick={() => {
          void onToggle();
        }}
        disabled={
          isRequesting ||
          !hasHydrated ||
          !isSupported ||
          (!browserNotificationsEnabled && permission === "denied")
        }
        className={`${compact ? "flex h-11 w-11 shrink-0 items-center justify-center" : "mt-1 px-3"} min-h-11 rounded-lg border border-zinc-300 bg-white text-sm font-medium text-zinc-900 enabled:hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950/85 dark:text-slate-100 dark:enabled:hover:bg-slate-900`}
      >
        {compact ? (
          <>
            {browserNotificationsEnabled ? <Bell className="h-5 w-5" aria-hidden="true" /> : <BellOff className="h-5 w-5" aria-hidden="true" />}
            <span className="sr-only">{buttonLabel}</span>
          </>
        ) : buttonLabel}
      </button>

      {!compact && (
        <>
          <p className="mt-1 text-xs text-zinc-600 dark:text-slate-400">{statusText}</p>
          <p className={`mt-1 text-xs ${deliveryStatusClassName}`}>
            {t("deliveryStatusLabel")}: {deliveryStatusText}
          </p>
          <p className="mt-1 text-[11px] text-zinc-500 dark:text-slate-400">
            {t("browserBackgroundOnlyHint")}
          </p>

          {hasHydrated &&
          isSupported &&
          permission === "denied" &&
          !browserNotificationsEnabled ? (
            <p className="mt-1 text-[11px] text-amber-700 dark:text-amber-400">
              {t("browserBlockedHelp")}
            </p>
          ) : null}
        </>
      )}
    </div>
  );
}
