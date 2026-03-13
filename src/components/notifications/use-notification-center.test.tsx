import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useNotificationCenter } from "@/components/notifications/use-notification-center";

type MockEventType = "INSERT" | "UPDATE";
type MockTable = "alerts" | "official_updates";

type MockChannel = {
  on: (
    type: "postgres_changes",
    filter: { event: MockEventType; schema: "public"; table: MockTable },
    callback: (payload: Record<string, unknown>) => void,
  ) => MockChannel;
  subscribe: () => MockChannel;
};

let callbacksByKey: Record<string, ((payload: Record<string, unknown>) => void) | undefined>;
let removeChannelMock: ReturnType<typeof vi.fn>;

vi.mock("@/lib/supabase/client", () => {
  return {
    createSupabaseBrowserClient: () => {
      const channel: MockChannel = {
        on: (_type, filter, callback) => {
          callbacksByKey[`${filter.table}:${filter.event}`] = callback;
          return channel;
        },
        subscribe: () => channel,
      };

      return {
        channel: () => channel,
        removeChannel: removeChannelMock,
      };
    },
  };
});

function emit(table: MockTable, event: MockEventType, payload: Record<string, unknown>) {
  const callback = callbacksByKey[`${table}:${event}`];

  if (!callback) {
    throw new Error(`Missing callback for ${table}:${event}`);
  }

  callback(payload);
}

describe("useNotificationCenter", () => {
  beforeEach(() => {
    callbacksByKey = {};
    removeChannelMock = vi.fn();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("keeps official alerts above official guidance by priority", async () => {
    const { result } = renderHook(() =>
      useNotificationCenter({
        alertFallbackBody: "Alert fallback",
        officialFallbackBody: "Official fallback",
      }),
    );

    await act(async () => {
      emit("official_updates", "INSERT", {
        eventType: "INSERT",
        new: {
          id: "fa5f67e1-e64a-4bce-a4fa-0532f7e55402",
          title: "Official update",
          body: "Guidance details",
          severity: "high",
          is_active: true,
          published_at: "2026-03-09T12:20:00.000+00:00",
        },
      });

      emit("alerts", "INSERT", {
        eventType: "INSERT",
        new: {
          id: "22df13a9-6fa2-4cf3-a647-f6a5f3113751",
          title: "Official alert",
          message: "Take shelter now",
          severity: "critical",
          status: "active",
          published_at: "2026-03-09T12:21:00.000+00:00",
        },
      });
    });

    await waitFor(() => {
      expect(result.current.notifications).toHaveLength(2);
    });

    expect(result.current.notifications[0]?.type).toBe("official_alert");
    expect(result.current.notifications[1]?.type).toBe("official_guidance");
  });

  it("deduplicates repeated events for the same row", async () => {
    const { result } = renderHook(() =>
      useNotificationCenter({
        alertFallbackBody: "Alert fallback",
        officialFallbackBody: "Official fallback",
      }),
    );

    await act(async () => {
      emit("alerts", "INSERT", {
        eventType: "INSERT",
        new: {
          id: "22df13a9-6fa2-4cf3-a647-f6a5f3113751",
          title: "Official alert",
          message: "Take shelter now",
          severity: "critical",
          status: "active",
          published_at: "2026-03-09T12:21:00.000+00:00",
        },
      });

      emit("alerts", "UPDATE", {
        eventType: "UPDATE",
        old: {
          status: "resolved",
        },
        new: {
          id: "22df13a9-6fa2-4cf3-a647-f6a5f3113751",
          title: "Official alert",
          message: "Take shelter now",
          severity: "critical",
          status: "active",
          published_at: "2026-03-09T12:21:00.000+00:00",
        },
      });
    });

    await waitFor(() => {
      expect(result.current.notifications).toHaveLength(1);
    });
  });

  it("ignores updates that resolve an alert", async () => {
    const { result } = renderHook(() =>
      useNotificationCenter({
        alertFallbackBody: "Alert fallback",
        officialFallbackBody: "Official fallback",
      }),
    );

    await act(async () => {
      emit("alerts", "UPDATE", {
        eventType: "UPDATE",
        old: {
          status: "active",
        },
        new: {
          id: "22df13a9-6fa2-4cf3-a647-f6a5f3113751",
          title: "Official alert",
          message: "Resolved",
          severity: "critical",
          status: "resolved",
          published_at: "2026-03-09T12:21:00.000+00:00",
        },
      });
    });

    expect(result.current.notifications).toHaveLength(0);
  });

  it("removes realtime channel subscription on unmount", () => {
    const { unmount } = renderHook(() =>
      useNotificationCenter({
        alertFallbackBody: "Alert fallback",
        officialFallbackBody: "Official fallback",
      }),
    );

    unmount();

    expect(removeChannelMock).toHaveBeenCalledTimes(1);
  });
});
