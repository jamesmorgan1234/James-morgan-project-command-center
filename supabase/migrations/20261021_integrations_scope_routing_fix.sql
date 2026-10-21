-- Route normalized intake through the correct connection scopes.
-- Social metrics, email metadata, and generic records have independent permissions.

create or replace function command_center_private.payload_scopes_authorized(
  p_owner uuid,
  p_connection uuid,
  p_payload jsonb
)
returns boolean
language plpgsql
stable
security definer
set search_path=''
as $$
declare
  metrics_needed boolean;
  email_needed boolean;
  records_needed boolean;
begin
  metrics_needed := p_payload ?| array['followers','subscribers','views','likes','comments','shares','watch_time_seconds','revenue'];
  email_needed := jsonb_typeof(p_payload->'messages')='array' and jsonb_array_length(p_payload->'messages')>0;
  records_needed := jsonb_typeof(p_payload->'records')='array' and jsonb_array_length(p_payload->'records')>0;

  if not metrics_needed and not email_needed and not records_needed then return false; end if;
  if metrics_needed and not command_center_private.scope_authorized(p_owner,p_connection,'metrics','read') then return false; end if;
  if email_needed and not command_center_private.scope_authorized(p_owner,p_connection,'email_metadata','read') then return false; end if;
  if records_needed and not command_center_private.scope_authorized(p_owner,p_connection,'records','read') then return false; end if;
  return true;
end $$;
revoke all on function command_center_private.payload_scopes_authorized(uuid,uuid,jsonb) from public,anon,authenticated;
grant execute on function command_center_private.payload_scopes_authorized(uuid,uuid,jsonb) to service_role;

create or replace function public.command_center_integration_ingest(p_connection_id uuid,p_payload jsonb,p_idempotency_key text default null,p_sync_kind text default 'manual')
returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); c public.integration_connections%rowtype; rid uuid; eid uuid; idem text; n integer; obs timestamptz; begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  select * into c from public.integration_connections where id=p_connection_id and owner_id=u and status<>'archived';
  if not found then raise exception 'Connection not found'; end if;
  if not c.read_enabled then raise exception 'Read sync is disabled'; end if;
  if not command_center_private.payload_scopes_authorized(u,c.id,p_payload) then raise exception 'Required read scope is not authorized for this payload'; end if;
  if p_sync_kind not in ('manual','scheduled','webhook','reconnect','internal') then raise exception 'Invalid sync kind'; end if;
  idem:=coalesce(nullif(btrim(p_idempotency_key),''),'ingest:'||c.id::text||':'||encode(extensions.gen_random_bytes(12),'hex'));
  if exists(select 1 from public.integration_sync_runs where owner_id=u and idempotency_key=idem) then
    select id into rid from public.integration_sync_runs where owner_id=u and idempotency_key=idem;
    return jsonb_build_object('ok',true,'duplicate',true,'sync_run_id',rid);
  end if;
  obs:=coalesce((p_payload->>'observed_at')::timestamptz,now());
  insert into public.integration_sync_runs(owner_id,connection_id,sync_kind,status,idempotency_key,records_received) values(u,c.id,p_sync_kind,'running',idem,1) returning id into rid;
  insert into public.integration_source_events(owner_id,connection_id,sync_run_id,event_kind,idempotency_key,payload,observed_at)
  values(u,c.id,rid,'snapshot',idem||':event',p_payload,obs) returning id into eid;
  n:=command_center_private.normalize_integration_payload(u,c.id,eid,p_payload,obs);
  update public.integration_sync_runs set status='succeeded',records_normalized=n,completed_at=now() where id=rid;
  update public.integration_connections set status='connected',last_sync_at=now(),last_success_at=now(),last_error=null where id=c.id;
  return jsonb_build_object('ok',true,'duplicate',false,'sync_run_id',rid,'source_event_id',eid,'records_normalized',n);
exception when others then
  if rid is not null then update public.integration_sync_runs set status='failed',error_message=sqlerrm,completed_at=now() where id=rid; end if;
  update public.integration_connections set last_sync_at=now(),last_error=sqlerrm,status=case when status='needs_auth' then status else 'error' end where id=p_connection_id and owner_id=u;
  raise;
end $$;
revoke all on function public.command_center_integration_ingest(uuid,jsonb,text,text) from public,anon;
grant execute on function public.command_center_integration_ingest(uuid,jsonb,text,text) to authenticated;

create or replace function command_center_private.ingest_webhook(p_public_key uuid,p_secret_hash text,p_provider_event_id text,p_payload jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare e public.integration_webhook_endpoints%rowtype; c public.integration_connections%rowtype; rid uuid; eid uuid; idem text; n integer; observed timestamptz; begin
  select * into e from public.integration_webhook_endpoints where public_key=p_public_key and status='active'; if not found then raise exception 'Webhook endpoint not found'; end if;
  if e.secret_hash<>p_secret_hash then raise exception 'Invalid webhook secret'; end if;
  select * into c from public.integration_connections where id=e.connection_id and owner_id=e.owner_id and status<>'archived'; if not found then raise exception 'Connection not found'; end if;
  if not c.webhook_enabled or not c.read_enabled then raise exception 'Webhook intake is disabled'; end if;
  if not command_center_private.payload_scopes_authorized(c.owner_id,c.id,p_payload) then raise exception 'Required read scope is not authorized for this payload'; end if;
  idem:='webhook:'||c.id::text||':'||coalesce(nullif(p_provider_event_id,''),encode(extensions.digest(p_payload::text,'sha256'),'hex'));
  if exists(select 1 from public.integration_source_events where owner_id=c.owner_id and idempotency_key=idem||':event') then return jsonb_build_object('ok',true,'duplicate',true); end if;
  observed:=coalesce((p_payload->>'observed_at')::timestamptz,now());
  insert into public.integration_sync_runs(owner_id,connection_id,sync_kind,status,idempotency_key,records_received) values(c.owner_id,c.id,'webhook','running',idem,1) returning id into rid;
  insert into public.integration_source_events(owner_id,connection_id,sync_run_id,event_kind,provider_event_id,idempotency_key,payload,observed_at)
  values(c.owner_id,c.id,rid,'webhook',p_provider_event_id,idem||':event',p_payload,observed) returning id into eid;
  n:=command_center_private.normalize_integration_payload(c.owner_id,c.id,eid,p_payload,observed);
  update public.integration_sync_runs set status='succeeded',records_normalized=n,completed_at=now() where id=rid;
  update public.integration_webhook_endpoints set last_received_at=now(),delivery_count=delivery_count+1 where id=e.id;
  update public.integration_connections set status='connected',last_sync_at=now(),last_success_at=now(),last_error=null where id=c.id;
  return jsonb_build_object('ok',true,'duplicate',false,'records_normalized',n,'sync_run_id',rid);
end $$;
revoke all on function command_center_private.ingest_webhook(uuid,text,text,jsonb) from public,anon,authenticated;
grant execute on function command_center_private.ingest_webhook(uuid,text,text,jsonb) to service_role;
