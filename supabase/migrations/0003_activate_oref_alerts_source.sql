update public.sources
set
  feed_url = 'https://www.oref.org.il/WarningMessages/alert/alerts.json',
  is_active = true
where slug = 'home-front-command-alerts';
