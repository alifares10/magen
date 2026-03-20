"use client";

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
    <div className="flex items-center gap-2 border-b border-[var(--border-panel)] bg-[var(--surface-raised)] px-4 py-2">
      <label htmlFor="dashboard-region-filter" className="sr-only">
        {content.regionFilterLabel}
      </label>
      <select
        id="dashboard-region-filter"
        value={selectedRegion}
        onChange={(event) => onRegionChange(event.target.value)}
        className="h-7 rounded border border-slate-600/60 bg-transparent px-2 text-xs text-slate-300 dark:border-slate-600/60 dark:text-slate-300"
      >
        <option value={ALL_REGIONS_FILTER_VALUE}>{content.regionFilterAll}</option>
        {availableRegions.map((region) => (
          <option key={region} value={region}>
            {region}
          </option>
        ))}
      </select>

      <label htmlFor="dashboard-location-search" className="sr-only">
        {content.locationSearchLabel}
      </label>
      <input
        id="dashboard-location-search"
        type="search"
        value={locationSearchQuery}
        onChange={(event) => onLocationSearchChange(event.target.value)}
        placeholder={content.locationSearchPlaceholder}
        className="h-7 w-48 rounded border border-slate-600/60 bg-transparent px-2 text-xs text-slate-300 placeholder:text-slate-500 dark:border-slate-600/60 dark:text-slate-300 dark:placeholder:text-slate-500"
      />
    </div>
  );
}

export type { FilterBarContent };
