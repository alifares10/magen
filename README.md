# Magen (מגן)

Magen is a real-time crisis monitoring dashboard focused on Israel.

It prioritizes official alerts and official guidance, then adds trusted news and map context for faster decision-making.

## What the app does

- Shows official alerts, official guidance, and trusted RSS news in near real time
- Provides dashboard, feed, and map views (`/dashboard`, `/feed`, `/map`)
- Keeps official alerts, official guidance, and news visually separated
- Renders map overlays for shelters, road closures, and hospitals
- Supports English and Hebrew (`next-intl`) with RTL readiness
- Includes in-app notifications and optional browser notifications

## Core product rules

- Official alerts are highest priority
- Official alerts, official guidance, and news must stay visually distinct
- Live streams are secondary context, not source of truth
- The newest alert should not only be hidden inside a tab

## Tech stack

- Next.js 16 + React 19 + TypeScript
- Tailwind CSS + shadcn/ui
- Zustand
- mapcn / MapLibre
- Supabase Postgres + Realtime
- Zod
- Vitest + React Testing Library + ESLint

## Local development

### 1) Install dependencies

```bash
npm install
```

### 2) Configure environment

Copy `.env.example` to `.env.local` and set values:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Notes:

- Frontend runtime requires public Supabase vars.
- Worker scripts require `SUPABASE_SERVICE_ROLE_KEY`.

### 3) Run the app

```bash
npm run dev
```

Open:

- `http://localhost:3000/en/dashboard`
- `http://localhost:3000/en/feed`
- `http://localhost:3000/en/map`

## Quality checks

```bash
npm run lint
npm run test
npm run typecheck
npm run build
```

Or all in one:

```bash
npm run check
```

## Workers (ingestion)

Run on demand:

```bash
npm run worker:alerts
npm run worker:official
npm run worker:rss
```

Worker docs:

- `workers/alerts/README.md`
- `workers/official/README.md`
- `workers/rss/README.md`

## Temporary manual DB mode (official guidance + overlays)

Until official guidance and overlay APIs are available, update these tables manually in Supabase.

### Official guidance (`official_updates`)

Keep the guidance source inactive while manual mode is active:

```sql
update public.sources
set is_active = false
where slug = 'official-guidance-gov-il';
```

Upsert current guidance rows (repeat per update batch):

```sql
with guidance_source as (
  select id
  from public.sources
  where slug = 'official-guidance-gov-il'
  limit 1
)
insert into public.official_updates (
  source_id,
  external_id,
  title,
  body,
  update_type,
  severity,
  country,
  region,
  published_at,
  is_active,
  raw_payload
)
select
  guidance_source.id,
  row_data.external_id,
  row_data.title,
  row_data.body,
  row_data.update_type,
  row_data.severity,
  'IL',
  row_data.region,
  row_data.published_at::timestamptz,
  true,
  row_data.raw_payload
from guidance_source
cross join (
  values
    (
      'manual-guidance-2026-03-14-01',
      'Public shelter access update',
      'Shelters remain open in affected districts.',
      'featured_news',
      'high',
      'Center',
      '2026-03-14T10:00:00.000+00:00',
      '{"source":"manual"}'::jsonb
    )
) as row_data(
  external_id,
  title,
  body,
  update_type,
  severity,
  region,
  published_at,
  raw_payload
)
on conflict (source_id, external_id) do update
set
  title = excluded.title,
  body = excluded.body,
  update_type = excluded.update_type,
  severity = excluded.severity,
  country = excluded.country,
  region = excluded.region,
  published_at = excluded.published_at,
  is_active = excluded.is_active,
  raw_payload = excluded.raw_payload,
  ingested_at = timezone('utc', now());
```

Deactivate stale active rows after each batch:

```sql
with guidance_source as (
  select id
  from public.sources
  where slug = 'official-guidance-gov-il'
  limit 1
)
update public.official_updates
set is_active = false
where source_id = (select id from guidance_source)
  and external_id not in ('manual-guidance-2026-03-14-01');
```

### Map overlays (`shelters`, `road_closures`, `hospitals`)

- Use stable `external_id` values.
- Update `last_updated_at` each refresh.
- Delete stale rows not present in the new snapshot.

Snapshot cleanup pattern (repeat per overlay table/source slug):

```sql
with overlay_source as (
  select id
  from public.sources
  where slug = 'internal-manual-shelters-overlay'
  limit 1
)
delete from public.shelters
where source_id = (select id from overlay_source)
  and external_id not in ('shelter-tel-aviv-1', 'shelter-haifa-1');
```

Use `supabase/migrations/0010_seed_map_overlay_sources_and_rows.sql` as the canonical upsert template for all three overlay tables.

## Browser notifications

- Browser notifications are opt-in from the UI (`Browser alerts` control)
- They only fire when the tab is in the background
- In-app notifications still show in the app itself

## Deployment (recommended)

- Frontend: Vercel
- Workers: Railway scheduled jobs
- Database + realtime: Supabase

For frontend deployment, set at least:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

For worker deployment, also set:

- `SUPABASE_SERVICE_ROLE_KEY`

## Project guidance files

- `tasks.md` - active execution checklist
- `plan.md` - architecture and product decisions
- `progress.md` - latest session snapshot
