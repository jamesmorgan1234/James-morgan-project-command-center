-- Category 6 / P6.13 — durable evidence-backed Improvements Center.
-- Branch-only migration. Improvements never self-install or silently rewrite roadmap scope.

create table if not exists public.command_center_brain_improvement_proposals (
  owner_id uuid not null references auth.users(id) on delete cascade,
  improvement_id uuid primary key default gen_random_uuid(),
  project_id text,
  area text not null check (area in ('roadmap_gap','manual_work','fragility','provider','cost','security','historical_lesson','quality')),
  title text not null check (length(btrim(title)) between 1 and 500),
  detail_ref text not null check (length(btrim(detail_ref)) between 1 and 1000),
  detail_hash text not null check (detail_hash ~ '^[a-f0-9]{64}$'),
  confidence numeric(6,5) not null check (confidence between 0 and 1),
  evidence_refs text[] not null,
  state text not null default 'proposed' check (state in ('proposed','accepted','rejected','converted_to_scope')),
  installs_automatically boolean not null default false check (installs_automatically=false),
  created_at timestamptz not null default now(),
  decided_at timestamptz,
  foreign key(owner_id,project_id) references public.command_center_project_profiles(owner_id,project_id) on delete restrict,
  check (cardinality(evidence_refs)>0),
  check ((state='proposed' and decided_at is null) or (state<>'proposed' and decided_at is not null))
);

create table if not exists public.command_center_brain_improvement_scope_requests (
  scope_request_id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  improvement_id uuid not null references public.command_center_brain_improvement_proposals(improvement_id) on delete restrict,
  project_id text,
  proposed_roadmap_parent_ref text,
  scope_ref text not null check (length(btrim(scope_ref)) between 1 and 1000),
  scope_hash text not null check (scope_hash ~ '^[a-f0-9]{64}$'),
  owner_decision_ref text not null check (length(btrim(owner_decision_ref)) between 1 and 1000),
  evidence_refs text[] not null,
  roadmap_mutated boolean not null default false check (roadmap_mutated=false),
  created_at timestamptz not null default now(),
  check (cardinality(evidence_refs)>0)
);
create index if not exists command_center_brain_improvements_idx
  on public.command_center_brain_improvement_proposals(owner_id,project_id,state,created_at desc,improvement_id);

do $$
declare t text;
begin
  foreach t in array array['command_center_brain_improvement_proposals','command_center_brain_improvement_scope_requests'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('revoke all on table public.%I from public,anon,authenticated',t);
    execute format('grant select on table public.%I to authenticated',t);
    execute format('drop policy if exists %I on public.%I','c6_owner_select_'||t,t);
    execute format('create policy %I on public.%I for select to authenticated using (owner_id=(select auth.uid()) and (select public.is_command_center_authorized()))','c6_owner_select_'||t,t);
  end loop;
end $$;

create or replace function public.command_center_brain_record_improvement(
  p_project_id text,p_area text,p_title text,p_detail_ref text,p_detail_hash text,p_confidence numeric,p_evidence_refs text[]
) returns uuid language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); v_project text:=nullif(btrim(coalesce(p_project_id,'')),''); v_id uuid; begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  if p_area not in ('roadmap_gap','manual_work','fragility','provider','cost','security','historical_lesson','quality') then raise exception 'Invalid improvement area'; end if;
  if coalesce(btrim(p_title),'')='' or coalesce(btrim(p_detail_ref),'')='' or coalesce(p_detail_hash,'') !~ '^[a-f0-9]{64}$' or p_confidence<0 or p_confidence>1 then raise exception 'Invalid improvement envelope'; end if;
  if v_project is not null and not exists(select 1 from public.command_center_project_profiles where owner_id=u and project_id=v_project) then raise exception 'Improvement project not found'; end if;
  perform command_center_private.c3_assert_unique_text_array(p_evidence_refs,'Improvement evidence');
  if cardinality(coalesce(p_evidence_refs,'{}'::text[]))=0 then raise exception 'Improvement proposal requires evidence'; end if;
  insert into public.command_center_brain_improvement_proposals(owner_id,project_id,area,title,detail_ref,detail_hash,confidence,evidence_refs)
  values(u,v_project,p_area,btrim(p_title),btrim(p_detail_ref),p_detail_hash,p_confidence,p_evidence_refs) returning improvement_id into v_id;
  return v_id;
end $$;

create or replace function public.command_center_brain_convert_improvement_to_scope_request(
  p_improvement_id uuid,p_expected_state text,p_proposed_roadmap_parent_ref text,p_scope_ref text,p_scope_hash text,p_owner_decision_ref text,p_evidence_refs text[]
) returns uuid language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); i public.command_center_brain_improvement_proposals%rowtype; v_id uuid; begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  select * into i from public.command_center_brain_improvement_proposals where owner_id=u and improvement_id=p_improvement_id for update;
  if not found then raise exception 'Improvement proposal not found'; end if;
  if i.state<>p_expected_state or i.state<>'accepted' then raise exception 'Only an explicitly accepted improvement can become a scope request'; end if;
  if coalesce(btrim(p_scope_ref),'')='' or coalesce(p_scope_hash,'') !~ '^[a-f0-9]{64}$' or coalesce(btrim(p_owner_decision_ref),'')='' then raise exception 'Scope request requires stable scope and owner decision'; end if;
  perform command_center_private.c3_assert_unique_text_array(p_evidence_refs,'Improvement scope evidence');
  if cardinality(coalesce(p_evidence_refs,'{}'::text[]))=0 then raise exception 'Scope conversion requires evidence'; end if;
  insert into public.command_center_brain_improvement_scope_requests(owner_id,improvement_id,project_id,proposed_roadmap_parent_ref,scope_ref,scope_hash,owner_decision_ref,evidence_refs)
  values(u,i.improvement_id,i.project_id,nullif(btrim(coalesce(p_proposed_roadmap_parent_ref,'')),''),btrim(p_scope_ref),p_scope_hash,btrim(p_owner_decision_ref),p_evidence_refs) returning scope_request_id into v_id;
  update public.command_center_brain_improvement_proposals set state='converted_to_scope',decided_at=coalesce(decided_at,now()) where owner_id=u and improvement_id=i.improvement_id;
  return v_id;
end $$;

revoke all on function public.command_center_brain_record_improvement(text,text,text,text,text,numeric,text[]) from public,anon;
revoke all on function public.command_center_brain_convert_improvement_to_scope_request(uuid,text,text,text,text,text,text[]) from public,anon;
grant execute on function public.command_center_brain_record_improvement(text,text,text,text,text,numeric,text[]) to authenticated;
grant execute on function public.command_center_brain_convert_improvement_to_scope_request(uuid,text,text,text,text,text,text[]) to authenticated;
