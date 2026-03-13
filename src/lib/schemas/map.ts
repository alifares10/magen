import { z } from "zod";

export const severitySchema = z.enum(["low", "medium", "high", "critical"]);

export const mapAlertMarkerSchema = z.object({
  id: z.string().uuid(),
  sourceId: z.string().uuid(),
  sourceName: z.string().min(1),
  title: z.string().min(1),
  message: z.string().nullable(),
  alertType: z.string().min(1),
  severity: severitySchema,
  status: z.string().min(1),
  region: z.string().nullable(),
  city: z.string().nullable(),
  locationName: z.string().nullable(),
  longitude: z.number().gte(-180).lte(180),
  latitude: z.number().gte(-90).lte(90),
  publishedAt: z.string().datetime({ offset: true }),
});

export const watchedLocationMarkerSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  longitude: z.number().gte(-180).lte(180),
  latitude: z.number().gte(-90).lte(90),
  radiusKm: z.number().positive(),
  country: z.string().length(2),
  region: z.string().nullable(),
  city: z.string().nullable(),
});

export type MapAlertMarker = z.infer<typeof mapAlertMarkerSchema>;
export type WatchedLocationMarker = z.infer<typeof watchedLocationMarkerSchema>;
