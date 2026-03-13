import { z } from "zod";
import {
  alertFeedItemSchema,
  dashboardOverviewSchema,
  liveStreamOverviewItemSchema,
  newsFeedItemSchema,
  officialUpdateFeedItemSchema,
  sourceHealthItemSchema,
  sourceHealthOverviewSchema,
  type AlertFeedItem,
  type DashboardOverview,
  type LiveStreamOverviewItem,
  type NewsFeedItem,
  type OfficialUpdateFeedItem,
  type SourceHealthItem,
  type SourceHealthOverview,
  type SourceHealthType,
  type WatchedLocationMatch,
  watchedLocationMatchSchema,
} from "@/lib/schemas/feed";
import type { DashboardOverviewRequestWatchedLocation } from "@/lib/schemas/api-responses";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const sourceNameSchema = z.object({
  name: z.string().min(1),
});

const sourceRelationSchema = z.union([sourceNameSchema, z.array(sourceNameSchema)]).nullable();

const rawAlertFeedRowSchema = z.object({
  id: z.string().uuid(),
  source_id: z.string().uuid(),
  title: z.string().min(1),
  message: z.string().nullable(),
  alert_type: z.string().min(1),
  severity: z.enum(["low", "medium", "high", "critical"]),
  status: z.string().min(1),
  country: z.string().length(2),
  region: z.string().nullable(),
  city: z.string().nullable(),
  location_name: z.string().nullable(),
  lat: z.number().nullable(),
  lng: z.number().nullable(),
  published_at: z.string().datetime({ offset: true }),
  sources: sourceRelationSchema,
});

const rawNewsFeedRowSchema = z.object({
  id: z.string().uuid(),
  source_id: z.string().uuid(),
  title: z.string().min(1),
  summary: z.string().nullable(),
  url: z.string().min(1),
  author: z.string().nullable(),
  topic: z.string().nullable(),
  region: z.string().nullable(),
  country: z.string().length(2),
  language: z.string().nullable(),
  severity: z.enum(["low", "medium", "high", "critical"]).nullable(),
  image_url: z.string().nullable(),
  is_breaking: z.boolean(),
  published_at: z.string().datetime({ offset: true }),
  sources: sourceRelationSchema,
});

const rawOfficialUpdateFeedRowSchema = z.object({
  id: z.string().uuid(),
  source_id: z.string().uuid(),
  title: z.string().min(1),
  body: z.string().min(1),
  update_type: z.string().min(1),
  severity: z.enum(["low", "medium", "high", "critical"]).nullable(),
  country: z.string().length(2),
  region: z.string().nullable(),
  is_active: z.boolean(),
  published_at: z.string().datetime({ offset: true }),
  sources: sourceRelationSchema,
});

const rawLiveStreamRowSchema = z.object({
  id: z.string().uuid(),
  source_id: z.string().uuid().nullable(),
  title: z.string().min(1),
  description: z.string().nullable(),
  platform: z.enum(["youtube", "other"]),
  embed_url: z.string().min(1),
  watch_url: z.string().nullable(),
  region: z.string().nullable(),
  country: z.string().length(2),
  sort_order: z.number().int(),
  sources: sourceRelationSchema,
});

const activeAlertLocationRowSchema = z.object({
  id: z.string().uuid(),
  lat: z.number(),
  lng: z.number(),
  location_name: z.string().nullable(),
  city: z.string().nullable(),
  region: z.string().nullable(),
  country: z.string().length(2),
});

const sourceHealthSourceRowSchema = z.object({
  id: z.string().uuid(),
  source_type: z.enum(["official_alerts", "official_guidance", "rss_news"]),
  is_active: z.boolean(),
});

const sourceHealthRunRowSchema = z.object({
  source_id: z.string().uuid().nullable(),
  job_type: z.string().min(1),
  status: z.enum(["started", "success", "failed"]),
  started_at: z.string().datetime({ offset: true }),
  finished_at: z.string().datetime({ offset: true }).nullable(),
  error_message: z.string().nullable(),
});

const monitoredSourceTypes: SourceHealthType[] = [
  "official_alerts",
  "official_guidance",
  "rss_news",
];

const sourceHealthJobTypeBySourceType: Record<SourceHealthType, string> = {
  official_alerts: "official_alerts",
  official_guidance: "official_guidance",
  rss_news: "rss_news",
};

const staleThresholdBySourceTypeMs: Record<SourceHealthType, number> = {
  official_alerts: 5 * 60 * 1000,
  official_guidance: 10 * 60 * 1000,
  rss_news: 15 * 60 * 1000,
};

type SourceHealthSource = {
  id: string;
  sourceType: SourceHealthType;
};

type SourceHealthRun = {
  sourceId: string;
  jobType: string;
  status: "started" | "success" | "failed";
  startedAt: string;
  finishedAt: string | null;
  errorMessage: string | null;
};

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}

export function calculateDistanceInKilometers(
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

  const centralAngle =
    2 * Math.atan2(Math.sqrt(haversineValue), Math.sqrt(1 - haversineValue));

  return earthRadiusKm * centralAngle;
}

export function computeWatchedLocationMatches(
  watchedLocations: DashboardOverviewRequestWatchedLocation[],
  activeAlertRows: unknown[],
): WatchedLocationMatch[] {
  if (watchedLocations.length === 0) {
    return [];
  }

  const validAlertRows = activeAlertRows
    .map((row) => activeAlertLocationRowSchema.safeParse(row))
    .filter((parsedRow) => parsedRow.success)
    .map((parsedRow) => parsedRow.data);

  const matches: WatchedLocationMatch[] = [];

  for (const location of watchedLocations) {
    let alertCount = 0;

    for (const alertRow of validAlertRows) {
      const distanceInKilometers = calculateDistanceInKilometers(
        location.latitude,
        location.longitude,
        alertRow.lat,
        alertRow.lng,
      );

      if (distanceInKilometers <= location.radiusKm) {
        alertCount += 1;
      }
    }

    if (alertCount === 0) {
      continue;
    }

    const parsedMatch = watchedLocationMatchSchema.safeParse({
      locationName: location.name,
      alertCount,
    });

    if (parsedMatch.success) {
      matches.push(parsedMatch.data);
    }
  }

  return matches.sort((left, right) => {
    if (left.alertCount !== right.alertCount) {
      return right.alertCount - left.alertCount;
    }

    return left.locationName.localeCompare(right.locationName);
  });
}

async function getWatchedLocationMatches(
  watchedLocations: DashboardOverviewRequestWatchedLocation[],
): Promise<WatchedLocationMatch[]> {
  if (watchedLocations.length === 0) {
    return [];
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("alerts")
    .select("id, lat, lng, location_name, city, region, country")
    .eq("status", "active")
    .not("lat", "is", null)
    .not("lng", "is", null)
    .order("published_at", { ascending: false })
    .limit(500);

  if (error || !data) {
    return [];
  }

  return computeWatchedLocationMatches(watchedLocations, data);
}

function getSourceName(sourceField: z.infer<typeof sourceRelationSchema>): string | null {
  if (!sourceField) {
    return null;
  }

  if (Array.isArray(sourceField)) {
    return sourceField[0]?.name ?? null;
  }

  return sourceField.name;
}

export function mapAlertRowsToFeedItems(rows: unknown[]): AlertFeedItem[] {
  const items: AlertFeedItem[] = [];

  for (const row of rows) {
    const parsedRow = rawAlertFeedRowSchema.safeParse(row);

    if (!parsedRow.success) {
      continue;
    }

    const sourceName = getSourceName(parsedRow.data.sources);

    if (!sourceName) {
      continue;
    }

    const parsedItem = alertFeedItemSchema.safeParse({
      id: parsedRow.data.id,
      sourceId: parsedRow.data.source_id,
      sourceName,
      title: parsedRow.data.title,
      message: parsedRow.data.message,
      alertType: parsedRow.data.alert_type,
      severity: parsedRow.data.severity,
      status: parsedRow.data.status,
      country: parsedRow.data.country,
      region: parsedRow.data.region,
      city: parsedRow.data.city,
      locationName: parsedRow.data.location_name,
      latitude: parsedRow.data.lat,
      longitude: parsedRow.data.lng,
      publishedAt: parsedRow.data.published_at,
    });

    if (parsedItem.success) {
      items.push(parsedItem.data);
    }
  }

  return items;
}

export function mapNewsRowsToFeedItems(rows: unknown[]): NewsFeedItem[] {
  const items: NewsFeedItem[] = [];

  for (const row of rows) {
    const parsedRow = rawNewsFeedRowSchema.safeParse(row);

    if (!parsedRow.success) {
      continue;
    }

    const sourceName = getSourceName(parsedRow.data.sources);

    if (!sourceName) {
      continue;
    }

    const parsedItem = newsFeedItemSchema.safeParse({
      id: parsedRow.data.id,
      sourceId: parsedRow.data.source_id,
      sourceName,
      title: parsedRow.data.title,
      summary: parsedRow.data.summary,
      url: parsedRow.data.url,
      author: parsedRow.data.author,
      topic: parsedRow.data.topic,
      region: parsedRow.data.region,
      country: parsedRow.data.country,
      language: parsedRow.data.language,
      severity: parsedRow.data.severity,
      imageUrl: parsedRow.data.image_url,
      isBreaking: parsedRow.data.is_breaking,
      publishedAt: parsedRow.data.published_at,
    });

    if (parsedItem.success) {
      items.push(parsedItem.data);
    }
  }

  return items;
}

export function mapOfficialUpdateRowsToFeedItems(rows: unknown[]): OfficialUpdateFeedItem[] {
  const items: OfficialUpdateFeedItem[] = [];

  for (const row of rows) {
    const parsedRow = rawOfficialUpdateFeedRowSchema.safeParse(row);

    if (!parsedRow.success) {
      continue;
    }

    const sourceName = getSourceName(parsedRow.data.sources);

    if (!sourceName) {
      continue;
    }

    const parsedItem = officialUpdateFeedItemSchema.safeParse({
      id: parsedRow.data.id,
      sourceId: parsedRow.data.source_id,
      sourceName,
      title: parsedRow.data.title,
      body: parsedRow.data.body,
      updateType: parsedRow.data.update_type,
      severity: parsedRow.data.severity,
      country: parsedRow.data.country,
      region: parsedRow.data.region,
      isActive: parsedRow.data.is_active,
      publishedAt: parsedRow.data.published_at,
    });

    if (parsedItem.success) {
      items.push(parsedItem.data);
    }
  }

  return items;
}

export function mapLiveStreamRowsToOverviewItems(rows: unknown[]): LiveStreamOverviewItem[] {
  const items: LiveStreamOverviewItem[] = [];

  for (const row of rows) {
    const parsedRow = rawLiveStreamRowSchema.safeParse(row);

    if (!parsedRow.success) {
      continue;
    }

    const parsedItem = liveStreamOverviewItemSchema.safeParse({
      id: parsedRow.data.id,
      sourceId: parsedRow.data.source_id,
      sourceName: getSourceName(parsedRow.data.sources),
      title: parsedRow.data.title,
      description: parsedRow.data.description,
      platform: parsedRow.data.platform,
      embedUrl: parsedRow.data.embed_url,
      watchUrl: parsedRow.data.watch_url,
      region: parsedRow.data.region,
      country: parsedRow.data.country,
      sortOrder: parsedRow.data.sort_order,
    });

    if (parsedItem.success) {
      items.push(parsedItem.data);
    }
  }

  return items;
}

function getRunTimestamp(run: SourceHealthRun): number {
  const fallbackTimestamp = Date.parse(run.startedAt);

  if (!run.finishedAt) {
    return fallbackTimestamp;
  }

  const finishedTimestamp = Date.parse(run.finishedAt);

  return Number.isNaN(finishedTimestamp) ? fallbackTimestamp : finishedTimestamp;
}

export function buildSourceHealthOverview(input: {
  activeSources: SourceHealthSource[];
  ingestionRuns: SourceHealthRun[];
  now?: Date;
}): SourceHealthOverview {
  const nowMs = (input.now ?? new Date()).getTime();
  const sortedRuns = [...input.ingestionRuns].sort((left, right) => {
    return getRunTimestamp(right) - getRunTimestamp(left);
  });
  const latestRunsBySourceAndJob = new Map<string, SourceHealthRun>();

  for (const run of sortedRuns) {
    const key = `${run.sourceId}:${run.jobType}`;

    if (!latestRunsBySourceAndJob.has(key)) {
      latestRunsBySourceAndJob.set(key, run);
    }
  }

  const categories: SourceHealthItem[] = monitoredSourceTypes.map((sourceType) => {
    const expectedJobType = sourceHealthJobTypeBySourceType[sourceType];
    const sourcesForType = input.activeSources.filter(
      (source) => source.sourceType === sourceType,
    );

    let healthySourceCount = 0;
    let failingSourceCount = 0;
    let staleSourceCount = 0;
    let missingRunSourceCount = 0;
    let lastRunTimestamp: number | null = null;
    let lastError: string | null = null;

    for (const source of sourcesForType) {
      const run = latestRunsBySourceAndJob.get(`${source.id}:${expectedJobType}`);

      if (!run) {
        missingRunSourceCount += 1;
        continue;
      }

      const runTimestamp = getRunTimestamp(run);

      if (lastRunTimestamp === null || runTimestamp > lastRunTimestamp) {
        lastRunTimestamp = runTimestamp;
      }

      if (run.status === "success") {
        const staleThreshold = staleThresholdBySourceTypeMs[sourceType];
        const isFresh = nowMs - runTimestamp <= staleThreshold;

        if (isFresh) {
          healthySourceCount += 1;
        } else {
          staleSourceCount += 1;
        }

        continue;
      }

      failingSourceCount += 1;

      if (!lastError && run.errorMessage) {
        lastError = run.errorMessage;
      }
    }

    const activeSourceCount = sourcesForType.length;
    const status =
      activeSourceCount === 0 || missingRunSourceCount === activeSourceCount
        ? "unknown"
        : healthySourceCount === activeSourceCount
          ? "healthy"
          : healthySourceCount === 0
            ? "down"
            : "degraded";

    const parsedCategory = sourceHealthItemSchema.safeParse({
      sourceType,
      status,
      activeSourceCount,
      healthySourceCount,
      failingSourceCount,
      staleSourceCount,
      missingRunSourceCount,
      lastRunAt: lastRunTimestamp ? new Date(lastRunTimestamp).toISOString() : null,
      lastError,
    });

    if (!parsedCategory.success) {
      return {
        sourceType,
        status: "unknown",
        activeSourceCount,
        healthySourceCount: 0,
        failingSourceCount: 0,
        staleSourceCount: 0,
        missingRunSourceCount: activeSourceCount,
        lastRunAt: null,
        lastError: null,
      };
    }

    return parsedCategory.data;
  });

  const categoriesWithKnownStatus = categories.filter(
    (category) => category.activeSourceCount > 0 && category.status !== "unknown",
  );

  const overallStatus =
    categoriesWithKnownStatus.length === 0
      ? "unknown"
      : categoriesWithKnownStatus.every((category) => category.status === "healthy")
        ? "healthy"
        : categoriesWithKnownStatus.some((category) => category.status === "down")
          ? "down"
          : "degraded";

  const parsedOverview = sourceHealthOverviewSchema.safeParse({
    overallStatus,
    updatedAt: new Date(nowMs).toISOString(),
    categories,
  });

  if (!parsedOverview.success) {
    return {
      overallStatus: "unknown",
      updatedAt: new Date(nowMs).toISOString(),
      categories: [],
    };
  }

  return parsedOverview.data;
}

export async function getSourceHealthOverview(): Promise<SourceHealthOverview> {
  const supabase = await createSupabaseServerClient();
  const { data: sourceRows, error: sourcesError } = await supabase
    .from("sources")
    .select("id, source_type, is_active")
    .in("source_type", monitoredSourceTypes)
    .eq("is_active", true);

  if (sourcesError || !sourceRows) {
    return buildSourceHealthOverview({
      activeSources: [],
      ingestionRuns: [],
    });
  }

  const activeSources: SourceHealthSource[] = [];

  for (const row of sourceRows) {
    const parsedRow = sourceHealthSourceRowSchema.safeParse(row);

    if (!parsedRow.success) {
      continue;
    }

    activeSources.push({
      id: parsedRow.data.id,
      sourceType: parsedRow.data.source_type,
    });
  }

  if (activeSources.length === 0) {
    return buildSourceHealthOverview({
      activeSources: [],
      ingestionRuns: [],
    });
  }

  const sourceIds = activeSources.map((source) => source.id);
  const { data: runRows, error: runsError } = await supabase
    .from("ingestion_runs")
    .select("source_id, job_type, status, started_at, finished_at, error_message")
    .in("source_id", sourceIds)
    .order("started_at", { ascending: false })
    .limit(1000);

  if (runsError || !runRows) {
    return buildSourceHealthOverview({
      activeSources,
      ingestionRuns: [],
    });
  }

  const ingestionRuns: SourceHealthRun[] = [];

  for (const row of runRows) {
    const parsedRow = sourceHealthRunRowSchema.safeParse(row);

    if (!parsedRow.success || !parsedRow.data.source_id) {
      continue;
    }

    ingestionRuns.push({
      sourceId: parsedRow.data.source_id,
      jobType: parsedRow.data.job_type,
      status: parsedRow.data.status,
      startedAt: parsedRow.data.started_at,
      finishedAt: parsedRow.data.finished_at,
      errorMessage: parsedRow.data.error_message,
    });
  }

  return buildSourceHealthOverview({
    activeSources,
    ingestionRuns,
  });
}

type FeedQueryOptions = {
  limit?: number;
  activeOnly?: boolean;
};

export async function getAlertsFeed({ limit = 20, activeOnly = false }: FeedQueryOptions = {}): Promise<AlertFeedItem[]> {
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("alerts")
    .select(
      "id, source_id, title, message, alert_type, severity, status, country, region, city, location_name, lat, lng, published_at, sources(name)",
    )
    .order("published_at", { ascending: false })
    .limit(limit);

  if (activeOnly) {
    query = query.eq("status", "active");
  }

  const { data, error } = await query;

  if (error || !data) {
    return [];
  }

  return mapAlertRowsToFeedItems(data);
}

export async function getNewsFeed(limit = 20): Promise<NewsFeedItem[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("news_items")
    .select(
      "id, source_id, title, summary, url, author, topic, region, country, language, severity, image_url, is_breaking, published_at, sources(name)",
    )
    .order("published_at", { ascending: false })
    .limit(limit);

  if (error || !data) {
    return [];
  }

  return mapNewsRowsToFeedItems(data);
}

export async function getOfficialUpdatesFeed({
  limit = 20,
  activeOnly = true,
}: FeedQueryOptions = {}): Promise<OfficialUpdateFeedItem[]> {
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("official_updates")
    .select(
      "id, source_id, title, body, update_type, severity, country, region, is_active, published_at, sources(name)",
    )
    .order("published_at", { ascending: false })
    .limit(limit);

  if (activeOnly) {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query;

  if (error || !data) {
    return [];
  }

  return mapOfficialUpdateRowsToFeedItems(data);
}

export async function getActiveStreams(limit = 3): Promise<LiveStreamOverviewItem[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("live_streams")
    .select(
      "id, source_id, title, description, platform, embed_url, watch_url, region, country, sort_order, sources(name)",
    )
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) {
    return [];
  }

  return mapLiveStreamRowsToOverviewItems(data);
}

type DashboardOverviewOptions = {
  newsLimit?: number;
  streamLimit?: number;
  watchedLocations?: DashboardOverviewRequestWatchedLocation[];
};

export async function getDashboardOverview({
  newsLimit = 5,
  streamLimit = 3,
  watchedLocations = [],
}: DashboardOverviewOptions = {}): Promise<DashboardOverview> {
  const [latestAlerts, latestOfficialUpdates, topNews, activeStreams, watchedLocationMatches] = await Promise.all([
    getAlertsFeed({ limit: 1, activeOnly: true }),
    getOfficialUpdatesFeed({ limit: 1, activeOnly: true }),
    getNewsFeed(newsLimit),
    getActiveStreams(streamLimit),
    getWatchedLocationMatches(watchedLocations),
  ]);

  const parsedOverview = dashboardOverviewSchema.safeParse({
    latestAlert: latestAlerts[0] ?? null,
    latestOfficialUpdate: latestOfficialUpdates[0] ?? null,
    topNews,
    activeStreams,
    watchedLocationMatches,
  });

  if (!parsedOverview.success) {
    return {
      latestAlert: null,
      latestOfficialUpdate: null,
      topNews: [],
      activeStreams: [],
      watchedLocationMatches: [],
    };
  }

  return parsedOverview.data;
}
