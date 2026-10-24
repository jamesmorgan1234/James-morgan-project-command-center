-- Category 5 / P5.3 — durable versioned roadmap/work-unit DAG and gate enforcement.
-- Branch-only migration. No production state is changed by committing this file.

create table if not exists public.command_center_project_roadmaps (
  owner_id uuid not null references auth.users(id) on delete cascade,
  project_id text not null,
  version bigint not null check (version >= 1),
  state text not null default 'current' check (state in ('current','superseded')),
  source_ref text not null,
  created_at timestamptz not null default now(),
  superseded_at timestamptz,
  primary key(owner_id,project_id,version),
  foreign key(owner_id,project_id) references public.command_center_project_profiles(owner_id,project_id) on delete cascade,
  check (length(btrim(source_ref)) between 1 and 1000),
  check ((state='current' and superseded_at is null) or (state='superseded' and superseded_at is not null))
);
create unique index if not exists command_center_project_one_current_roadmap_idx
  on public.command_center_project_roadmaps(owner_id,project_id) where state='current';

create table if not exists public.command_center_project_roadmap_gates (
  owner_id uuid not null,
  project_id text not null,
  roadmap_version bigint not null,
  gate_id text not null,
  satisfied boolean not null default false,
  evidence_refs text[] not null default '{}'::text[],
  updated_at timestamptz not null default now(),
  primary key(owner_id,project_id,roadmap_version,gate_id),
  foreign key(owner_id,project_id,roadmap_version) references public.command_center_project_roadmaps(owner_id,project_id,version) on delete cascade,
  check (length(btrim(gate_id)) between 1 and 200),
  check (not satisfied or cardinality(evidence_refs)>0)
);

create table if not exists public.command_center_project_work_units (
  owner_id uuid not null,
  project_id text not null,
  roadmap_version bigint not null,
  work_unit_id text not null,
  category_id text not null,
  phase_id text not null,
  title text not null,
  status text not null check (status in ('planned','ready','working','blocked','verified','skipped')),
  applicable boolean not null default true,
  dependency_ids text[] not null default '{}'::text[],
  gate_ids text[] not null default '{}'::text[],
  acceptance_criteria text[] not null,
  evidence_refs text[] not null default '{}'::text[],
  updated_at timestamptz not null default now(),
  primary key(owner_id,project_id,roadmap_version,work_unit_id),
  foreign key(owner_id,project_id,roadmap_version) references public.command_center_project_roadmaps(owner_id,project_id,version) on delete cascade,
  check (length(btrim(work_unit_id)) between 1 and 200),
  check (length(btrim(category_id)) between 1 and 200),
  check (length(btrim(phase_id)) between 1 and 200),
  check (length(btrim(title)) between 1 and 500),
  check (cardinality(acceptance_criteria)>0),
  check (work_unit_id <> all(dependency_ids)),
  check (status not in ('verified','skipped') or cardinality(evidence_refs)>0)
);
create index if not exists command_center_project_work_units_status_idx
  on public.command_center_project_work_units(owner_id,project_id,roadmap_version,status,work_unit_id);

-- Read-only browser access; all mutations use narrow RPCs.
do $$
declare t text;
begin
  foreach t in array array['command_center_project_roadmaps','command_center_project_roadmap_gates','command_center_project_work_units'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('revoke all on table public.%I from public,anon,authenticated',t);
    execute format('grant select on table public.%I to authenticated',t);
    execute format('drop policy if exists %I on public.%I','c5_owner_select_'||t,t);
    execute format('create policy %I on public.%I for select to authenticated using (owner_id=(select auth.uid()) and (select public.is_command_center_authorized()))','c5_owner_select_'||t,t);
  end loop;
end $$;

create or replace function command_center_private.c5_assert_roadmap_integrity(p_owner uuid,p_project_id text,p_version bigint)
returns void language plpgsql security definer set search_path='' as $$
declare r record; dep text; gate_key text; begin
  for r in select * from public.command_center_project_work_units where owner_id=p_owner and project_id=p_project_id and roadmap_version=p_version loop
    perform command_center_private.c5_assert_unique_text_array(r.dependency_ids,'Work-unit dependencies');
    perform command_center_private.c5_assert_unique_text_array(r.gate_ids,'Work-unit gates');
    perform command_center_private.c5_assert_unique_text_array(r.acceptance_criteria,'Acceptance criteria');
    foreach dep in array r.dependency_ids loop
      if not exists(select 1 from public.command_center_project_work_units where owner_id=p_owner and project_id=p_project_id and roadmap_version=p_version and work_unit_id=dep) then
        raise exception 'Unknown dependency % for %',dep,r.work_unit_id;
      end if;
    end loop;
    foreach gate_key in array r.gate_ids loop
      if not exists(select 1 from public.command_center_project_roadmap_gates where owner_id=p_owner and project_id=p_project_id and roadmap_version=p_version and gate_id=gate_key) then
        raise exception 'Unknown gate % for %',gate_key,r.work_unit_id;
      end if;
    end loop;
  end loop;
  if exists(
    with recursive walk(root,node,path,cycle) as (
      select w.work_unit_id,w.work_unit_id,array[w.work_unit_id]::text[],false
      from public.command_center_project_work_units w where w.owner_id=p_owner and w.project_id=p_project_id and w.roadmap_version=p_version
      union all
      select walk.root,d.dep,walk.path||d.dep,d.dep=any(walk.path)
      from walk
      join public.command_center_project_work_units w on w.owner_id=p_owner and w.project_id=p_project_id and w.roadmap_version=p_version and w.work_unit_id=walk.node
      cross join lateral unnest(w.dependency_ids) d(dep)
      where not walk.cycle
    ) select 1 from walk where cycle limit 1
  ) then raise exception 'Roadmap dependency cycle detected'; end if;
end $$;
revoke all on function command_center_private.c5_assert_roadmap_integrity(uuid,text,bigint) from public,anon,authenticated;

create or replace function public.command_center_project_work_readiness(p_project_id text,p_roadmap_version bigint,p_work_unit_id text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
  u uuid:=auth.uid(); w public.command_center_project_work_units%rowtype; deps text[]; gates text[];
begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  select * into w from public.command_center_project_work_units where owner_id=u and project_id=btrim(p_project_id) and roadmap_version=p_roadmap_version and work_unit_id=btrim(p_work_unit_id);
  if not found then raise exception 'Work unit not found'; end if;
  select coalesce(array_agg(dep order by dep),'{}'::text[]) into deps
    from unnest(w.dependency_ids) dep
    where not exists(select 1 from public.command_center_project_work_units d where d.owner_id=u and d.project_id=w.project_id and d.roadmap_version=w.roadmap_version and d.work_unit_id=dep and d.status in ('verified','skipped'));
  select coalesce(array_agg(gate_key order by gate_key),'{}'::text[]) into gates
    from unnest(w.gate_ids) gate_key
    where not exists(select 1 from public.command_center_project_roadmap_gates g where g.owner_id=u and g.project_id=w.project_id and g.roadmap_version=w.roadmap_version and g.gate_id=gate_key and g.satisfied);
  return jsonb_build_object('ready',w.applicable and cardinality(deps)=0 and cardinality(gates)=0 and w.status in ('planned','ready'),'unmet_dependencies',deps,'unmet_gates',gates);
end $$;

create or replace function public.command_center_project_set_work_status(
  p_project_id text,p_roadmap_version bigint,p_work_unit_id text,p_expected_status text,p_new_status text,p_evidence_refs text[]
)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
  u uuid:=auth.uid(); w public.command_center_project_work_units%rowtype; readiness jsonb;
begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  select * into w from public.command_center_project_work_units where owner_id=u and project_id=btrim(p_project_id) and roadmap_version=p_roadmap_version and work_unit_id=btrim(p_work_unit_id) for update;
  if not found then raise exception 'Work unit not found'; end if;
  if w.status<>p_expected_status then raise exception 'Work-unit status conflict'; end if;
  if p_new_status not in ('planned','ready','working','blocked','verified','skipped') then raise exception 'Invalid work-unit status'; end if;
  if p_new_status in ('ready','working','verified') then
    readiness:=public.command_center_project_work_readiness(w.project_id,w.roadmap_version,w.work_unit_id);
    if not coalesce((readiness->>'ready')::boolean,false) and not (p_new_status='verified' and w.status='working') then raise exception 'Work unit cannot advance past unmet dependencies or gates'; end if;
  end if;
  if p_new_status in ('verified','skipped') and cardinality(coalesce(p_evidence_refs,'{}'::text[]))=0 then raise exception 'Completion status requires evidence'; end if;
  update public.command_center_project_work_units set status=p_new_status,evidence_refs=coalesce(p_evidence_refs,evidence_refs),updated_at=now()
   where owner_id=u and project_id=w.project_id and roadmap_version=w.roadmap_version and work_unit_id=w.work_unit_id;
  return jsonb_build_object('project_id',w.project_id,'roadmap_version',w.roadmap_version,'work_unit_id',w.work_unit_id,'status',p_new_status);
end $$;

revoke all on function public.command_center_project_work_readiness(text,bigint,text) from public,anon;
revoke all on function public.command_center_project_set_work_status(text,bigint,text,text,text,text[]) from public,anon;
grant execute on function public.command_center_project_work_readiness(text,bigint,text) to authenticated;
grant execute on function public.command_center_project_set_work_status(text,bigint,text,text,text,text[]) to authenticated;
