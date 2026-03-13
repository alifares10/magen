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
