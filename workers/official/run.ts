import { loadEnvConfig } from "@next/env";
import { z } from "zod";
import { sourceSchema } from "../../src/lib/schemas/source";
import { createSupabaseAdminClient } from "../../src/lib/supabase/admin";
import { extractRawGuidanceItems, parseOfficialGuidanceBody } from "./extract";
import { normalizeOfficialUpdateItem } from "./normalize";

loadEnvConfig(process.cwd());

const supabase = createSupabaseAdminClient();

const officialGuidanceSourceSchema = sourceSchema.extend({
  source_type: z.literal("official_guidance"),
});

const configuredOfficialGuidanceSourceSchema = officialGuidanceSourceSchema.extend({
  feed_url: z.string().url(),
});

type OfficialGuidanceSource = z.infer<typeof configuredOfficialGuidanceSourceSchema>;

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
      job_type: "official_guidance",
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

async function fetchOfficialGuidanceSourceState(): Promise<{
  activeSources: OfficialGuidanceSource[];
  inactiveCount: number;
  invalidCount: number;
  activeMisconfiguredCount: number;
  totalRows: number;
}> {
  const { data, error } = await supabase
    .from("sources")
    .select("id, name, slug, source_type, base_url, feed_url, is_active, priority, created_at")
    .eq("source_type", "official_guidance")
    .order("priority", { ascending: true });

  if (error) {
    throw new Error(`Failed to load official guidance sources: ${error.message}`);
  }

  const validRows: z.infer<typeof officialGuidanceSourceSchema>[] = [];
  let invalidCount = 0;

  for (const source of data ?? []) {
    const parsed = officialGuidanceSourceSchema.safeParse(source);

    if (!parsed.success) {
      invalidCount += 1;
      continue;
    }

    validRows.push(parsed.data);
  }

  const activeRows = validRows.filter((source) => source.is_active);
  const activeSources: OfficialGuidanceSource[] = [];
  let activeMisconfiguredCount = 0;

  for (const source of activeRows) {
    const configured = configuredOfficialGuidanceSourceSchema.safeParse(source);

    if (!configured.success) {
      activeMisconfiguredCount += 1;
      continue;
    }

    activeSources.push(configured.data);
  }

  return {
    activeSources,
    inactiveCount: validRows.length - activeRows.length,
    invalidCount,
    activeMisconfiguredCount,
    totalRows: (data ?? []).length,
  };
}

async function fetchOfficialGuidancePayload(feedUrl: string): Promise<unknown> {
  const response = await fetch(feedUrl, {
    headers: {
      Accept: "application/json, application/*+json, text/plain;q=0.9, */*;q=0.8",
      "User-Agent": "magen-official-worker/0.1 (+https://magen.local)",
    },
    signal: AbortSignal.timeout(20000),
  });

  if (!response.ok) {
    throw new Error(`Official guidance request failed (${response.status})`);
  }

  const bodyText = await response.text();

  return parseOfficialGuidanceBody(bodyText);
}

async function ingestSource(source: OfficialGuidanceSource): Promise<{
  fetched: number;
  normalized: number;
  dedupedInRun: number;
  inserted: number;
}> {
  const runId = await startRun(source.id);

  let fetched = 0;
  let inserted = 0;

  try {
    const payload = await fetchOfficialGuidancePayload(source.feed_url);
    const rawItems = extractRawGuidanceItems(payload);

    fetched = rawItems.length;

    const seenExternalIds = new Set<string>();
    const inserts = [];
    let normalizedCount = 0;
    let dedupedInRun = 0;

    for (const rawItem of rawItems) {
      const normalizedItem = normalizeOfficialUpdateItem({
        sourceId: source.id,
        sourceSlug: source.slug,
        rawItem,
      });

      if (!normalizedItem || !normalizedItem.external_id) {
        continue;
      }

      normalizedCount += 1;

      if (seenExternalIds.has(normalizedItem.external_id)) {
        dedupedInRun += 1;
        continue;
      }

      seenExternalIds.add(normalizedItem.external_id);
      inserts.push(normalizedItem);
    }

    if (inserts.length > 0) {
      const { data, error } = await supabase
        .from("official_updates")
        .upsert(inserts, {
          onConflict: "source_id,external_id",
          ignoreDuplicates: true,
        })
        .select("id");

      if (error) {
        throw new Error(`Failed to write official updates: ${error.message}`);
      }

      inserted = data?.length ?? 0;
    }

    await completeRun({
      runId,
      status: "success",
      itemsFetched: fetched,
      itemsInserted: inserted,
    });

    return {
      fetched,
      normalized: normalizedCount,
      dedupedInRun,
      inserted,
    };
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
  const state = await fetchOfficialGuidanceSourceState();
  const sources = state.activeSources;

  if (sources.length === 0) {
    if (state.totalRows === 0) {
      console.log(
        "No official guidance sources found in DB. Apply seed migration `supabase/migrations/0002_seed_sources.sql`.",
      );
      return;
    }

    console.log(
      `No active configured official guidance sources found. rows=${state.totalRows} inactive=${state.inactiveCount} invalid=${state.invalidCount} active_misconfigured=${state.activeMisconfiguredCount}`,
    );
    console.log(
      "Activate the Oref guidance source by applying `supabase/migrations/0004_activate_oref_guidance_source.sql` (or update `sources.feed_url` + `is_active` manually).",
    );
    return;
  }

  if (state.invalidCount > 0) {
    console.warn(`Skipped ${state.invalidCount} official guidance source rows due to schema validation issues.`);
  }

  if (state.activeMisconfiguredCount > 0) {
    console.warn(
      `Skipped ${state.activeMisconfiguredCount} active official guidance sources because feed_url is missing or invalid.`,
    );
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
    `Official guidance ingestion finished. sources=${sources.length} failed=${failedSources} fetched=${totalFetched} inserted=${totalInserted}`,
  );

  if (failedSources > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(`Official guidance worker failed before processing sources: ${formatError(error)}`);
  process.exit(1);
});
