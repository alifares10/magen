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
    'Home Front Command Alerts',
    'home-front-command-alerts',
    'official_alerts',
    'https://www.oref.org.il',
    null,
    false,
    10
  ),
  (
    'Government Guidance Portal',
    'official-guidance-gov-il',
    'official_guidance',
    'https://www.gov.il',
    null,
    false,
    20
  ),
  (
    'Times of Israel',
    'times-of-israel-main',
    'rss_news',
    'https://www.timesofisrael.com',
    'https://www.timesofisrael.com/feed/',
    true,
    100
  ),
  (
    'Israel Hayom',
    'israel-hayom-main',
    'rss_news',
    'https://www.israelhayom.com',
    'https://www.israelhayom.com/feed/',
    true,
    110
  ),
  (
    'Israel National News',
    'israel-national-news-main',
    'rss_news',
    'https://www.israelnationalnews.com',
    'https://www.israelnationalnews.com/Rss.aspx',
    true,
    120
  ),
  (
    'Jewish News Syndicate',
    'jns-main',
    'rss_news',
    'https://www.jns.org',
    'https://www.jns.org/feed/',
    true,
    130
  )
on conflict (slug) do update
set
  name = excluded.name,
  source_type = excluded.source_type,
  base_url = excluded.base_url,
  feed_url = excluded.feed_url,
  is_active = excluded.is_active,
  priority = excluded.priority;
