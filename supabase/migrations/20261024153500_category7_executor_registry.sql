-- Category 7 / P7.2 — durable Agency capability/executor registry.
-- Branch-only migration. Executors are registry-driven and may be added/retired without orchestration-core edits.

create table if not exists public.command_center_agency_executors (
  owner_id uuid not null references auth.users(id) on delete cascade,
  executor_key text not null,
  version bigint not null default 1 check (version>=1),
  enabled boolean not null default false,
  environments text[] not null,
  capabilities text[] not null,
  project_type_keys text[] not null default '{}'::text[],
  account_scopes text[] not null default '{}'::text[],
  permission_scopes text[] not null default '{}'::text[],
  authority_class text not null check (authority_class in ('read_only','propose','execute_reversible','execute_protected')),
  cost_class text not null check (cost_class in ('free','paid','unknown')),
  health text not null check (health in ('available','degraded','unavailable','unconfigured')),
  verification_strategy text not null check (verification_strategy in ('self_evidence','independent','external')),
  max_risk text not null check (max_risk in ('low','medium','high')),
  executor_ref text not null check (length(btrim(executor_ref)) between 1 and 1000),
  evidence_semantics text[] not null,
  evidence_refs text[] not null,
  retired_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key(owner_id,executor_key),
  check (executor_key ~ '^executor:[a-z0-9][a-z0-9._:-]{0,180}$'),
  check (cardinality(environments)>0),
  check (cardinality(capabilities)>0),
  check (cardinality(evidence_semantics)>0),
  check (cardinality(evidence_refs)>0),
  check (environments <@ array['normal_chat','work','deterministic']::text[]),
  check (updated_at>=created_at),
  check (retired_at is null or retired_at>=created_at)
);

create table if not exists public.command_center_agency_executor_versions (
  version_id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  executor_key text not null,
  version bigint not null check (version>=1),
  enabled boolean not null,
  environments text[] not null,
  capabilities text[] not null,
  project_type_keys text[] not null,
  account_scopes text[] not null,
  permission_scopes text[] not null,
  authority_class text not null,
  cost_class text not null,
  health text not null,
  verification_strategy text not null,
  max_risk text not null,
  executor_ref text not null,
  evidence_semantics text[] not null,
  evidence_refs text[] not null,
  retired_at timestamptz,
  source_ref text not null check (length(btrim(source_ref)) between 1 and 1000),
  recorded_at timestamptz not null default now(),
  unique(owner_id,executor_key,version),
  foreign key(owner_id,executor_key) references public.command_center_agency_executors(owner_id,executor_key) on delete cascade
);
create index if not exists command_center_agency_executor_eligibility_idx
  on public.command_center_agency_executors(owner_id,enabled,health,cost_class,max_risk,retired_at,executor_key);

do $$
declare t text;
begin
  foreach t in array array['command_center_agency_executors','command_center_agency_executor_versions'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('revoke all on table public.%I from public,anon,authenticated',t);
    execute format('grant select on table public.%I to authenticated',t);
    execute format('drop policy if exists %I on public.%I','c7_owner_select_'||t,t);
    execute format('create policy %I on public.%I for select to authenticated using (owner_id=(select auth.uid()) and (select public.is_command_center_authorized()))','c7_owner_select_'||t,t);
  end loop;
end $$;

create or replace function public.command_center_agency_register_executor(
  p_executor_key text,p_enabled boolean,p_environments text[],p_capabilities text[],p_project_type_keys text[],p_account_scopes text[],p_permission_scopes text[],p_authority_class text,p_cost_class text,p_health text,p_verification_strategy text,p_max_risk text,p_executor_ref text,p_evidence_semantics text[],p_evidence_refs text[],p_source_ref text
) returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  if coalesce(btrim(p_executor_key),'') !~ '^executor:[a-z0-9][a-z0-9._:-]{0,180}$' then raise exception 'Invalid executor key'; end if;
  if p_authority_class not in ('read_only','propose','execute_reversible','execute_protected') or p_cost_class not in ('free','paid','unknown') or p_health not in ('available','degraded','unavailable','unconfigured') or p_verification_strategy not in ('self_evidence','independent','external') or p_max_risk not in ('low','medium','high') then raise exception 'Invalid executor classification'; end if;
  if exists(select 1 from unnest(coalesce(p_environments,'{}'::text[])) x where x not in ('normal_chat','work','deterministic')) then raise exception 'Invalid executor environment'; end if;
  perform command_center_private.c3_assert_unique_text_array(p_environments,'Executor environments');
  perform command_center_private.c3_assert_unique_text_array(p_capabilities,'Executor capabilities');
  perform command_center_private.c3_assert_unique_text_array(p_project_type_keys,'Executor project types');
  perform command_center_private.c3_assert_unique_text_array(p_account_scopes,'Executor account scopes');
  perform command_center_private.c3_assert_unique_text_array(p_permission_scopes,'Executor permission scopes');
  perform command_center_private.c3_assert_unique_text_array(p_evidence_semantics,'Executor evidence semantics');
  perform command_center_private.c3_assert_unique_text_array(p_evidence_refs,'Executor evidence');
  if cardinality(coalesce(p_environments,'{}'::text[]))=0 or cardinality(coalesce(p_capabilities,'{}'::text[]))=0 or cardinality(coalesce(p_evidence_semantics,'{}'::text[]))=0 or cardinality(coalesce(p_evidence_refs,'{}'::text[]))=0 or coalesce(btrim(p_executor_ref),'')='' or coalesce(btrim(p_source_ref),'')='' then raise exception 'Executor requires environment/capability/evidence/reference/source'; end if;
  insert into public.command_center_agency_executors(owner_id,executor_key,version,enabled,environments,capabilities,project_type_keys,account_scopes,permission_scopes,authority_class,cost_class,health,verification_strategy,max_risk,executor_ref,evidence_semantics,evidence_refs)
  values(u,btrim(p_executor_key),1,p_enabled,p_environments,p_capabilities,coalesce(p_project_type_keys,'{}'::text[]),coalesce(p_account_scopes,'{}'::text[]),coalesce(p_permission_scopes,'{}'::text[]),p_authority_class,p_cost_class,p_health,p_verification_strategy,p_max_risk,btrim(p_executor_ref),p_evidence_semantics,p_evidence_refs);
  insert into public.command_center_agency_executor_versions(owner_id,executor_key,version,enabled,environments,capabilities,project_type_keys,account_scopes,permission_scopes,authority_class,cost_class,health,verification_strategy,max_risk,executor_ref,evidence_semantics,evidence_refs,source_ref)
  values(u,btrim(p_executor_key),1,p_enabled,p_environments,p_capabilities,coalesce(p_project_type_keys,'{}'::text[]),coalesce(p_account_scopes,'{}'::text[]),coalesce(p_permission_scopes,'{}'::text[]),p_authority_class,p_cost_class,p_health,p_verification_strategy,p_max_risk,btrim(p_executor_ref),p_evidence_semantics,p_evidence_refs,btrim(p_source_ref));
  return jsonb_build_object('executor_key',btrim(p_executor_key),'version',1,'registered',true);
end $$;

create or replace function public.command_center_agency_update_executor_state(
  p_executor_key text,p_expected_version bigint,p_enabled boolean,p_health text,p_retire boolean,p_evidence_refs text[],p_source_ref text
) returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); e public.command_center_agency_executors%rowtype; v_next bigint; v_retired timestamptz; begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  select * into e from public.command_center_agency_executors where owner_id=u and executor_key=btrim(p_executor_key) for update;
  if not found then raise exception 'Executor not found'; end if;
  if e.version<>p_expected_version then raise exception 'Executor version conflict'; end if;
  if p_health not in ('available','degraded','unavailable','unconfigured') then raise exception 'Invalid executor health'; end if;
  perform command_center_private.c3_assert_unique_text_array(p_evidence_refs,'Executor state evidence');
  if cardinality(coalesce(p_evidence_refs,'{}'::text[]))=0 or coalesce(btrim(p_source_ref),'')='' then raise exception 'Executor state update requires evidence/source'; end if;
  v_next:=e.version+1;
  v_retired:=case when p_retire then coalesce(e.retired_at,now()) else e.retired_at end;
  update public.command_center_agency_executors set version=v_next,enabled=case when p_retire then false else p_enabled end,health=p_health,evidence_refs=p_evidence_refs,retired_at=v_retired,updated_at=now() where owner_id=u and executor_key=e.executor_key;
  insert into public.command_center_agency_executor_versions(owner_id,executor_key,version,enabled,environments,capabilities,project_type_keys,account_scopes,permission_scopes,authority_class,cost_class,health,verification_strategy,max_risk,executor_ref,evidence_semantics,evidence_refs,retired_at,source_ref)
  select owner_id,executor_key,version,enabled,environments,capabilities,project_type_keys,account_scopes,permission_scopes,authority_class,cost_class,health,verification_strategy,max_risk,executor_ref,evidence_semantics,evidence_refs,retired_at,btrim(p_source_ref) from public.command_center_agency_executors where owner_id=u and executor_key=e.executor_key;
  return jsonb_build_object('executor_key',e.executor_key,'version',v_next,'retired',v_retired is not null);
end $$;

revoke all on function public.command_center_agency_register_executor(text,boolean,text[],text[],text[],text[],text[],text,text,text,text,text,text,text[],text[],text) from public,anon;
revoke all on function public.command_center_agency_update_executor_state(text,bigint,boolean,text,boolean,text[],text) from public,anon;
grant execute on function public.command_center_agency_register_executor(text,boolean,text[],text[],text[],text[],text[],text,text,text,text,text,text,text[],text[],text) to authenticated;
grant execute on function public.command_center_agency_update_executor_state(text,bigint,boolean,text,boolean,text[],text) to authenticated;
