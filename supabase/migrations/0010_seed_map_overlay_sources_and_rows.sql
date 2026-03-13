insert into public.sources (
  name,
  slug,
  source_type,
  base_url,
  feed_url,
  is_active,
  priority
)
values
  (
    'Internal Manual Shelters Overlay',
    'internal-manual-shelters-overlay',
    'map_overlay',
    null,
    null,
    true,
    300
  ),
  (
    'Internal Manual Road Closures Overlay',
    'internal-manual-road-closures-overlay',
    'map_overlay',
    null,
    null,
    true,
    310
  ),
  (
    'Internal Manual Hospitals Overlay',
    'internal-manual-hospitals-overlay',
    'map_overlay',
    null,
    null,
    true,
    320
  )
on conflict (slug) do update
set
  name = excluded.name,
  source_type = excluded.source_type,
  base_url = excluded.base_url,
  feed_url = excluded.feed_url,
  is_active = excluded.is_active,
  priority = excluded.priority;

with shelter_source as (
  select id
  from public.sources
  where slug = 'internal-manual-shelters-overlay'
  limit 1
)
insert into public.shelters (
  source_id,
  external_id,
  name,
  status,
  country,
  region,
  city,
  lat,
  lng,
  last_updated_at,
  raw_payload
)
select
  shelter_source.id,
  row_data.external_id,
  row_data.name,
  row_data.status,
  'IL',
  row_data.region,
  row_data.city,
  row_data.lat,
  row_data.lng,
  row_data.last_updated_at::timestamptz,
  row_data.raw_payload
from shelter_source
cross join (
  values
    (
      'shelter-tel-aviv-1',
      'Tel Aviv Community Shelter A',
      'open',
      'Center',
      'Tel Aviv',
      32.0805,
      34.7804,
      '2026-03-09T10:40:00.000+00:00',
      '{"id":"shelter-tel-aviv-1","name":"Tel Aviv Community Shelter A","status":"open"}'::jsonb
    ),
    (
      'shelter-haifa-1',
      'Haifa Public Shelter North',
      'limited',
      'North',
      'Haifa',
      32.8071,
      34.9896,
      '2026-03-09T10:35:00.000+00:00',
      '{"id":"shelter-haifa-1","name":"Haifa Public Shelter North","status":"limited"}'::jsonb
    ),
    (
      'shelter-beer-sheva-1',
      'Beer Sheva School Shelter',
      'open',
      'South',
      'Beer Sheva',
      31.253,
      34.7915,
      '2026-03-09T10:30:00.000+00:00',
      '{"id":"shelter-beer-sheva-1","name":"Beer Sheva School Shelter","status":"open"}'::jsonb
    )
) as row_data(
  external_id,
  name,
  status,
  region,
  city,
  lat,
  lng,
  last_updated_at,
  raw_payload
)
on conflict (source_id, external_id) do update
set
  name = excluded.name,
  status = excluded.status,
  country = excluded.country,
  region = excluded.region,
  city = excluded.city,
  lat = excluded.lat,
  lng = excluded.lng,
  last_updated_at = excluded.last_updated_at,
  raw_payload = excluded.raw_payload,
  ingested_at = timezone('utc', now());

with road_source as (
  select id
  from public.sources
  where slug = 'internal-manual-road-closures-overlay'
  limit 1
)
insert into public.road_closures (
  source_id,
  external_id,
  name,
  status,
  reason,
  country,
  region,
  city,
  coordinates,
  last_updated_at,
  raw_payload
)
select
  road_source.id,
  row_data.external_id,
  row_data.name,
  row_data.status,
  row_data.reason,
  'IL',
  row_data.region,
  row_data.city,
  row_data.coordinates,
  row_data.last_updated_at::timestamptz,
  row_data.raw_payload
from road_source
cross join (
  values
    (
      'closure-ayalon-northbound',
      'Ayalon Northbound Closure',
      'active',
      'Security operations',
      'Center',
      'Tel Aviv',
      '[[34.7982,32.0701],[34.8012,32.0881],[34.8043,32.1062]]'::jsonb,
      '2026-03-09T10:42:00.000+00:00',
      '{"id":"closure-ayalon-northbound","name":"Ayalon Northbound Closure","status":"active"}'::jsonb
    ),
    (
      'closure-route-40-south',
      'Route 40 South Segment',
      'partial',
      'Emergency response access',
      'South',
      'Beer Sheva',
      '[[34.8124,31.361],[34.8048,31.3262],[34.7965,31.2914]]'::jsonb,
      '2026-03-09T10:20:00.000+00:00',
      '{"id":"closure-route-40-south","name":"Route 40 South Segment","status":"partial"}'::jsonb
    )
) as row_data(
  external_id,
  name,
  status,
  reason,
  region,
  city,
  coordinates,
  last_updated_at,
  raw_payload
)
on conflict (source_id, external_id) do update
set
  name = excluded.name,
  status = excluded.status,
  reason = excluded.reason,
  country = excluded.country,
  region = excluded.region,
  city = excluded.city,
  coordinates = excluded.coordinates,
  last_updated_at = excluded.last_updated_at,
  raw_payload = excluded.raw_payload,
  ingested_at = timezone('utc', now());

with hospital_source as (
  select id
  from public.sources
  where slug = 'internal-manual-hospitals-overlay'
  limit 1
)
insert into public.hospitals (
  source_id,
  external_id,
  name,
  status,
  has_emergency_room,
  country,
  region,
  city,
  lat,
  lng,
  last_updated_at,
  raw_payload
)
select
  hospital_source.id,
  row_data.external_id,
  row_data.name,
  row_data.status,
  row_data.has_emergency_room,
  'IL',
  row_data.region,
  row_data.city,
  row_data.lat,
  row_data.lng,
  row_data.last_updated_at::timestamptz,
  row_data.raw_payload
from hospital_source
cross join (
  values
    (
      'hospital-ichilov',
      'Ichilov Medical Center',
      'open',
      true,
      'Center',
      'Tel Aviv',
      32.0809,
      34.7811,
      '2026-03-09T10:45:00.000+00:00',
      '{"id":"hospital-ichilov","name":"Ichilov Medical Center","status":"open"}'::jsonb
    ),
    (
      'hospital-rambam',
      'Rambam Health Care Campus',
      'limited',
      true,
      'North',
      'Haifa',
      32.8329,
      34.9899,
      '2026-03-09T10:37:00.000+00:00',
      '{"id":"hospital-rambam","name":"Rambam Health Care Campus","status":"limited"}'::jsonb
    ),
    (
      'hospital-soroka',
      'Soroka Medical Center',
      'open',
      true,
      'South',
      'Beer Sheva',
      31.2609,
      34.7993,
      '2026-03-09T10:33:00.000+00:00',
      '{"id":"hospital-soroka","name":"Soroka Medical Center","status":"open"}'::jsonb
    )
) as row_data(
  external_id,
  name,
  status,
  has_emergency_room,
  region,
  city,
  lat,
  lng,
  last_updated_at,
  raw_payload
)
on conflict (source_id, external_id) do update
set
  name = excluded.name,
  status = excluded.status,
  has_emergency_room = excluded.has_emergency_room,
  country = excluded.country,
  region = excluded.region,
  city = excluded.city,
  lat = excluded.lat,
  lng = excluded.lng,
  last_updated_at = excluded.last_updated_at,
  raw_payload = excluded.raw_payload,
  ingested_at = timezone('utc', now());
