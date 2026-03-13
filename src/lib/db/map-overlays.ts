import { z } from "zod";
import { getMapOverlayFixtures } from "@/lib/map/overlay-fixtures";
import {
  hospitalOverlaySchema,
  mapOverlayFixturesSchema,
  roadClosureOverlaySchema,
  shelterOverlaySchema,
  type HospitalOverlay,
  type MapOverlayFixtures,
  type RoadClosureOverlay,
  type ShelterOverlay,
} from "@/lib/schemas/map-overlays";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const rawCoordinateSchema = z.tuple([
  z.number().gte(-180).lte(180),
  z.number().gte(-90).lte(90),
]);

const rawShelterRowSchema = z.object({
  id: z.string().uuid(),
  external_id: z.string().min(1),
  name: z.string().min(1),
  status: z.enum(["open", "limited", "closed"]),
  region: z.string().nullable(),
  city: z.string().nullable(),
  lat: z.number(),
  lng: z.number(),
  last_updated_at: z.string().datetime({ offset: true }),
});

const rawRoadClosureRowSchema = z.object({
  id: z.string().uuid(),
  external_id: z.string().min(1),
  name: z.string().min(1),
  status: z.enum(["active", "partial", "cleared"]),
  reason: z.string().nullable(),
  coordinates: z.unknown(),
  last_updated_at: z.string().datetime({ offset: true }),
});

const rawHospitalRowSchema = z.object({
  id: z.string().uuid(),
  external_id: z.string().min(1),
  name: z.string().min(1),
  status: z.enum(["open", "limited", "closed"]),
  has_emergency_room: z.boolean(),
  region: z.string().nullable(),
  city: z.string().nullable(),
  lat: z.number(),
  lng: z.number(),
  last_updated_at: z.string().datetime({ offset: true }),
});

function createEmptyOverlays(): MapOverlayFixtures {
  return {
    shelters: [],
    roadClosures: [],
    hospitals: [],
  };
}

export function mapShelterRowsToOverlays(rows: unknown[]): ShelterOverlay[] {
  const overlays: ShelterOverlay[] = [];

  for (const row of rows) {
    const parsedRow = rawShelterRowSchema.safeParse(row);

    if (!parsedRow.success) {
      continue;
    }

    const parsedOverlay = shelterOverlaySchema.safeParse({
      id: parsedRow.data.external_id,
      name: parsedRow.data.name,
      longitude: parsedRow.data.lng,
      latitude: parsedRow.data.lat,
      status: parsedRow.data.status,
      region: parsedRow.data.region,
      city: parsedRow.data.city,
      lastUpdatedAt: parsedRow.data.last_updated_at,
    });

    if (parsedOverlay.success) {
      overlays.push(parsedOverlay.data);
    }
  }

  return overlays;
}

export function mapRoadClosureRowsToOverlays(rows: unknown[]): RoadClosureOverlay[] {
  const overlays: RoadClosureOverlay[] = [];

  for (const row of rows) {
    const parsedRow = rawRoadClosureRowSchema.safeParse(row);

    if (!parsedRow.success) {
      continue;
    }

    const parsedCoordinates = z.array(rawCoordinateSchema).min(2).safeParse(parsedRow.data.coordinates);

    if (!parsedCoordinates.success) {
      continue;
    }

    const parsedOverlay = roadClosureOverlaySchema.safeParse({
      id: parsedRow.data.external_id,
      name: parsedRow.data.name,
      status: parsedRow.data.status,
      reason: parsedRow.data.reason,
      coordinates: parsedCoordinates.data,
      lastUpdatedAt: parsedRow.data.last_updated_at,
    });

    if (parsedOverlay.success) {
      overlays.push(parsedOverlay.data);
    }
  }

  return overlays;
}

export function mapHospitalRowsToOverlays(rows: unknown[]): HospitalOverlay[] {
  const overlays: HospitalOverlay[] = [];

  for (const row of rows) {
    const parsedRow = rawHospitalRowSchema.safeParse(row);

    if (!parsedRow.success) {
      continue;
    }

    const parsedOverlay = hospitalOverlaySchema.safeParse({
      id: parsedRow.data.external_id,
      name: parsedRow.data.name,
      longitude: parsedRow.data.lng,
      latitude: parsedRow.data.lat,
      status: parsedRow.data.status,
      hasEmergencyRoom: parsedRow.data.has_emergency_room,
      region: parsedRow.data.region,
      city: parsedRow.data.city,
      lastUpdatedAt: parsedRow.data.last_updated_at,
    });

    if (parsedOverlay.success) {
      overlays.push(parsedOverlay.data);
    }
  }

  return overlays;
}

export function hasMapOverlayData(overlays: MapOverlayFixtures): boolean {
  return (
    overlays.shelters.length > 0 ||
    overlays.roadClosures.length > 0 ||
    overlays.hospitals.length > 0
  );
}

export async function getMapOverlaysFromDatabase(limit = 500): Promise<{
  overlays: MapOverlayFixtures;
  hadError: boolean;
}> {
  const supabase = await createSupabaseServerClient();

  const [shelterResult, roadClosureResult, hospitalResult] = await Promise.all([
    supabase
      .from("shelters")
      .select("id, external_id, name, status, region, city, lat, lng, last_updated_at")
      .order("last_updated_at", { ascending: false })
      .limit(limit),
    supabase
      .from("road_closures")
      .select("id, external_id, name, status, reason, coordinates, last_updated_at")
      .order("last_updated_at", { ascending: false })
      .limit(limit),
    supabase
      .from("hospitals")
      .select("id, external_id, name, status, has_emergency_room, region, city, lat, lng, last_updated_at")
      .order("last_updated_at", { ascending: false })
      .limit(limit),
  ]);

  const hadError = Boolean(shelterResult.error || roadClosureResult.error || hospitalResult.error);

  const parsedOverlays = mapOverlayFixturesSchema.safeParse({
    shelters: mapShelterRowsToOverlays(shelterResult.data ?? []),
    roadClosures: mapRoadClosureRowsToOverlays(roadClosureResult.data ?? []),
    hospitals: mapHospitalRowsToOverlays(hospitalResult.data ?? []),
  });

  if (!parsedOverlays.success) {
    return {
      overlays: createEmptyOverlays(),
      hadError: true,
    };
  }

  return {
    overlays: parsedOverlays.data,
    hadError,
  };
}

export async function getMapOverlays(): Promise<MapOverlayFixtures> {
  const { overlays, hadError } = await getMapOverlaysFromDatabase();

  if (hasMapOverlayData(overlays)) {
    return overlays;
  }

  if (!hadError || process.env.NODE_ENV !== "production") {
    return getMapOverlayFixtures();
  }

  return createEmptyOverlays();
}
