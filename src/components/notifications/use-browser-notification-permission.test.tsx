import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useBrowserNotificationPermission } from "@/components/notifications/use-browser-notification-permission";

describe("useBrowserNotificationPermission", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it("reports unsupported when Notification API is unavailable", async () => {
    vi.stubGlobal("Notification", undefined);

    const { result } = renderHook(() => useBrowserNotificationPermission());

    await waitFor(() => {
      expect(result.current.isSupported).toBe(false);
    });
    expect(result.current.permission).toBe("default");
  });

  it("requests and stores permission updates", async () => {
    const notificationApi = {
      permission: "default" as NotificationPermission,
      requestPermission: vi
        .fn<() => Promise<NotificationPermission>>()
        .mockImplementation(async () => {
          notificationApi.permission = "granted";
          return "granted";
        }),
    };

    vi.stubGlobal("Notification", notificationApi);

    const { result } = renderHook(() => useBrowserNotificationPermission());

    await waitFor(() => {
      expect(result.current.isSupported).toBe(true);
    });
    expect(result.current.permission).toBe("default");

    await act(async () => {
      await result.current.requestPermission();
    });

    expect(notificationApi.requestPermission).toHaveBeenCalledTimes(1);
    expect(result.current.permission).toBe("granted");
  });
});
