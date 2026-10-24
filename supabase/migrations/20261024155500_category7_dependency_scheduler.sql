-- Category 7 / P7.6 — durable dependency-aware parallel scheduler and work-stealing candidates.
-- Branch-only migration. Scheduling selects work; P7.4 task claims/fencing owns execution claims.

create table if not exists public.command_center_agency_scheduled_tasks (
  owner_id uuid not null references auth.users(id) on delete cascade,
  project_id text not null,
  task_id text not null,
  run_ref text not null,
  title text not null,
  state text not null check (state in ('pending','ready','claimed','working','blocked','needs_user','work_boundary','verified','skipped','stopped','failed')),
  capability text not null,
  risk text not null check (risk in ('low','medium','high','critical')),
  preferred_environment text not null check (preferred_environment in ('normal_chat','work','user','deterministic')),
  priority integer not null,
  created_sequence bigint not null check (created_sequence>=0),
  affinity_keys text[] not null default '{}'::text[],
  anti_affinity_keys text[] not null default '{}'::text[],
  idempotency_key text not null,
  evidence_refs text[] not null,
  blocker text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key(owner_id,project_id,task_id),
  unique(owner_id,idempotency_key),
  foreign key(owner_id,project_id) references public.command_center_project_profiles(owner_id,project_id) on delete cascade,
  check (length(btrim(task_id)) between 1 and 240),
  check (length(btrim(run_ref)) between 1 and 500),
  check (length(btrim(title)) between 1 and 1000),
  check (length(btrim(capability)) between 1 and 240),
  check (cardinality(evidence_refs)>0),
  check (updated_at>=created_at),
  check ((state='blocked' and blocker is not null) or state<>'blocked')
);

create table if not exists public.command_center_agency_task_dependencies (
  owner_id uuid not null references auth.users(id) on delete cascade,
  project_id text not null,
  task_id text not null,
  dependency_task_id text not null,
  created_at timestamptz not null default now(),
  primary key(owner_id,project_id,task_id,dependency_task_id),
  foreign key(owner_id,project_id,task_id) references public.command_center_agency_scheduled_tasks(owner_id,project_id,task_id) on delete cascade,
  foreign key(owner_id,project_id,dependency_task_id) references public.command_center_agency_scheduled_tasks(owner_id,project_id,task_id) on delete restrict,
  check (task_id<>dependency_task_id)
);
create index if not exists command_center_agency_scheduler_ready_idx
  on public.command_center_agency_scheduled_tasks(owner_id,project_id,state,priority,created_sequence,task_id);
create index if not exists command_center_agency_task_dependencies_reverse_idx
  on public.command_center_agency_task_dependencies(owner_id,project_id,dependency_task_id,task_id);

do $$
declare t text;
begin
  foreach t in array array['command_center_agency_scheduled_tasks','command_center_agency_task_dependencies'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('revoke all on table public.%I from public,anon,authenticated',t);
    execute format('grant select on table public.%I to authenticated',t);
    execute format('drop policy if exists %I on public.%I','c7_owner_select_'||t,t);
    execute format('create policy %I on public.%I for select to authenticated using (owner_id=(select auth.uid()) and (select public.is_command_center_authorized()))','c7_owner_select_'||t,t);
  end loop;
end $$;

create or replace function public.command_center_agency_register_scheduled_task(
  p_project_id text,p_task_id text,p_run_ref text,p_title text,p_state text,p_capability text,p_risk text,p_preferred_environment text,p_priority integer,p_created_sequence bigint,p_affinity_keys text[],p_anti_affinity_keys text[],p_idempotency_key text,p_dependency_task_ids text[],p_evidence_refs text[],p_blocker text
) returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); dep text; begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  if not exists(select 1 from public.command_center_project_profiles where owner_id=u and project_id=btrim(p_project_id)) then raise exception 'Scheduled task project not found'; end if;
  if coalesce(btrim(p_task_id),'')='' or coalesce(btrim(p_run_ref),'')='' or coalesce(btrim(p_title),'')='' or coalesce(btrim(p_capability),'')='' or coalesce(btrim(p_idempotency_key),'')='' then raise exception 'Scheduled task identity is incomplete'; end if;
  if p_state not in ('pending','ready','claimed','working','blocked','needs_user','work_boundary','verified','skipped','stopped','failed') or p_risk not in ('low','medium','high','critical') or p_preferred_environment not in ('normal_chat','work','user','deterministic') then raise exception 'Invalid scheduled task classification'; end if;
  if p_state='blocked' and coalesce(btrim(p_blocker),'')='' then raise exception 'Blocked task requires blocker'; end if;
  perform command_center_private.c3_assert_unique_text_array(p_affinity_keys,'Task affinity');
  perform command_center_private.c3_assert_unique_text_array(p_anti_affinity_keys,'Task anti-affinity');
  perform command_center_private.c3_assert_unique_text_array(p_dependency_task_ids,'Task dependencies');
  perform command_center_private.c3_assert_unique_text_array(p_evidence_refs,'Scheduled task evidence');
  if cardinality(coalesce(p_evidence_refs,'{}'::text[]))=0 then raise exception 'Scheduled task requires evidence'; end if;
  if btrim(p_task_id)=any(coalesce(p_dependency_task_ids,'{}'::text[])) then raise exception 'Task cannot depend on itself'; end if;
  foreach dep in array coalesce(p_dependency_task_ids,'{}'::text[]) loop
    if not exists(select 1 from public.command_center_agency_scheduled_tasks where owner_id=u and project_id=btrim(p_project_id) and task_id=dep) then raise exception 'Dependency must already exist in same project/run graph: %',dep; end if;
  end loop;
  insert into public.command_center_agency_scheduled_tasks(owner_id,project_id,task_id,run_ref,title,state,capability,risk,preferred_environment,priority,created_sequence,affinity_keys,anti_affinity_keys,idempotency_key,evidence_refs,blocker)
  values(u,btrim(p_project_id),btrim(p_task_id),btrim(p_run_ref),btrim(p_title),p_state,btrim(p_capability),p_risk,p_preferred_environment,p_priority,p_created_sequence,coalesce(p_affinity_keys,'{}'::text[]),coalesce(p_anti_affinity_keys,'{}'::text[]),btrim(p_idempotency_key),p_evidence_refs,nullif(btrim(coalesce(p_blocker,'')),''));
  foreach dep in array coalesce(p_dependency_task_ids,'{}'::text[]) loop
    insert into public.command_center_agency_task_dependencies(owner_id,project_id,task_id,dependency_task_id) values(u,btrim(p_project_id),btrim(p_task_id),dep);
  end loop;
  return jsonb_build_object('project_id',btrim(p_project_id),'task_id',btrim(p_task_id),'dependency_count',cardinality(coalesce(p_dependency_task_ids,'{}'::text[])),'registered',true);
end $$;

create or replace function public.command_center_agency_ready_tasks(
  p_project_id text,p_run_ref text,p_worker_capabilities text[],p_held_anti_affinity text[],p_limit integer
) returns table(task_id text,capability text,risk text,preferred_environment text,priority integer,created_sequence bigint) language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  if p_limit<1 or p_limit>1000 then raise exception 'Ready-task limit out of range'; end if;
  return query
  select t.task_id,t.capability,t.risk,t.preferred_environment,t.priority,t.created_sequence
  from public.command_center_agency_scheduled_tasks t
  where t.owner_id=u and t.project_id=btrim(p_project_id) and t.run_ref=btrim(p_run_ref)
    and t.state in ('pending','ready')
    and t.capability=any(coalesce(p_worker_capabilities,'{}'::text[]))
    and not (t.anti_affinity_keys && coalesce(p_held_anti_affinity,'{}'::text[]))
    and not exists(
      select 1 from public.command_center_agency_task_dependencies d
      join public.command_center_agency_scheduled_tasks prereq
        on prereq.owner_id=d.owner_id and prereq.project_id=d.project_id and prereq.task_id=d.dependency_task_id
      where d.owner_id=t.owner_id and d.project_id=t.project_id and d.task_id=t.task_id
        and prereq.state not in ('verified','skipped')
    )
  order by t.priority asc,t.created_sequence asc,t.task_id asc
  limit p_limit;
end $$;

revoke all on function public.command_center_agency_register_scheduled_task(text,text,text,text,text,text,text,text,integer,bigint,text[],text[],text,text[],text[],text) from public,anon;
revoke all on function public.command_center_agency_ready_tasks(text,text,text[],text[],integer) from public,anon;
grant execute on function public.command_center_agency_register_scheduled_task(text,text,text,text,text,text,text,text,integer,bigint,text[],text[],text,text[],text[],text) to authenticated;
grant execute on function public.command_center_agency_ready_tasks(text,text,text[],text[],integer) to authenticated;
