-- Category 7 / P7.7 — immutable Agency task context packets with freshness and revalidation evidence.
-- Branch-only migration. Context packets freeze inputs; stale/wrong-project packets cannot authorize task commit.

create table if not exists public.command_center_agency_context_packets (
  owner_id uuid not null references auth.users(id) on delete cascade,
  packet_id uuid primary key,
  project_id text not null,
  run_ref text not null,
  task_id text not null,
  agent_generation bigint not null check (agent_generation>=1),
  goal_ref text not null,
  spec_version bigint not null check (spec_version>=1),
  owner_instruction_version bigint not null check (owner_instruction_version>=1),
  authorization_scope text[] not null,
  checkpoint_id uuid,
  dependency_output_refs text[] not null default '{}'::text[],
  provider_evidence_refs text[] not null default '{}'::text[],
  artifact_refs text[] not null default '{}'::text[],
  artifact_hashes text[] not null default '{}'::text[],
  source_refs jsonb not null check (jsonb_typeof(source_refs)='array'),
  max_sensitivity_rank integer not null check (max_sensitivity_rank between 0 and 1000),
  packet_hash text not null check (packet_hash ~ '^[a-f0-9]{64}$'),
  built_at timestamptz not null,
  stale_after timestamptz not null,
  evidence_refs text[] not null,
  created_at timestamptz not null default now(),
  foreign key(owner_id,project_id) references public.command_center_project_profiles(owner_id,project_id) on delete restrict,
  foreign key(owner_id,project_id,task_id) references public.command_center_agency_scheduled_tasks(owner_id,project_id,task_id) on delete restrict,
  foreign key(checkpoint_id) references public.command_center_project_checkpoints(checkpoint_id) on delete restrict,
  check (length(btrim(run_ref)) between 1 and 500),
  check (length(btrim(goal_ref)) between 1 and 1000),
  check (cardinality(authorization_scope)>0),
  check (cardinality(artifact_refs)=cardinality(artifact_hashes)),
  check (cardinality(evidence_refs)>0),
  check (stale_after>built_at),
  check (built_at<=created_at + interval '5 minutes')
);

create table if not exists public.command_center_agency_context_revalidations (
  revalidation_id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  packet_id uuid not null references public.command_center_agency_context_packets(packet_id) on delete restrict,
  project_id text not null,
  result text not null check (result in ('fresh','revalidated','rejected_stale','rejected_scope','rejected_generation','rejected_artifact')),
  new_packet_id uuid,
  evidence_refs text[] not null,
  reason text not null check (length(btrim(reason)) between 1 and 1000),
  checked_at timestamptz not null,
  recorded_at timestamptz not null default now(),
  check (cardinality(evidence_refs)>0),
  check ((result='revalidated' and new_packet_id is not null) or (result<>'revalidated' and new_packet_id is null)),
  check (checked_at<=recorded_at + interval '5 minutes')
);
create index if not exists command_center_agency_context_packet_task_idx
  on public.command_center_agency_context_packets(owner_id,project_id,task_id,built_at desc,packet_id);

do $$
declare t text;
begin
  foreach t in array array['command_center_agency_context_packets','command_center_agency_context_revalidations'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('revoke all on table public.%I from public,anon,authenticated',t);
    execute format('grant select on table public.%I to authenticated',t);
    execute format('drop policy if exists %I on public.%I','c7_owner_select_'||t,t);
    execute format('create policy %I on public.%I for select to authenticated using (owner_id=(select auth.uid()) and (select public.is_command_center_authorized()))','c7_owner_select_'||t,t);
  end loop;
end $$;

create or replace function public.command_center_agency_create_context_packet(
  p_packet_id uuid,p_project_id text,p_run_ref text,p_task_id text,p_agent_generation bigint,p_goal_ref text,p_spec_version bigint,p_owner_instruction_version bigint,p_authorization_scope text[],p_checkpoint_id uuid,p_dependency_output_refs text[],p_provider_evidence_refs text[],p_artifact_refs text[],p_artifact_hashes text[],p_source_refs jsonb,p_max_sensitivity_rank integer,p_built_at timestamptz,p_stale_after timestamptz,p_evidence_refs text[]
) returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); v_hash text; src jsonb; begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  if p_packet_id is null or not exists(select 1 from public.command_center_agency_scheduled_tasks t where t.owner_id=u and t.project_id=btrim(p_project_id) and t.task_id=btrim(p_task_id) and t.run_ref=btrim(p_run_ref)) then raise exception 'Context packet task/project/run mismatch'; end if;
  if not exists(select 1 from public.command_center_agency_project_agents a where a.owner_id=u and a.project_id=btrim(p_project_id) and a.generation=p_agent_generation and a.state<>'retired') then raise exception 'Context packet Project Agent generation mismatch'; end if;
  if p_checkpoint_id is not null and not exists(select 1 from public.command_center_project_checkpoints c where c.owner_id=u and c.project_id=btrim(p_project_id) and c.checkpoint_id=p_checkpoint_id) then raise exception 'Context packet checkpoint scope mismatch'; end if;
  if coalesce(btrim(p_goal_ref),'')='' or coalesce(p_spec_version,0)<1 or coalesce(p_owner_instruction_version,0)<1 then raise exception 'Context packet goal/spec/instruction versions required'; end if;
  if p_stale_after<=p_built_at then raise exception 'Context packet freshness window invalid'; end if;
  perform command_center_private.c3_assert_unique_text_array(p_authorization_scope,'Context authorization scope');
  perform command_center_private.c3_assert_unique_text_array(p_dependency_output_refs,'Context dependency outputs');
  perform command_center_private.c3_assert_unique_text_array(p_provider_evidence_refs,'Context provider evidence');
  perform command_center_private.c3_assert_unique_text_array(p_artifact_refs,'Context artifacts');
  perform command_center_private.c3_assert_unique_text_array(p_artifact_hashes,'Context artifact hashes');
  perform command_center_private.c3_assert_unique_text_array(p_evidence_refs,'Context packet evidence');
  if cardinality(coalesce(p_authorization_scope,'{}'::text[]))=0 or cardinality(coalesce(p_evidence_refs,'{}'::text[]))=0 then raise exception 'Context packet requires authorization scope/evidence'; end if;
  if cardinality(coalesce(p_artifact_refs,'{}'::text[]))<>cardinality(coalesce(p_artifact_hashes,'{}'::text[])) then raise exception 'Artifact references/hashes must align'; end if;
  if exists(select 1 from unnest(coalesce(p_artifact_hashes,'{}'::text[])) h where h !~ '^[a-f0-9]{64}$') then raise exception 'Artifact hash must be SHA-256 hex'; end if;
  if jsonb_typeof(p_source_refs)<>'array' then raise exception 'Context source refs must be array'; end if;
  for src in select value from jsonb_array_elements(p_source_refs) loop
    if coalesce(btrim(src->>'id'),'')='' or coalesce((src->>'version')::bigint,0)<1 or coalesce(src->>'contentHash','') !~ '^[a-f0-9]{64}$' then raise exception 'Invalid context source identity/version/hash'; end if;
    if coalesce((src->>'sensitivityRank')::integer,999999)>p_max_sensitivity_rank then raise exception 'Context source exceeds sensitivity envelope'; end if;
  end loop;
  v_hash:=encode(extensions.digest((btrim(p_project_id)||'|'||btrim(p_run_ref)||'|'||btrim(p_task_id)||'|'||p_agent_generation::text||'|'||btrim(p_goal_ref)||'|'||p_spec_version::text||'|'||p_owner_instruction_version::text||'|'||p_source_refs::text||'|'||array_to_string(p_artifact_hashes,',')),'sha256'),'hex');
  insert into public.command_center_agency_context_packets(owner_id,packet_id,project_id,run_ref,task_id,agent_generation,goal_ref,spec_version,owner_instruction_version,authorization_scope,checkpoint_id,dependency_output_refs,provider_evidence_refs,artifact_refs,artifact_hashes,source_refs,max_sensitivity_rank,packet_hash,built_at,stale_after,evidence_refs)
  values(u,p_packet_id,btrim(p_project_id),btrim(p_run_ref),btrim(p_task_id),p_agent_generation,btrim(p_goal_ref),p_spec_version,p_owner_instruction_version,p_authorization_scope,p_checkpoint_id,coalesce(p_dependency_output_refs,'{}'::text[]),coalesce(p_provider_evidence_refs,'{}'::text[]),coalesce(p_artifact_refs,'{}'::text[]),coalesce(p_artifact_hashes,'{}'::text[]),p_source_refs,p_max_sensitivity_rank,v_hash,p_built_at,p_stale_after,p_evidence_refs);
  return jsonb_build_object('packet_id',p_packet_id,'packet_hash',v_hash,'immutable',true,'stale_after',p_stale_after);
end $$;

create or replace function public.command_center_agency_assert_context_commit_allowed(
  p_packet_id uuid,p_project_id text,p_task_id text,p_agent_generation bigint,p_now timestamptz
) returns boolean language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); p public.command_center_agency_context_packets%rowtype; begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  select * into p from public.command_center_agency_context_packets where owner_id=u and packet_id=p_packet_id;
  if not found or p.project_id<>btrim(p_project_id) or p.task_id<>btrim(p_task_id) then raise exception 'Wrong-project/task context packet cannot commit'; end if;
  if p.agent_generation<>p_agent_generation then raise exception 'Stale Project Agent generation context cannot commit'; end if;
  if p_now>=p.stale_after then raise exception 'Stale context packet requires revalidation'; end if;
  if not exists(select 1 from public.command_center_agency_project_agents a where a.owner_id=u and a.project_id=p.project_id and a.generation=p_agent_generation and a.state<>'retired') then raise exception 'Current Project Agent generation no longer matches context'; end if;
  return true;
end $$;

revoke all on function public.command_center_agency_create_context_packet(uuid,text,text,text,bigint,text,bigint,bigint,text[],uuid,text[],text[],text[],text[],jsonb,integer,timestamptz,timestamptz,text[]) from public,anon;
revoke all on function public.command_center_agency_assert_context_commit_allowed(uuid,text,text,bigint,timestamptz) from public,anon;
grant execute on function public.command_center_agency_create_context_packet(uuid,text,text,text,bigint,text,bigint,bigint,text[],uuid,text[],text[],text[],text[],jsonb,integer,timestamptz,timestamptz,text[]) to authenticated;
grant execute on function public.command_center_agency_assert_context_commit_allowed(uuid,text,text,bigint,timestamptz) to authenticated;
