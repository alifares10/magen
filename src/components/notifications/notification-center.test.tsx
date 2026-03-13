import React from "react";
import { render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NotificationCenter } from "@/components/notifications/notification-center";

const { notificationCenterState, browserPreferenceState, browserPermissionState } = vi.hoisted(
  () => ({
    notificationCenterState: {
      notifications: [] as Array<{
        id: string;
        type: "official_alert" | "official_guidance";
        title: string;
        body: string;
        severity: "low" | "medium" | "high" | "critical" | null;
        publishedAt: string;
        createdAt: number;
      }>,
      dismissNotification: vi.fn(),
    },
    browserPreferenceState: {
      browserNotificationsEnabled: true,
    },
    browserPermissionState: {
      isSupported: true,
      permission: "granted" as NotificationPermission,
      requestPermission: vi.fn<() => Promise<NotificationPermission>>(),
    },
  }),
);

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const labels: Record<string, string> = {
      title: "Live notifications",
      alertLabel: "Official alert",
      officialLabel: "Official guidance",
      dismissLabel: "Dismiss",
      severityLabel: "Severity",
      alertFallbackBody: "Alert fallback",
      officialFallbackBody: "Official fallback",
    };

    return labels[key] ?? key;
  },
}));

vi.mock("@/components/notifications/use-notification-center", () => ({
  useNotificationCenter: () => notificationCenterState,
}));

vi.mock("@/store/use-notification-preferences-store", () => ({
  useNotificationPreferencesStore: <T,>(
    selector: (state: {
      browserNotificationsEnabled: boolean;
      setBrowserNotificationsEnabled: (enabled: boolean) => void;
    }) => T,
  ) =>
    selector({
      browserNotificationsEnabled: browserPreferenceState.browserNotificationsEnabled,
      setBrowserNotificationsEnabled: () => undefined,
    }),
}));

vi.mock("@/components/notifications/use-browser-notification-permission", () => ({
  useBrowserNotificationPermission: () => browserPermissionState,
}));

describe("NotificationCenter browser notifications", () => {
  beforeEach(() => {
    notificationCenterState.dismissNotification.mockClear();
    notificationCenterState.notifications = [
      {
        id: "official_alert-1",
        type: "official_alert",
        title: "Official alert",
        body: "Take shelter now",
        severity: "critical",
        publishedAt: "2026-03-13T12:21:00.000+00:00",
        createdAt: Date.now(),
      },
    ];
    browserPreferenceState.browserNotificationsEnabled = true;
    browserPermissionState.isSupported = true;
    browserPermissionState.permission = "granted";
  });

  it("fires browser notifications only when tab is hidden", async () => {
    const notificationMock = vi.fn();
    vi.stubGlobal("Notification", notificationMock);
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "hidden",
    });

    render(<NotificationCenter />);

    await waitFor(() => {
      expect(notificationMock).toHaveBeenCalledWith("Official alert", {
        body: "Take shelter now",
        tag: "official_alert-1",
      });
    });
  });

  it("does not fire browser notifications while tab is visible", async () => {
    const notificationMock = vi.fn();
    vi.stubGlobal("Notification", notificationMock);
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "visible",
    });

    render(<NotificationCenter />);

    await waitFor(() => {
      expect(notificationMock).not.toHaveBeenCalled();
    });
  });

  it("does not fire browser notifications when opt-in is disabled", async () => {
    const notificationMock = vi.fn();
    vi.stubGlobal("Notification", notificationMock);
    browserPreferenceState.browserNotificationsEnabled = false;
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "hidden",
    });

    render(<NotificationCenter />);

    await waitFor(() => {
      expect(notificationMock).not.toHaveBeenCalled();
    });
  });
});
