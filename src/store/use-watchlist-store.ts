import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  watchedLocationMarkerSchema,
  type WatchedLocationMarker,
} from "@/lib/schemas/map";

type WatchedLocationInput = Omit<WatchedLocationMarker, "id"> & {
  id?: string;
};

type WatchlistState = {
  watchedLocations: WatchedLocationMarker[];
  addWatchedLocation: (location: WatchedLocationInput) => void;
  removeWatchedLocation: (id: string) => void;
  clearWatchedLocations: () => void;
};

function toWatchedLocationId(input: WatchedLocationInput): string {
  if (input.id) {
    return input.id;
  }

  const normalizedName = input.name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");

  return `${normalizedName}-${input.latitude.toFixed(4)}-${input.longitude.toFixed(4)}`;
}

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

export const useWatchlistStore = create<WatchlistState>()(
  persist(
    (set) => ({
      watchedLocations: [],
      addWatchedLocation: (location) => {
        const parsed = watchedLocationMarkerSchema.safeParse({
          ...location,
          id: toWatchedLocationId(location),
        });

        if (!parsed.success) {
          return;
        }

        set((state) => ({
          watchedLocations: [
            ...state.watchedLocations.filter((item) => item.id !== parsed.data.id),
            parsed.data,
          ],
        }));
      },
      removeWatchedLocation: (id) => {
        set((state) => ({
          watchedLocations: state.watchedLocations.filter((location) => location.id !== id),
        }));
      },
      clearWatchedLocations: () => {
        set({ watchedLocations: [] });
      },
    }),
    {
      name: "magen-watchlist-v1",
      storage,
    },
  ),
);
