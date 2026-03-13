import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BrowserNotificationOptIn } from "@/components/notifications/browser-notification-opt-in";

const {
  browserNotificationsEnabledState,
  setBrowserNotificationsEnabledMock,
  browserPermissionState,
} = vi.hoisted(() => ({
  browserNotificationsEnabledState: {
    value: false,
  },
  setBrowserNotificationsEnabledMock: vi.fn((enabled: boolean) => {
    browserNotificationsEnabledState.value = enabled;
  }),
  browserPermissionState: {
    isSupported: true,
    permission: "default" as NotificationPermission,
    requestPermission: vi.fn<() => Promise<NotificationPermission>>(),
  },
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const labels: Record<string, string> = {
      browserOptInLabel: "Browser alerts",
      browserEnableAction: "Enable",
      browserDisableAction: "Disable",
      browserRequestingAction: "Requesting...",
      browserStatusEnabled: "Enabled for background tabs.",
      browserStatusDisabled: "Permission granted. Alerts are currently off.",
      browserStatusNeedsPermission: "Enable to request browser notification permission.",
      browserStatusBlocked: "Blocked by browser permission settings.",
      browserStatusUnsupported: "Browser notifications are not supported here.",
      browserBackgroundOnlyHint:
        "Browser alerts only fire when this tab is in the background.",
      browserBlockedHelp:
        "To re-enable, allow notifications for this site in browser settings.",
    };

    return labels[key] ?? key;
  },
}));

vi.mock("@/store/use-notification-preferences-store", () => ({
  useNotificationPreferencesStore: <T,>(
    selector: (state: {
      browserNotificationsEnabled: boolean;
      setBrowserNotificationsEnabled: (enabled: boolean) => void;
    }) => T,
  ) =>
    selector({
      browserNotificationsEnabled: browserNotificationsEnabledState.value,
      setBrowserNotificationsEnabled: setBrowserNotificationsEnabledMock,
    }),
}));

vi.mock("@/components/notifications/use-browser-notification-permission", () => ({
  useBrowserNotificationPermission: () => browserPermissionState,
}));

describe("BrowserNotificationOptIn", () => {
  beforeEach(() => {
    browserNotificationsEnabledState.value = false;
    setBrowserNotificationsEnabledMock.mockClear();
    browserPermissionState.isSupported = true;
    browserPermissionState.permission = "default";
    browserPermissionState.requestPermission = vi
      .fn<() => Promise<NotificationPermission>>()
      .mockResolvedValue("granted");
  });

  it("requests permission and enables browser alerts", async () => {
    const user = userEvent.setup();
    render(<BrowserNotificationOptIn />);

    await user.click(screen.getByRole("button", { name: "Enable" }));

    expect(browserPermissionState.requestPermission).toHaveBeenCalledTimes(1);
    expect(setBrowserNotificationsEnabledMock).toHaveBeenCalledWith(true);
  });

  it("disables browser alerts when already enabled", async () => {
    const user = userEvent.setup();
    browserNotificationsEnabledState.value = true;
    browserPermissionState.permission = "granted";

    render(<BrowserNotificationOptIn />);

    await user.click(screen.getByRole("button", { name: "Disable" }));

    expect(browserPermissionState.requestPermission).not.toHaveBeenCalled();
    expect(setBrowserNotificationsEnabledMock).toHaveBeenCalledWith(false);
  });

  it("prevents opt-in when permission is blocked", () => {
    browserPermissionState.permission = "denied";
    render(<BrowserNotificationOptIn />);

    expect(screen.getByRole("button", { name: "Enable" })).toBeDisabled();
    expect(
      screen.getByText("Blocked by browser permission settings."),
    ).toBeInTheDocument();
  });
});
