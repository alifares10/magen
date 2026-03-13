update public.sources
set
  name = 'Home Front Command Guidance',
  base_url = 'https://api.oref.org.il',
  feed_url = 'https://api.oref.org.il/api/v1/home/heb',
  is_active = true
where slug = 'official-guidance-gov-il';
