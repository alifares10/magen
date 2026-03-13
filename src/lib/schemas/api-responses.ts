import { z } from "zod";
import {
  alertFeedItemSchema,
  dashboardOverviewSchema,
  liveStreamOverviewItemSchema,
  newsFeedItemSchema,
  officialUpdateFeedItemSchema,
  sourceHealthOverviewSchema,
} from "@/lib/schemas/feed";
import { watchedLocationMarkerSchema } from "@/lib/schemas/map";

const apiErrorSchema = z.object({
  error: z.string().min(1),
});

const paginationMetaSchema = z.object({
  count: z.number().int().nonnegative(),
  limit: z.number().int().positive(),
});

export const dashboardOverviewApiResponseSchema = z.object({
  data: dashboardOverviewSchema,
  meta: z.object({
    newsLimit: z.number().int().positive(),
    streamLimit: z.number().int().positive(),
    watchedLocationsCount: z.number().int().nonnegative().optional(),
  }),
});

export const dashboardOverviewRequestWatchedLocationSchema =
  watchedLocationMarkerSchema.pick({
    name: true,
    latitude: true,
    longitude: true,
    radiusKm: true,
    country: true,
    region: true,
    city: true,
  });

export const dashboardOverviewRequestBodySchema = z.object({
  watchedLocations: z
    .array(dashboardOverviewRequestWatchedLocationSchema)
    .max(100)
    .default([]),
});

export const alertsApiResponseSchema = z.object({
  data: z.array(alertFeedItemSchema),
  meta: paginationMetaSchema,
});

export const newsApiResponseSchema = z.object({
  data: z.array(newsFeedItemSchema),
  meta: paginationMetaSchema,
});

export const officialUpdatesApiResponseSchema = z.object({
  data: z.array(officialUpdateFeedItemSchema),
  meta: paginationMetaSchema.extend({
    activeOnly: z.boolean(),
  }),
});

export const liveStreamsApiResponseSchema = z.object({
  data: z.array(liveStreamOverviewItemSchema),
  meta: paginationMetaSchema,
});

export const sourceHealthApiResponseSchema = z.object({
  data: sourceHealthOverviewSchema,
  meta: z.object({
    pollIntervalMs: z.number().int().positive(),
  }),
});

export type DashboardOverviewApiResponse = z.infer<
  typeof dashboardOverviewApiResponseSchema
>;
export type AlertsApiResponse = z.infer<typeof alertsApiResponseSchema>;
export type NewsApiResponse = z.infer<typeof newsApiResponseSchema>;
export type OfficialUpdatesApiResponse = z.infer<
  typeof officialUpdatesApiResponseSchema
>;
export type LiveStreamsApiResponse = z.infer<typeof liveStreamsApiResponseSchema>;
export type SourceHealthApiResponse = z.infer<typeof sourceHealthApiResponseSchema>;
export type DashboardOverviewRequestBody = z.infer<
  typeof dashboardOverviewRequestBodySchema
>;
export type DashboardOverviewRequestWatchedLocation = z.infer<
  typeof dashboardOverviewRequestWatchedLocationSchema
>;
export type ApiErrorResponse = z.infer<typeof apiErrorSchema>;

export { apiErrorSchema };
