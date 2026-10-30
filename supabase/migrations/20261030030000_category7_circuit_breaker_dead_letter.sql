-- Category 7 / P7 resilience — durable project/portfolio circuit breakers and dead-letter / blocked-task management.
-- Branch-only migration. No production apply is authorized by this file.

create table if not exists public.command_center_agency_circuit_breakers (
  breaker_id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  scope_type text not null check (scope_type in ('project','portfolio')),
  scope_key text not null check (length(btrim(scope_key)) between 1 and 240),
  project_id text,
  run_id text,
  state text not null default 'closed' check (state in ('closed','open','half_open')),
  failure_threshold integer not null check (failure_threshold>=1),
  failure_count integer not null default 0 check (failure_count>=0),
  cooldown_seconds integer not null check (cooldown_seconds>=1),
  opened_at timestamptz,
  probe_started_at timestamptz,
  version bigint not null default 1 check (version>=1),
  evidence_refs text[] not null,
  updated_at timestamptz not null,
  unique(owner_id,breaker_id),
  unique(owner_id,scope_type,scope_key),
  foreign key(owner_id,project_id,run_id) references public.command_center_agency_runs(owner_id,project_id,run_id) on delete cascade,
  check (cardinality(evidence_refs)>0),
  check (
    (scope_type='project' and project_id is not null and run_id is not null and scope_key=project_id)
    or (scope_type='portfolio' and project_id is null and run_id is null)
  ),
  check (
    (state='closed' and opened_at is null and probe_started_at is null)
    or (state='open' and opened_at is not null and probe_started_at is null)
    or (state='half_open' and opened_at is not null and probe_started_at is not null)
  )
);

create table if not exists public.command_center_agency_circuit_breaker_events (
  event_id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  breaker_id uuid not null,
  event_type text not null check (event_type in ('registered','failure','opened','permit_denied','half_open_probe','probe_failed','recovered')),
  from_state text not null check (from_state in ('closed','open','half_open')),
  to_state text not null check (to_state in ('closed','open','half_open')),
  version bigint not null check (version>=1),
  reason text not null check (length(btrim(reason)) between 1 and 2000),
  evidence_refs text[] not null,
  occurred_at timestamptz not null,
  recorded_at timestamptz not null default now(),
  foreign key(owner_id,breaker_id) references public.command_center_agency_circuit_breakers(owner_id,breaker_id) on delete cascade,
  check (cardinality(evidence_refs)>0),
  check (occurred_at<=recorded_at + interval '5 minutes')
);

create index if not exists command_center_agency_circuit_breakers_scope_idx
  on public.command_center_agency_circuit_breakers(owner_id,scope_type,scope_key,state,updated_at);
create index if not exists command_center_agency_circuit_breaker_events_idx
  on public.command_center_agency_circuit_breaker_events(owner_id,breaker_id,occurred_at,event_id);

create table if not exists public.command_center_agency_dead_letters (
  dead_letter_id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  project_id text not null,
  run_id text not null,
  task_id text not null,
  state text not null check (state in ('dead_letter','blocked','requeued','resolved')),
  failure_class text not null check (failure_class in ('retry_exhausted','permanent_failure','blocked')),
  attempt_count integer not null check (attempt_count>=1),
  reason text not null check (length(btrim(reason)) between 1 and 4000),
  task_completion_authorized boolean not null default false check (task_completion_authorized=false),
  version bigint not null default 1 check (version>=1),
  evidence_refs text[] not null,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  unique(owner_id,dead_letter_id),
  foreign key(owner_id,project_id,run_id) references public.command_center_agency_runs(owner_id,project_id,run_id) on delete cascade,
  check (length(btrim(task_id)) between 1 and 240),
  check (cardinality(evidence_refs)>0),
  check (updated_at>=created_at),
  check ((state='dead_letter' and failure_class in ('retry_exhausted','permanent_failure')) or (state='blocked' and failure_class='blocked') or state in ('requeued','resolved'))
);

create table if not exists public.command_center_agency_dead_letter_actions (
  action_id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  dead_letter_id uuid not null,
  from_state text not null check (from_state in ('dead_letter','blocked')),
  to_state text not null check (to_state in ('requeued','resolved')),
  reason text not null check (length(btrim(reason)) between 1 and 4000),
  evidence_refs text[] not null,
  occurred_at timestamptz not null,
  recorded_at timestamptz not null default now(),
  foreign key(owner_id,dead_letter_id) references public.command_center_agency_dead_letters(owner_id,dead_letter_id) on delete cascade,
  check (cardinality(evidence_refs)>0),
  check (occurred_at<=recorded_at + interval '5 minutes')
);

create index if not exists command_center_agency_dead_letters_active_idx
  on public.command_center_agency_dead_letters(owner_id,project_id,state,updated_at,dead_letter_id);
create index if not exists command_center_agency_dead_letter_actions_idx
  on public.command_center_agency_dead_letter_actions(owner_id,dead_letter_id,occurred_at,action_id);

do $$
declare t text;
begin
  foreach t in array array[
    'command_center_agency_circuit_breakers',
    'command_center_agency_circuit_breaker_events',
    'command_center_agency_dead_letters',
    'command_center_agency_dead_letter_actions'
  ] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('revoke all on table public.%I from public,anon,authenticated',t);
    execute format('grant select on table public.%I to authenticated',t);
    execute format('drop policy if exists %I on public.%I','c7_owner_select_'||t,t);
    execute format(
      'create policy %I on public.%I for select to authenticated using (owner_id=(select auth.uid()) and (select public.is_command_center_authorized()))',
      'c7_owner_select_'||t,t
    );
  end loop;
end $$;

create or replace function public.command_center_agency_register_circuit_breaker(
  p_scope_type text,
  p_scope_key text,
  p_project_id text,
  p_run_id text,
  p_failure_threshold integer,
  p_cooldown_seconds integer,
  p_evidence_refs text[],
  p_occurred_at timestamptz
) returns uuid language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); v_id uuid; begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  if p_scope_type not in ('project','portfolio') then raise exception 'Invalid circuit-breaker scope'; end if;
  if coalesce(btrim(p_scope_key),'')='' or p_failure_threshold<1 or p_cooldown_seconds<1 then raise exception 'Circuit breaker requires scope, threshold, and cooldown'; end if;
  perform command_center_private.c3_assert_unique_text_array(p_evidence_refs,'Circuit breaker evidence');
  if cardinality(coalesce(p_evidence_refs,'{}'::text[]))=0 then raise exception 'Circuit breaker requires evidence'; end if;
  if p_scope_type='project' then
    if btrim(coalesce(p_project_id,''))<>btrim(p_scope_key) or coalesce(btrim(p_run_id),'')='' then raise exception 'Project breaker scope mismatch'; end if;
    if not exists(select 1 from public.command_center_agency_runs where owner_id=u and project_id=btrim(p_project_id) and run_id=btrim(p_run_id)) then raise exception 'Project breaker run not found'; end if;
  elsif p_project_id is not null or p_run_id is not null then
    raise exception 'Portfolio breaker cannot claim a project/run identity';
  end if;
  insert into public.command_center_agency_circuit_breakers(owner_id,scope_type,scope_key,project_id,run_id,state,failure_threshold,failure_count,cooldown_seconds,evidence_refs,updated_at)
  values(u,p_scope_type,btrim(p_scope_key),case when p_scope_type='project' then btrim(p_project_id) else null end,case when p_scope_type='project' then btrim(p_run_id) else null end,'closed',p_failure_threshold,0,p_cooldown_seconds,p_evidence_refs,p_occurred_at)
  returning breaker_id into v_id;
  insert into public.command_center_agency_circuit_breaker_events(owner_id,breaker_id,event_type,from_state,to_state,version,reason,evidence_refs,occurred_at)
  values(u,v_id,'registered','closed','closed',1,'breaker_registered',p_evidence_refs,p_occurred_at);
  return v_id;
end $$;

create or replace function public.command_center_agency_request_circuit_breaker_permit(
  p_breaker_id uuid,p_expected_version bigint,p_evidence_refs text[],p_now timestamptz
) returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); b public.command_center_agency_circuit_breakers%rowtype; v_new_version bigint; begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  select * into b from public.command_center_agency_circuit_breakers where owner_id=u and breaker_id=p_breaker_id for update;
  if not found then raise exception 'Circuit breaker not found'; end if;
  if b.version<>p_expected_version then raise exception 'Circuit breaker version conflict'; end if;
  perform command_center_private.c3_assert_unique_text_array(p_evidence_refs,'Circuit breaker permit evidence');
  if cardinality(coalesce(p_evidence_refs,'{}'::text[]))=0 then raise exception 'Circuit breaker permit requires evidence'; end if;
  if b.state='closed' then
    return jsonb_build_object('allowed',true,'reason','closed','state',b.state,'version',b.version);
  elsif b.state='half_open' then
    insert into public.command_center_agency_circuit_breaker_events(owner_id,breaker_id,event_type,from_state,to_state,version,reason,evidence_refs,occurred_at)
    values(u,b.breaker_id,'permit_denied','half_open','half_open',b.version,'probe_in_flight',p_evidence_refs,p_now);
    return jsonb_build_object('allowed',false,'reason','probe_in_flight','state',b.state,'version',b.version);
  elsif b.opened_at + make_interval(secs=>b.cooldown_seconds)>p_now then
    insert into public.command_center_agency_circuit_breaker_events(owner_id,breaker_id,event_type,from_state,to_state,version,reason,evidence_refs,occurred_at)
    values(u,b.breaker_id,'permit_denied','open','open',b.version,'cooldown',p_evidence_refs,p_now);
    return jsonb_build_object('allowed',false,'reason','cooldown','state',b.state,'version',b.version);
  end if;
  v_new_version:=b.version+1;
  update public.command_center_agency_circuit_breakers set state='half_open',probe_started_at=p_now,version=v_new_version,evidence_refs=(select array(select distinct x from unnest(b.evidence_refs||p_evidence_refs) x)),updated_at=p_now where owner_id=u and breaker_id=b.breaker_id;
  insert into public.command_center_agency_circuit_breaker_events(owner_id,breaker_id,event_type,from_state,to_state,version,reason,evidence_refs,occurred_at)
  values(u,b.breaker_id,'half_open_probe','open','half_open',v_new_version,'cooldown_elapsed_probe_allowed',p_evidence_refs,p_now);
  return jsonb_build_object('allowed',true,'reason','half_open_probe','state','half_open','version',v_new_version);
end $$;

create or replace function public.command_center_agency_record_circuit_breaker_failure(
  p_breaker_id uuid,p_expected_version bigint,p_evidence_refs text[],p_occurred_at timestamptz
) returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); b public.command_center_agency_circuit_breakers%rowtype; v_count integer; v_state text; v_version bigint; v_event text; begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  select * into b from public.command_center_agency_circuit_breakers where owner_id=u and breaker_id=p_breaker_id for update;
  if not found then raise exception 'Circuit breaker not found'; end if;
  if b.version<>p_expected_version then raise exception 'Circuit breaker version conflict'; end if;
  if b.state='open' then raise exception 'Open breaker cannot record an unpermitted failure'; end if;
  perform command_center_private.c3_assert_unique_text_array(p_evidence_refs,'Circuit breaker failure evidence');
  if cardinality(coalesce(p_evidence_refs,'{}'::text[]))=0 then raise exception 'Circuit breaker failure requires evidence'; end if;
  v_count:=case when b.state='half_open' then b.failure_threshold else b.failure_count+1 end;
  v_state:=case when b.state='half_open' or v_count>=b.failure_threshold then 'open' else 'closed' end;
  v_event:=case when b.state='half_open' then 'probe_failed' when v_state='open' then 'opened' else 'failure' end;
  v_version:=b.version+1;
  update public.command_center_agency_circuit_breakers set state=v_state,failure_count=v_count,opened_at=case when v_state='open' then p_occurred_at else null end,probe_started_at=null,version=v_version,evidence_refs=(select array(select distinct x from unnest(b.evidence_refs||p_evidence_refs) x)),updated_at=p_occurred_at where owner_id=u and breaker_id=b.breaker_id;
  insert into public.command_center_agency_circuit_breaker_events(owner_id,breaker_id,event_type,from_state,to_state,version,reason,evidence_refs,occurred_at)
  values(u,b.breaker_id,v_event,b.state,v_state,v_version,'failure_recorded',p_evidence_refs,p_occurred_at);
  return jsonb_build_object('state',v_state,'failure_count',v_count,'version',v_version);
end $$;

create or replace function public.command_center_agency_record_circuit_breaker_success(
  p_breaker_id uuid,p_expected_version bigint,p_evidence_refs text[],p_occurred_at timestamptz
) returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); b public.command_center_agency_circuit_breakers%rowtype; v_version bigint; begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  select * into b from public.command_center_agency_circuit_breakers where owner_id=u and breaker_id=p_breaker_id for update;
  if not found then raise exception 'Circuit breaker not found'; end if;
  if b.version<>p_expected_version then raise exception 'Circuit breaker version conflict'; end if;
  if b.state='open' then raise exception 'Open breaker requires a half-open probe before recovery'; end if;
  perform command_center_private.c3_assert_unique_text_array(p_evidence_refs,'Circuit breaker success evidence');
  if cardinality(coalesce(p_evidence_refs,'{}'::text[]))=0 then raise exception 'Circuit breaker success requires evidence'; end if;
  v_version:=b.version+1;
  update public.command_center_agency_circuit_breakers set state='closed',failure_count=0,opened_at=null,probe_started_at=null,version=v_version,evidence_refs=(select array(select distinct x from unnest(b.evidence_refs||p_evidence_refs) x)),updated_at=p_occurred_at where owner_id=u and breaker_id=b.breaker_id;
  insert into public.command_center_agency_circuit_breaker_events(owner_id,breaker_id,event_type,from_state,to_state,version,reason,evidence_refs,occurred_at)
  values(u,b.breaker_id,'recovered',b.state,'closed',v_version,'breaker_recovered',p_evidence_refs,p_occurred_at);
  return jsonb_build_object('state','closed','failure_count',0,'version',v_version);
end $$;

create or replace function public.command_center_agency_dead_letter_task(
  p_project_id text,p_run_id text,p_task_id text,p_disposition text,p_failure_class text,p_attempt_count integer,p_reason text,p_evidence_refs text[],p_occurred_at timestamptz
) returns uuid language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); v_id uuid; begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  if not exists(select 1 from public.command_center_agency_runs where owner_id=u and project_id=btrim(p_project_id) and run_id=btrim(p_run_id)) then raise exception 'Dead-letter run not found'; end if;
  if not exists(select 1 from public.command_center_agency_scheduled_tasks where owner_id=u and project_id=btrim(p_project_id) and run_ref=btrim(p_run_id) and task_id=btrim(p_task_id)) then raise exception 'Dead-letter task not found in run scope'; end if;
  if p_attempt_count<1 or coalesce(btrim(p_reason),'')='' then raise exception 'Dead-letter requires attempts and reason'; end if;
  if not ((p_disposition='dead_letter' and p_failure_class in ('retry_exhausted','permanent_failure')) or (p_disposition='blocked' and p_failure_class='blocked')) then raise exception 'Dead-letter disposition/failure class mismatch'; end if;
  perform command_center_private.c3_assert_unique_text_array(p_evidence_refs,'Dead-letter evidence');
  if cardinality(coalesce(p_evidence_refs,'{}'::text[]))=0 then raise exception 'Dead-letter requires evidence'; end if;
  insert into public.command_center_agency_dead_letters(owner_id,project_id,run_id,task_id,state,failure_class,attempt_count,reason,evidence_refs,created_at,updated_at)
  values(u,btrim(p_project_id),btrim(p_run_id),btrim(p_task_id),p_disposition,p_failure_class,p_attempt_count,btrim(p_reason),p_evidence_refs,p_occurred_at,p_occurred_at)
  returning dead_letter_id into v_id;
  update public.command_center_agency_runs set state='blocked',blocker=case when p_disposition='dead_letter' then 'dead_letter:'||v_id::text else 'blocked_task:'||v_id::text end,updated_at=p_occurred_at where owner_id=u and project_id=btrim(p_project_id) and run_id=btrim(p_run_id) and state not in ('completed','stopped','failed');
  return v_id;
end $$;

create or replace function public.command_center_agency_manage_dead_letter(
  p_dead_letter_id uuid,p_action text,p_reason text,p_evidence_refs text[],p_occurred_at timestamptz
) returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); d public.command_center_agency_dead_letters%rowtype; v_state text; v_version bigint; begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  select * into d from public.command_center_agency_dead_letters where owner_id=u and dead_letter_id=p_dead_letter_id for update;
  if not found or d.state not in ('dead_letter','blocked') then raise exception 'Active dead-letter/blocked task not found'; end if;
  if p_action not in ('requeue','resolve') or coalesce(btrim(p_reason),'')='' then raise exception 'Dead-letter management requires requeue/resolve and reason'; end if;
  if p_occurred_at<d.updated_at then raise exception 'Dead-letter transition time cannot move backward'; end if;
  perform command_center_private.c3_assert_unique_text_array(p_evidence_refs,'Dead-letter action evidence');
  if cardinality(coalesce(p_evidence_refs,'{}'::text[]))=0 then raise exception 'Dead-letter action requires evidence'; end if;
  v_state:=case when p_action='requeue' then 'requeued' else 'resolved' end;
  v_version:=d.version+1;
  insert into public.command_center_agency_dead_letter_actions(owner_id,dead_letter_id,from_state,to_state,reason,evidence_refs,occurred_at)
  values(u,d.dead_letter_id,d.state,v_state,btrim(p_reason),p_evidence_refs,p_occurred_at);
  update public.command_center_agency_dead_letters set state=v_state,reason=btrim(p_reason),version=v_version,evidence_refs=(select array(select distinct x from unnest(d.evidence_refs||p_evidence_refs) x)),updated_at=p_occurred_at,task_completion_authorized=false where owner_id=u and dead_letter_id=d.dead_letter_id;
  return jsonb_build_object('dead_letter_id',d.dead_letter_id,'state',v_state,'version',v_version,'task_completion_authorized',false,'task_id',d.task_id,'run_id',d.run_id,'project_id',d.project_id);
end $$;

revoke all on function public.command_center_agency_register_circuit_breaker(text,text,text,text,integer,integer,text[],timestamptz) from public,anon;
revoke all on function public.command_center_agency_request_circuit_breaker_permit(uuid,bigint,text[],timestamptz) from public,anon;
revoke all on function public.command_center_agency_record_circuit_breaker_failure(uuid,bigint,text[],timestamptz) from public,anon;
revoke all on function public.command_center_agency_record_circuit_breaker_success(uuid,bigint,text[],timestamptz) from public,anon;
revoke all on function public.command_center_agency_dead_letter_task(text,text,text,text,text,integer,text,text[],timestamptz) from public,anon;
revoke all on function public.command_center_agency_manage_dead_letter(uuid,text,text,text[],timestamptz) from public,anon;

grant execute on function public.command_center_agency_register_circuit_breaker(text,text,text,text,integer,integer,text[],timestamptz) to authenticated;
grant execute on function public.command_center_agency_request_circuit_breaker_permit(uuid,bigint,text[],timestamptz) to authenticated;
grant execute on function public.command_center_agency_record_circuit_breaker_failure(uuid,bigint,text[],timestamptz) to authenticated;
grant execute on function public.command_center_agency_record_circuit_breaker_success(uuid,bigint,text[],timestamptz) to authenticated;
grant execute on function public.command_center_agency_dead_letter_task(text,text,text,text,text,integer,text,text[],timestamptz) to authenticated;
grant execute on function public.command_center_agency_manage_dead_letter(uuid,text,text,text[],timestamptz) to authenticated;
