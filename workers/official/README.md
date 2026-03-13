# Official Guidance Worker

Ingests active `official_guidance` sources from Supabase and writes normalized items to `official_updates`.

## Behavior

- Reads active sources from `sources` where `source_type = official_guidance`.
- Requires a valid `feed_url` for each active source.
- Fetches JSON payload and treats BOM/whitespace-only responses as an empty updates list.
- Supports Oref home contract (`/api/v1/home/heb`) by extracting `content[*].newsListFeatured.newsItems[]`.
- Falls back to generic list extraction (`updates`, `items`, `data`, `results`, `events`, or `guidance`) for non-Oref sources.
- Deduplicates in-memory by `external_id`, then relies on DB uniqueness (`source_id, external_id`) to prevent duplicates across runs.
- Writes one `ingestion_runs` row per source poll (`started` -> `success` or `failed`).

## Contract-first mode

- Keep unknown official guidance sources inactive until payload contract is confirmed.
- Oref guidance (`official-guidance-gov-il`) can be activated with `https://api.oref.org.il/api/v1/home/heb`.

## Active-state default

- The worker does not auto-deactivate previous `official_updates` rows.
- `is_active` is read from payload when available; otherwise defaults to `true`.

## Run locally

```bash
npm run worker:official
```

## Required env

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

The worker loads local env files via Next's env loader (`@next/env`).

## Railway scheduling

- Intended to run on a short interval (for MVP: every 1-2 minutes, respecting source limits).
- Keep this worker source-scoped and idempotent so reruns are safe.
