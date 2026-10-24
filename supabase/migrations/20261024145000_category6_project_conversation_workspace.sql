-- Category 6 / P6.8 — durable project-specific Brain conversation workspace.
-- Branch-only migration. Workspace state resumes across sessions and uses optimistic versioning.

create table if not exists public.command_center_brain_project_workspaces (
  owner_id uuid not null references auth.users(id) on delete cascade,
  project_id text not null,
  version bigint not null check (version>=1),
  spec_version bigint not null check (spec_version>=1),
  conversation_id uuid references public.command_center_brain_conversations(conversation_id) on delete set null,
  turn_ids uuid[] not null default '{}'::uuid[],
  decision_refs text[] not null default '{}'::text[],
  execution_run_id text,
  blocker_refs text[] not null default '{}'::text[],
  evidence_refs text[] not null default '{}'::text[],
  verified_result_refs text[] not null default '{}'::text[],
  updated_at timestamptz not null,
  recorded_at timestamptz not null default now(),
  primary key(owner_id,project_id),
  foreign key(owner_id,project_id) references public.command_center_project_profiles(owner_id,project_id) on delete cascade,
  check (updated_at<=recorded_at + interval '5 minutes')
);

create table if not exists public.command_center_brain_project_workspace_versions (
  version_id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  project_id text not null,
  version bigint not null check (version>=1),
  spec_version bigint not null check (spec_version>=1),
  conversation_id uuid,
  turn_ids uuid[] not null,
  decision_refs text[] not null,
  execution_run_id text,
  blocker_refs text[] not null,
  evidence_refs text[] not null,
  verified_result_refs text[] not null,
  updated_at timestamptz not null,
  recorded_at timestamptz not null default now(),
  unique(owner_id,project_id,version),
  foreign key(owner_id,project_id) references public.command_center_brain_project_workspaces(owner_id,project_id) on delete cascade
);
create index if not exists command_center_brain_workspace_versions_idx
  on public.command_center_brain_project_workspace_versions(owner_id,project_id,version desc);

do $$
declare t text;
begin
  foreach t in array array['command_center_brain_project_workspaces','command_center_brain_project_workspace_versions'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('revoke all on table public.%I from public,anon,authenticated',t);
    execute format('grant select on table public.%I to authenticated',t);
    execute format('drop policy if exists %I on public.%I','c6_owner_select_'||t,t);
    execute format('create policy %I on public.%I for select to authenticated using (owner_id=(select auth.uid()) and (select public.is_command_center_authorized()))','c6_owner_select_'||t,t);
  end loop;
end $$;

create or replace function public.command_center_brain_save_project_workspace(
  p_project_id text,
  p_expected_version bigint,
  p_spec_version bigint,
  p_conversation_id uuid,
  p_turn_ids uuid[],
  p_decision_refs text[],
  p_execution_run_id text,
  p_blocker_refs text[],
  p_evidence_refs text[],
  p_verified_result_refs text[],
  p_updated_at timestamptz
) returns jsonb language plpgsql security definer set search_path='' as $$
declare
  u uuid:=auth.uid();
  w public.command_center_brain_project_workspaces%rowtype;
  v_next bigint;
  v_project text:=btrim(coalesce(p_project_id,''));
begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  if v_project='' or not exists(select 1 from public.command_center_project_profiles where owner_id=u and project_id=v_project) then raise exception 'Workspace project not found'; end if;
  if p_spec_version<1 then raise exception 'Workspace spec version required'; end if;
  perform command_center_private.c3_assert_unique_text_array(p_decision_refs,'Workspace decisions');
  perform command_center_private.c3_assert_unique_text_array(p_blocker_refs,'Workspace blockers');
  perform command_center_private.c3_assert_unique_text_array(p_evidence_refs,'Workspace evidence');
  perform command_center_private.c3_assert_unique_text_array(p_verified_result_refs,'Workspace verified results');
  if cardinality(coalesce(p_turn_ids,'{}'::uuid[]))<>cardinality(array(select distinct x from unnest(coalesce(p_turn_ids,'{}'::uuid[])) x)) then raise exception 'Workspace turn ids must be unique'; end if;
  if p_conversation_id is not null and not exists(select 1 from public.command_center_brain_conversations c where c.owner_id=u and c.conversation_id=p_conversation_id and c.project_id=v_project) then raise exception 'Workspace conversation scope mismatch'; end if;
  if exists(
    select 1 from unnest(coalesce(p_turn_ids,'{}'::uuid[])) tid
    where not exists(select 1 from public.command_center_brain_conversation_turns t where t.owner_id=u and t.turn_id=tid and t.project_id=v_project and (p_conversation_id is null or t.conversation_id=p_conversation_id))
  ) then raise exception 'Workspace turn is outside owner/project conversation scope'; end if;

  select * into w from public.command_center_brain_project_workspaces where owner_id=u and project_id=v_project for update;
  if not found then
    if p_expected_version<>0 then raise exception 'New workspace expected version must be 0'; end if;
    v_next:=1;
    insert into public.command_center_brain_project_workspaces(owner_id,project_id,version,spec_version,conversation_id,turn_ids,decision_refs,execution_run_id,blocker_refs,evidence_refs,verified_result_refs,updated_at)
    values(u,v_project,v_next,p_spec_version,p_conversation_id,coalesce(p_turn_ids,'{}'::uuid[]),coalesce(p_decision_refs,'{}'::text[]),nullif(btrim(coalesce(p_execution_run_id,'')),''),coalesce(p_blocker_refs,'{}'::text[]),coalesce(p_evidence_refs,'{}'::text[]),coalesce(p_verified_result_refs,'{}'::text[]),p_updated_at);
  else
    if w.version<>p_expected_version then raise exception 'Workspace version conflict'; end if;
    v_next:=w.version+1;
    update public.command_center_brain_project_workspaces set version=v_next,spec_version=p_spec_version,conversation_id=p_conversation_id,turn_ids=coalesce(p_turn_ids,'{}'::uuid[]),decision_refs=coalesce(p_decision_refs,'{}'::text[]),execution_run_id=nullif(btrim(coalesce(p_execution_run_id,'')),''),blocker_refs=coalesce(p_blocker_refs,'{}'::text[]),evidence_refs=coalesce(p_evidence_refs,'{}'::text[]),verified_result_refs=coalesce(p_verified_result_refs,'{}'::text[]),updated_at=p_updated_at,recorded_at=now() where owner_id=u and project_id=v_project;
  end if;

  insert into public.command_center_brain_project_workspace_versions(owner_id,project_id,version,spec_version,conversation_id,turn_ids,decision_refs,execution_run_id,blocker_refs,evidence_refs,verified_result_refs,updated_at)
  select owner_id,project_id,version,spec_version,conversation_id,turn_ids,decision_refs,execution_run_id,blocker_refs,evidence_refs,verified_result_refs,updated_at from public.command_center_brain_project_workspaces where owner_id=u and project_id=v_project;
  return jsonb_build_object('project_id',v_project,'version',v_next,'spec_version',p_spec_version,'resumable',true);
end $$;

revoke all on function public.command_center_brain_save_project_workspace(text,bigint,bigint,uuid,uuid[],text[],text,text[],text[],text[],timestamptz) from public,anon;
grant execute on function public.command_center_brain_save_project_workspace(text,bigint,bigint,uuid,uuid[],text[],text,text[],text[],text[],timestamptz) to authenticated;
