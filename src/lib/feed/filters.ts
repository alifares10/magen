import type {
  AlertFeedItem,
  NewsFeedItem,
  OfficialUpdateFeedItem,
  SourceHealthStatus,
} from "@/lib/schemas/feed";

export const ALL_REGIONS_FILTER_VALUE = "__all_regions__";

export type TickerItem = {
  id: string;
  type: "alert" | "official" | "news";
  title: string;
  sourceName: string | null;
  severity: string | null;
  region: string | null;
  locationName: string | null;
  isBreaking: boolean;
};

export function normalizeFilterText(value: string): string {
  return value.trim().toLowerCase();
}

export function matchesRegionFilter(
  region: string | null,
  selectedRegion: string,
): boolean {
  if (selectedRegion === ALL_REGIONS_FILTER_VALUE) {
    return true;
  }

  if (!region) {
    return false;
  }

  return normalizeFilterText(region) === normalizeFilterText(selectedRegion);
}

export function matchesSearchFilter(
  searchQuery: string,
  values: Array<string | null | undefined>,
): boolean {
  if (!searchQuery) {
    return true;
  }

  return values.some((value) => {
    if (!value) {
      return false;
    }

    return normalizeFilterText(value).includes(searchQuery);
  });
}

export function matchesAlertFilters(
  item: AlertFeedItem,
  selectedRegion: string,
  searchQuery: string,
): boolean {
  return (
    matchesRegionFilter(item.region, selectedRegion) &&
    matchesSearchFilter(searchQuery, [
      item.title,
      item.message,
      item.sourceName,
      item.locationName,
      item.city,
      item.region,
    ])
  );
}

export function matchesNewsFilters(
  item: NewsFeedItem,
  selectedRegion: string,
  searchQuery: string,
): boolean {
  return (
    matchesRegionFilter(item.region, selectedRegion) &&
    matchesSearchFilter(searchQuery, [
      item.title,
      item.summary,
      item.sourceName,
      item.region,
    ])
  );
}

export function matchesOfficialFilters(
  item: OfficialUpdateFeedItem,
  selectedRegion: string,
  searchQuery: string,
): boolean {
  return (
    matchesRegionFilter(item.region, selectedRegion) &&
    matchesSearchFilter(searchQuery, [
      item.title,
      item.body,
      item.sourceName,
      item.region,
    ])
  );
}

export function getSourceHealthStatusClasses(status: SourceHealthStatus): string {
  if (status === "healthy") {
    return "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800/65 dark:bg-emerald-950/55 dark:text-emerald-100";
  }

  if (status === "degraded") {
    return "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-800/65 dark:bg-amber-950/55 dark:text-amber-100";
  }

  if (status === "down") {
    return "border-rose-300 bg-rose-50 text-rose-800 dark:border-rose-800/65 dark:bg-rose-950/55 dark:text-rose-100";
  }

  return "border-zinc-300 bg-zinc-100 text-zinc-700 dark:border-slate-600/80 dark:bg-slate-800/80 dark:text-slate-200";
}

export function getTickerItemTypeClasses(itemType: TickerItem["type"]): string {
  if (itemType === "alert") {
    return "border-rose-300 bg-rose-100 text-rose-900 dark:border-rose-800/70 dark:bg-rose-950/55 dark:text-rose-100";
  }

  if (itemType === "official") {
    return "border-sky-300 bg-sky-100 text-sky-900 dark:border-sky-800/70 dark:bg-sky-950/55 dark:text-sky-100";
  }

  return "border-zinc-300 bg-zinc-100 text-zinc-900 dark:border-slate-700/80 dark:bg-slate-800/85 dark:text-slate-100";
}
