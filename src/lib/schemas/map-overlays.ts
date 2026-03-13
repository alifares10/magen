import { z } from "zod";

const mapCoordinateSchema = z.tuple([
  z.number().gte(-180).lte(180),
  z.number().gte(-90).lte(90),
]);

const overlayPointStatusSchema = z.enum(["open", "limited", "closed"]);

export const shelterOverlaySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  longitude: z.number().gte(-180).lte(180),
  latitude: z.number().gte(-90).lte(90),
  status: overlayPointStatusSchema,
  region: z.string().nullable(),
  city: z.string().nullable(),
  lastUpdatedAt: z.string().datetime({ offset: true }),
});

export const hospitalOverlaySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  longitude: z.number().gte(-180).lte(180),
  latitude: z.number().gte(-90).lte(90),
  status: overlayPointStatusSchema,
  hasEmergencyRoom: z.boolean(),
  region: z.string().nullable(),
  city: z.string().nullable(),
  lastUpdatedAt: z.string().datetime({ offset: true }),
});

const roadClosureStatusSchema = z.enum(["active", "partial", "cleared"]);

export const roadClosureOverlaySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  status: roadClosureStatusSchema,
  reason: z.string().nullable(),
  coordinates: z.array(mapCoordinateSchema).min(2),
  lastUpdatedAt: z.string().datetime({ offset: true }),
});

export const mapOverlayFixturesSchema = z.object({
  shelters: z.array(shelterOverlaySchema),
  roadClosures: z.array(roadClosureOverlaySchema),
  hospitals: z.array(hospitalOverlaySchema),
});

export type ShelterOverlay = z.infer<typeof shelterOverlaySchema>;
export type RoadClosureOverlay = z.infer<typeof roadClosureOverlaySchema>;
export type HospitalOverlay = z.infer<typeof hospitalOverlaySchema>;
export type MapOverlayFixtures = z.infer<typeof mapOverlayFixturesSchema>;
