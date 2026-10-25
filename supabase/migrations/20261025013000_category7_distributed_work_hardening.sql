-- Category 7 post-audit retrofit — dependency-cycle admission, starvation-safe scheduling,
-- auditable resource orphan recovery, and identity/resource/cost/policy-bound delegation.
-- Branch-only migration. This file is not applied to production by committing it.

-- Enforce the scheduler's documented same-project/run dependency contract at the edge itself
-- and reject cycles even if a future writer bypasses the current registration RPC.
create or replace function command_center_private.c7_enforce_dependency_edge()
returns trigger language plpgsql security definer set search_path='' as $$
declare v_task_run text; v_dependency_run text; begin
  select run_ref into v_task_run from public.command_center_agency_scheduled_tasks
    where owner_id=new.owner_id and project_id=new.project_id and task_id=new.task_id;
  select run_ref into v_dependency_run from public.command_center_agency_scheduled_tasks
    where owner_id=new.owner_id and project_id=new.project_id and task_id=new.dependency_task_id;
  if v_task_run is null or v_dependency_run is null or v_task_run<>v_dependency_run then
    raise exception 'Dependency must stay in same project/run graph';
  end if;
  if exists(
    with recursive walk(task_id,path,cycle) as (
      select new.dependency_task_id,array[new.dependency_task_id]::text[],false
      union all
      select d.dependency_task_id,w.path||d.dependency_task_id,d.dependency_task_id=any(w.path)
      from walk w
      join public.command_center_agency_task_dependencies d
        on d.owner_id=new.owner_id and d.project_id=new.project_id and d.task_id=w.task_id
      where not w.cycle
    )
    select 1 from walk where task_id=new.task_id or cycle
  ) then raise exception 'Dependency cycle detected'; end if;
  return new;
end $$;
revoke all on function command_center_private.c7_enforce_dependency_edge() from public,anon,authenticated;

drop trigger if exists trg_c7_dependency_edge_guard on public.command_center_agency_task_dependencies;
create trigger trg_c7_dependency_edge_guard
before insert or update on public.command_center_agency_task_dependencies
for each row execute function command_center_private.c7_enforce_dependency_edge();

create table if not exists public.command_center_agency_scheduler_wait_state (
  owner_id uuid not null references auth.users(id) on delete cascade,
  project_id text not null,
  task_id text not null,
  run_ref text not null,
  wait_rounds integer not null default 0 check (wait_rounds>=0),
  first_ready_at timestamptz not null,
  last_considered_at timestamptz not null,
  last_selected_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key(owner_id,project_id,task_id),
  foreign key(owner_id,project_id,task_id) references public.command_center_agency_scheduled_tasks(owner_id,project_id,task_id) on delete cascade,
  check (length(btrim(run_ref)) between 1 and 500),
  check (last_considered_at>=first_ready_at),
  check (last_selected_at is null or last_selected_at>=first_ready_at)
);

alter table public.command_center_agency_scheduler_wait_state enable row level security;
revoke all on table public.command_center_agency_scheduler_wait_state from public,anon,authenticated;
grant select on table public.command_center_agency_scheduler_wait_state to authenticated;
drop policy if exists c7_owner_select_agency_scheduler_wait_state on public.command_center_agency_scheduler_wait_state;
create policy c7_owner_select_agency_scheduler_wait_state
  on public.command_center_agency_scheduler_wait_state for select to authenticated
  using (owner_id=(select auth.uid()) and (select public.is_command_center_authorized()));

create or replace function public.command_center_agency_fair_ready_tasks(
  p_project_id text,p_run_ref text,p_worker_capabilities text[],p_held_anti_affinity text[],p_limit integer,p_starvation_rounds integer,p_now timestamptz
) returns table(task_id text,capability text,risk text,preferred_environment text,priority integer,created_sequence bigint,wait_rounds integer,starvation_escalated boolean)
language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); v_selected text[]:='{}'::text[]; begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  if p_limit<1 or p_limit>1000 then raise exception 'Ready-task limit out of range'; end if;
  if p_starvation_rounds<1 or p_starvation_rounds>10000 then raise exception 'Starvation threshold out of range'; end if;

  insert into public.command_center_agency_scheduler_wait_state(owner_id,project_id,task_id,run_ref,wait_rounds,first_ready_at,last_considered_at)
  select u,t.project_id,t.task_id,t.run_ref,1,p_now,p_now
  from public.command_center_agency_scheduled_tasks t
  where t.owner_id=u and t.project_id=btrim(p_project_id) and t.run_ref=btrim(p_run_ref)
    and t.state in ('pending','ready')
    and t.capability=any(coalesce(p_worker_capabilities,'{}'::text[]))
    and not (t.anti_affinity_keys && coalesce(p_held_anti_affinity,'{}'::text[]))
    and not exists(
      select 1 from public.command_center_agency_task_dependencies d
      join public.command_center_agency_scheduled_tasks prereq
        on prereq.owner_id=d.owner_id and prereq.project_id=d.project_id and prereq.task_id=d.dependency_task_id
      where d.owner_id=t.owner_id and d.project_id=t.project_id and d.task_id=t.task_id and prereq.state not in ('verified','skipped')
    )
  on conflict(owner_id,project_id,task_id) do update
    set wait_rounds=least(p_starvation_rounds,public.command_center_agency_scheduler_wait_state.wait_rounds+1),
        last_considered_at=p_now,updated_at=now();

  select coalesce(array_agg(q.task_id order by q.starved desc,q.wait_rounds desc,q.priority asc,q.created_sequence asc,q.task_id asc),'{}'::text[])
  into v_selected
  from (
    select t.task_id,t.priority,t.created_sequence,w.wait_rounds,(w.wait_rounds>=p_starvation_rounds) as starved
    from public.command_center_agency_scheduled_tasks t
    join public.command_center_agency_scheduler_wait_state w
      on w.owner_id=t.owner_id and w.project_id=t.project_id and w.task_id=t.task_id
    where t.owner_id=u and t.project_id=btrim(p_project_id) and t.run_ref=btrim(p_run_ref)
      and t.state in ('pending','ready')
      and t.capability=any(coalesce(p_worker_capabilities,'{}'::text[]))
      and not (t.anti_affinity_keys && coalesce(p_held_anti_affinity,'{}'::text[]))
      and not exists(
        select 1 from public.command_center_agency_task_dependencies d
        join public.command_center_agency_scheduled_tasks prereq
          on prereq.owner_id=d.owner_id and prereq.project_id=d.project_id and prereq.task_id=d.dependency_task_id
        where d.owner_id=t.owner_id and d.project_id=t.project_id and d.task_id=t.task_id and prereq.state not in ('verified','skipped')
      )
    order by starved desc,w.wait_rounds desc,t.priority asc,t.created_sequence asc,t.task_id asc
    limit p_limit
  ) q;

  return query
  select t.task_id,t.capability,t.risk,t.preferred_environment,t.priority,t.created_sequence,w.wait_rounds,(w.wait_rounds>=p_starvation_rounds)
  from public.command_center_agency_scheduled_tasks t
  join public.command_center_agency_scheduler_wait_state w
    on w.owner_id=t.owner_id and w.project_id=t.project_id and w.task_id=t.task_id
  where t.owner_id=u and t.project_id=btrim(p_project_id) and t.task_id=any(v_selected)
  order by (w.wait_rounds>=p_starvation_rounds) desc,w.wait_rounds desc,t.priority asc,t.created_sequence asc,t.task_id asc;

  update public.command_center_agency_scheduler_wait_state
    set wait_rounds=0,last_selected_at=p_now,updated_at=now()
    where owner_id=u and project_id=btrim(p_project_id) and task_id=any(v_selected);
end $$;

revoke all on function public.command_center_agency_fair_ready_tasks(text,text,text[],text[],integer,integer,timestamptz) from public,anon;
grant execute on function public.command_center_agency_fair_ready_tasks(text,text,text[],text[],integer,integer,timestamptz) to authenticated;

create table if not exists public.command_center_agency_resource_recovery_events (
  recovery_event_id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  project_id text not null,
  claim_id uuid not null references public.command_center_agency_resource_claims(claim_id) on delete restrict,
  resource_key text not null,
  prior_claimant_ref text not null,
  prior_generation bigint not null check (prior_generation>=1),
  cause text not null check (cause='lease_expired'),
  reclaimer_ref text not null,
  evidence_refs text[] not null,
  recovered_at timestamptz not null,
  recorded_at timestamptz not null default now(),
  unique(owner_id,claim_id),
  check (length(btrim(resource_key)) between 1 and 500),
  check (length(btrim(prior_claimant_ref)) between 1 and 500),
  check (length(btrim(reclaimer_ref)) between 1 and 500),
  check (cardinality(evidence_refs)>0)
);

alter table public.command_center_agency_resource_recovery_events enable row level security;
revoke all on table public.command_center_agency_resource_recovery_events from public,anon,authenticated;
grant select on table public.command_center_agency_resource_recovery_events to authenticated;
drop policy if exists c7_owner_select_agency_resource_recovery_events on public.command_center_agency_resource_recovery_events;
create policy c7_owner_select_agency_resource_recovery_events
  on public.command_center_agency_resource_recovery_events for select to authenticated
  using (owner_id=(select auth.uid()) and (select public.is_command_center_authorized()));

create or replace function public.command_center_agency_reap_expired_resource_claims(
  p_project_id text,p_reclaimer_ref text,p_now timestamptz,p_evidence_refs text[]
) returns integer language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); c public.command_center_agency_resource_claims%rowtype; v_count integer:=0; begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  if coalesce(btrim(p_reclaimer_ref),'')='' then raise exception 'Resource reclaimer identity required'; end if;
  perform command_center_private.c3_assert_unique_text_array(p_evidence_refs,'Resource recovery evidence');
  if cardinality(coalesce(p_evidence_refs,'{}'::text[]))=0 then raise exception 'Resource recovery requires evidence'; end if;
  for c in
    select * from public.command_center_agency_resource_claims
    where owner_id=u and project_id=btrim(p_project_id) and released_at is null and expires_at<=p_now
    order by resource_key,claim_id
    for update
  loop
    perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(u::text||':'||c.resource_key,0));
    update public.command_center_agency_resource_claims set released_at=p_now
      where claim_id=c.claim_id and owner_id=u and released_at is null and expires_at<=p_now;
    if found then
      insert into public.command_center_agency_resource_recovery_events(owner_id,project_id,claim_id,resource_key,prior_claimant_ref,prior_generation,cause,reclaimer_ref,evidence_refs,recovered_at)
      values(u,c.project_id,c.claim_id,c.resource_key,c.claimant_ref,c.generation,'lease_expired',btrim(p_reclaimer_ref),p_evidence_refs,p_now)
      on conflict(owner_id,claim_id) do nothing;
      v_count:=v_count+1;
    end if;
  end loop;
  return v_count;
end $$;
revoke all on function public.command_center_agency_reap_expired_resource_claims(text,text,timestamptz,text[]) from public,anon;
grant execute on function public.command_center_agency_reap_expired_resource_claims(text,text,timestamptz,text[]) to authenticated;

-- Current policy version is server-owned. Future policy changes replace this helper and
-- automatically invalidate stale delegated authority until explicitly rebound.
create or replace function command_center_private.c7_current_delegation_policy_version()
returns text language sql immutable set search_path='' as $$ select 'category2-v1'::text $$;
revoke all on function command_center_private.c7_current_delegation_policy_version() from public,anon,authenticated;

create table if not exists public.command_center_agency_delegation_authority (
  owner_id uuid not null references auth.users(id) on delete cascade,
  delegation_id uuid primary key references public.command_center_agency_delegations(delegation_id) on delete cascade,
  project_id text not null,
  controlling_orchestrator text not null check (controlling_orchestrator='command-center'),
  parent_subject_ref text not null,
  child_subject_ref text not null,
  company_id text,
  account_id text,
  environment text not null check (environment in ('development','test','staging','production')),
  policy_version text not null,
  parent_budget_cents bigint not null check (parent_budget_cents>=0),
  child_budget_cents bigint not null check (child_budget_cents>=0 and child_budget_cents<=parent_budget_cents),
  parent_max_concurrent integer not null check (parent_max_concurrent>=1),
  child_max_concurrent integer not null check (child_max_concurrent>=1 and child_max_concurrent<=parent_max_concurrent),
  parent_max_queue_depth integer not null check (parent_max_queue_depth>=0),
  child_max_queue_depth integer not null check (child_max_queue_depth>=0 and child_max_queue_depth<=parent_max_queue_depth),
  parent_max_retries integer not null check (parent_max_retries>=0),
  child_max_retries integer not null check (child_max_retries>=0 and child_max_retries<=parent_max_retries),
  parent_max_runtime_ms bigint not null check (parent_max_runtime_ms>=0),
  child_max_runtime_ms bigint not null check (child_max_runtime_ms>=0 and child_max_runtime_ms<=parent_max_runtime_ms),
  parent_resource_limits jsonb not null,
  child_resource_limits jsonb not null,
  evidence_refs text[] not null,
  issued_at timestamptz not null,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  recorded_at timestamptz not null default now(),
  check (length(btrim(parent_subject_ref)) between 1 and 500),
  check (length(btrim(child_subject_ref)) between 1 and 500),
  check (parent_subject_ref<>child_subject_ref),
  check (company_id is null or length(btrim(company_id)) between 1 and 240),
  check (account_id is null or length(btrim(account_id)) between 1 and 240),
  check (jsonb_typeof(parent_resource_limits)='object' and jsonb_typeof(child_resource_limits)='object'),
  check (cardinality(evidence_refs)>0),
  check (expires_at>issued_at),
  check (revoked_at is null or revoked_at>=issued_at)
);

alter table public.command_center_agency_delegation_authority enable row level security;
revoke all on table public.command_center_agency_delegation_authority from public,anon,authenticated;
grant select on table public.command_center_agency_delegation_authority to authenticated;
drop policy if exists c7_owner_select_agency_delegation_authority on public.command_center_agency_delegation_authority;
create policy c7_owner_select_agency_delegation_authority
  on public.command_center_agency_delegation_authority for select to authenticated
  using (owner_id=(select auth.uid()) and (select public.is_command_center_authorized()));

create or replace function public.command_center_agency_bind_delegation_authority(
  p_delegation_id uuid,p_project_id text,p_parent_subject_ref text,p_child_subject_ref text,p_company_id text,p_account_id text,p_environment text,p_policy_version text,
  p_parent_budget_cents bigint,p_child_budget_cents bigint,p_parent_max_concurrent integer,p_child_max_concurrent integer,p_parent_max_queue_depth integer,p_child_max_queue_depth integer,
  p_parent_max_retries integer,p_child_max_retries integer,p_parent_max_runtime_ms bigint,p_child_max_runtime_ms bigint,p_parent_resource_limits jsonb,p_child_resource_limits jsonb,
  p_evidence_refs text[],p_issued_at timestamptz,p_expires_at timestamptz
) returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); d public.command_center_agency_delegations%rowtype; child_entry record; parent_value numeric; begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  select * into d from public.command_center_agency_delegations where delegation_id=p_delegation_id and owner_id=u and project_id=btrim(p_project_id) and state='active';
  if not found then raise exception 'Active delegation not found'; end if;
  if coalesce(btrim(p_parent_subject_ref),'')='' or coalesce(btrim(p_child_subject_ref),'')='' or btrim(p_parent_subject_ref)=btrim(p_child_subject_ref) then raise exception 'Delegation requires distinct bound parent/child subject identities'; end if;
  if p_environment not in ('development','test','staging','production') then raise exception 'Invalid delegation environment'; end if;
  if p_policy_version is distinct from command_center_private.c7_current_delegation_policy_version() then raise exception 'Delegation policy version is stale'; end if;
  if p_issued_at>now()+interval '30 seconds' or p_expires_at<=p_issued_at or p_expires_at<=now() then raise exception 'Delegation validity window is invalid or expired'; end if;
  if p_parent_budget_cents<0 or p_child_budget_cents<0 or p_child_budget_cents>p_parent_budget_cents then raise exception 'Delegation monetary budget amplification blocked'; end if;
  if p_parent_budget_cents<>0 or p_child_budget_cents<>0 then raise exception 'Delegated monetary budget must remain zero without separate owner spending authorization'; end if;
  if p_parent_max_concurrent<1 or p_child_max_concurrent<1 or p_child_max_concurrent>p_parent_max_concurrent then raise exception 'Delegation concurrency amplification blocked'; end if;
  if p_parent_max_queue_depth<0 or p_child_max_queue_depth<0 or p_child_max_queue_depth>p_parent_max_queue_depth then raise exception 'Delegation queue-depth amplification blocked'; end if;
  if p_parent_max_retries<0 or p_child_max_retries<0 or p_child_max_retries>p_parent_max_retries then raise exception 'Delegation retry amplification blocked'; end if;
  if p_parent_max_runtime_ms<0 or p_child_max_runtime_ms<0 or p_child_max_runtime_ms>p_parent_max_runtime_ms then raise exception 'Delegation runtime amplification blocked'; end if;
  if jsonb_typeof(coalesce(p_parent_resource_limits,'null'::jsonb))<>'object' or jsonb_typeof(coalesce(p_child_resource_limits,'null'::jsonb))<>'object' then raise exception 'Delegation resource limits must be objects'; end if;
  if exists(select 1 from jsonb_each(p_parent_resource_limits) e where jsonb_typeof(e.value)<>'number' or (e.value#>>'{}')::numeric<0)
     or exists(select 1 from jsonb_each(p_child_resource_limits) e where jsonb_typeof(e.value)<>'number' or (e.value#>>'{}')::numeric<0) then raise exception 'Delegation resource limits must be non-negative numbers'; end if;
  for child_entry in select key,value from jsonb_each(p_child_resource_limits) loop
    if not (p_parent_resource_limits ? child_entry.key) then raise exception 'Delegation resource amplification blocked: %',child_entry.key; end if;
    parent_value:=(p_parent_resource_limits->child_entry.key#>>'{}')::numeric;
    if (child_entry.value#>>'{}')::numeric>parent_value then raise exception 'Delegation resource amplification blocked: %',child_entry.key; end if;
  end loop;
  perform command_center_private.c3_assert_unique_text_array(p_evidence_refs,'Delegation authority evidence');
  if cardinality(coalesce(p_evidence_refs,'{}'::text[]))=0 then raise exception 'Delegation authority requires evidence'; end if;
  insert into public.command_center_agency_delegation_authority(owner_id,delegation_id,project_id,controlling_orchestrator,parent_subject_ref,child_subject_ref,company_id,account_id,environment,policy_version,parent_budget_cents,child_budget_cents,parent_max_concurrent,child_max_concurrent,parent_max_queue_depth,child_max_queue_depth,parent_max_retries,child_max_retries,parent_max_runtime_ms,child_max_runtime_ms,parent_resource_limits,child_resource_limits,evidence_refs,issued_at,expires_at)
  values(u,p_delegation_id,d.project_id,'command-center',btrim(p_parent_subject_ref),btrim(p_child_subject_ref),nullif(btrim(coalesce(p_company_id,'')),''),nullif(btrim(coalesce(p_account_id,'')),''),p_environment,p_policy_version,p_parent_budget_cents,p_child_budget_cents,p_parent_max_concurrent,p_child_max_concurrent,p_parent_max_queue_depth,p_child_max_queue_depth,p_parent_max_retries,p_child_max_retries,p_parent_max_runtime_ms,p_child_max_runtime_ms,p_parent_resource_limits,p_child_resource_limits,p_evidence_refs,p_issued_at,p_expires_at);
  return jsonb_build_object('delegation_id',p_delegation_id,'controlling_orchestrator','command-center','policy_version',p_policy_version,'monetary_budget_cents',p_child_budget_cents,'authority_amplified',false,'revalidation_required',true);
end $$;

create or replace function public.command_center_agency_revalidate_delegation_authority(p_delegation_id uuid,p_now timestamptz)
returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); a public.command_center_agency_delegation_authority%rowtype; d public.command_center_agency_delegations%rowtype; begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  select * into a from public.command_center_agency_delegation_authority where owner_id=u and delegation_id=p_delegation_id;
  if not found then raise exception 'Bound delegation authority not found'; end if;
  if a.controlling_orchestrator<>'command-center' then raise exception 'Command Center controlling authority missing'; end if;
  if a.revoked_at is not null then raise exception 'Delegation authority revoked'; end if;
  if p_now>=a.expires_at then raise exception 'Delegation authority expired'; end if;
  if a.policy_version is distinct from command_center_private.c7_current_delegation_policy_version() then raise exception 'Delegation policy version is stale'; end if;
  select * into d from public.command_center_agency_delegations where delegation_id=p_delegation_id and owner_id=u and project_id=a.project_id and state='active';
  if not found then raise exception 'Underlying delegation is no longer active'; end if;
  return jsonb_build_object('delegation_id',a.delegation_id,'valid',true,'controlling_orchestrator','command-center','policy_version',a.policy_version,'expires_at',a.expires_at,'authority_amplified',false);
end $$;

revoke all on function public.command_center_agency_bind_delegation_authority(uuid,text,text,text,text,text,text,text,bigint,bigint,integer,integer,integer,integer,integer,integer,bigint,bigint,jsonb,jsonb,text[],timestamptz,timestamptz) from public,anon;
revoke all on function public.command_center_agency_revalidate_delegation_authority(uuid,timestamptz) from public,anon;
grant execute on function public.command_center_agency_bind_delegation_authority(uuid,text,text,text,text,text,text,text,bigint,bigint,integer,integer,integer,integer,integer,integer,bigint,bigint,jsonb,jsonb,text[],timestamptz,timestamptz) to authenticated;
grant execute on function public.command_center_agency_revalidate_delegation_authority(uuid,timestamptz) to authenticated;
