-- Category 7 / P7.19 — atomic pause/resume/stop/kill and stale-worker containment.
-- Branch-only migration. Control actions fence stale workers and preserve protected state consistency.

create table if not exists public.command_center_agency_control_events (
  control_event_id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  project_id text not null,
  run_id text not null,
  prior_generation bigint not null check (prior_generation>=1),
  new_generation bigint not null check (new_generation>=1),
  action text not null check (action in ('pause','resume','stop','kill_run','kill_project','kill_agency','force_reclaim')),
  reason text not null check (length(btrim(reason)) between 1 and 2000),
  cancelled_task_ids text[] not null default '{}'::text[],
  released_resource_claim_count integer not null default 0 check (released_resource_claim_count>=0),
  drained_worker_ids text[] not null default '{}'::text[],
  evidence_refs text[] not null,
  occurred_at timestamptz not null,
  recorded_at timestamptz not null default now(),
  foreign key(owner_id,project_id,run_id) references public.command_center_agency_runs(owner_id,project_id,run_id) on delete cascade,
  check (cardinality(evidence_refs)>0),
  check (new_generation>=prior_generation),
  check (action in ('pause','resume') or new_generation>prior_generation),
  check (occurred_at<=recorded_at + interval '5 minutes')
);
create index if not exists command_center_agency_control_events_idx
  on public.command_center_agency_control_events(owner_id,project_id,run_id,occurred_at,control_event_id);

alter table public.command_center_agency_control_events enable row level security;
revoke all on table public.command_center_agency_control_events from public,anon,authenticated;
grant select on table public.command_center_agency_control_events to authenticated;
drop policy if exists c7_owner_select_agency_control_events on public.command_center_agency_control_events;
create policy c7_owner_select_agency_control_events
  on public.command_center_agency_control_events for select to authenticated
  using (owner_id=(select auth.uid()) and (select public.is_command_center_authorized()));

create or replace function public.command_center_agency_control_run(
  p_project_id text,p_run_id text,p_expected_generation bigint,p_action text,p_reason text,p_evidence_refs text[],p_occurred_at timestamptz
) returns jsonb language plpgsql security definer set search_path='' as $$
declare
  u uuid:=auth.uid();
  r public.command_center_agency_runs%rowtype;
  v_new_generation bigint;
  v_cancelled text[]:='{}'::text[];
  v_released integer:=0;
  v_drained text[]:='{}'::text[];
  v_event uuid;
  v_scope text;
begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  if p_action not in ('pause','resume','stop','kill_run','kill_project','kill_agency','force_reclaim') then raise exception 'Invalid Agency control action'; end if;
  if coalesce(btrim(p_reason),'')='' then raise exception 'Agency control action requires reason'; end if;
  perform command_center_private.c3_assert_unique_text_array(p_evidence_refs,'Agency control evidence');
  if cardinality(coalesce(p_evidence_refs,'{}'::text[]))=0 then raise exception 'Agency control action requires evidence'; end if;

  select * into r from public.command_center_agency_runs where owner_id=u and project_id=btrim(p_project_id) and run_id=btrim(p_run_id) for update;
  if not found then raise exception 'Agency control run not found'; end if;
  if r.generation<>p_expected_generation then raise exception 'Agency control generation conflict'; end if;
  if r.state in ('completed','failed') and p_action not in ('force_reclaim') then raise exception 'Terminal run cannot accept control action'; end if;

  if p_action='pause' then
    if r.state not in ('queued','working','blocked','needs_user') then raise exception 'Run cannot pause from current state'; end if;
    v_new_generation:=r.generation;
    update public.command_center_agency_runs set pause_requested=true,state='paused',updated_at=p_occurred_at where owner_id=u and project_id=r.project_id and run_id=r.run_id;
  elsif p_action='resume' then
    if r.state<>'paused' then raise exception 'Only paused run can resume'; end if;
    v_new_generation:=r.generation;
    update public.command_center_agency_runs set pause_requested=false,state='queued',updated_at=p_occurred_at where owner_id=u and project_id=r.project_id and run_id=r.run_id;
  else
    v_new_generation:=r.generation+1;
    v_scope:=case p_action when 'kill_project' then 'project' when 'kill_agency' then 'agency' else 'run' end;

    select coalesce(array_agg(t.task_id order by t.task_id),'{}'::text[]) into v_cancelled
    from public.command_center_agency_tasks t
    where t.owner_id=u
      and (v_scope='agency' or t.project_id=r.project_id)
      and (v_scope<>'run' or t.run_id=r.run_id)
      and t.state not in ('verified','skipped','stopped','failed');

    update public.command_center_agency_tasks set state='stopped',updated_at=p_occurred_at
    where owner_id=u
      and (v_scope='agency' or project_id=r.project_id)
      and (v_scope<>'run' or run_id=r.run_id)
      and state not in ('verified','skipped','stopped','failed');

    update public.command_center_agency_task_claims set status='released',updated_at=p_occurred_at
    where owner_id=u
      and (v_scope='agency' or project_id=r.project_id)
      and (v_scope<>'run' or exists(select 1 from public.command_center_agency_scheduled_tasks s where s.owner_id=u and s.project_id=r.project_id and s.task_id=command_center_agency_task_claims.task_id and s.run_ref=r.run_id))
      and status='claimed';

    update public.command_center_agency_resource_claims set released_at=p_occurred_at
    where owner_id=u and released_at is null
      and (v_scope='agency' or project_id=r.project_id)
      and (v_scope<>'run' or claimant_ref like r.run_id||'%');
    get diagnostics v_released = row_count;

    select coalesce(array_agg(worker_id order by worker_id),'{}'::text[]) into v_drained
    from public.command_center_agency_worker_health
    where owner_id=u and (v_scope='agency' or project_id=r.project_id) and (v_scope<>'run' or run_id=r.run_id) and state not in ('dead','draining');
    update public.command_center_agency_worker_health set state='draining',updated_at=now()
    where owner_id=u and (v_scope='agency' or project_id=r.project_id) and (v_scope<>'run' or run_id=r.run_id) and state not in ('dead','draining');

    update public.command_center_agency_project_auto_locks set state='released',released_at=p_occurred_at
    where owner_id=u and state='active' and (v_scope='agency' or project_id=r.project_id) and (v_scope<>'run' or run_id=r.run_id);

    update public.command_center_agency_runs set stop_requested=true,pause_requested=false,state='stopped',generation=generation+1,updated_at=p_occurred_at
    where owner_id=u and (v_scope='agency' or project_id=r.project_id) and (v_scope<>'run' or run_id=r.run_id) and state not in ('completed','failed','stopped');
  end if;

  insert into public.command_center_agency_control_events(owner_id,project_id,run_id,prior_generation,new_generation,action,reason,cancelled_task_ids,released_resource_claim_count,drained_worker_ids,evidence_refs,occurred_at)
  values(u,r.project_id,r.run_id,r.generation,v_new_generation,p_action,btrim(p_reason),v_cancelled,v_released,v_drained,p_evidence_refs,p_occurred_at)
  returning control_event_id into v_event;

  return jsonb_build_object('control_event_id',v_event,'project_id',r.project_id,'run_id',r.run_id,'action',p_action,'prior_generation',r.generation,'new_generation',v_new_generation,'cancelled_task_ids',to_jsonb(v_cancelled),'released_resource_claim_count',v_released,'drained_worker_ids',to_jsonb(v_drained),'late_worker_resurrection_allowed',false);
end $$;

revoke all on function public.command_center_agency_control_run(text,text,bigint,text,text,text[],timestamptz) from public,anon;
grant execute on function public.command_center_agency_control_run(text,text,bigint,text,text,text[],timestamptz) to authenticated;
