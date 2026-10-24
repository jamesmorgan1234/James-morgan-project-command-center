-- Category 5 / P5.12 — durable Ultimate Spec/domain completeness compiler.
-- Branch-only migration. No production state is changed by committing this file.

create table if not exists public.command_center_spec_dimension_requirements (
  owner_id uuid not null references auth.users(id) on delete cascade,
  playbook_key text not null,
  dimension_key text not null,
  matrix_group text not null,
  applicable_by_default boolean not null default true,
  required boolean not null default true,
  source_ref text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key(owner_id,playbook_key,dimension_key),
  check (length(btrim(playbook_key)) between 1 and 200),
  check (dimension_key ~ '^[a-z0-9][a-z0-9._:-]{0,159}$'),
  check (matrix_group in ('functional','nonfunctional','security','privacy','data','operations','recovery','cost','monetization','maintenance','testing','accessibility','future_dormant','domain')),
  check (length(btrim(source_ref)) between 1 and 1000),
  check (updated_at>=created_at)
);

create table if not exists public.command_center_project_specs (
  owner_id uuid not null references auth.users(id) on delete cascade,
  project_id text not null,
  spec_version bigint not null check (spec_version>=1),
  type_key text not null,
  playbook_key text not null,
  state text not null default 'draft' check (state in ('draft','complete','superseded')),
  source_ref text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  primary key(owner_id,project_id,spec_version),
  foreign key(owner_id,project_id) references public.command_center_project_profiles(owner_id,project_id) on delete cascade,
  foreign key(owner_id,type_key) references public.command_center_project_types(owner_id,type_key) on delete restrict,
  check (length(btrim(playbook_key)) between 1 and 200),
  check (length(btrim(source_ref)) between 1 and 1000),
  check ((state='complete' and completed_at is not null) or (state<>'complete' and completed_at is null)),
  check (updated_at>=created_at)
);

create table if not exists public.command_center_project_spec_dimensions (
  owner_id uuid not null,
  project_id text not null,
  spec_version bigint not null,
  dimension_key text not null,
  applicable boolean not null,
  state text not null check (state in ('addressed','excluded_with_reason','unknown')),
  evidence_refs text[] not null default '{}'::text[],
  exclusion_reason text,
  assumption_refs text[] not null default '{}'::text[],
  unknown_refs text[] not null default '{}'::text[],
  future_dormant_refs text[] not null default '{}'::text[],
  updated_at timestamptz not null default now(),
  primary key(owner_id,project_id,spec_version,dimension_key),
  foreign key(owner_id,project_id,spec_version) references public.command_center_project_specs(owner_id,project_id,spec_version) on delete cascade,
  check (dimension_key ~ '^[a-z0-9][a-z0-9._:-]{0,159}$'),
  check (state<>'addressed' or cardinality(evidence_refs)>0),
  check (state<>'excluded_with_reason' or length(btrim(coalesce(exclusion_reason,'')))>0),
  check (state='unknown' or cardinality(unknown_refs)=0)
);
create index if not exists command_center_project_spec_state_idx
  on public.command_center_project_spec_dimensions(owner_id,project_id,spec_version,state,dimension_key);

-- Browser roles can inspect specs but cannot self-certify completeness.
do $$
declare t text;
begin
  foreach t in array array['command_center_spec_dimension_requirements','command_center_project_specs','command_center_project_spec_dimensions'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('revoke all on table public.%I from public,anon,authenticated',t);
    execute format('grant select on table public.%I to authenticated',t);
    execute format('drop policy if exists %I on public.%I','c5_owner_select_'||t,t);
    execute format('create policy %I on public.%I for select to authenticated using (owner_id=(select auth.uid()) and (select public.is_command_center_authorized()))','c5_owner_select_'||t,t);
  end loop;
end $$;

create or replace function public.command_center_project_compile_spec(p_project_id text,p_spec_version bigint)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
  u uuid:=auth.uid(); s public.command_center_project_specs%rowtype; unresolved text[]; required_count bigint;
begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  select * into s from public.command_center_project_specs where owner_id=u and project_id=btrim(p_project_id) and spec_version=p_spec_version for update;
  if not found then raise exception 'Project spec not found'; end if;

  select count(*) into required_count from public.command_center_spec_dimension_requirements r
    where r.owner_id=u and r.playbook_key=s.playbook_key and r.required;
  if required_count=0 then
    return jsonb_build_object('project_id',s.project_id,'spec_version',s.spec_version,'complete',false,'unresolved_keys',jsonb_build_array('playbook:no_required_dimensions'));
  end if;

  select coalesce(array_agg(key order by key),'{}'::text[]) into unresolved
  from (
    select r.dimension_key as key
    from public.command_center_spec_dimension_requirements r
    left join public.command_center_project_spec_dimensions d
      on d.owner_id=r.owner_id and d.project_id=s.project_id and d.spec_version=s.spec_version and d.dimension_key=r.dimension_key
    where r.owner_id=u and r.playbook_key=s.playbook_key and r.required and (
      d.dimension_key is null
      or (coalesce(d.applicable,r.applicable_by_default) and d.state='unknown')
      or (coalesce(d.applicable,r.applicable_by_default) and d.state='addressed' and cardinality(d.evidence_refs)=0)
      or (coalesce(d.applicable,r.applicable_by_default) and d.state='excluded_with_reason' and coalesce(btrim(d.exclusion_reason),'')='')
    )
  ) q;

  if cardinality(unresolved)=0 then
    update public.command_center_project_specs set state='complete',completed_at=coalesce(completed_at,now()),updated_at=now()
      where owner_id=u and project_id=s.project_id and spec_version=s.spec_version;
  else
    update public.command_center_project_specs set state='draft',completed_at=null,updated_at=now()
      where owner_id=u and project_id=s.project_id and spec_version=s.spec_version;
  end if;
  return jsonb_build_object('project_id',s.project_id,'spec_version',s.spec_version,'complete',cardinality(unresolved)=0,'unresolved_keys',unresolved,'playbook_key',s.playbook_key);
end $$;

revoke all on function public.command_center_project_compile_spec(text,bigint) from public,anon;
grant execute on function public.command_center_project_compile_spec(text,bigint) to authenticated;
