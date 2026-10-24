-- Category 7 / P7.1 — durable Project Agent orchestration state.
-- Branch-only migration. A browser/client is not the owner of Project Agent state.

create table if not exists public.command_center_agency_project_agents (
  owner_id uuid not null references auth.users(id) on delete cascade,
  project_id text not null,
  agent_id text not null,
  version bigint not null default 1 check (version>=1),
  generation bigint not null default 1 check (generation>=1),
  state text not null check (state in ('ready','working','blocked','paused','retired')),
  mission_ref text not null check (length(btrim(mission_ref)) between 1 and 1000),
  mission_hash text not null check (mission_hash ~ '^[a-f0-9]{64}$'),
  context_version bigint not null check (context_version>=1),
  policy_version bigint not null check (policy_version>=1),
  queue_ref text not null check (length(btrim(queue_ref)) between 1 and 1000),
  checkpoint_id uuid,
  active_run_ref text,
  blocker_ref text,
  state_hash text not null check (state_hash ~ '^[a-f0-9]{64}$'),
  evidence_refs text[] not null,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  recorded_at timestamptz not null default now(),
  primary key(owner_id,project_id),
  unique(owner_id,agent_id),
  foreign key(owner_id,project_id) references public.command_center_project_profiles(owner_id,project_id) on delete cascade,
  foreign key(checkpoint_id) references public.command_center_project_checkpoints(checkpoint_id) on delete restrict,
  check (agent_id ~ '^project-agent:[a-zA-Z0-9._:-]{1,220}$'),
  check (cardinality(evidence_refs)>0),
  check (updated_at>=created_at),
  check (updated_at<=recorded_at + interval '5 minutes'),
  check ((state='blocked' and blocker_ref is not null) or state<>'blocked')
);

create table if not exists public.command_center_agency_project_agent_versions (
  version_id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  project_id text not null,
  agent_id text not null,
  version bigint not null check (version>=1),
  generation bigint not null check (generation>=1),
  state text not null,
  mission_ref text not null,
  mission_hash text not null,
  context_version bigint not null,
  policy_version bigint not null,
  queue_ref text not null,
  checkpoint_id uuid,
  active_run_ref text,
  blocker_ref text,
  state_hash text not null,
  evidence_refs text[] not null,
  updated_at timestamptz not null,
  source_ref text not null check (length(btrim(source_ref)) between 1 and 1000),
  recorded_at timestamptz not null default now(),
  unique(owner_id,project_id,version),
  foreign key(owner_id,project_id) references public.command_center_agency_project_agents(owner_id,project_id) on delete cascade
);
create index if not exists command_center_agency_project_agent_versions_idx
  on public.command_center_agency_project_agent_versions(owner_id,project_id,version desc);

-- Project Agent state is owner-readable but browser roles never mutate tables directly.
do $$
declare t text;
begin
  foreach t in array array['command_center_agency_project_agents','command_center_agency_project_agent_versions'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('revoke all on table public.%I from public,anon,authenticated',t);
    execute format('grant select on table public.%I to authenticated',t);
    execute format('drop policy if exists %I on public.%I','c7_owner_select_'||t,t);
    execute format('create policy %I on public.%I for select to authenticated using (owner_id=(select auth.uid()) and (select public.is_command_center_authorized()))','c7_owner_select_'||t,t);
  end loop;
end $$;

create or replace function public.command_center_agency_create_project_agent(
  p_project_id text,
  p_agent_id text,
  p_state text,
  p_mission_ref text,
  p_mission_hash text,
  p_context_version bigint,
  p_policy_version bigint,
  p_queue_ref text,
  p_checkpoint_id uuid,
  p_active_run_ref text,
  p_blocker_ref text,
  p_evidence_refs text[],
  p_source_ref text,
  p_created_at timestamptz
)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
  u uuid:=auth.uid();
  v_project text:=btrim(coalesce(p_project_id,''));
  v_hash text;
begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  if v_project='' or not exists(select 1 from public.command_center_project_profiles where owner_id=u and project_id=v_project) then raise exception 'Project Agent requires canonical project'; end if;
  if coalesce(btrim(p_agent_id),'') !~ '^project-agent:[a-zA-Z0-9._:-]{1,220}$' then raise exception 'Invalid Project Agent id'; end if;
  if p_state not in ('ready','working','blocked','paused','retired') then raise exception 'Invalid Project Agent state'; end if;
  if p_state='blocked' and coalesce(btrim(p_blocker_ref),'')='' then raise exception 'Blocked Project Agent requires blocker'; end if;
  if coalesce(btrim(p_mission_ref),'')='' or coalesce(p_mission_hash,'') !~ '^[a-f0-9]{64}$' or coalesce(btrim(p_queue_ref),'')='' then raise exception 'Project Agent mission/queue identity required'; end if;
  if coalesce(p_context_version,0)<1 or coalesce(p_policy_version,0)<1 then raise exception 'Project Agent context/policy versions required'; end if;
  if p_checkpoint_id is not null and not exists(select 1 from public.command_center_project_checkpoints where owner_id=u and project_id=v_project and checkpoint_id=p_checkpoint_id) then raise exception 'Project Agent checkpoint scope mismatch'; end if;
  perform command_center_private.c3_assert_unique_text_array(p_evidence_refs,'Project Agent evidence');
  if cardinality(coalesce(p_evidence_refs,'{}'::text[]))=0 or coalesce(btrim(p_source_ref),'')='' then raise exception 'Project Agent requires evidence/source'; end if;
  v_hash:=encode(extensions.digest((v_project||'|'||btrim(p_agent_id)||'|1|1|'||p_state||'|'||p_mission_hash||'|'||p_context_version::text||'|'||p_policy_version::text||'|'||btrim(p_queue_ref)||'|'||coalesce(p_checkpoint_id::text,'')||'|'||coalesce(btrim(p_active_run_ref),'')||'|'||coalesce(btrim(p_blocker_ref),'')),'sha256'),'hex');
  insert into public.command_center_agency_project_agents(owner_id,project_id,agent_id,version,generation,state,mission_ref,mission_hash,context_version,policy_version,queue_ref,checkpoint_id,active_run_ref,blocker_ref,state_hash,evidence_refs,created_at,updated_at)
  values(u,v_project,btrim(p_agent_id),1,1,p_state,btrim(p_mission_ref),p_mission_hash,p_context_version,p_policy_version,btrim(p_queue_ref),p_checkpoint_id,nullif(btrim(coalesce(p_active_run_ref,'')),''),nullif(btrim(coalesce(p_blocker_ref,'')),''),v_hash,p_evidence_refs,p_created_at,p_created_at);
  insert into public.command_center_agency_project_agent_versions(owner_id,project_id,agent_id,version,generation,state,mission_ref,mission_hash,context_version,policy_version,queue_ref,checkpoint_id,active_run_ref,blocker_ref,state_hash,evidence_refs,updated_at,source_ref)
  values(u,v_project,btrim(p_agent_id),1,1,p_state,btrim(p_mission_ref),p_mission_hash,p_context_version,p_policy_version,btrim(p_queue_ref),p_checkpoint_id,nullif(btrim(coalesce(p_active_run_ref,'')),''),nullif(btrim(coalesce(p_blocker_ref,'')),''),v_hash,p_evidence_refs,p_created_at,btrim(p_source_ref));
  return jsonb_build_object('project_id',v_project,'agent_id',btrim(p_agent_id),'version',1,'generation',1,'state',p_state,'state_hash',v_hash,'server_authoritative',true);
end $$;

create or replace function public.command_center_agency_update_project_agent(
  p_project_id text,
  p_expected_version bigint,
  p_expected_generation bigint,
  p_state text,
  p_context_version bigint,
  p_policy_version bigint,
  p_queue_ref text,
  p_checkpoint_id uuid,
  p_active_run_ref text,
  p_blocker_ref text,
  p_advance_generation boolean,
  p_evidence_refs text[],
  p_source_ref text,
  p_updated_at timestamptz
)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
  u uuid:=auth.uid();
  a public.command_center_agency_project_agents%rowtype;
  v_version bigint;
  v_generation bigint;
  v_hash text;
begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  select * into a from public.command_center_agency_project_agents where owner_id=u and project_id=btrim(p_project_id) for update;
  if not found then raise exception 'Project Agent not found'; end if;
  if a.version<>p_expected_version or a.generation<>p_expected_generation then raise exception 'Project Agent stale version/generation'; end if;
  if p_state not in ('ready','working','blocked','paused','retired') then raise exception 'Invalid Project Agent state'; end if;
  if p_state='blocked' and coalesce(btrim(p_blocker_ref),'')='' then raise exception 'Blocked Project Agent requires blocker'; end if;
  if p_checkpoint_id is not null and not exists(select 1 from public.command_center_project_checkpoints where owner_id=u and project_id=a.project_id and checkpoint_id=p_checkpoint_id) then raise exception 'Project Agent checkpoint scope mismatch'; end if;
  perform command_center_private.c3_assert_unique_text_array(p_evidence_refs,'Project Agent evidence');
  if cardinality(coalesce(p_evidence_refs,'{}'::text[]))=0 or coalesce(btrim(p_source_ref),'')='' then raise exception 'Project Agent update requires evidence/source'; end if;
  v_version:=a.version+1;
  v_generation:=a.generation + case when p_advance_generation then 1 else 0 end;
  v_hash:=encode(extensions.digest((a.project_id||'|'||a.agent_id||'|'||v_version::text||'|'||v_generation::text||'|'||p_state||'|'||a.mission_hash||'|'||p_context_version::text||'|'||p_policy_version::text||'|'||btrim(p_queue_ref)||'|'||coalesce(p_checkpoint_id::text,'')||'|'||coalesce(btrim(p_active_run_ref),'')||'|'||coalesce(btrim(p_blocker_ref),'')),'sha256'),'hex');
  update public.command_center_agency_project_agents set version=v_version,generation=v_generation,state=p_state,context_version=p_context_version,policy_version=p_policy_version,queue_ref=btrim(p_queue_ref),checkpoint_id=p_checkpoint_id,active_run_ref=nullif(btrim(coalesce(p_active_run_ref,'')),''),blocker_ref=nullif(btrim(coalesce(p_blocker_ref,'')),''),state_hash=v_hash,evidence_refs=p_evidence_refs,updated_at=p_updated_at,recorded_at=now() where owner_id=u and project_id=a.project_id;
  insert into public.command_center_agency_project_agent_versions(owner_id,project_id,agent_id,version,generation,state,mission_ref,mission_hash,context_version,policy_version,queue_ref,checkpoint_id,active_run_ref,blocker_ref,state_hash,evidence_refs,updated_at,source_ref)
  select owner_id,project_id,agent_id,version,generation,state,mission_ref,mission_hash,context_version,policy_version,queue_ref,checkpoint_id,active_run_ref,blocker_ref,state_hash,evidence_refs,updated_at,btrim(p_source_ref) from public.command_center_agency_project_agents where owner_id=u and project_id=a.project_id;
  return jsonb_build_object('project_id',a.project_id,'agent_id',a.agent_id,'version',v_version,'generation',v_generation,'state',p_state,'state_hash',v_hash,'server_authoritative',true);
end $$;

revoke all on function public.command_center_agency_create_project_agent(text,text,text,text,text,bigint,bigint,text,uuid,text,text,text[],text,timestamptz) from public,anon;
revoke all on function public.command_center_agency_update_project_agent(text,bigint,bigint,text,bigint,bigint,text,uuid,text,text,boolean,text[],text,timestamptz) from public,anon;
grant execute on function public.command_center_agency_create_project_agent(text,text,text,text,text,bigint,bigint,text,uuid,text,text,text[],text,timestamptz) to authenticated;
grant execute on function public.command_center_agency_update_project_agent(text,bigint,bigint,text,bigint,bigint,text,uuid,text,text,boolean,text[],text,timestamptz) to authenticated;
