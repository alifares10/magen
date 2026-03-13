do $$
begin
  if not exists (
    select 1
    from pg_publication
    where pubname = 'supabase_realtime'
  ) then
    return;
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'sources'
  ) then
    execute 'alter publication supabase_realtime add table public.sources';
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'ingestion_runs'
  ) then
    execute 'alter publication supabase_realtime add table public.ingestion_runs';
  end if;
end;
$$;
