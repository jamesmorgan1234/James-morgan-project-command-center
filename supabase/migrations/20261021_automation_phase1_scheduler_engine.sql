-- Command Center Brain — Automation Phase 1: Scheduler Engine
-- Owner-scoped schedules are evaluated server-side so they continue while the PWA is closed.
-- Phase 1 only emits due Command Center triggers. Later Automation phases may evaluate conditions,
-- deliver notifications, generate reports, or execute explicitly authorized actions.

create extension if not exists pg_cron with schema pg_catalog;

grant usage on schema cron to postgres;
grant all privileges on all tables in schema cron to postgres;

create table if not exists public.automation_schedules (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  project_id text null references public.projects(id) on delete set null,
  name text not null,
  job_label text not null,
  schedule_kind text not null check (schedule_kind in ('once','interval','daily','weekly')),
  schedule_at timestamptz null,
  interval_minutes integer null check (interval_minutes is null or interval_minutes between 5 and 525600),
  local_time time null,
  weekdays smallint[] not null default '{}'::smallint[],
  timezone text not null default 'UTC',
  status text not null default 'active' check (status in ('active','paused','completed','archived')),
  next_run_at timestamptz null,
  last_triggered_at timestamptz null,
  trigger_count integer not null default 0 check (trigger_count >= 0),
  max_runs integer null check (max_runs is null or max_runs > 0),
  metadata jsonb not null default '{}'::jsonb,
  archived_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint automation_schedules_kind_fields_check check (
    (schedule_kind='once' and schedule_at is not null)
    or (schedule_kind='interval' and interval_minutes is not null)
    or (schedule_kind='daily' and local_time is not null)
    or (schedule_kind='weekly' and local_time is not null and cardinality(weekdays) > 0)
  ),
  constraint automation_schedules_weekdays_check check (weekdays <@ array[0,1,2,3,4,5,6]::smallint[])
);

create table if not exists public.automation_dispatch_queue (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  project_id text null references public.projects(id) on delete set null,
  schedule_id uuid not null references public.automation_schedules(id) on delete cascade,
  schedule_name text not null,
  job_label text not null,
  scheduled_for timestamptz not null,
  status text not null default 'queued' check (status in ('queued','claimed','completed','skipped','failed')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  claimed_at timestamptz null,
  completed_at timestamptz null,
  unique(schedule_id,scheduled_for)
);

create index if not exists automation_schedules_owner_status_next_idx on public.automation_schedules(owner_id,status,next_run_at);
create index if not exists automation_schedules_due_idx on public.automation_schedules(next_run_at) where status='active';
create index if not exists automation_dispatch_owner_status_idx on public.automation_dispatch_queue(owner_id,status,scheduled_for desc);
create index if not exists automation_dispatch_schedule_idx on public.automation_dispatch_queue(schedule_id,scheduled_for desc);

alter table public.automation_schedules enable row level security;
alter table public.automation_dispatch_queue enable row level security;

drop policy if exists automation_schedules_select_own on public.automation_schedules;
create policy automation_schedules_select_own on public.automation_schedules for select using (
  owner_id=(select auth.uid()) and (select public.is_command_center_authorized())
);
drop policy if exists automation_schedules_insert_own on public.automation_schedules;
create policy automation_schedules_insert_own on public.automation_schedules for insert with check (
  owner_id=(select auth.uid()) and (select public.is_command_center_authorized())
);
drop policy if exists automation_schedules_update_own on public.automation_schedules;
create policy automation_schedules_update_own on public.automation_schedules for update using (
  owner_id=(select auth.uid()) and (select public.is_command_center_authorized())
) with check (
  owner_id=(select auth.uid()) and (select public.is_command_center_authorized())
);
drop policy if exists automation_schedules_delete_own on public.automation_schedules;
create policy automation_schedules_delete_own on public.automation_schedules for delete using (
  owner_id=(select auth.uid()) and (select public.is_command_center_authorized())
);

drop policy if exists automation_dispatch_select_own on public.automation_dispatch_queue;
create policy automation_dispatch_select_own on public.automation_dispatch_queue for select using (
  owner_id=(select auth.uid()) and (select public.is_command_center_authorized())
);

revoke all on public.automation_dispatch_queue from anon, authenticated;
grant select on public.automation_dispatch_queue to authenticated;
grant select,insert,update,delete on public.automation_schedules to authenticated;

create or replace function public.command_center_scheduler_next_run(
  p_kind text,
  p_schedule_at timestamptz,
  p_interval_minutes integer,
  p_local_time time,
  p_weekdays smallint[],
  p_timezone text,
  p_after timestamptz
) returns timestamptz
language plpgsql
stable
set search_path=public,pg_temp
as $$
declare
  v_tz text := coalesce(nullif(trim(p_timezone),''),'UTC');
  v_local_after timestamp;
  v_candidate_local timestamp;
  v_candidate_date date;
  v_anchor timestamptz;
  v_steps bigint;
  v_i integer;
begin
  if not exists(select 1 from pg_timezone_names where name=v_tz) then
    raise exception 'Invalid scheduler timezone: %',v_tz;
  end if;

  if p_kind='once' then
    if p_schedule_at is not null and p_schedule_at > p_after then return p_schedule_at; end if;
    return null;
  elsif p_kind='interval' then
    if p_interval_minutes is null then return null; end if;
    v_anchor:=coalesce(p_schedule_at,p_after);
    if v_anchor > p_after then return v_anchor; end if;
    v_steps:=floor(extract(epoch from (p_after-v_anchor))/60/p_interval_minutes)::bigint+1;
    return v_anchor + (v_steps*p_interval_minutes) * interval '1 minute';
  elsif p_kind='daily' then
    if p_local_time is null then return null; end if;
    v_local_after:=p_after at time zone v_tz;
    v_candidate_local:=v_local_after::date + p_local_time;
    if v_candidate_local <= v_local_after then v_candidate_local:=v_candidate_local+interval '1 day'; end if;
    return v_candidate_local at time zone v_tz;
  elsif p_kind='weekly' then
    if p_local_time is null or coalesce(cardinality(p_weekdays),0)=0 then return null; end if;
    v_local_after:=p_after at time zone v_tz;
    for v_i in 0..7 loop
      v_candidate_date:=v_local_after::date+v_i;
      if extract(dow from v_candidate_date)::smallint=any(p_weekdays) then
        v_candidate_local:=v_candidate_date+p_local_time;
        if v_candidate_local > v_local_after then return v_candidate_local at time zone v_tz; end if;
      end if;
    end loop;
    return null;
  end if;
  return null;
end;
$$;

create or replace function public.command_center_prepare_automation_schedule()
returns trigger
language plpgsql
set search_path=public,pg_temp
as $$
declare
  v_recalculate boolean;
begin
  new.name:=btrim(new.name);
  new.job_label:=btrim(new.job_label);
  new.timezone:=coalesce(nullif(btrim(new.timezone),''),'UTC');
  if new.name='' then raise exception 'Schedule name is required'; end if;
  if new.job_label='' then raise exception 'Scheduled job is required'; end if;
  if not exists(select 1 from pg_timezone_names where name=new.timezone) then raise exception 'Invalid scheduler timezone'; end if;

  if new.schedule_kind<>'weekly' then new.weekdays:='{}'::smallint[]; end if;
  if new.schedule_kind not in ('daily','weekly') then new.local_time:=null; end if;
  if new.schedule_kind<>'interval' then new.interval_minutes:=null; end if;

  if new.status='archived' then
    new.archived_at:=coalesce(new.archived_at,now());
  else
    new.archived_at:=null;
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

drop trigger if exists automation_schedules_prepare on public.automation_schedules;
create trigger automation_schedules_prepare before insert or update on public.automation_schedules
for each row execute function public.command_center_prepare_automation_schedule();

drop trigger if exists automation_schedules_set_updated_at on public.automation_schedules;
create trigger automation_schedules_set_updated_at before update on public.automation_schedules
for each row execute function public.command_center_set_updated_at();

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
    insert into public.automation_dispatch_queue(owner_id,project_id,schedule_id,schedule_name,job_label,scheduled_for,metadata)
    values(r.owner_id,r.project_id,r.id,r.name,r.job_label,r.next_run_at,jsonb_build_object('scheduler_phase',1,'schedule_kind',r.schedule_kind))
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

revoke all on function public.command_center_scheduler_tick(timestamptz,integer) from public,anon,authenticated;
grant execute on function public.command_center_scheduler_tick(timestamptz,integer) to postgres,service_role;

-- Replace only Command Center's own scheduler heartbeat. It is deliberately data-empty until the owner creates a schedule.
do $$
declare j record;
begin
  for j in select jobid from cron.job where jobname='command-center-scheduler-tick' loop
    perform cron.unschedule(j.jobid);
  end loop;
  perform cron.schedule('command-center-scheduler-tick','* * * * *','select public.command_center_scheduler_tick();');
end $$;
