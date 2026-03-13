# Alerts Worker

Ingests active `official_alerts` sources from Supabase and writes normalized items to `alerts`.

## Behavior

- Reads active sources from `sources` where `source_type = official_alerts`.
- Requires a valid `feed_url` for each active source.
- Fetches JSON payload and treats BOM/whitespace-only responses as an empty active-alert snapshot.
- Supports Oref contract (`id`, `cat`, `title`, `desc`, `data[]`) and fans out one row per location.
- Falls back to generic list extraction (`alerts`, `items`, `data`, `results`, or `events`) for non-Oref sources.
- Deduplicates in-memory by `external_id`, then relies on DB uniqueness (`source_id, external_id`) to prevent duplicates across runs.
- Applies snapshot reconciliation per source: rows seen in the current poll stay `active`; previously active rows missing from the current poll are marked `resolved`.
- Writes one `ingestion_runs` row per source poll (`started` -> `success` or `failed`).

## Contract-first mode

- Keep unknown official sources inactive until payload contract is confirmed.
- Oref (`home-front-command-alerts`) can be activated with `https://www.oref.org.il/WarningMessages/alert/alerts.json`.

## Run locally

```bash
npm run worker:alerts
```

## Required env

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

The worker loads local env files via Next's env loader (`@next/env`).

## Railway scheduling

- Intended to run on a short interval (for MVP: every 15-30 seconds, respecting source limits).
- Keep this worker source-scoped and idempotent so reruns are safe.
