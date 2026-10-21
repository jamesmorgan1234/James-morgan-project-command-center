-- Command Center Brain — Automation Phase 2: Condition Evaluator
-- Saved conditions are owner/project scoped and evaluate only trusted Command Center data.
-- This phase decides whether a scheduled trigger passes. It does not notify, report, or execute actions.

create table if not exists public.automation_conditions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  project_id text not null references public.projects(id) on delete cascade,
  name text not null,
  match_mode text not null default 'all' check (match_mode in ('all','any')),
  clauses jsonb not null default '[]'::jsonb,
  status text not null default 'active' check (status in ('active','paused','archived')),
  last_result text not null default 'never' check (last_result in ('never','true','false','unavailable','error')),
  last_evaluated_at timestamptz null,
  evaluation_count integer not null default 0 check (evaluation_count >= 0),
  metadata jsonb not null default '{}'::jsonb,
  archived_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint automation_conditions_clauses_shape_check check (
    jsonb_typeof(clauses)='array' and jsonb_array_length(clauses) between 1 and 10
  )
);

create table if not exists public.automation_condition_evaluations (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  project_id text not null references public.projects(id) on delete cascade,
  condition_id uuid not null references public.automation_conditions(id) on delete cascade,
  dispatch_id uuid null references public.automation_dispatch_queue(id) on delete set null,
  result_state text not null check (result_state in ('true','false','unavailable','error')),
  result_boolean boolean null,
  clause_results jsonb not null default '[]'::jsonb,
  evaluated_at timestamptz not null default now(),
  constraint automation_condition_evaluations_result_check check (
    (result_state='true' and result_boolean is true)
    or (result_state='false' and result_boolean is false)
    or (result_state in ('unavailable','error') and result_boolean is null)
  )
);

create unique index if not exists automation_condition_evaluations_dispatch_uidx
  on public.automation_condition_evaluations(dispatch_id) where dispatch_id is not null;
create index if not exists automation_conditions_owner_project_status_idx
  on public.automation_conditions(owner_id,project_id,status,updated_at desc);
create index if not exists automation_condition_evaluations_owner_condition_idx
  on public.automation_condition_evaluations(owner_id,condition_id,evaluated_at desc);

alter table public.automation_schedules
  add column if not exists condition_id uuid null references public.automation_conditions(id) on delete set null;

alter table public.automation_dispatch_queue
  add column if not exists condition_id uuid null references public.automation_conditions(id) on delete set null,
  add column if not exists condition_state text not null default 'not_required'
    check (condition_state in ('not_required','pending','passed','blocked','unavailable','error')),
  add column if not exists condition_evaluated_at timestamptz null;

create index if not exists automation_schedules_owner_condition_idx
  on public.automation_schedules(owner_id,condition_id);
create index if not exists automation_dispatch_condition_state_idx
  on public.automation_dispatch_queue(owner_id,condition_state,scheduled_for desc);

alter table public.automation_conditions enable row level security;
alter table public.automation_condition_evaluations enable row level security;

drop policy if exists automation_conditions_select_own on public.automation_conditions;
create policy automation_conditions_select_own on public.automation_conditions for select using (
  owner_id=(select auth.uid()) and (select public.is_command_center_authorized())
);
drop policy if exists automation_conditions_insert_own on public.automation_conditions;
create policy automation_conditions_insert_own on public.automation_conditions for insert with check (
  owner_id=(select auth.uid()) and (select public.is_command_center_authorized())
);
drop policy if exists automation_conditions_update_own on public.automation_conditions;
create policy automation_conditions_update_own on public.automation_conditions for update using (
  owner_id=(select auth.uid()) and (select public.is_command_center_authorized())
) with check (
  owner_id=(select auth.uid()) and (select public.is_command_center_authorized())
);
drop policy if exists automation_conditions_delete_own on public.automation_conditions;
create policy automation_conditions_delete_own on public.automation_conditions for delete using (
  owner_id=(select auth.uid()) and (select public.is_command_center_authorized())
);

drop policy if exists automation_condition_evaluations_select_own on public.automation_condition_evaluations;
create policy automation_condition_evaluations_select_own on public.automation_condition_evaluations for select using (
  owner_id=(select auth.uid()) and (select public.is_command_center_authorized())
);

revoke all on public.automation_condition_evaluations from anon, authenticated;
grant select on public.automation_condition_evaluations to authenticated;
grant select,insert,update,delete on public.automation_conditions to authenticated;

create or replace function public.command_center_prepare_automation_condition()
returns trigger
language plpgsql
set search_path=public,pg_temp
as $$
declare
  v_clause jsonb;
  v_source text;
  v_operator text;
  v_field text;
  v_key text;
begin
  new.name:=btrim(new.name);
  if new.name='' then raise exception 'Condition name is required'; end if;
  if not exists(
    select 1 from public.projects p where p.id=new.project_id and p.owner_id=new.owner_id
  ) then raise exception 'Condition project must belong to the owner'; end if;

  if jsonb_typeof(new.clauses)<>'array' or jsonb_array_length(new.clauses) not between 1 and 10 then
    raise exception 'A condition needs between 1 and 10 rules';
  end if;

  for v_clause in select value from jsonb_array_elements(new.clauses)
  loop
    if jsonb_typeof(v_clause)<>'object' then raise exception 'Each condition rule must be an object'; end if;
    v_source:=btrim(coalesce(v_clause->>'source',''));
    v_operator:=btrim(coalesce(v_clause->>'operator',''));
    if v_source not in ('metric','project') then raise exception 'Unsupported condition source'; end if;
    if v_operator not in ('eq','neq','gt','gte','lt','lte','contains','not_contains','is_empty','not_empty') then
      raise exception 'Unsupported condition operator';
    end if;
    if v_operator not in ('is_empty','not_empty') and not (v_clause ? 'expected') then
      raise exception 'Condition comparison value is required';
    end if;

    if v_source='metric' then
      v_key:=btrim(coalesce(v_clause->>'key',''));
      if v_key='' then raise exception 'Verified metric key is required'; end if;
    else
      v_field:=btrim(coalesce(v_clause->>'field',''));
      if v_field not in ('status','verification','stage','next_action','blocker','attention','source_status') then
        raise exception 'Unsupported project field';
      end if;
    end if;
  end loop;

  if new.status='archived' then new.archived_at:=coalesce(new.archived_at,now());
  else new.archived_at:=null;
  end if;
  return new;
end;
$$;

drop trigger if exists automation_conditions_prepare on public.automation_conditions;
create trigger automation_conditions_prepare before insert or update on public.automation_conditions
for each row execute function public.command_center_prepare_automation_condition();

drop trigger if exists automation_conditions_set_updated_at on public.automation_conditions;
create trigger automation_conditions_set_updated_at before update on public.automation_conditions
for each row execute function public.command_center_set_updated_at();

create or replace function public.command_center_condition_compare(
  p_actual jsonb,
  p_operator text,
  p_expected jsonb
) returns boolean
language plpgsql
immutable
set search_path=public,pg_temp
as $$
declare
  v_actual text;
  v_expected text;
  v_actual_num numeric;
  v_expected_num numeric;
begin
  if p_actual is null or p_actual='null'::jsonb then v_actual:=null;
  else v_actual:=p_actual #>> '{}';
  end if;
  if p_expected is null or p_expected='null'::jsonb then v_expected:=null;
  else v_expected:=p_expected #>> '{}';
  end if;

  if p_operator='is_empty' then return v_actual is null or btrim(v_actual)=''; end if;
  if p_operator='not_empty' then return v_actual is not null and btrim(v_actual)<>''; end if;
  if v_actual is null then return null; end if;

  if p_operator='eq' then return v_actual is not distinct from v_expected; end if;
  if p_operator='neq' then return v_actual is distinct from v_expected; end if;
  if p_operator='contains' then return position(lower(coalesce(v_expected,'')) in lower(v_actual))>0; end if;
  if p_operator='not_contains' then return position(lower(coalesce(v_expected,'')) in lower(v_actual))=0; end if;

  if v_expected is null
     or v_actual !~ '^-?[0-9]+([.][0-9]+)?$'
     or v_expected !~ '^-?[0-9]+([.][0-9]+)?$' then return null;
  end if;
  v_actual_num:=v_actual::numeric;
  v_expected_num:=v_expected::numeric;
  if p_operator='gt' then return v_actual_num>v_expected_num; end if;
  if p_operator='gte' then return v_actual_num>=v_expected_num; end if;
  if p_operator='lt' then return v_actual_num<v_expected_num; end if;
  if p_operator='lte' then return v_actual_num<=v_expected_num; end if;
  return null;
end;
$$;

create or replace function public.command_center_evaluate_condition_internal(
  p_condition_id uuid,
  p_dispatch_id uuid default null
) returns table(result_state text,result_boolean boolean,evaluation_id uuid)
language plpgsql
security definer
set search_path=public,pg_temp
as $$
declare
  c public.automation_conditions%rowtype;
  d public.automation_dispatch_queue%rowtype;
  v_clause jsonb;
  v_source text;
  v_operator text;
  v_actual jsonb;
  v_compare boolean;
  v_clause_state text;
  v_results jsonb:='[]'::jsonb;
  v_true integer:=0;
  v_false integer:=0;
  v_unavailable integer:=0;
  v_state text;
  v_bool boolean;
  v_eval_id uuid;
begin
  select * into c from public.automation_conditions where id=p_condition_id;
  if not found then raise exception 'Condition not found'; end if;

  if p_dispatch_id is not null then
    select * into d from public.automation_dispatch_queue where id=p_dispatch_id for update;
    if not found or d.owner_id<>c.owner_id or d.condition_id is distinct from c.id then
      raise exception 'Dispatch does not match condition';
    end if;
    select e.id,e.result_state,e.result_boolean into v_eval_id,v_state,v_bool
    from public.automation_condition_evaluations e where e.dispatch_id=p_dispatch_id;
    if found then
      result_state:=v_state; result_boolean:=v_bool; evaluation_id:=v_eval_id; return next; return;
    end if;
  end if;

  if c.status<>'active' then
    v_state:='unavailable';
    v_bool:=null;
    v_results:=jsonb_build_array(jsonb_build_object('state','unavailable','reason','condition_not_active'));
  else
    begin
      for v_clause in select value from jsonb_array_elements(c.clauses)
      loop
        v_source:=v_clause->>'source';
        v_operator:=v_clause->>'operator';
        v_actual:=null;

        if v_source='metric' then
          select case
            when m.value_numeric is not null then to_jsonb(m.value_numeric)
            when m.value_text is not null then to_jsonb(m.value_text)
            else 'null'::jsonb
          end
          into v_actual
          from public.metrics m
          where m.owner_id=c.owner_id
            and m.project_id=c.project_id
            and m.key=(v_clause->>'key')
            and m.verified is true
          order by m.updated_at desc nulls last,m.created_at desc
          limit 1;
          if not found then
            v_clause_state:='unavailable';
            v_compare:=null;
          else
            v_compare:=public.command_center_condition_compare(v_actual,v_operator,v_clause->'expected');
            v_clause_state:=case when v_compare is true then 'true' when v_compare is false then 'false' else 'unavailable' end;
          end if;
        else
          select case v_clause->>'field'
            when 'status' then to_jsonb(p.status)
            when 'verification' then to_jsonb(p.verification)
            when 'stage' then to_jsonb(p.stage)
            when 'next_action' then to_jsonb(p.next_action)
            when 'blocker' then to_jsonb(p.blocker)
            when 'attention' then to_jsonb(p.attention)
            when 'source_status' then to_jsonb(p.source_status)
            else null
          end
          into v_actual
          from public.projects p
          where p.id=c.project_id and p.owner_id=c.owner_id;
          if not found then
            v_clause_state:='unavailable';
            v_compare:=null;
          else
            v_compare:=public.command_center_condition_compare(v_actual,v_operator,v_clause->'expected');
            v_clause_state:=case when v_compare is true then 'true' when v_compare is false then 'false' else 'unavailable' end;
          end if;
        end if;

        if v_clause_state='true' then v_true:=v_true+1;
        elsif v_clause_state='false' then v_false:=v_false+1;
        else v_unavailable:=v_unavailable+1;
        end if;
        v_results:=v_results||jsonb_build_array(jsonb_build_object(
          'source',v_source,
          'subject',coalesce(v_clause->>'key',v_clause->>'field'),
          'operator',v_operator,
          'state',v_clause_state
        ));
      end loop;

      if c.match_mode='all' then
        if v_false>0 then v_state:='false'; v_bool:=false;
        elsif v_unavailable>0 then v_state:='unavailable'; v_bool:=null;
        else v_state:='true'; v_bool:=true;
        end if;
      else
        if v_true>0 then v_state:='true'; v_bool:=true;
        elsif v_unavailable>0 then v_state:='unavailable'; v_bool:=null;
        else v_state:='false'; v_bool:=false;
        end if;
      end if;
    exception when others then
      v_state:='error'; v_bool:=null;
      v_results:=jsonb_build_array(jsonb_build_object('state','error','reason','evaluation_failed'));
    end;
  end if;

  insert into public.automation_condition_evaluations(
    owner_id,project_id,condition_id,dispatch_id,result_state,result_boolean,clause_results
  ) values(
    c.owner_id,c.project_id,c.id,p_dispatch_id,v_state,v_bool,v_results
  ) returning id into v_eval_id;

  update public.automation_conditions
  set last_result=v_state,last_evaluated_at=now(),evaluation_count=evaluation_count+1
  where id=c.id;

  if p_dispatch_id is not null then
    update public.automation_dispatch_queue
    set condition_state=case v_state
      when 'true' then 'passed'
      when 'false' then 'blocked'
      when 'unavailable' then 'unavailable'
      else 'error'
    end,
    condition_evaluated_at=now()
    where id=p_dispatch_id;
  end if;

  result_state:=v_state; result_boolean:=v_bool; evaluation_id:=v_eval_id;
  return next;
end;
$$;

revoke all on function public.command_center_condition_compare(jsonb,text,jsonb) from public,anon,authenticated;
revoke all on function public.command_center_evaluate_condition_internal(uuid,uuid) from public,anon,authenticated;
grant execute on function public.command_center_condition_compare(jsonb,text,jsonb) to postgres,service_role;
grant execute on function public.command_center_evaluate_condition_internal(uuid,uuid) to postgres,service_role;

create or replace function public.command_center_evaluate_condition(p_condition_id uuid)
returns table(result_state text,result_boolean boolean,evaluation_id uuid)
language plpgsql
security definer
set search_path=public,pg_temp
as $$
declare
  v_owner uuid;
begin
  if (select auth.uid()) is null then raise exception 'Authentication required'; end if;
  if not (select public.is_command_center_authorized()) then raise exception 'Command Center authorization required'; end if;
  select owner_id into v_owner from public.automation_conditions where id=p_condition_id;
  if not found or v_owner<>(select auth.uid()) then raise exception 'Condition not found'; end if;
  return query select * from public.command_center_evaluate_condition_internal(p_condition_id,null);
end;
$$;

revoke all on function public.command_center_evaluate_condition(uuid) from public,anon;
grant execute on function public.command_center_evaluate_condition(uuid) to authenticated;

create or replace function public.command_center_prepare_automation_schedule()
returns trigger
language plpgsql
set search_path=public,pg_temp
as $$
declare
  v_recalculate boolean;
  v_condition_owner uuid;
  v_condition_project text;
  v_condition_status text;
begin
  new.name:=btrim(new.name);
  new.job_label:=btrim(new.job_label);
  new.timezone:=coalesce(nullif(btrim(new.timezone),''),'UTC');
  if new.name='' then raise exception 'Schedule name is required'; end if;
  if new.job_label='' then raise exception 'Scheduled job is required'; end if;
  if not exists(select 1 from pg_timezone_names where name=new.timezone) then raise exception 'Invalid scheduler timezone'; end if;

  if new.condition_id is not null then
    select owner_id,project_id,status into v_condition_owner,v_condition_project,v_condition_status
    from public.automation_conditions where id=new.condition_id;
    if not found or v_condition_owner<>new.owner_id then raise exception 'Schedule condition must belong to the owner'; end if;
    if new.project_id is null or v_condition_project<>new.project_id then raise exception 'Schedule and condition must use the same project'; end if;
    if v_condition_status='archived' then raise exception 'Archived conditions cannot be attached to schedules'; end if;
  end if;

  if new.schedule_kind<>'weekly' then new.weekdays:='{}'::smallint[]; end if;
  if new.schedule_kind not in ('daily','weekly') then new.local_time:=null; end if;
  if new.schedule_kind<>'interval' then new.interval_minutes:=null; end if;

  if new.status='archived' then new.archived_at:=coalesce(new.archived_at,now());
  else new.archived_at:=null;
  end if;

  v_recalculate:=tg_op='INSERT';
  if tg_op='UPDATE' then
    v_recalculate:=
      new.schedule_kind is distinct from old.schedule_kind or
      new.schedule_at is distinct from old.schedule_at or
      new.interval_minutes is distinct from old.interval_minutes or
      new.local_time is distinct from old.local_time or
      new.weekdays is distinct from old.weekdays or
      new.timezone is distinct from old.timezone or
      new.status is distinct from old.status;
  end if;

  if new.status='active' and v_recalculate then
    new.next_run_at:=public.command_center_scheduler_next_run(new.schedule_kind,new.schedule_at,new.interval_minutes,new.local_time,new.weekdays,new.timezone,clock_timestamp()-interval '1 second');
    if new.next_run_at is null then new.status:='completed'; end if;
  elsif new.status<>'active' then
    new.next_run_at:=null;
  end if;
  return new;
end;
$$;

create or replace function public.command_center_scheduler_tick(p_now timestamptz default clock_timestamp(),p_limit integer default 100)
returns integer
language plpgsql
security definer
set search_path=public,pg_temp
as $$
declare
  r public.automation_schedules%rowtype;
  v_count integer:=0;
  v_trigger_count integer;
  v_next timestamptz;
begin
  for r in
    select * from public.automation_schedules
    where status='active' and next_run_at is not null and next_run_at<=p_now
    order by next_run_at,id
    limit greatest(1,least(coalesce(p_limit,100),500))
    for update skip locked
  loop
    insert into public.automation_dispatch_queue(
      owner_id,project_id,schedule_id,schedule_name,job_label,scheduled_for,condition_id,condition_state,metadata
    ) values(
      r.owner_id,r.project_id,r.id,r.name,r.job_label,r.next_run_at,r.condition_id,
      case when r.condition_id is null then 'not_required' else 'pending' end,
      jsonb_build_object('scheduler_phase',1,'condition_evaluator_phase',2,'schedule_kind',r.schedule_kind)
    )
    on conflict(schedule_id,scheduled_for) do nothing;

    v_trigger_count:=r.trigger_count+1;
    if r.schedule_kind='once' or (r.max_runs is not null and v_trigger_count>=r.max_runs) then
      update public.automation_schedules set last_triggered_at=r.next_run_at,trigger_count=v_trigger_count,status='completed',next_run_at=null where id=r.id;
    else
      v_next:=public.command_center_scheduler_next_run(r.schedule_kind,r.schedule_at,r.interval_minutes,r.local_time,r.weekdays,r.timezone,greatest(p_now,r.next_run_at));
      update public.automation_schedules set last_triggered_at=r.next_run_at,trigger_count=v_trigger_count,next_run_at=v_next,status=case when v_next is null then 'completed' else 'active' end where id=r.id;
    end if;
    v_count:=v_count+1;
  end loop;
  return v_count;
end;
$$;

create or replace function public.command_center_evaluate_dispatch_condition()
returns trigger
language plpgsql
security definer
set search_path=public,pg_temp
as $$
begin
  if new.condition_id is not null then
    perform public.command_center_evaluate_condition_internal(new.condition_id,new.id);
  end if;
  return new;
end;
$$;

drop trigger if exists automation_dispatch_evaluate_condition on public.automation_dispatch_queue;
create trigger automation_dispatch_evaluate_condition after insert on public.automation_dispatch_queue
for each row execute function public.command_center_evaluate_dispatch_condition();

revoke all on function public.command_center_evaluate_dispatch_condition() from public,anon,authenticated;
grant execute on function public.command_center_evaluate_dispatch_condition() to postgres,service_role;
