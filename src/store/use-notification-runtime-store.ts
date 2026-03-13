import { create } from "zustand";

export type NotificationDeliveryMode =
  | "disabled"
  | "connecting"
  | "realtime"
  | "fallback_polling"
  | "error";

type NotificationRuntimeState = {
  deliveryMode: NotificationDeliveryMode;
  errorMessage: string | null;
  setRuntimeState: (input: {
    deliveryMode: NotificationDeliveryMode;
    errorMessage?: string | null;
  }) => void;
};

export const useNotificationRuntimeStore = create<NotificationRuntimeState>()((set) => ({
  deliveryMode: "connecting",
  errorMessage: null,
  setRuntimeState: ({ deliveryMode, errorMessage = null }) => {
    set({ deliveryMode, errorMessage });
  },
}));
