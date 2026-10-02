"use client";

import { useState } from "react";
import { PlusCircle } from "lucide-react";
import type { AppLocale } from "@/i18n/routing";
import {
  getSelectedMapPlaceDisplayName,
  getSelectedMapPlaceDisplayRegion,
  getWatchedLocationDisplayArea,
  getWatchedLocationDisplayName,
} from "@/lib/map/location-labels";
import type { PrioritizedWatchedLocation } from "@/lib/map/watch-priority";
import type { SelectedMapPlace } from "@/lib/schemas/map-places";
import type { WatchedLocationMarker } from "@/lib/schemas/map";
import { Button } from "@/components/ui/button";

type MapWatchlistManagerContent = {
  title: string;
  addLabel: string;
  activeAlertBadge: string;
  emptyBody: string;
  removeActionLabel: string;
  watchRadiusLabel: string;
  watchlistPriorityLabel: string;
  watchlistTopPriorityLabel: string;
  watchlistNearbyAlertsLabel: string;
  addFormTitle: string;
  addFormNameLabel: string;
  addFormLatitudeLabel: string;
  addFormLongitudeLabel: string;
  addFormCityLabel: string;
  addFormRegionLabel: string;
  saveActionLabel: string;
  cancelActionLabel: string;
  nameRequiredError: string;
  latitudeInvalidError: string;
  longitudeInvalidError: string;
  radiusInvalidError: string;
  pickPlaceLabel: string;
  cancelPlacePickingLabel: string;
  placePickerHint: string;
  selectedPlaceLabel: string;
  addSelectedPlaceLabel: string;
};

type MapWatchlistManagerProps = {
  locale: AppLocale;
  content: MapWatchlistManagerContent;
  watchedLocations: WatchedLocationMarker[];
  prioritizedWatchedLocations: PrioritizedWatchedLocation[];
  isPickingPlace: boolean;
  selectedPlace: SelectedMapPlace | null;
  onStartPlacePicking: () => void;
  onCancelPlacePicking: () => void;
  onAddWatchedLocation: (location: Omit<WatchedLocationMarker, "id"> & { id?: string }) => void;
  onRemoveWatchedLocation: (id: string) => void;
};

type WatchlistFormField = "name" | "latitude" | "longitude" | "radiusKm";

type WatchlistFormState = {
  name: string;
  latitude: string;
  longitude: string;
  radiusKm: string;
  city: string;
  region: string;
};

const defaultFormState: WatchlistFormState = {
  name: "",
  latitude: "",
  longitude: "",
  radiusKm: "15",
  city: "",
  region: "",
};

function parseCoordinate(value: string): number | null {
  const normalizedValue = value.trim();

  if (!/^[+-]?(?:\d+(?:[.,]\d*)?|[.,]\d+)$/.test(normalizedValue)) {
    return null;
  }

  const parsedValue = Number(normalizedValue.replace(",", "."));

  return Number.isFinite(parsedValue) ? parsedValue : null;
}

export function MapWatchlistManager({
  locale,
  content,
  watchedLocations,
  prioritizedWatchedLocations,
  isPickingPlace,
  selectedPlace,
  onStartPlacePicking,
  onCancelPlacePicking,
  onAddWatchedLocation,
  onRemoveWatchedLocation,
}: MapWatchlistManagerProps) {
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [formState, setFormState] = useState(defaultFormState);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<WatchlistFormField, string>>>({});
  const [selectedPlaceRadiusDraft, setSelectedPlaceRadiusDraft] = useState<{
    placeId: string;
    value: string;
  } | null>(null);
  const [selectedPlaceRadiusErrorDraft, setSelectedPlaceRadiusErrorDraft] = useState<{
    placeId: string;
    value: string;
  } | null>(null);

  const selectedPlaceRadiusKm =
    selectedPlace && selectedPlaceRadiusDraft?.placeId === selectedPlace.id
      ? selectedPlaceRadiusDraft.value
      : "15";
  const selectedPlaceRadiusError =
    selectedPlace && selectedPlaceRadiusErrorDraft?.placeId === selectedPlace.id
      ? selectedPlaceRadiusErrorDraft.value
      : null;

  const resetForm = () => {
    setFormState(defaultFormState);
    setFieldErrors({});
    setIsAddFormOpen(false);
  };

  const resetSelectedPlaceDraft = () => {
    setSelectedPlaceRadiusDraft(null);
    setSelectedPlaceRadiusErrorDraft(null);
  };

  const handleStartPlacePicking = () => {
    resetSelectedPlaceDraft();
    onStartPlacePicking();
  };

  const handleCancelPlacePicking = () => {
    resetSelectedPlaceDraft();
    onCancelPlacePicking();
  };

  const handleFieldChange = (field: keyof WatchlistFormState, value: string) => {
    setFormState((currentValue) => ({
      ...currentValue,
      [field]: value,
    }));

    if (field in fieldErrors) {
      setFieldErrors((currentValue) => {
        const nextErrors = { ...currentValue };
        delete nextErrors[field as WatchlistFormField];
        return nextErrors;
      });
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors: Partial<Record<WatchlistFormField, string>> = {};
    const latitude = parseCoordinate(formState.latitude);
    const longitude = parseCoordinate(formState.longitude);
    const radiusKm = parseCoordinate(formState.radiusKm);

    if (formState.name.trim().length === 0) {
      nextErrors.name = content.nameRequiredError;
    }

    if (latitude === null || latitude < -90 || latitude > 90) {
      nextErrors.latitude = content.latitudeInvalidError;
    }

    if (longitude === null || longitude < -180 || longitude > 180) {
      nextErrors.longitude = content.longitudeInvalidError;
    }

    if (radiusKm === null || radiusKm <= 0) {
      nextErrors.radiusKm = content.radiusInvalidError;
    }

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      return;
    }

    onAddWatchedLocation({
      name: formState.name.trim(),
      latitude: latitude!,
      longitude: longitude!,
      radiusKm: radiusKm!,
      country: "IL",
      city: formState.city.trim() || null,
      region: formState.region.trim() || null,
    });
    resetForm();
  };

  const handleSelectedPlaceSave = () => {
    if (!selectedPlace) {
      return;
    }

    const radiusKm = parseCoordinate(selectedPlaceRadiusKm);

    if (radiusKm === null || radiusKm <= 0) {
      setSelectedPlaceRadiusErrorDraft({
        placeId: selectedPlace.id,
        value: content.radiusInvalidError,
      });
      return;
    }

    onAddWatchedLocation({
      name: selectedPlace.nameEn,
      nameEn: selectedPlace.nameEn,
      nameHe: selectedPlace.nameHe,
      longitude: selectedPlace.longitude,
      latitude: selectedPlace.latitude,
      radiusKm,
      country: "IL",
      city: selectedPlace.nameEn,
      cityEn: selectedPlace.nameEn,
      cityHe: selectedPlace.nameHe,
      region: selectedPlace.regionEn,
      regionEn: selectedPlace.regionEn,
      regionHe: selectedPlace.regionHe,
    });
    handleCancelPlacePicking();
  };

  return (
    <section className="hidden w-72 rounded-lg bg-md3-surface-container-low/90 backdrop-blur-sm md:block">
      {/* Header */}
      <div className="flex items-center justify-between p-3 pb-2">
        <h2 className="font-[family-name:var(--font-label)] text-[10px] font-bold uppercase tracking-[0.2em] text-md3-on-surface-variant">
          {content.title}
        </h2>
        <div className="flex items-center gap-1.5">
          {!isAddFormOpen ? (
            <button
              type="button"
            className="flex items-center gap-1 rounded-md bg-md3-primary/15 px-2 py-1 text-md3-primary transition-colors hover:bg-md3-primary/25"
            onClick={() => {
              handleCancelPlacePicking();
              setIsAddFormOpen(true);
            }}
          >
              <PlusCircle className="h-3.5 w-3.5" />
              <span className="font-[family-name:var(--font-label)] text-[10px] font-bold uppercase tracking-widest">
                {content.addLabel}
              </span>
            </button>
          ) : null}

          <Button
            type="button"
            size="sm"
            variant={isPickingPlace || selectedPlace ? "secondary" : "outline"}
            className="h-7 px-2 text-[10px] uppercase tracking-[0.16em]"
            onClick={() => {
              if (isPickingPlace || selectedPlace) {
                handleCancelPlacePicking();
                return;
              }

              resetForm();
              handleStartPlacePicking();
            }}
          >
            {isPickingPlace || selectedPlace
              ? content.cancelPlacePickingLabel
              : content.pickPlaceLabel}
          </Button>
        </div>
      </div>

      {isPickingPlace || selectedPlace ? (
        <div className="space-y-3 border-b border-md3-outline-variant/10 px-3 pb-3">
          {selectedPlace ? (
            <>
              <div>
                <p className="font-[family-name:var(--font-label)] text-[10px] font-bold uppercase tracking-[0.16em] text-md3-on-surface-variant">
                  {content.selectedPlaceLabel}
                </p>
                <p className="mt-1 text-sm font-semibold text-md3-on-surface">
                  {getSelectedMapPlaceDisplayName(selectedPlace, locale)}
                </p>
                <p className="text-xs text-md3-on-surface-variant">
                  {getSelectedMapPlaceDisplayRegion(selectedPlace, locale)}
                </p>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="selected-place-radius"
                  className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-md3-on-surface-variant"
                >
                  {content.watchRadiusLabel}
                </label>
                <input
                  id="selected-place-radius"
                  type="text"
                  inputMode="decimal"
                  value={selectedPlaceRadiusKm}
                  onChange={(event) => {
                    setSelectedPlaceRadiusDraft({
                      placeId: selectedPlace.id,
                      value: event.target.value,
                    });
                    setSelectedPlaceRadiusErrorDraft(null);
                  }}
                  className="h-10 w-full rounded-md border border-md3-outline-variant/20 bg-md3-surface-container px-3 text-sm text-md3-on-surface outline-none transition-colors placeholder:text-md3-outline focus:border-md3-primary"
                  aria-invalid={selectedPlaceRadiusError ? true : undefined}
                  aria-describedby={selectedPlaceRadiusError ? "selected-place-radius-error" : undefined}
                />
                {selectedPlaceRadiusError ? (
                  <p id="selected-place-radius-error" className="text-xs text-md3-error">
                    {selectedPlaceRadiusError}
                  </p>
                ) : null}
              </div>

              <div className="flex items-center justify-end gap-2">
                <Button type="button" size="sm" variant="ghost" onClick={handleCancelPlacePicking}>
                  {content.cancelActionLabel}
                </Button>
                <Button type="button" size="sm" onClick={handleSelectedPlaceSave}>
                  {content.addSelectedPlaceLabel}
                </Button>
              </div>
            </>
          ) : (
            <p className="text-xs text-md3-on-surface-variant">{content.placePickerHint}</p>
          )}
        </div>
      ) : null}

      {isAddFormOpen ? (
        <form className="space-y-3 border-b border-md3-outline-variant/10 px-3 pb-3" onSubmit={handleSubmit}>
          <div>
            <p className="font-[family-name:var(--font-label)] text-[10px] font-bold uppercase tracking-[0.16em] text-md3-on-surface-variant">
              {content.addFormTitle}
            </p>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="watchlist-name"
              className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-md3-on-surface-variant"
            >
              {content.addFormNameLabel}
            </label>
            <input
              id="watchlist-name"
              type="text"
              value={formState.name}
              onChange={(event) => {
                handleFieldChange("name", event.target.value);
              }}
              className="h-10 w-full rounded-md border border-md3-outline-variant/20 bg-md3-surface-container px-3 text-sm text-md3-on-surface outline-none transition-colors placeholder:text-md3-outline focus:border-md3-primary"
              aria-invalid={fieldErrors.name ? true : undefined}
              aria-describedby={fieldErrors.name ? "watchlist-name-error" : undefined}
            />
            {fieldErrors.name ? (
              <p id="watchlist-name-error" className="text-xs text-md3-error">
                {fieldErrors.name}
              </p>
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <label
                htmlFor="watchlist-latitude"
                className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-md3-on-surface-variant"
              >
                {content.addFormLatitudeLabel}
              </label>
              <input
                id="watchlist-latitude"
                type="text"
                inputMode="decimal"
                value={formState.latitude}
                onChange={(event) => {
                  handleFieldChange("latitude", event.target.value);
                }}
                className="h-10 w-full rounded-md border border-md3-outline-variant/20 bg-md3-surface-container px-3 text-sm text-md3-on-surface outline-none transition-colors placeholder:text-md3-outline focus:border-md3-primary"
                aria-invalid={fieldErrors.latitude ? true : undefined}
                aria-describedby={fieldErrors.latitude ? "watchlist-latitude-error" : undefined}
              />
              {fieldErrors.latitude ? (
                <p id="watchlist-latitude-error" className="text-xs text-md3-error">
                  {fieldErrors.latitude}
                </p>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="watchlist-longitude"
                className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-md3-on-surface-variant"
              >
                {content.addFormLongitudeLabel}
              </label>
              <input
                id="watchlist-longitude"
                type="text"
                inputMode="decimal"
                value={formState.longitude}
                onChange={(event) => {
                  handleFieldChange("longitude", event.target.value);
                }}
                className="h-10 w-full rounded-md border border-md3-outline-variant/20 bg-md3-surface-container px-3 text-sm text-md3-on-surface outline-none transition-colors placeholder:text-md3-outline focus:border-md3-primary"
                aria-invalid={fieldErrors.longitude ? true : undefined}
                aria-describedby={fieldErrors.longitude ? "watchlist-longitude-error" : undefined}
              />
              {fieldErrors.longitude ? (
                <p id="watchlist-longitude-error" className="text-xs text-md3-error">
                  {fieldErrors.longitude}
                </p>
              ) : null}
            </div>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="watchlist-radius"
              className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-md3-on-surface-variant"
            >
              {content.watchRadiusLabel}
            </label>
            <input
              id="watchlist-radius"
              type="text"
              inputMode="decimal"
              value={formState.radiusKm}
              onChange={(event) => {
                handleFieldChange("radiusKm", event.target.value);
              }}
              className="h-10 w-full rounded-md border border-md3-outline-variant/20 bg-md3-surface-container px-3 text-sm text-md3-on-surface outline-none transition-colors placeholder:text-md3-outline focus:border-md3-primary"
              aria-invalid={fieldErrors.radiusKm ? true : undefined}
              aria-describedby={fieldErrors.radiusKm ? "watchlist-radius-error" : undefined}
            />
            {fieldErrors.radiusKm ? (
              <p id="watchlist-radius-error" className="text-xs text-md3-error">
                {fieldErrors.radiusKm}
              </p>
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <label
                htmlFor="watchlist-city"
                className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-md3-on-surface-variant"
              >
                {content.addFormCityLabel}
              </label>
              <input
                id="watchlist-city"
                type="text"
                value={formState.city}
                onChange={(event) => {
                  handleFieldChange("city", event.target.value);
                }}
                className="h-10 w-full rounded-md border border-md3-outline-variant/20 bg-md3-surface-container px-3 text-sm text-md3-on-surface outline-none transition-colors placeholder:text-md3-outline focus:border-md3-primary"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="watchlist-region"
                className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-md3-on-surface-variant"
              >
                {content.addFormRegionLabel}
              </label>
              <input
                id="watchlist-region"
                type="text"
                value={formState.region}
                onChange={(event) => {
                  handleFieldChange("region", event.target.value);
                }}
                className="h-10 w-full rounded-md border border-md3-outline-variant/20 bg-md3-surface-container px-3 text-sm text-md3-on-surface outline-none transition-colors placeholder:text-md3-outline focus:border-md3-primary"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button type="button" size="sm" variant="ghost" onClick={resetForm}>
              {content.cancelActionLabel}
            </Button>
            <Button type="submit" size="sm">
              {content.saveActionLabel}
            </Button>
          </div>
        </form>
      ) : null}

      {/* Location cards */}
      <div className="max-h-[calc(100vh-10rem)] space-y-1.5 overflow-y-auto px-3 pb-3">
        {watchedLocations.length === 0 ? (
          <p className="px-1 py-4 text-center text-xs text-md3-outline">
            {content.emptyBody}
          </p>
        ) : (
          prioritizedWatchedLocations.map((item) => (
            <div
              key={item.location.id}
              className={`rounded-md p-3 transition-colors ${
                item.matchedAlertCount > 0
                  ? "bg-md3-surface-container-high"
                  : "bg-md3-surface-container"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-md3-on-surface">
                    {getWatchedLocationDisplayName(item.location, locale)}
                  </p>
                  <p className="text-xs text-md3-on-surface-variant">
                    {getWatchedLocationDisplayArea(item.location, locale)}
                  </p>
                </div>
                <button
                  type="button"
                  aria-label={`${content.removeActionLabel} ${getWatchedLocationDisplayName(item.location, locale)}`}
                  className="shrink-0 rounded px-1.5 py-0.5 text-[10px] text-md3-outline transition-colors hover:text-md3-on-surface"
                  onClick={() => {
                    onRemoveWatchedLocation(item.location.id);
                  }}
                >
                  {content.removeActionLabel}
                </button>
              </div>

              {item.matchedAlertCount > 0 ? (
                <div className="mt-2 flex items-center gap-2">
                  <span className="rounded bg-md3-error-container px-1.5 py-0.5 font-[family-name:var(--font-label)] text-[10px] font-bold uppercase tracking-wider text-md3-error">
                    {content.activeAlertBadge}
                  </span>
                </div>
              ) : null}

              {item.rank ? (
                <p className="mt-1 text-[10px] text-md3-on-surface-variant">
                  {item.rank === 1
                    ? content.watchlistTopPriorityLabel
                    : `${content.watchlistPriorityLabel} #${item.rank}`}
                  {" \u00B7 "}
                  {item.matchedAlertCount} {content.watchlistNearbyAlertsLabel}
                </p>
              ) : null}
            </div>
          ))
        )}
      </div>
    </section>
  );
}

export type { MapWatchlistManagerContent };
