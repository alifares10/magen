"use client";

import { useCallback, useSyncExternalStore } from "react";

const PERMISSION_CHANGE_EVENT = "magen-notification-permission-change";

type BrowserNotificationPermissionSnapshot = {
  isSupported: boolean;
  permission: NotificationPermission;
};

const serverSnapshot: BrowserNotificationPermissionSnapshot = {
  isSupported: false,
  permission: "default",
};

let lastSnapshot = serverSnapshot;

function isBrowserNotificationSupported(): boolean {
  return (
    typeof window !== "undefined" && typeof window.Notification !== "undefined"
  );
}

function getSnapshot(): BrowserNotificationPermissionSnapshot {
  if (!isBrowserNotificationSupported()) {
    lastSnapshot = serverSnapshot;
    return serverSnapshot;
  }

  const nextSnapshot: BrowserNotificationPermissionSnapshot = {
    isSupported: true,
    permission: window.Notification.permission,
  };

  if (
    lastSnapshot.isSupported === nextSnapshot.isSupported &&
    lastSnapshot.permission === nextSnapshot.permission
  ) {
    return lastSnapshot;
  }

  lastSnapshot = nextSnapshot;
  return nextSnapshot;
}

function subscribe(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const onPermissionChange = () => {
    onStoreChange();
  };

  window.addEventListener("focus", onPermissionChange);
  window.addEventListener(PERMISSION_CHANGE_EVENT, onPermissionChange);
  document.addEventListener("visibilitychange", onPermissionChange);

  return () => {
    window.removeEventListener("focus", onPermissionChange);
    window.removeEventListener(PERMISSION_CHANGE_EVENT, onPermissionChange);
    document.removeEventListener("visibilitychange", onPermissionChange);
  };
}

export function useBrowserNotificationPermission() {
  const { isSupported, permission } = useSyncExternalStore(
    subscribe,
    getSnapshot,
    () => serverSnapshot,
  );

  const requestPermission = useCallback(async () => {
    if (!isSupported) {
      return permission;
    }

    const nextPermission = await window.Notification.requestPermission();
    window.dispatchEvent(new Event(PERMISSION_CHANGE_EVENT));
    return nextPermission;
  }, [isSupported, permission]);

  return {
    isSupported,
    permission,
    requestPermission,
  };
}
