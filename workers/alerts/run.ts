import { loadEnvConfig } from "@next/env";
import { z } from "zod";
import { sourceSchema } from "../../src/lib/schemas/source";
import { createSupabaseAdminClient } from "../../src/lib/supabase/admin";
import { extractRawAlertItems, parseOfficialAlertsBody } from "./extract";
import { normalizeOfficialAlertItem } from "./normalize";

loadEnvConfig(process.cwd());

const supabase = createSupabaseAdminClient();

const officialAlertsSourceSchema = sourceSchema.extend({
  source_type: z.literal("official_alerts"),
});

const configuredOfficialAlertsSourceSchema = officialAlertsSourceSchema.extend({
  feed_url: z.string().url(),
});

type OfficialAlertsSource = z.infer<typeof configuredOfficialAlertsSourceSchema>;

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
      job_type: "official_alerts",
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

async function fetchOfficialAlertsSourceState(): Promise<{
  activeSources: OfficialAlertsSource[];
  inactiveCount: number;
  invalidCount: number;
  activeMisconfiguredCount: number;
  totalRows: number;
}> {
  const { data, error } = await supabase
    .from("sources")
    .select("id, name, slug, source_type, base_url, feed_url, is_active, priority, created_at")
    .eq("source_type", "official_alerts")
    .order("priority", { ascending: true });

  if (error) {
    throw new Error(`Failed to load official alert sources: ${error.message}`);
  }

  const validRows: z.infer<typeof officialAlertsSourceSchema>[] = [];
  let invalidCount = 0;

  for (const source of data ?? []) {
    const parsed = officialAlertsSourceSchema.safeParse(source);

    if (!parsed.success) {
      invalidCount += 1;
      continue;
    }

    validRows.push(parsed.data);
  }

  const activeRows = validRows.filter((source) => source.is_active);
  const activeSources: OfficialAlertsSource[] = [];
  let activeMisconfiguredCount = 0;

  for (const source of activeRows) {
    const configured = configuredOfficialAlertsSourceSchema.safeParse(source);

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

async function fetchOfficialAlertsPayload(feedUrl: string): Promise<unknown> {
  const response = await fetch(feedUrl, {
    headers: {
      Accept: "application/json, application/*+json, text/plain;q=0.9, */*;q=0.8",
      "User-Agent": "magen-alerts-worker/0.1 (+https://magen.local)",
    },
    signal: AbortSignal.timeout(20000),
  });

  if (!response.ok) {
    throw new Error(`Official alerts request failed (${response.status})`);
  }

  const bodyText = await response.text();

  return parseOfficialAlertsBody(bodyText);
}

function chunkValues<T>(values: T[], chunkSize: number): T[][] {
  if (values.length === 0) {
    return [];
  }

  const chunks: T[][] = [];

  for (let index = 0; index < values.length; index += chunkSize) {
    chunks.push(values.slice(index, index + chunkSize));
  }

  return chunks;
}

async function reactivateCurrentAlerts(sourceId: string, externalIds: string[]): Promise<number> {
  if (externalIds.length === 0) {
    return 0;
  }

  let reactivated = 0;

  for (const chunk of chunkValues(externalIds, 200)) {
    const { data, error } = await supabase
      .from("alerts")
      .update({ status: "active" })
      .eq("source_id", sourceId)
      .in("external_id", chunk)
      .neq("status", "active")
      .select("id");

    if (error) {
      throw new Error(`Failed to reactivate current alerts: ${error.message}`);
    }

    reactivated += data?.length ?? 0;
  }

  return reactivated;
}

async function resolveStaleAlerts(sourceId: string, currentExternalIds: Set<string>): Promise<number> {
  const { data: activeRows, error: activeRowsError } = await supabase
    .from("alerts")
    .select("id, external_id")
    .eq("source_id", sourceId)
    .eq("status", "active");

  if (activeRowsError) {
    throw new Error(`Failed to load active alerts for snapshot reconciliation: ${activeRowsError.message}`);
  }

  const staleIds = (activeRows ?? [])
    .filter((row) => typeof row.external_id !== "string" || !currentExternalIds.has(row.external_id))
    .map((row) => row.id as string);

  if (staleIds.length === 0) {
    return 0;
  }

  let resolved = 0;

  for (const chunk of chunkValues(staleIds, 200)) {
    const { data, error } = await supabase
      .from("alerts")
      .update({ status: "resolved" })
      .in("id", chunk)
      .select("id");

    if (error) {
      throw new Error(`Failed to resolve stale alerts: ${error.message}`);
    }

    resolved += data?.length ?? 0;
  }

  return resolved;
}

async function reconcileSnapshot(input: { sourceId: string; currentExternalIds: Set<string> }): Promise<{
  reactivated: number;
  resolved: number;
}> {
  const externalIds = [...input.currentExternalIds];
  const reactivated = await reactivateCurrentAlerts(input.sourceId, externalIds);
  const resolved = await resolveStaleAlerts(input.sourceId, input.currentExternalIds);

  return {
    reactivated,
    resolved,
  };
}

async function ingestSource(source: OfficialAlertsSource): Promise<{
  fetched: number;
  normalized: number;
  dedupedInRun: number;
  inserted: number;
  reactivated: number;
  resolved: number;
}> {
  const runId = await startRun(source.id);

  let fetched = 0;
  let inserted = 0;

  try {
    const payload = await fetchOfficialAlertsPayload(source.feed_url);
    const rawItems = extractRawAlertItems(payload);

    fetched = rawItems.length;

    const seenExternalIds = new Set<string>();
    const currentExternalIds = new Set<string>();
    const inserts = [];
    let normalizedCount = 0;
    let dedupedInRun = 0;

    for (const rawItem of rawItems) {
      const normalizedItem = normalizeOfficialAlertItem({
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
      currentExternalIds.add(normalizedItem.external_id);
      inserts.push(normalizedItem);
    }

    if (inserts.length > 0) {
      const { data, error } = await supabase
        .from("alerts")
        .upsert(inserts, {
          onConflict: "source_id,external_id",
          ignoreDuplicates: true,
        })
        .select("id");

      if (error) {
        throw new Error(`Failed to write alerts: ${error.message}`);
      }

      inserted = data?.length ?? 0;
    }

    const reconciliation = await reconcileSnapshot({
      sourceId: source.id,
      currentExternalIds,
    });

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
      reactivated: reconciliation.reactivated,
      resolved: reconciliation.resolved,
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
  const state = await fetchOfficialAlertsSourceState();
  const sources = state.activeSources;

  if (sources.length === 0) {
    if (state.totalRows === 0) {
      console.log("No official alert sources found in DB. Apply seed migration `supabase/migrations/0002_seed_sources.sql`.");
      return;
    }

    console.log(
      `No active configured official alert sources found. rows=${state.totalRows} inactive=${state.inactiveCount} invalid=${state.invalidCount} active_misconfigured=${state.activeMisconfiguredCount}`,
    );
    console.log(
      "Activate the Oref source by applying `supabase/migrations/0003_activate_oref_alerts_source.sql` (or update `sources.feed_url` + `is_active` manually).",
    );
    return;
  }

  if (state.invalidCount > 0) {
    console.warn(`Skipped ${state.invalidCount} official alert source rows due to schema validation issues.`);
  }

  if (state.activeMisconfiguredCount > 0) {
    console.warn(
      `Skipped ${state.activeMisconfiguredCount} active official alert sources because feed_url is missing or invalid.`,
    );
  }

  let totalFetched = 0;
  let totalInserted = 0;
  let totalReactivated = 0;
  let totalResolved = 0;
  let failedSources = 0;

  for (const source of sources) {
    try {
      const result = await ingestSource(source);
      totalFetched += result.fetched;
      totalInserted += result.inserted;
      totalReactivated += result.reactivated;
      totalResolved += result.resolved;
      const alreadyExisting = Math.max(result.normalized - result.dedupedInRun - result.inserted, 0);
      console.log(
        `Source ${source.slug}: fetched ${result.fetched}, normalized ${result.normalized}, inserted ${result.inserted}, deduped_in_run ${result.dedupedInRun}, already_existing ${alreadyExisting}, reactivated ${result.reactivated}, resolved ${result.resolved}`,
      );
    } catch (error) {
      failedSources += 1;
      console.error(`Source ${source.slug}: ${formatError(error)}`);
    }
  }

  console.log(
    `Official alerts ingestion finished. sources=${sources.length} failed=${failedSources} fetched=${totalFetched} inserted=${totalInserted} reactivated=${totalReactivated} resolved=${totalResolved}`,
  );

  if (failedSources > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(`Official alerts worker failed before processing sources: ${formatError(error)}`);
  process.exit(1);
});
