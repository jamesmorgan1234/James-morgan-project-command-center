-- Category 7 / P7.1 — durable Agency run, job, task and explicit state-transition models.
-- Branch-only migration. Queued/working/completed states require durable evidence and cannot be inferred from browser activity.

create table if not exists public.command_center_agency_runs (
  owner_id uuid not null references auth.users(id) on delete cascade,
  project_id text not null,
  run_id text not null,
  objective text not null check (length(btrim(objective)) between 1 and 4000),
  control_mode text not null check (control_mode in ('project_auto','agent_auto','next_step','until_work','to_work_barriers','manual_task')),
  state text not null check (state in ('draft','queued','working','blocked','needs_user','paused','completed','stopped','failed')),
  generation bigint not null default 1 check (generation>=1),
  authorization_ref text not null check (length(btrim(authorization_ref)) between 1 and 1000),
  priority integer not null default 0,
  stop_requested boolean not null default false,
  pause_requested boolean not null default false,
  blocker text,
  checkpoint_id uuid,
  evidence_refs text[] not null,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  completed_at timestamptz,
  primary key(owner_id,project_id,run_id),
  unique(owner_id,run_id),
  foreign key(owner_id,project_id) references public.command_center_project_profiles(owner_id,project_id) on delete cascade,
  foreign key(checkpoint_id) references public.command_center_project_checkpoints(checkpoint_id) on delete restrict,
  check (run_id ~ '^agency-run:[a-zA-Z0-9._:-]{1,220}$'),
  check (cardinality(evidence_refs)>0),
  check (updated_at>=created_at),
  check ((state='blocked' and blocker is not null) or state<>'blocked'),
  check ((state='completed' and completed_at is not null) or (state<>'completed' and completed_at is null))
);

create table if not exists public.command_center_agency_jobs (
  owner_id uuid not null references auth.users(id) on delete cascade,
  project_id text not null,
  run_id text not null,
  job_id text not null,
  objective text not null check (length(btrim(objective)) between 1 and 4000),
  state text not null check (state in ('draft','queued','working','blocked','needs_user','paused','completed','stopped','failed')),
  risk text not null check (risk in ('low','medium','high','critical')),
  cost_class text not null check (cost_class in ('free','paid','unknown')),
  preferred_environment text not null check (preferred_environment in ('normal_chat','work','user','deterministic')),
  capability text not null check (length(btrim(capability)) between 1 and 240),
  retry_count integer not null default 0 check (retry_count>=0),
  blocker text,
  checkpoint_ref text,
  evidence_refs text[] not null,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  primary key(owner_id,project_id,job_id),
  unique(owner_id,job_id),
  foreign key(owner_id,project_id,run_id) references public.command_center_agency_runs(owner_id,project_id,run_id) on delete cascade,
  check (job_id ~ '^agency-job:[a-zA-Z0-9._:-]{1,220}$'),
  check (cardinality(evidence_refs)>0),
  check (updated_at>=created_at),
  check ((state='blocked' and blocker is not null) or state<>'blocked')
);

create table if not exists public.command_center_agency_tasks (
  owner_id uuid not null references auth.users(id) on delete cascade,
  project_id text not null,
  run_id text not null,
  job_id text not null,
  task_id text not null,
  title text not null check (length(btrim(title)) between 1 and 1000),
  state text not null check (state in ('pending','ready','claimed','working','blocked','needs_user','work_boundary','verified','skipped','stopped','failed')),
  dependency_ids text[] not null default '{}'::text[],
  capability text not null check (length(btrim(capability)) between 1 and 240),
  risk text not null check (risk in ('low','medium','high','critical')),
  cost_class text not null check (cost_class in ('free','paid','unknown')),
  preferred_environment text not null check (preferred_environment in ('normal_chat','work','user','deterministic')),
  retry_count integer not null default 0 check (retry_count>=0),
  idempotency_key text not null check (length(btrim(idempotency_key)) between 1 and 500),
  blocker text,
  checkpoint_ref text,
  evidence_refs text[] not null,
  verification_refs text[] not null default '{}'::text[],
  created_at timestamptz not null,
  updated_at timestamptz not null,
  primary key(owner_id,project_id,task_id),
  unique(owner_id,task_id),
  unique(owner_id,idempotency_key),
  foreign key(owner_id,project_id,run_id) references public.command_center_agency_runs(owner_id,project_id,run_id) on delete cascade,
  foreign key(owner_id,project_id,job_id) references public.command_center_agency_jobs(owner_id,project_id,job_id) on delete cascade,
  check (task_id ~ '^agency-task:[a-zA-Z0-9._:-]{1,220}$'),
  check (cardinality(evidence_refs)>0),
  check (updated_at>=created_at),
  check ((state='blocked' and blocker is not null) or state<>'blocked'),
  check ((state='verified' and cardinality(verification_refs)>0) or state<>'verified')
);

create table if not exists public.command_center_agency_state_events (
  event_id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  project_id text not null,
  entity_type text not null check (entity_type in ('run','job','task')),
  entity_id text not null,
  from_state text,
  to_state text not null,
  generation bigint,
  evidence_refs text[] not null,
  detail jsonb not null default '{}'::jsonb check (jsonb_typeof(detail)='object'),
  occurred_at timestamptz not null,
  recorded_at timestamptz not null default now(),
  check (cardinality(evidence_refs)>0),
  check (occurred_at<=recorded_at + interval '5 minutes')
);
create index if not exists command_center_agency_state_events_idx
  on public.command_center_agency_state_events(owner_id,project_id,entity_type,entity_id,occurred_at,event_id);

do $$
declare t text;
begin
  foreach t in array array['command_center_agency_runs','command_center_agency_jobs','command_center_agency_tasks','command_center_agency_state_events'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('revoke all on table public.%I from public,anon,authenticated',t);
    execute format('grant select on table public.%I to authenticated',t);
    execute format('drop policy if exists %I on public.%I','c7_owner_select_'||t,t);
    execute format('create policy %I on public.%I for select to authenticated using (owner_id=(select auth.uid()) and (select public.is_command_center_authorized()))','c7_owner_select_'||t,t);
  end loop;
end $$;

create or replace function command_center_private.c7_run_transition_allowed(p_from text,p_to text)
returns boolean language sql immutable set search_path='' as $$
  select case p_from
    when 'draft' then p_to in ('queued','stopped','failed')
    when 'queued' then p_to in ('working','blocked','needs_user','paused','stopped','failed')
    when 'working' then p_to in ('blocked','needs_user','paused','completed','stopped','failed')
    when 'blocked' then p_to in ('queued','working','stopped','failed')
    when 'needs_user' then p_to in ('queued','working','stopped','failed')
    when 'paused' then p_to in ('queued','working','stopped')
    else false end;
$$;
revoke all on function command_center_private.c7_run_transition_allowed(text,text) from public,anon,authenticated;

create or replace function public.command_center_agency_create_run(
  p_project_id text,p_run_id text,p_objective text,p_control_mode text,p_authorization_ref text,p_priority integer,p_checkpoint_id uuid,p_evidence_refs text[],p_created_at timestamptz
) returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  if not exists(select 1 from public.command_center_project_profiles where owner_id=u and project_id=btrim(p_project_id)) then raise exception 'Agency run project not found'; end if;
  if coalesce(btrim(p_run_id),'') !~ '^agency-run:[a-zA-Z0-9._:-]{1,220}$' or coalesce(btrim(p_objective),'')='' or coalesce(btrim(p_authorization_ref),'')='' then raise exception 'Agency run identity/objective/authorization required'; end if;
  if p_control_mode not in ('project_auto','agent_auto','next_step','until_work','to_work_barriers','manual_task') then raise exception 'Invalid Agency control mode'; end if;
  if p_checkpoint_id is not null and not exists(select 1 from public.command_center_project_checkpoints where owner_id=u and project_id=btrim(p_project_id) and checkpoint_id=p_checkpoint_id) then raise exception 'Agency run checkpoint scope mismatch'; end if;
  perform command_center_private.c3_assert_unique_text_array(p_evidence_refs,'Agency run evidence');
  if cardinality(coalesce(p_evidence_refs,'{}'::text[]))=0 then raise exception 'Agency run requires evidence'; end if;
  insert into public.command_center_agency_runs(owner_id,project_id,run_id,objective,control_mode,state,generation,authorization_ref,priority,checkpoint_id,evidence_refs,created_at,updated_at)
  values(u,btrim(p_project_id),btrim(p_run_id),btrim(p_objective),p_control_mode,'draft',1,btrim(p_authorization_ref),p_priority,p_checkpoint_id,p_evidence_refs,p_created_at,p_created_at);
  insert into public.command_center_agency_state_events(owner_id,project_id,entity_type,entity_id,to_state,generation,evidence_refs,occurred_at)
  values(u,btrim(p_project_id),'run',btrim(p_run_id),'draft',1,p_evidence_refs,p_created_at);
  return jsonb_build_object('run_id',btrim(p_run_id),'state','draft','generation',1);
end $$;

create or replace function public.command_center_agency_transition_run(
  p_run_id text,p_expected_generation bigint,p_to_state text,p_blocker text,p_verification_refs text[],p_evidence_refs text[],p_occurred_at timestamptz
) returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); r public.command_center_agency_runs%rowtype; v_next_generation bigint; begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  select * into r from public.command_center_agency_runs where owner_id=u and run_id=btrim(p_run_id) for update;
  if not found then raise exception 'Agency run not found'; end if;
  if r.generation<>p_expected_generation then raise exception 'Agency run generation conflict'; end if;
  if not command_center_private.c7_run_transition_allowed(r.state,p_to_state) then raise exception 'Invalid Agency run transition: % -> %',r.state,p_to_state; end if;
  if r.stop_requested and p_to_state<>'stopped' then raise exception 'Stop-requested run may only transition to stopped'; end if;
  if r.pause_requested and p_to_state='working' then raise exception 'Pause-requested run cannot enter working'; end if;
  if p_to_state='blocked' and coalesce(btrim(p_blocker),'')='' then raise exception 'Blocked run requires blocker'; end if;
  perform command_center_private.c3_assert_unique_text_array(p_evidence_refs,'Agency run transition evidence');
  perform command_center_private.c3_assert_unique_text_array(p_verification_refs,'Agency run verification');
  if cardinality(coalesce(p_evidence_refs,'{}'::text[]))=0 then raise exception 'Agency run transition requires evidence'; end if;
  if p_to_state='completed' and cardinality(coalesce(p_verification_refs,'{}'::text[]))=0 then raise exception 'Completed run requires verification evidence'; end if;
  v_next_generation:=r.generation + case when p_to_state in ('stopped','failed') then 1 else 0 end;
  update public.command_center_agency_runs set state=p_to_state,generation=v_next_generation,blocker=case when p_to_state='blocked' then btrim(p_blocker) else null end,evidence_refs=p_evidence_refs,updated_at=p_occurred_at,completed_at=case when p_to_state='completed' then p_occurred_at else null end where owner_id=u and run_id=r.run_id;
  insert into public.command_center_agency_state_events(owner_id,project_id,entity_type,entity_id,from_state,to_state,generation,evidence_refs,detail,occurred_at)
  values(u,r.project_id,'run',r.run_id,r.state,p_to_state,v_next_generation,p_evidence_refs,jsonb_build_object('verification_refs',coalesce(p_verification_refs,'{}'::text[])),p_occurred_at);
  return jsonb_build_object('run_id',r.run_id,'from_state',r.state,'state',p_to_state,'generation',v_next_generation);
end $$;

revoke all on function public.command_center_agency_create_run(text,text,text,text,text,integer,uuid,text[],timestamptz) from public,anon;
revoke all on function public.command_center_agency_transition_run(text,bigint,text,text,text[],text[],timestamptz) from public,anon;
grant execute on function public.command_center_agency_create_run(text,text,text,text,text,integer,uuid,text[],timestamptz) to authenticated;
grant execute on function public.command_center_agency_transition_run(text,bigint,text,text,text[],text[],timestamptz) to authenticated;
