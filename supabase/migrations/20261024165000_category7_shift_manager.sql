-- Category 7 / P7.18 — durable Shift Manager and incident command.
-- Branch-only migration. Worker health/stalls/resources are evidence-backed; unresolved owner needs are explicit.

create table if not exists public.command_center_agency_worker_health (
  owner_id uuid not null references auth.users(id) on delete cascade,
  worker_id text not null,
  project_id text not null,
  run_id text not null,
  task_id text,
  state text not null check (state in ('idle','working','blocked','failed','draining','dead')),
  workload integer not null default 0 check (workload>=0),
  resource_refs text[] not null default '{}'::text[],
  blocker_code text,
  last_heartbeat_at timestamptz not null,
  evidence_refs text[] not null,
  updated_at timestamptz not null default now(),
  primary key(owner_id,worker_id),
  foreign key(owner_id,project_id,run_id) references public.command_center_agency_runs(owner_id,project_id,run_id) on delete cascade,
  check (length(btrim(worker_id)) between 1 and 240),
  check (cardinality(evidence_refs)>0),
  check ((state='blocked' and blocker_code is not null) or state<>'blocked')
);

create table if not exists public.command_center_agency_shift_incidents (
  incident_id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  project_id text not null,
  run_id text not null,
  worker_id text not null,
  task_id text,
  kind text not null check (kind in ('stalled','failed','blocked','resource_pressure','orphaned')),
  state text not null default 'open' check (state in ('open','contained','rerouted','handed_off','resolved','needs_owner')),
  owner_attention_required boolean not null,
  owner_need text,
  containment_ref text,
  replacement_worker_id text,
  evidence_refs text[] not null,
  opened_at timestamptz not null,
  updated_at timestamptz not null,
  resolved_at timestamptz,
  foreign key(owner_id,worker_id) references public.command_center_agency_worker_health(owner_id,worker_id) on delete restrict,
  check (cardinality(evidence_refs)>0),
  check ((owner_attention_required and owner_need is not null) or (not owner_attention_required and owner_need is null)),
  check ((state='resolved' and resolved_at is not null) or (state<>'resolved' and resolved_at is null)),
  check (updated_at>=opened_at)
);

create table if not exists public.command_center_agency_shift_actions (
  action_id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  incident_id uuid not null references public.command_center_agency_shift_incidents(incident_id) on delete cascade,
  action_type text not null check (action_type in ('contain','reroute','handoff','escalate_owner','resolve')),
  from_worker_id text,
  to_worker_id text,
  task_id text,
  reason text not null check (length(btrim(reason)) between 1 and 2000),
  evidence_refs text[] not null,
  occurred_at timestamptz not null,
  recorded_at timestamptz not null default now(),
  check (cardinality(evidence_refs)>0),
  check (occurred_at<=recorded_at + interval '5 minutes')
);
create index if not exists command_center_agency_shift_incidents_idx
  on public.command_center_agency_shift_incidents(owner_id,project_id,state,opened_at,incident_id);

do $$
declare t text;
begin
  foreach t in array array['command_center_agency_worker_health','command_center_agency_shift_incidents','command_center_agency_shift_actions'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('revoke all on table public.%I from public,anon,authenticated',t);
    execute format('grant select on table public.%I to authenticated',t);
    execute format('drop policy if exists %I on public.%I','c7_owner_select_'||t,t);
    execute format('create policy %I on public.%I for select to authenticated using (owner_id=(select auth.uid()) and (select public.is_command_center_authorized()))','c7_owner_select_'||t,t);
  end loop;
end $$;

create or replace function public.command_center_agency_record_worker_health(
  p_worker_id text,p_project_id text,p_run_id text,p_task_id text,p_state text,p_workload integer,p_resource_refs text[],p_blocker_code text,p_last_heartbeat_at timestamptz,p_evidence_refs text[]
) returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  if not exists(select 1 from public.command_center_agency_runs where owner_id=u and project_id=btrim(p_project_id) and run_id=btrim(p_run_id)) then raise exception 'Worker health run not found'; end if;
  if p_state not in ('idle','working','blocked','failed','draining','dead') or p_workload<0 then raise exception 'Invalid worker health state'; end if;
  if p_state='blocked' and coalesce(btrim(p_blocker_code),'')='' then raise exception 'Blocked worker requires blocker code'; end if;
  perform command_center_private.c3_assert_unique_text_array(p_resource_refs,'Worker resources');
  perform command_center_private.c3_assert_unique_text_array(p_evidence_refs,'Worker health evidence');
  if cardinality(coalesce(p_evidence_refs,'{}'::text[]))=0 then raise exception 'Worker health requires evidence'; end if;
  insert into public.command_center_agency_worker_health(owner_id,worker_id,project_id,run_id,task_id,state,workload,resource_refs,blocker_code,last_heartbeat_at,evidence_refs)
  values(u,btrim(p_worker_id),btrim(p_project_id),btrim(p_run_id),nullif(btrim(coalesce(p_task_id,'')),''),p_state,p_workload,coalesce(p_resource_refs,'{}'::text[]),nullif(btrim(coalesce(p_blocker_code,'')),''),p_last_heartbeat_at,p_evidence_refs)
  on conflict(owner_id,worker_id) do update set project_id=excluded.project_id,run_id=excluded.run_id,task_id=excluded.task_id,state=excluded.state,workload=excluded.workload,resource_refs=excluded.resource_refs,blocker_code=excluded.blocker_code,last_heartbeat_at=excluded.last_heartbeat_at,evidence_refs=excluded.evidence_refs,updated_at=now();
  return jsonb_build_object('worker_id',btrim(p_worker_id),'state',p_state,'workload',p_workload,'last_heartbeat_at',p_last_heartbeat_at);
end $$;

create or replace function public.command_center_agency_inspect_shift(
  p_now timestamptz,p_stall_after_seconds integer,p_resource_pressure_threshold integer,p_evidence_refs text[]
) returns jsonb language plpgsql security definer set search_path='' as $$
declare
  u uuid:=auth.uid();
  w record;
  v_kind text;
  v_owner_attention boolean;
  v_owner_need text;
  v_incident uuid;
  created_ids uuid[]:='{}'::uuid[];
begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  if p_stall_after_seconds<1 or p_resource_pressure_threshold<1 then raise exception 'Shift thresholds must be positive'; end if;
  perform command_center_private.c3_assert_unique_text_array(p_evidence_refs,'Shift inspection evidence');
  if cardinality(coalesce(p_evidence_refs,'{}'::text[]))=0 then raise exception 'Shift inspection requires evidence'; end if;
  for w in select * from public.command_center_agency_worker_health where owner_id=u loop
    v_kind:=null; v_owner_attention:=false; v_owner_need:=null;
    if w.state='working' and w.last_heartbeat_at + make_interval(secs=>p_stall_after_seconds)<=p_now then v_kind:='stalled';
    elsif w.state in ('failed','dead') then v_kind:='failed';
    elsif w.state='blocked' then v_kind:='blocked'; v_owner_attention:=true; v_owner_need:='Resolve worker blocker: '||coalesce(w.blocker_code,'unknown');
    elsif w.workload>=p_resource_pressure_threshold then v_kind:='resource_pressure';
    end if;
    if v_kind is not null and not exists(select 1 from public.command_center_agency_shift_incidents i where i.owner_id=u and i.worker_id=w.worker_id and i.kind=v_kind and i.state not in ('resolved')) then
      insert into public.command_center_agency_shift_incidents(owner_id,project_id,run_id,worker_id,task_id,kind,state,owner_attention_required,owner_need,evidence_refs,opened_at,updated_at)
      values(u,w.project_id,w.run_id,w.worker_id,w.task_id,v_kind,case when v_owner_attention then 'needs_owner' else 'open' end,v_owner_attention,v_owner_need,p_evidence_refs,p_now,p_now) returning incident_id into v_incident;
      created_ids:=array_append(created_ids,v_incident);
    end if;
  end loop;
  return jsonb_build_object('incident_ids',to_jsonb(created_ids),'incident_count',cardinality(created_ids));
end $$;

create or replace function public.command_center_agency_act_on_shift_incident(
  p_incident_id uuid,p_action_type text,p_to_worker_id text,p_reason text,p_evidence_refs text[],p_occurred_at timestamptz
) returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); i public.command_center_agency_shift_incidents%rowtype; v_state text; v_owner boolean:=false; v_owner_need text; v_id uuid; begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  select * into i from public.command_center_agency_shift_incidents where owner_id=u and incident_id=p_incident_id for update;
  if not found or i.state='resolved' then raise exception 'Open shift incident not found'; end if;
  if p_action_type not in ('contain','reroute','handoff','escalate_owner','resolve') or coalesce(btrim(p_reason),'')='' then raise exception 'Invalid Shift Manager action'; end if;
  perform command_center_private.c3_assert_unique_text_array(p_evidence_refs,'Shift action evidence');
  if cardinality(coalesce(p_evidence_refs,'{}'::text[]))=0 then raise exception 'Shift action requires evidence'; end if;
  if p_action_type in ('reroute','handoff') and (coalesce(btrim(p_to_worker_id),'')='' or not exists(select 1 from public.command_center_agency_worker_health w where w.owner_id=u and w.worker_id=btrim(p_to_worker_id) and w.state in ('idle','working') and w.project_id=i.project_id)) then raise exception 'Replacement worker unavailable or wrong project'; end if;
  v_state:=case p_action_type when 'contain' then 'contained' when 'reroute' then 'rerouted' when 'handoff' then 'handed_off' when 'escalate_owner' then 'needs_owner' else 'resolved' end;
  if p_action_type='escalate_owner' then v_owner:=true; v_owner_need:=btrim(p_reason); end if;
  insert into public.command_center_agency_shift_actions(owner_id,incident_id,action_type,from_worker_id,to_worker_id,task_id,reason,evidence_refs,occurred_at)
  values(u,i.incident_id,p_action_type,i.worker_id,nullif(btrim(coalesce(p_to_worker_id,'')),''),i.task_id,btrim(p_reason),p_evidence_refs,p_occurred_at) returning action_id into v_id;
  update public.command_center_agency_shift_incidents set state=v_state,owner_attention_required=v_owner,owner_need=v_owner_need,containment_ref=case when p_action_type='contain' then 'shift-action:'||v_id::text else containment_ref end,replacement_worker_id=case when p_action_type in ('reroute','handoff') then btrim(p_to_worker_id) else replacement_worker_id end,evidence_refs=p_evidence_refs,updated_at=p_occurred_at,resolved_at=case when p_action_type='resolve' then p_occurred_at else null end where owner_id=u and incident_id=i.incident_id;
  return jsonb_build_object('incident_id',i.incident_id,'state',v_state,'owner_attention_required',v_owner,'owner_need',v_owner_need,'replacement_worker_id',case when p_action_type in ('reroute','handoff') then btrim(p_to_worker_id) else i.replacement_worker_id end);
end $$;

revoke all on function public.command_center_agency_record_worker_health(text,text,text,text,text,integer,text[],text,timestamptz,text[]) from public,anon;
revoke all on function public.command_center_agency_inspect_shift(timestamptz,integer,integer,text[]) from public,anon;
revoke all on function public.command_center_agency_act_on_shift_incident(uuid,text,text,text,text[],timestamptz) from public,anon;
grant execute on function public.command_center_agency_record_worker_health(text,text,text,text,text,integer,text[],text,timestamptz,text[]) to authenticated;
grant execute on function public.command_center_agency_inspect_shift(timestamptz,integer,integer,text[]) to authenticated;
grant execute on function public.command_center_agency_act_on_shift_incident(uuid,text,text,text,text[],timestamptz) to authenticated;
