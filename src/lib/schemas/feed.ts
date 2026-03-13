import { z } from "zod";

const severitySchema = z.enum(["low", "medium", "high", "critical"]);
const liveStreamPlatformSchema = z.enum(["youtube", "other"]);
const isoDateTimeSchema = z.string().datetime({ offset: true });
const sourceHealthStatusSchema = z.enum(["healthy", "degraded", "down", "unknown"]);
const sourceHealthTypeSchema = z.enum([
  "official_alerts",
  "official_guidance",
  "rss_news",
]);

export const alertFeedItemSchema = z.object({
  id: z.string().uuid(),
  sourceId: z.string().uuid(),
  sourceName: z.string().min(1),
  title: z.string().min(1),
  message: z.string().nullable(),
  alertType: z.string().min(1),
  severity: severitySchema,
  status: z.string().min(1),
  country: z.string().length(2),
  region: z.string().nullable(),
  city: z.string().nullable(),
  locationName: z.string().nullable(),
  latitude: z.number().gte(-90).lte(90).nullable(),
  longitude: z.number().gte(-180).lte(180).nullable(),
  publishedAt: isoDateTimeSchema,
});

export const newsFeedItemSchema = z.object({
  id: z.string().uuid(),
  sourceId: z.string().uuid(),
  sourceName: z.string().min(1),
  title: z.string().min(1),
  summary: z.string().nullable(),
  url: z.string().url(),
  author: z.string().nullable(),
  topic: z.string().nullable(),
  region: z.string().nullable(),
  country: z.string().length(2),
  language: z.string().nullable(),
  severity: severitySchema.nullable(),
  imageUrl: z.string().url().nullable(),
  isBreaking: z.boolean(),
  publishedAt: isoDateTimeSchema,
});

export const officialUpdateFeedItemSchema = z.object({
  id: z.string().uuid(),
  sourceId: z.string().uuid(),
  sourceName: z.string().min(1),
  title: z.string().min(1),
  body: z.string().min(1),
  updateType: z.string().min(1),
  severity: severitySchema.nullable(),
  country: z.string().length(2),
  region: z.string().nullable(),
  isActive: z.boolean(),
  publishedAt: isoDateTimeSchema,
});

export const liveStreamOverviewItemSchema = z.object({
  id: z.string().uuid(),
  sourceId: z.string().uuid().nullable(),
  sourceName: z.string().min(1).nullable(),
  title: z.string().min(1),
  description: z.string().nullable(),
  platform: liveStreamPlatformSchema,
  embedUrl: z.string().url(),
  watchUrl: z.string().url().nullable(),
  region: z.string().nullable(),
  country: z.string().length(2),
  sortOrder: z.number().int(),
});

export const watchedLocationMatchSchema = z.object({
  locationName: z.string().min(1),
  alertCount: z.number().int().nonnegative(),
});

export const dashboardOverviewSchema = z.object({
  latestAlert: alertFeedItemSchema.nullable(),
  latestOfficialUpdate: officialUpdateFeedItemSchema.nullable(),
  topNews: z.array(newsFeedItemSchema),
  activeStreams: z.array(liveStreamOverviewItemSchema),
  watchedLocationMatches: z.array(watchedLocationMatchSchema),
});

export const sourceHealthItemSchema = z.object({
  sourceType: sourceHealthTypeSchema,
  status: sourceHealthStatusSchema,
  activeSourceCount: z.number().int().nonnegative(),
  healthySourceCount: z.number().int().nonnegative(),
  failingSourceCount: z.number().int().nonnegative(),
  staleSourceCount: z.number().int().nonnegative(),
  missingRunSourceCount: z.number().int().nonnegative(),
  lastRunAt: isoDateTimeSchema.nullable(),
  lastError: z.string().nullable(),
});

export const sourceHealthOverviewSchema = z.object({
  overallStatus: sourceHealthStatusSchema,
  updatedAt: isoDateTimeSchema,
  categories: z.array(sourceHealthItemSchema),
});

export type AlertFeedItem = z.infer<typeof alertFeedItemSchema>;
export type NewsFeedItem = z.infer<typeof newsFeedItemSchema>;
export type OfficialUpdateFeedItem = z.infer<typeof officialUpdateFeedItemSchema>;
export type LiveStreamOverviewItem = z.infer<typeof liveStreamOverviewItemSchema>;
export type WatchedLocationMatch = z.infer<typeof watchedLocationMatchSchema>;
export type DashboardOverview = z.infer<typeof dashboardOverviewSchema>;
export type SourceHealthStatus = z.infer<typeof sourceHealthStatusSchema>;
export type SourceHealthType = z.infer<typeof sourceHealthTypeSchema>;
export type SourceHealthItem = z.infer<typeof sourceHealthItemSchema>;
export type SourceHealthOverview = z.infer<typeof sourceHealthOverviewSchema>;
