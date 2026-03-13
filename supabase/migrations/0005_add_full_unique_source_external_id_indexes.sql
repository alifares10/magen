create unique index if not exists alerts_source_external_id_full_uidx
  on public.alerts (source_id, external_id);

create unique index if not exists official_updates_source_external_id_full_uidx
  on public.official_updates (source_id, external_id);
