with manual_source as (
  select id
  from public.sources
  where slug = 'internal-manual-streams'
  limit 1
),
updated as (
  update public.live_streams
  set
    title = 'Live Stream Broadcast',
    description = 'Live visual context stream (secondary to official alerts and guidance).',
    platform = 'youtube',
    embed_url = 'https://www.youtube.com/embed/gmtlJ_m2r5A',
    watch_url = 'https://www.youtube.com/watch?v=gmtlJ_m2r5A',
    region = 'Israel',
    country = 'IL',
    is_active = true,
    sort_order = 1
  where
    source_id = (select id from manual_source)
    and watch_url = 'https://www.youtube.com/watch?v=gmtlJ_m2r5A'
  returning id
)
insert into public.live_streams (
  source_id,
  title,
  description,
  platform,
  embed_url,
  watch_url,
  region,
  country,
  is_active,
  sort_order
)
select
  manual_source.id,
  'Live Stream Broadcast',
  'Live visual context stream (secondary to official alerts and guidance).',
  'youtube',
  'https://www.youtube.com/embed/gmtlJ_m2r5A',
  'https://www.youtube.com/watch?v=gmtlJ_m2r5A',
  'Israel',
  'IL',
  true,
  1
from manual_source
where not exists (select 1 from updated);
