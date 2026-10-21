-- Service-role-only public bridge for the integration webhook Edge Function.
-- External callers never receive database credentials; the Edge Function verifies
-- the per-connection secret before this bridge reaches the private ingestion helper.
create or replace function public.command_center_integration_webhook_ingest_service(
  p_public_key uuid,
  p_secret_hash text,
  p_provider_event_id text,
  p_payload jsonb
)
returns jsonb
language sql
security definer
set search_path=''
as $$
  select command_center_private.ingest_webhook(p_public_key,p_secret_hash,p_provider_event_id,p_payload);
$$;
revoke all on function public.command_center_integration_webhook_ingest_service(uuid,text,text,jsonb) from public,anon,authenticated;
grant execute on function public.command_center_integration_webhook_ingest_service(uuid,text,text,jsonb) to service_role;
