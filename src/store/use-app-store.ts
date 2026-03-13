import { create } from "zustand";

type AppState = {
  selectedRegion: string;
  setSelectedRegion: (region: string) => void;
};

export const useAppStore = create<AppState>()((set) => ({
  selectedRegion: "all",
  setSelectedRegion: (region) => set({ selectedRegion: region }),
}));
