"use client";

import { Search, ChevronDown } from "lucide-react";
import { ALL_REGIONS_FILTER_VALUE } from "@/lib/feed/filters";

type FilterBarContent = {
  regionFilterLabel: string;
  regionFilterAll: string;
  locationSearchLabel: string;
  locationSearchPlaceholder: string;
};

type FilterBarProps = {
  content: FilterBarContent;
  selectedRegion: string;
  onRegionChange: (region: string) => void;
  locationSearchQuery: string;
  onLocationSearchChange: (query: string) => void;
  availableRegions: string[];
};

export function FilterBar({
  content,
  selectedRegion,
  onRegionChange,
  locationSearchQuery,
  onLocationSearchChange,
  availableRegions,
}: FilterBarProps) {
  return (
    <div className="flex flex-col gap-3 border-b border-md3-outline-variant/10 bg-md3-surface-container-low px-4 py-3 sm:flex-row sm:items-center sm:gap-4 sm:px-6 sm:py-2">
      <div className="relative w-full sm:w-auto">
        <label htmlFor="dashboard-region-filter" className="sr-only">
          {content.regionFilterLabel}
        </label>
        <select
          id="dashboard-region-filter"
          value={selectedRegion}
          onChange={(event) => onRegionChange(event.target.value)}
          className="h-11 w-full appearance-none rounded-lg border-none bg-md3-surface-container pe-10 ps-4 font-[family-name:var(--font-label)] text-xs uppercase tracking-[0.16em] text-md3-on-surface focus:ring-1 focus:ring-md3-primary sm:w-auto sm:min-w-40 sm:py-2 sm:text-[10px] sm:tracking-widest"
        >
          <option value={ALL_REGIONS_FILTER_VALUE}>{content.regionFilterAll}</option>
          {availableRegions.map((region) => (
            <option key={region} value={region}>
              {region}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute top-1/2 end-3 h-4 w-4 -translate-y-1/2 text-md3-outline sm:end-2 sm:h-3.5 sm:w-3.5" />
      </div>

      <div className="relative flex-1">
        <label htmlFor="dashboard-location-search" className="sr-only">
          {content.locationSearchLabel}
        </label>
        <Search className="pointer-events-none absolute top-1/2 start-3 h-3.5 w-3.5 -translate-y-1/2 text-md3-outline" />
        <input
          id="dashboard-location-search"
          type="search"
          value={locationSearchQuery}
          onChange={(event) => onLocationSearchChange(event.target.value)}
          placeholder={content.locationSearchPlaceholder}
          className="h-11 w-full rounded-lg border-none bg-md3-surface-container pe-4 ps-10 font-[family-name:var(--font-label)] text-xs uppercase tracking-[0.16em] text-md3-on-surface placeholder:text-md3-outline focus:bg-md3-surface-container-high focus:ring-1 focus:ring-md3-primary sm:py-2 sm:text-[10px] sm:tracking-widest"
        />
      </div>
    </div>
  );
}

export type { FilterBarContent };
