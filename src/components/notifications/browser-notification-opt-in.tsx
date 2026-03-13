"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { useBrowserNotificationPermission } from "@/components/notifications/use-browser-notification-permission";
import { useNotificationPreferencesStore } from "@/store/use-notification-preferences-store";

type BrowserNotificationOptInProps = {
  className?: string;
};

export function BrowserNotificationOptIn({
  className,
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

  return (
    <div className={className}>
      <p className="block text-xs font-semibold uppercase tracking-wide text-zinc-700">
        {t("browserOptInLabel")}
      </p>

      <button
        type="button"
        onClick={() => {
          void onToggle();
        }}
        disabled={
          isRequesting ||
          !hasHydrated ||
          !isSupported ||
          (!browserNotificationsEnabled && permission === "denied")
        }
        className="mt-1 h-9 rounded-md border border-zinc-300 bg-white px-2 text-sm text-zinc-900 enabled:hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {buttonLabel}
      </button>

      <p className="mt-1 text-xs text-zinc-600">{statusText}</p>
      <p className="mt-1 text-[11px] text-zinc-500">
        {t("browserBackgroundOnlyHint")}
      </p>

      {hasHydrated &&
      isSupported &&
      permission === "denied" &&
      !browserNotificationsEnabled ? (
        <p className="mt-1 text-[11px] text-amber-700">
          {t("browserBlockedHelp")}
        </p>
      ) : null}
    </div>
  );
}
