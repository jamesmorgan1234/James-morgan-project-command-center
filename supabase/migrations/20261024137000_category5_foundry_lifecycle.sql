-- Category 5 / P5.11 — durable governed Project Foundry lifecycle.
-- Branch-only migration. No production state is changed by committing this file.

create table if not exists public.command_center_project_foundry_runs (
  owner_id uuid not null references auth.users(id) on delete cascade,
  foundry_id uuid primary key default gen_random_uuid(),
  project_id text not null,
  stage text not null check (stage in ('idea','research','ultimate_spec','architecture','roadmap','owner_authorization','agency_execution','evidence','acceptance')),
  spec_version bigint not null default 1 check (spec_version>=1),
  requirement_refs text[] not null default '{}'::text[],
  decision_refs text[] not null default '{}'::text[],
  artifact_refs text[] not null default '{}'::text[],
  owner_authorization_ref text,
  state text not null default 'active' check (state in ('active','accepted','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key(owner_id,project_id) references public.command_center_project_profiles(owner_id,project_id) on delete restrict,
  check (updated_at>=created_at),
  check (stage<>'agency_execution' or owner_authorization_ref is not null)
);
create unique index if not exists command_center_project_one_active_foundry_idx
  on public.command_center_project_foundry_runs(owner_id,project_id) where state='active';

create table if not exists public.command_center_project_foundry_transitions (
  transition_id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  foundry_id uuid not null references public.command_center_project_foundry_runs(foundry_id) on delete cascade,
  project_id text not null,
  from_stage text,
  to_stage text not null,
  evidence_ref text not null,
  owner_authorization_ref text,
  occurred_at timestamptz not null,
  recorded_at timestamptz not null default now(),
  check (length(btrim(evidence_ref)) between 1 and 1000),
  check (occurred_at<=recorded_at + interval '5 minutes')
);
create index if not exists command_center_project_foundry_history_idx
  on public.command_center_project_foundry_transitions(owner_id,project_id,occurred_at,transition_id);

-- Browser roles are read-only.
do $$
declare t text;
begin
  foreach t in array array['command_center_project_foundry_runs','command_center_project_foundry_transitions'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('revoke all on table public.%I from public,anon,authenticated',t);
    execute format('grant select on table public.%I to authenticated',t);
    execute format('drop policy if exists %I on public.%I','c5_owner_select_'||t,t);
    execute format('create policy %I on public.%I for select to authenticated using (owner_id=(select auth.uid()) and (select public.is_command_center_authorized()))','c5_owner_select_'||t,t);
  end loop;
end $$;

create or replace function public.command_center_project_start_foundry(
  p_project_id text,p_spec_version bigint,p_requirement_refs text[],p_decision_refs text[],p_evidence_ref text,p_occurred_at timestamptz
)
returns uuid language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); v_id uuid; begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  if not exists(select 1 from public.command_center_project_profiles where owner_id=u and project_id=btrim(p_project_id)) then raise exception 'Project not found'; end if;
  if coalesce(p_spec_version,0)<1 or coalesce(btrim(p_evidence_ref),'')='' then raise exception 'Foundry spec version and evidence are required'; end if;
  perform command_center_private.c5_assert_unique_text_array(p_requirement_refs,'Foundry requirements');
  perform command_center_private.c5_assert_unique_text_array(p_decision_refs,'Foundry decisions');
  insert into public.command_center_project_foundry_runs(owner_id,project_id,stage,spec_version,requirement_refs,decision_refs,artifact_refs)
  values(u,btrim(p_project_id),'idea',p_spec_version,coalesce(p_requirement_refs,'{}'::text[]),coalesce(p_decision_refs,'{}'::text[]),array[btrim(p_evidence_ref)])
  returning foundry_id into v_id;
  insert into public.command_center_project_foundry_transitions(owner_id,foundry_id,project_id,from_stage,to_stage,evidence_ref,occurred_at)
  values(u,v_id,btrim(p_project_id),null,'idea',btrim(p_evidence_ref),p_occurred_at);
  return v_id;
end $$;

create or replace function public.command_center_project_advance_foundry(
  p_foundry_id uuid,p_to_stage text,p_evidence_ref text,p_owner_authorization_ref text,p_occurred_at timestamptz
)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
  u uuid:=auth.uid(); r public.command_center_project_foundry_runs%rowtype; v_to text:=btrim(coalesce(p_to_stage,'')); v_expected text; v_auth text;
begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  select * into r from public.command_center_project_foundry_runs where owner_id=u and foundry_id=p_foundry_id and state='active' for update;
  if not found then raise exception 'Active Foundry run not found'; end if;
  if coalesce(btrim(p_evidence_ref),'')='' then raise exception 'Foundry transition requires evidence'; end if;
  v_expected:=case r.stage
    when 'idea' then 'research'
    when 'research' then 'ultimate_spec'
    when 'ultimate_spec' then 'architecture'
    when 'architecture' then 'roadmap'
    when 'roadmap' then 'owner_authorization'
    when 'owner_authorization' then 'agency_execution'
    when 'agency_execution' then 'evidence'
    when 'evidence' then 'acceptance'
    else null end;
  if v_expected is null or v_to<>v_expected then raise exception 'Invalid Foundry transition: % -> %',r.stage,v_to; end if;

  v_auth:=r.owner_authorization_ref;
  if v_to='agency_execution' then
    if coalesce(btrim(p_owner_authorization_ref),'')='' then raise exception 'Agency execution requires exact owner authorization reference'; end if;
    if not exists(
      select 1 from public.command_center_project_authorizations a
      where a.owner_id=u and a.project_id=r.project_id and a.authorization_key='project-auth:agent-access'
        and a.state='enabled' and a.owner_decision_ref=btrim(p_owner_authorization_ref)
    ) then raise exception 'Project Agent access is not owner-authorized'; end if;
    v_auth:=btrim(p_owner_authorization_ref);
  end if;

  update public.command_center_project_foundry_runs
    set stage=v_to,owner_authorization_ref=v_auth,artifact_refs=array_append(artifact_refs,btrim(p_evidence_ref)),
        state=case when v_to='acceptance' then 'accepted' else state end,updated_at=now()
    where owner_id=u and foundry_id=r.foundry_id;
  insert into public.command_center_project_foundry_transitions(owner_id,foundry_id,project_id,from_stage,to_stage,evidence_ref,owner_authorization_ref,occurred_at)
  values(u,r.foundry_id,r.project_id,r.stage,v_to,btrim(p_evidence_ref),case when v_to='agency_execution' then v_auth else null end,p_occurred_at);
  return jsonb_build_object('foundry_id',r.foundry_id,'project_id',r.project_id,'stage',v_to,'state',case when v_to='acceptance' then 'accepted' else 'active' end);
end $$;

revoke all on function public.command_center_project_start_foundry(text,bigint,text[],text[],text,timestamptz) from public,anon;
revoke all on function public.command_center_project_advance_foundry(uuid,text,text,text,timestamptz) from public,anon;
grant execute on function public.command_center_project_start_foundry(text,bigint,text[],text[],text,timestamptz) to authenticated;
grant execute on function public.command_center_project_advance_foundry(uuid,text,text,text,timestamptz) to authenticated;
