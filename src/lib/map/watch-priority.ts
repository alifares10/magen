import type { MapAlertMarker, WatchedLocationMarker } from "@/lib/schemas/map";

type AlertSeverity = MapAlertMarker["severity"];

const severityWeight: Record<AlertSeverity, number> = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

export type PrioritizedWatchedLocation = {
  location: WatchedLocationMarker;
  matchedAlertCount: number;
  highestSeverity: AlertSeverity | null;
  nearestAlertDistanceKm: number | null;
  rank: number | null;
};

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}

function calculateDistanceInKilometers(
  latitudeA: number,
  longitudeA: number,
  latitudeB: number,
  longitudeB: number,
): number {
  const earthRadiusKm = 6371;
  const latitudeDeltaRadians = toRadians(latitudeB - latitudeA);
  const longitudeDeltaRadians = toRadians(longitudeB - longitudeA);
  const latitudeARadians = toRadians(latitudeA);
  const latitudeBRadians = toRadians(latitudeB);

  const haversineValue =
    Math.sin(latitudeDeltaRadians / 2) * Math.sin(latitudeDeltaRadians / 2) +
    Math.cos(latitudeARadians) *
      Math.cos(latitudeBRadians) *
      Math.sin(longitudeDeltaRadians / 2) *
      Math.sin(longitudeDeltaRadians / 2);

  const centralAngle = 2 * Math.atan2(Math.sqrt(haversineValue), Math.sqrt(1 - haversineValue));

  return earthRadiusKm * centralAngle;
}

function compareByPriority(
  left: Omit<PrioritizedWatchedLocation, "rank">,
  right: Omit<PrioritizedWatchedLocation, "rank">,
): number {
  const leftHasMatches = left.matchedAlertCount > 0;
  const rightHasMatches = right.matchedAlertCount > 0;

  if (leftHasMatches !== rightHasMatches) {
    return leftHasMatches ? -1 : 1;
  }

  const leftSeverityWeight = left.highestSeverity ? severityWeight[left.highestSeverity] : 0;
  const rightSeverityWeight = right.highestSeverity ? severityWeight[right.highestSeverity] : 0;

  if (leftSeverityWeight !== rightSeverityWeight) {
    return rightSeverityWeight - leftSeverityWeight;
  }

  if (left.matchedAlertCount !== right.matchedAlertCount) {
    return right.matchedAlertCount - left.matchedAlertCount;
  }

  const leftNearestDistance = left.nearestAlertDistanceKm ?? Number.POSITIVE_INFINITY;
  const rightNearestDistance = right.nearestAlertDistanceKm ?? Number.POSITIVE_INFINITY;

  if (leftNearestDistance !== rightNearestDistance) {
    return leftNearestDistance - rightNearestDistance;
  }

  return left.location.name.localeCompare(right.location.name);
}

export function getPrioritizedWatchedLocations(
  watchedLocations: WatchedLocationMarker[],
  alertMarkers: MapAlertMarker[],
): PrioritizedWatchedLocation[] {
  const prioritizedWithoutRanks: Omit<PrioritizedWatchedLocation, "rank">[] = watchedLocations.map(
    (location) => {
      let matchedAlertCount = 0;
      let highestSeverity: AlertSeverity | null = null;
      let nearestAlertDistanceKm = Number.POSITIVE_INFINITY;

      for (const alertMarker of alertMarkers) {
        const distanceInKilometers = calculateDistanceInKilometers(
          location.latitude,
          location.longitude,
          alertMarker.latitude,
          alertMarker.longitude,
        );

        if (distanceInKilometers > location.radiusKm) {
          continue;
        }

        matchedAlertCount += 1;
        if (
          !highestSeverity ||
          severityWeight[alertMarker.severity] > severityWeight[highestSeverity]
        ) {
          highestSeverity = alertMarker.severity;
        }

        if (distanceInKilometers < nearestAlertDistanceKm) {
          nearestAlertDistanceKm = distanceInKilometers;
        }
      }

      return {
        location,
        matchedAlertCount,
        highestSeverity,
        nearestAlertDistanceKm:
          nearestAlertDistanceKm === Number.POSITIVE_INFINITY ? null : nearestAlertDistanceKm,
      };
    },
  );

  prioritizedWithoutRanks.sort(compareByPriority);

  let currentRank = 1;

  return prioritizedWithoutRanks.map((item) => {
    if (item.matchedAlertCount === 0) {
      return {
        ...item,
        rank: null,
      };
    }

    const rankedItem: PrioritizedWatchedLocation = {
      ...item,
      rank: currentRank,
    };

    currentRank += 1;
    return rankedItem;
  });
}
