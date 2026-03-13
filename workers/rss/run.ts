import { loadEnvConfig } from "@next/env";
import Parser from "rss-parser";
import { z } from "zod";
import { canonicalizeUrl } from "../../src/lib/ingestion/dedupe";
import { sourceSchema } from "../../src/lib/schemas/source";
import { createSupabaseAdminClient } from "../../src/lib/supabase/admin";
import { normalizeRssItem } from "./normalize";

loadEnvConfig(process.cwd());

const supabase = createSupabaseAdminClient();

const rssSourceSchema = sourceSchema.extend({
  source_type: z.literal("rss_news"),
  feed_url: z.string().url(),
});

type RssSource = z.infer<typeof rssSourceSchema>;

const parser = new Parser();

function formatError(error: unknown): string {
  if (error instanceof Error) {
    return error.message.slice(0, 2000);
  }

  return "Unknown ingestion failure";
}

async function startRun(sourceId: string) {
  const { data, error } = await supabase
    .from("ingestion_runs")
    .insert({
      source_id: sourceId,
      job_type: "rss_news",
      status: "started",
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(`Could not create ingestion run row: ${error?.message ?? "unknown error"}`);
  }

  return data.id as string;
}

async function completeRun(input: {
  runId: string;
  status: "success" | "failed";
  itemsFetched: number;
  itemsInserted: number;
  errorMessage?: string;
}) {
  const { error } = await supabase
    .from("ingestion_runs")
    .update({
      status: input.status,
      finished_at: new Date().toISOString(),
      items_fetched: input.itemsFetched,
      items_inserted: input.itemsInserted,
      error_message: input.errorMessage ?? null,
    })
    .eq("id", input.runId);

  if (error) {
    throw new Error(`Could not update ingestion run row: ${error.message}`);
  }
}

async function fetchRssSourceState(): Promise<{
  activeSources: RssSource[];
  inactiveCount: number;
  invalidCount: number;
  totalRows: number;
}> {
  const { data, error } = await supabase
    .from("sources")
    .select("id, name, slug, source_type, base_url, feed_url, is_active, priority, created_at")
    .eq("source_type", "rss_news")
    .not("feed_url", "is", null)
    .order("priority", { ascending: true });

  if (error) {
    throw new Error(`Failed to load RSS sources: ${error.message}`);
  }

  const validSources: RssSource[] = [];
  let invalidCount = 0;

  for (const source of data ?? []) {
    const parsed = rssSourceSchema.safeParse(source);

    if (!parsed.success) {
      invalidCount += 1;
      continue;
    }

    validSources.push(parsed.data);
  }

  const activeSources = validSources.filter((source) => source.is_active);

  return {
    activeSources,
    inactiveCount: validSources.length - activeSources.length,
    invalidCount,
    totalRows: (data ?? []).length,
  };
}

async function fetchFeedXml(feedUrl: string): Promise<string> {
  const response = await fetch(feedUrl, {
    headers: {
      Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9, */*;q=0.8",
      "User-Agent": "magen-rss-worker/0.1 (+https://magen.local)",
    },
    signal: AbortSignal.timeout(20000),
  });

  if (!response.ok) {
    throw new Error(`Feed request failed (${response.status})`);
  }

  return response.text();
}

async function ingestSource(source: RssSource): Promise<{
  fetched: number;
  normalized: number;
  dedupedInRun: number;
  inserted: number;
}> {
  const runId = await startRun(source.id);

  let fetched = 0;
  let inserted = 0;

  try {
    const xml = await fetchFeedXml(source.feed_url);
    const feed = await parser.parseString(xml);
    const rawItems = Array.isArray(feed.items) ? feed.items : [];

    fetched = rawItems.length;

    const seenUrls = new Set<string>();
    const inserts = [];
    let normalizedCount = 0;
    let dedupedInRun = 0;

    for (const rawItem of rawItems) {
      const normalizedItem = normalizeRssItem({
        sourceId: source.id,
        sourceSlug: source.slug,
        rawItem,
      });

      if (!normalizedItem) {
        continue;
      }

      normalizedCount += 1;

      const dedupeUrl = canonicalizeUrl(normalizedItem.url);

      if (!dedupeUrl || seenUrls.has(dedupeUrl)) {
        dedupedInRun += 1;
        continue;
      }

      seenUrls.add(dedupeUrl);
      inserts.push(normalizedItem);
    }

    if (inserts.length > 0) {
      const { data, error } = await supabase
        .from("news_items")
        .upsert(inserts, {
          onConflict: "url",
          ignoreDuplicates: true,
        })
        .select("id");

      if (error) {
        throw new Error(`Failed to write news items: ${error.message}`);
      }

      inserted = data?.length ?? 0;
    }

    await completeRun({
      runId,
      status: "success",
      itemsFetched: fetched,
      itemsInserted: inserted,
    });

    return { fetched, normalized: normalizedCount, dedupedInRun, inserted };
  } catch (error) {
    await completeRun({
      runId,
      status: "failed",
      itemsFetched: fetched,
      itemsInserted: inserted,
      errorMessage: formatError(error),
    });

    throw error;
  }
}

async function main() {
  const state = await fetchRssSourceState();
  const sources = state.activeSources;

  if (sources.length === 0) {
    if (state.totalRows === 0) {
      console.log("No RSS sources found in DB. Apply seed migration `supabase/migrations/0002_seed_sources.sql`.");
      return;
    }

    console.log(
      `No active RSS sources found. rss_rows=${state.totalRows} inactive=${state.inactiveCount} invalid=${state.invalidCount}`,
    );
    return;
  }

  if (state.invalidCount > 0) {
    console.warn(`Skipped ${state.invalidCount} RSS source rows due to schema validation issues.`);
  }

  let totalFetched = 0;
  let totalInserted = 0;
  let failedSources = 0;

  for (const source of sources) {
    try {
      const result = await ingestSource(source);
      totalFetched += result.fetched;
      totalInserted += result.inserted;
      const alreadyExisting = Math.max(result.normalized - result.dedupedInRun - result.inserted, 0);
      console.log(
        `Source ${source.slug}: fetched ${result.fetched}, normalized ${result.normalized}, inserted ${result.inserted}, deduped_in_run ${result.dedupedInRun}, already_existing ${alreadyExisting}`,
      );
    } catch (error) {
      failedSources += 1;
      console.error(`Source ${source.slug}: ${formatError(error)}`);
    }
  }

  console.log(
    `RSS ingestion finished. sources=${sources.length} failed=${failedSources} fetched=${totalFetched} inserted=${totalInserted}`,
  );

  if (failedSources > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(`RSS worker failed before processing sources: ${formatError(error)}`);
  process.exit(1);
});
