-- Cover the Integration-specific foreign keys surfaced by the Supabase advisor.
create index if not exists integration_health_events_owner_fk_idx
  on public.integration_health_events(owner_id);
create index if not exists integration_metrics_source_event_fk_idx
  on public.integration_metrics(source_event_id)
  where source_event_id is not null;
create index if not exists integration_source_events_sync_run_fk_idx
  on public.integration_source_events(sync_run_id)
  where sync_run_id is not null;
create index if not exists integration_write_requests_project_fk_idx
  on public.integration_write_requests(project_id)
  where project_id is not null;
