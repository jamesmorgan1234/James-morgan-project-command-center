-- Category 2 / P2.8 — durable incident response lifecycle with append-only evidence.
-- Branch-only migration. No production incident state changes occur until explicitly applied.

create table if not exists public.security_incidents (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  source_alert_id uuid references public.security_alerts(id) on delete set null,
  severity text not null check (severity in ('info','warning','critical')),
  status text not null default 'open' check (status in ('open','acknowledged','contained','recovering','resolved')),
  summary text not null,
  acknowledgement_note text,
  containment_note text,
  recovery_note text,
  resolution_note text,
  opened_at timestamptz not null default now(),
  acknowledged_at timestamptz,
  contained_at timestamptz,
  recovery_started_at timestamptz,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists security_incidents_owner_status_idx
  on public.security_incidents(owner_id,status,opened_at desc);
create index if not exists security_incidents_source_alert_idx
  on public.security_incidents(source_alert_id) where source_alert_id is not null;

alter table public.security_incidents enable row level security;
revoke all on table public.security_incidents from public, anon, authenticated;
grant select on table public.security_incidents to authenticated;

drop policy if exists security_incidents_select_own on public.security_incidents;
create policy security_incidents_select_own
on public.security_incidents
for select
to authenticated
using (owner_id=(select auth.uid()) and (select public.is_command_center_authorized()));

create or replace function command_center_private.log_security_incident_event(
  p_owner_id uuid,
  p_incident_id uuid,
  p_event_key text,
  p_action text,
  p_risk_level text,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_event_id uuid;
  v_actor uuid := auth.uid();
  v_session text := auth.jwt()->>'session_id';
  v_aal text := auth.jwt()->>'aal';
begin
  insert into public.security_audit_events(
    owner_id,actor_user_id,actor_session_id,actor_aal,event_key,action,
    target_type,target_id,risk_level,source,success,metadata,occurred_at
  ) values (
    p_owner_id,v_actor,v_session,v_aal,btrim(p_event_key),btrim(p_action),
    'security_incident',p_incident_id::text,p_risk_level,'system',true,coalesce(p_metadata,'{}'::jsonb),now()
  ) returning id into v_event_id;
  return v_event_id;
end;
$$;
revoke all on function command_center_private.log_security_incident_event(uuid,uuid,text,text,text,jsonb) from public, anon, authenticated;

create or replace function public.command_center_security_open_incident(
  p_source_alert_id uuid,
  p_severity text,
  p_summary text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  u uuid := auth.uid();
  v_id uuid;
begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  if p_severity not in ('info','warning','critical') then raise exception 'Invalid incident severity'; end if;
  if coalesce(btrim(p_summary),'')='' then raise exception 'Incident summary is required'; end if;
  if p_source_alert_id is not null and not exists(
    select 1 from public.security_alerts a where a.id=p_source_alert_id and a.owner_id=u
  ) then raise exception 'Source alert not found'; end if;

  insert into public.security_incidents(owner_id,source_alert_id,severity,summary)
  values(u,p_source_alert_id,p_severity,left(btrim(p_summary),2000))
  returning id into v_id;

  perform command_center_private.log_security_incident_event(
    u,v_id,'security.incident.opened','open_incident',p_severity,
    jsonb_strip_nulls(jsonb_build_object('source_alert_id',p_source_alert_id,'summary',left(btrim(p_summary),500)))
  );
  return v_id;
end;
$$;

create or replace function public.command_center_security_acknowledge_incident(
  p_incident_id uuid,
  p_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare u uuid:=auth.uid(); i public.security_incidents%rowtype; begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  select * into i from public.security_incidents where id=p_incident_id and owner_id=u for update;
  if not found then raise exception 'Incident not found'; end if;
  if i.status <> 'open' then raise exception 'Only an open incident can be acknowledged'; end if;
  update public.security_incidents set status='acknowledged',acknowledged_at=now(),acknowledgement_note=nullif(left(btrim(coalesce(p_note,'')),2000),''),updated_at=now() where id=i.id;
  perform command_center_private.log_security_incident_event(u,i.id,'security.incident.acknowledged','acknowledge_incident',i.severity,jsonb_build_object('note',coalesce(nullif(left(btrim(coalesce(p_note,'')),500),''),'acknowledged')));
  return jsonb_build_object('ok',true,'incident_id',i.id,'status','acknowledged');
end;
$$;

create or replace function public.command_center_security_contain_incident(
  p_incident_id uuid,
  p_note text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare u uuid:=auth.uid(); i public.security_incidents%rowtype; begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  if coalesce(btrim(p_note),'')='' then raise exception 'Containment evidence is required'; end if;
  select * into i from public.security_incidents where id=p_incident_id and owner_id=u for update;
  if not found then raise exception 'Incident not found'; end if;
  if i.status not in ('open','acknowledged') then raise exception 'Incident is not eligible for containment'; end if;
  update public.security_incidents set status='contained',contained_at=now(),containment_note=left(btrim(p_note),4000),updated_at=now() where id=i.id;
  perform command_center_private.log_security_incident_event(u,i.id,'security.incident.contained','contain_incident',i.severity,jsonb_build_object('containment_note',left(btrim(p_note),1000)));
  return jsonb_build_object('ok',true,'incident_id',i.id,'status','contained');
end;
$$;

create or replace function public.command_center_security_begin_recovery(
  p_incident_id uuid,
  p_note text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare u uuid:=auth.uid(); i public.security_incidents%rowtype; begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  if coalesce(btrim(p_note),'')='' then raise exception 'Recovery plan evidence is required'; end if;
  select * into i from public.security_incidents where id=p_incident_id and owner_id=u for update;
  if not found then raise exception 'Incident not found'; end if;
  if i.status <> 'contained' then raise exception 'Incident must be contained before recovery'; end if;
  update public.security_incidents set status='recovering',recovery_started_at=now(),recovery_note=left(btrim(p_note),4000),updated_at=now() where id=i.id;
  perform command_center_private.log_security_incident_event(u,i.id,'security.incident.recovery_started','begin_recovery',i.severity,jsonb_build_object('recovery_note',left(btrim(p_note),1000)));
  return jsonb_build_object('ok',true,'incident_id',i.id,'status','recovering');
end;
$$;

create or replace function public.command_center_security_resolve_incident(
  p_incident_id uuid,
  p_note text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare u uuid:=auth.uid(); i public.security_incidents%rowtype; begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  if coalesce(btrim(p_note),'')='' then raise exception 'Resolution evidence is required'; end if;
  select * into i from public.security_incidents where id=p_incident_id and owner_id=u for update;
  if not found then raise exception 'Incident not found'; end if;
  if i.status <> 'recovering' then raise exception 'Incident must complete containment and recovery before resolution'; end if;
  update public.security_incidents set status='resolved',resolved_at=now(),resolution_note=left(btrim(p_note),4000),updated_at=now() where id=i.id;
  perform command_center_private.log_security_incident_event(u,i.id,'security.incident.resolved','resolve_incident',i.severity,jsonb_build_object('resolution_note',left(btrim(p_note),1000)));
  return jsonb_build_object('ok',true,'incident_id',i.id,'status','resolved');
end;
$$;

revoke all on function public.command_center_security_open_incident(uuid,text,text) from public, anon;
revoke all on function public.command_center_security_acknowledge_incident(uuid,text) from public, anon;
revoke all on function public.command_center_security_contain_incident(uuid,text) from public, anon;
revoke all on function public.command_center_security_begin_recovery(uuid,text) from public, anon;
revoke all on function public.command_center_security_resolve_incident(uuid,text) from public, anon;
grant execute on function public.command_center_security_open_incident(uuid,text,text) to authenticated;
grant execute on function public.command_center_security_acknowledge_incident(uuid,text) to authenticated;
grant execute on function public.command_center_security_contain_incident(uuid,text) to authenticated;
grant execute on function public.command_center_security_begin_recovery(uuid,text) to authenticated;
grant execute on function public.command_center_security_resolve_incident(uuid,text) to authenticated;
