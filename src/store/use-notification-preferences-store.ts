import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type NotificationPreferencesState = {
  browserNotificationsEnabled: boolean;
  setBrowserNotificationsEnabled: (enabled: boolean) => void;
};

const storage = createJSONStorage(() => {
  if (typeof window === "undefined") {
    return {
      getItem: () => null,
      setItem: () => undefined,
      removeItem: () => undefined,
    };
  }

  return window.localStorage;
});

export const useNotificationPreferencesStore = create<NotificationPreferencesState>()(
  persist(
    (set) => ({
      browserNotificationsEnabled: false,
      setBrowserNotificationsEnabled: (enabled) => {
        set({ browserNotificationsEnabled: enabled });
      },
    }),
    {
      name: "magen-notification-preferences-v1",
      storage,
    },
  ),
);
