import React from "react";
import { act, render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NotificationCenter } from "@/components/notifications/notification-center";

const {
  notificationCenterState,
  browserPreferenceState,
  browserPermissionState,
  toastShowMock,
} = vi.hoisted(() => ({
  notificationCenterState: {
    notifications: [] as Array<{
      id: string;
      type: "official_alert" | "official_guidance";
      title: string;
      body: string;
      location: string | null;
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
  toastShowMock: vi.fn(),
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const labels: Record<string, string> = {
      title: "Live notifications",
      alertLabel: "Official alert",
      officialLabel: "Official guidance",
      dismissLabel: "Dismiss",
      locationLabel: "Location",
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
      browserNotificationsEnabled:
        browserPreferenceState.browserNotificationsEnabled,
      setBrowserNotificationsEnabled: () => undefined,
    }),
}));

vi.mock(
  "@/components/notifications/use-browser-notification-permission",
  () => ({
    useBrowserNotificationPermission: () => browserPermissionState,
  }),
);

vi.mock("@/components/ui/toast", async () => {
  const ReactModule = await import("react");

  return {
    __esModule: true,
    default: ReactModule.forwardRef<
      { show: typeof toastShowMock },
      { defaultPosition?: string }
    >(function MockToaster({ defaultPosition }, ref) {
      ReactModule.useImperativeHandle(ref, () => ({
        show: toastShowMock,
      }));

      return <div data-position={defaultPosition} data-testid="mock-toaster" />;
    }),
  };
});

describe("NotificationCenter browser notifications", () => {
  beforeEach(() => {
    notificationCenterState.dismissNotification.mockClear();
    toastShowMock.mockClear();
    notificationCenterState.notifications = [
      {
        id: "official_alert-1",
        type: "official_alert",
        title: "Official alert",
        body: "Take shelter now",
        location: "Tel Aviv",
        severity: "critical",
        publishedAt: "2026-03-13T12:21:00.000+00:00",
        createdAt: Date.now(),
      },
    ];
    browserPreferenceState.browserNotificationsEnabled = true;
    browserPermissionState.isSupported = true;
    browserPermissionState.permission = "granted";
  });

  afterEach(() => {
    vi.useRealTimers();
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
        requireInteraction: true,
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

  it("sends a pending browser notification after tab becomes hidden", async () => {
    const notificationMock = vi.fn(function MockNotification(this: {
      onclick: (() => void) | null;
      close: () => void;
    }) {
      this.onclick = null;
      this.close = vi.fn();
    });
    vi.stubGlobal("Notification", notificationMock);
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "visible",
    });

    render(<NotificationCenter />);

    await waitFor(() => {
      expect(notificationMock).not.toHaveBeenCalled();
    });

    await act(async () => {
      Object.defineProperty(document, "visibilityState", {
        configurable: true,
        value: "hidden",
      });
      document.dispatchEvent(new Event("visibilitychange"));
    });

    await waitFor(() => {
      expect(notificationMock).toHaveBeenCalledWith("Official alert", {
        body: "Take shelter now",
        tag: "official_alert-1",
        requireInteraction: true,
      });
    });
  });

  it("retries browser notification delivery after a dispatch failure", async () => {
    let callCount = 0;
    const notificationMock = vi.fn(function MockNotification(this: {
      onclick: (() => void) | null;
      close: () => void;
    }) {
      callCount += 1;

      if (callCount === 1) {
        throw new Error("dispatch failed");
      }

      this.onclick = null;
      this.close = vi.fn();
    });
    vi.stubGlobal("Notification", notificationMock);
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "hidden",
    });

    const view = render(<NotificationCenter />);

    await waitFor(() => {
      expect(notificationMock).toHaveBeenCalledTimes(1);
    });

    notificationCenterState.notifications = [
      {
        ...notificationCenterState.notifications[0],
      },
    ];
    view.rerender(<NotificationCenter />);

    await waitFor(() => {
      expect(notificationMock).toHaveBeenCalledTimes(2);
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

  it("shows top-center toast alerts with mapped metadata", async () => {
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "visible",
    });

    render(<NotificationCenter />);

    await waitFor(() => {
      expect(toastShowMock).toHaveBeenCalledTimes(1);
    });

    const toastConfig = toastShowMock.mock.calls[0]?.[0];

    expect(toastConfig).toMatchObject({
      title: "Tel Aviv",
      variant: "error",
      position: "top-center",
      duration: 20_000,
      dismissLabel: "Dismiss",
    });
    expect(toastConfig?.message).toContain("Official alert");
    expect(toastConfig?.message).toContain("Severity: critical");
    expect(toastConfig?.message).toContain("Take shelter now");
  });

  it("bridges manual toast dismissal back to notification state", async () => {
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "visible",
    });

    render(<NotificationCenter />);

    await waitFor(() => {
      expect(toastShowMock).toHaveBeenCalledTimes(1);
    });

    const toastConfig = toastShowMock.mock.calls[0]?.[0];

    await act(async () => {
      toastConfig?.onDismiss?.();
    });

    expect(notificationCenterState.dismissNotification).toHaveBeenCalledWith(
      "official_alert-1",
    );
  });

  it("auto-dismisses guidance before alert by configured timers", async () => {
    vi.useFakeTimers();
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "visible",
    });

    notificationCenterState.notifications = [
      {
        id: "official_alert-1",
        type: "official_alert",
        title: "Official alert",
        body: "Take shelter now",
        location: "Tel Aviv",
        severity: "critical",
        publishedAt: "2026-03-13T12:21:00.000+00:00",
        createdAt: Date.now(),
      },
      {
        id: "official_guidance-1",
        type: "official_guidance",
        title: "Official guidance",
        body: "Stay near shelter",
        location: null,
        severity: "high",
        publishedAt: "2026-03-13T12:21:00.000+00:00",
        createdAt: Date.now(),
      },
    ];

    render(<NotificationCenter />);

    expect(notificationCenterState.dismissNotification).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(12_000);
    });

    expect(notificationCenterState.dismissNotification).toHaveBeenCalledWith(
      "official_guidance-1",
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(8_000);
    });

    expect(notificationCenterState.dismissNotification).toHaveBeenCalledWith(
      "official_alert-1",
    );
  });
});
