alter table public.sources
drop constraint if exists sources_source_type_check;

alter table public.sources
add constraint sources_source_type_check
check (source_type in ('official_alerts', 'official_guidance', 'rss_news', 'manual_stream', 'map_overlay'));

create table if not exists public.shelters (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.sources (id) on delete restrict,
  external_id text not null,
  name text not null,
  status text not null check (status in ('open', 'limited', 'closed')),
  country text not null default 'IL',
  region text,
  city text,
  lat double precision not null,
  lng double precision not null,
  last_updated_at timestamptz not null,
  ingested_at timestamptz not null default timezone('utc', now()),
  raw_payload jsonb not null default '{}'::jsonb
);

create unique index if not exists shelters_source_external_id_uidx
  on public.shelters (source_id, external_id);

create index if not exists shelters_last_updated_at_idx
  on public.shelters (last_updated_at desc);

create index if not exists shelters_lat_lng_idx
  on public.shelters (lat, lng);

create table if not exists public.road_closures (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.sources (id) on delete restrict,
  external_id text not null,
  name text not null,
  status text not null check (status in ('active', 'partial', 'cleared')),
  reason text,
  country text not null default 'IL',
  region text,
  city text,
  coordinates jsonb not null,
  last_updated_at timestamptz not null,
  ingested_at timestamptz not null default timezone('utc', now()),
  raw_payload jsonb not null default '{}'::jsonb,
  constraint road_closures_coordinates_array_check check (
    jsonb_typeof(coordinates) = 'array'
    and jsonb_array_length(coordinates) >= 2
  )
);

create unique index if not exists road_closures_source_external_id_uidx
  on public.road_closures (source_id, external_id);

create index if not exists road_closures_last_updated_at_idx
  on public.road_closures (last_updated_at desc);

create table if not exists public.hospitals (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.sources (id) on delete restrict,
  external_id text not null,
  name text not null,
  status text not null check (status in ('open', 'limited', 'closed')),
  has_emergency_room boolean not null default false,
  country text not null default 'IL',
  region text,
  city text,
  lat double precision not null,
  lng double precision not null,
  last_updated_at timestamptz not null,
  ingested_at timestamptz not null default timezone('utc', now()),
  raw_payload jsonb not null default '{}'::jsonb
);

create unique index if not exists hospitals_source_external_id_uidx
  on public.hospitals (source_id, external_id);

create index if not exists hospitals_last_updated_at_idx
  on public.hospitals (last_updated_at desc);

create index if not exists hospitals_lat_lng_idx
  on public.hospitals (lat, lng);
