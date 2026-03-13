create extension if not exists pgcrypto;

create table if not exists public.sources (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  source_type text not null check (source_type in ('official_alerts', 'official_guidance', 'rss_news', 'manual_stream')),
  base_url text,
  feed_url text,
  is_active boolean not null default true,
  priority smallint not null default 100 check (priority >= 0),
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists sources_active_priority_idx
  on public.sources (is_active, priority);

create index if not exists sources_type_idx
  on public.sources (source_type);

create table if not exists public.alerts (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.sources (id) on delete restrict,
  external_id text,
  title text not null,
  message text,
  alert_type text not null,
  severity text not null check (severity in ('low', 'medium', 'high', 'critical')),
  status text not null default 'active',
  country text not null default 'IL',
  region text,
  city text,
  location_name text,
  lat double precision,
  lng double precision,
  published_at timestamptz not null,
  ingested_at timestamptz not null default timezone('utc', now()),
  raw_payload jsonb not null,
  constraint alerts_lat_lng_pair_check check ((lat is null and lng is null) or (lat is not null and lng is not null))
);

create unique index if not exists alerts_source_external_id_uidx
  on public.alerts (source_id, external_id)
  where external_id is not null;

create index if not exists alerts_published_at_idx
  on public.alerts (published_at desc);

create index if not exists alerts_city_idx
  on public.alerts (city);

create table if not exists public.news_items (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.sources (id) on delete restrict,
  external_id text,
  title text not null,
  summary text,
  url text not null,
  author text,
  topic text,
  region text,
  country text not null default 'IL',
  language text,
  severity text check (severity in ('low', 'medium', 'high', 'critical')),
  published_at timestamptz not null,
  ingested_at timestamptz not null default timezone('utc', now()),
  image_url text,
  is_breaking boolean not null default false,
  raw_payload jsonb not null
);

create unique index if not exists news_items_url_uidx
  on public.news_items (url);

create unique index if not exists news_items_source_external_id_uidx
  on public.news_items (source_id, external_id)
  where external_id is not null;

create index if not exists news_items_published_at_idx
  on public.news_items (published_at desc);

create index if not exists news_items_breaking_published_idx
  on public.news_items (is_breaking, published_at desc);

create table if not exists public.official_updates (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.sources (id) on delete restrict,
  external_id text,
  title text not null,
  body text not null,
  update_type text not null,
  severity text check (severity in ('low', 'medium', 'high', 'critical')),
  country text not null default 'IL',
  region text,
  published_at timestamptz not null,
  ingested_at timestamptz not null default timezone('utc', now()),
  is_active boolean not null default true,
  raw_payload jsonb not null
);

create unique index if not exists official_updates_source_external_id_uidx
  on public.official_updates (source_id, external_id)
  where external_id is not null;

create index if not exists official_updates_active_published_idx
  on public.official_updates (is_active, published_at desc);

create table if not exists public.live_streams (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.sources (id) on delete restrict,
  title text not null,
  description text,
  platform text not null check (platform in ('youtube', 'other')),
  embed_url text not null,
  watch_url text,
  region text,
  country text not null default 'IL',
  is_active boolean not null default true,
  sort_order integer not null default 0,
  last_checked_at timestamptz,
  thumbnail_url text,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists live_streams_active_sort_idx
  on public.live_streams (is_active, sort_order asc, created_at desc);

create table if not exists public.watched_locations (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  name text not null,
  country text not null default 'IL',
  region text,
  city text,
  lat double precision not null,
  lng double precision not null,
  radius_km numeric(5,2) not null default 15.00,
  created_at timestamptz not null default timezone('utc', now()),
  constraint watched_locations_radius_check check (radius_km > 0)
);

create index if not exists watched_locations_user_id_idx
  on public.watched_locations (user_id);

create unique index if not exists watched_locations_user_name_uidx
  on public.watched_locations (user_id, name);

create table if not exists public.ingestion_runs (
  id uuid primary key default gen_random_uuid(),
  source_id uuid references public.sources (id) on delete set null,
  job_type text not null,
  status text not null check (status in ('started', 'success', 'failed')),
  started_at timestamptz not null default timezone('utc', now()),
  finished_at timestamptz,
  items_fetched integer not null default 0,
  items_inserted integer not null default 0,
  error_message text
);

create index if not exists ingestion_runs_status_started_idx
  on public.ingestion_runs (status, started_at desc);

insert into public.sources (name, slug, source_type, base_url, is_active, priority)
values ('Internal Manual Streams', 'internal-manual-streams', 'manual_stream', null, true, 1000)
on conflict (slug) do nothing;
