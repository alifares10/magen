import { z } from "zod";

export const mapPlaceTypeSchema = z.enum(["city", "town", "locality"]);

export const mapPlaceFeaturePropertiesSchema = z.object({
  id: z.string().min(1),
  nameEn: z.string().min(1),
  nameHe: z.string().min(1),
  regionEn: z.string().min(1),
  regionHe: z.string().min(1),
  type: mapPlaceTypeSchema,
});

export const selectedMapPlaceSchema = mapPlaceFeaturePropertiesSchema.extend({
  longitude: z.number().gte(-180).lte(180),
  latitude: z.number().gte(-90).lte(90),
});

export type MapPlaceFeatureProperties = z.infer<typeof mapPlaceFeaturePropertiesSchema>;
export type SelectedMapPlace = z.infer<typeof selectedMapPlaceSchema>;
