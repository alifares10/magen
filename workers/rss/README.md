# RSS Worker

Ingests active `rss_news` sources from Supabase and writes normalized items to `news_items`.

## Behavior

- Reads active sources from `sources` where `source_type = rss_news`.
- Fetches each feed and parses entries.
- Validates and normalizes items with Zod.
- Deduplicates in-memory by canonical URL, then relies on DB `url` uniqueness to avoid duplicates across runs.
- Writes one `ingestion_runs` row per source poll (`started` -> `success` or `failed`).

## Run locally

```bash
npm run worker:rss
```

## Required env

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

The worker loads local env files via Next's env loader (`@next/env`).

## Railway scheduling

- Intended to run on a short interval (for MVP: every 2-5 minutes).
- Keep this worker source-scoped and idempotent so reruns are safe.
