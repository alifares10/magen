import type { AppLocale } from "@/i18n/routing";
import type { SelectedMapPlace } from "@/lib/schemas/map-places";
import type { WatchedLocationMarker } from "@/lib/schemas/map";

function pickLocalizedValue(
  locale: AppLocale,
  values: {
    hebrew?: string | null;
    english?: string | null;
    fallback?: string | null;
  },
): string {
  if (locale === "he") {
    return values.hebrew ?? values.english ?? values.fallback ?? "";
  }

  return values.english ?? values.hebrew ?? values.fallback ?? "";
}

export function getWatchedLocationDisplayName(
  location: WatchedLocationMarker,
  locale: AppLocale,
): string {
  return pickLocalizedValue(locale, {
    hebrew: location.nameHe,
    english: location.nameEn,
    fallback: location.name,
  });
}

export function getWatchedLocationDisplayArea(
  location: WatchedLocationMarker,
  locale: AppLocale,
): string {
  return pickLocalizedValue(locale, {
    hebrew: location.cityHe ?? location.regionHe,
    english: location.cityEn ?? location.regionEn,
    fallback: location.city ?? location.region ?? location.country,
  });
}

export function getSelectedMapPlaceDisplayName(
  place: SelectedMapPlace,
  locale: AppLocale,
): string {
  return pickLocalizedValue(locale, {
    hebrew: place.nameHe,
    english: place.nameEn,
  });
}

export function getSelectedMapPlaceDisplayRegion(
  place: SelectedMapPlace,
  locale: AppLocale,
): string {
  return pickLocalizedValue(locale, {
    hebrew: place.regionHe,
    english: place.regionEn,
  });
}
