-- Category 7 / P7.11 — durable Boundary Office and bounded execution-mode handoffs.
-- Branch-only migration. Boundary records survive session loss; Work is never auto-launched.

create table if not exists public.command_center_agency_boundaries (
  boundary_id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  project_id text not null,
  run_id text not null,
  run_generation bigint not null check (run_generation>=1),
  task_id text,
  boundary_type text not null check (boundary_type in ('next_step','until_work','to_work_barriers','manual_task','project_checkpoint','needs_me')),
  state text not null default 'open' check (state in ('open','resolved','cancelled','superseded')),
  blocker_code text not null check (length(btrim(blocker_code)) between 1 and 240),
  blocker_detail text not null check (length(btrim(blocker_detail)) between 1 and 4000),
  required_environment text check (required_environment is null or required_environment in ('pc','phone','local_browser','any_device','work')),
  owner_action text,
  verification_method text not null check (length(btrim(verification_method)) between 1 and 1000),
  checkpoint_id uuid,
  resume_task_id text,
  resume_context_ref text,
  evidence_refs text[] not null,
  automatic_work_launch boolean not null default false check (automatic_work_launch=false),
  created_at timestamptz not null,
  resolved_at timestamptz,
  unique(owner_id,boundary_id),
  foreign key(owner_id,project_id,run_id) references public.command_center_agency_runs(owner_id,project_id,run_id) on delete cascade,
  foreign key(checkpoint_id) references public.command_center_project_checkpoints(checkpoint_id) on delete restrict,
  check (cardinality(evidence_refs)>0),
  check (owner_action is null or required_environment is not null),
  check ((state='open' and resolved_at is null) or (state<>'open' and resolved_at is not null))
);
create index if not exists command_center_agency_boundaries_open_idx
  on public.command_center_agency_boundaries(owner_id,project_id,state,created_at,boundary_id);

create table if not exists public.command_center_agency_boundary_resolutions (
  resolution_id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  boundary_id uuid not null,
  run_generation bigint not null check (run_generation>=1),
  verification_refs text[] not null,
  result text not null check (result in ('verified_resolved','verification_failed','stale_generation')),
  resume_allowed boolean not null,
  reason text not null check (length(btrim(reason)) between 1 and 1000),
  verified_at timestamptz not null,
  recorded_at timestamptz not null default now(),
  foreign key(owner_id,boundary_id) references public.command_center_agency_boundaries(owner_id,boundary_id) on delete cascade,
  check (cardinality(verification_refs)>0),
  check (resume_allowed=(result='verified_resolved')),
  check (verified_at<=recorded_at + interval '5 minutes')
);

do $$
declare t text;
begin
  foreach t in array array['command_center_agency_boundaries','command_center_agency_boundary_resolutions'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('revoke all on table public.%I from public,anon,authenticated',t);
    execute format('grant select on table public.%I to authenticated',t);
    execute format('drop policy if exists %I on public.%I','c7_owner_select_'||t,t);
    execute format('create policy %I on public.%I for select to authenticated using (owner_id=(select auth.uid()) and (select public.is_command_center_authorized()))','c7_owner_select_'||t,t);
  end loop;
end $$;

create or replace function public.command_center_agency_open_boundary(
  p_project_id text,p_run_id text,p_expected_generation bigint,p_task_id text,p_boundary_type text,p_blocker_code text,p_blocker_detail text,p_required_environment text,p_owner_action text,p_verification_method text,p_checkpoint_id uuid,p_resume_task_id text,p_resume_context_ref text,p_evidence_refs text[],p_created_at timestamptz
) returns uuid language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); r public.command_center_agency_runs%rowtype; v_id uuid; begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  select * into r from public.command_center_agency_runs where owner_id=u and project_id=btrim(p_project_id) and run_id=btrim(p_run_id) for update;
  if not found then raise exception 'Boundary run not found'; end if;
  if r.generation<>p_expected_generation then raise exception 'Boundary run generation conflict'; end if;
  if p_boundary_type not in ('next_step','until_work','to_work_barriers','manual_task','project_checkpoint','needs_me') then raise exception 'Invalid boundary type'; end if;
  if coalesce(btrim(p_blocker_code),'')='' or coalesce(btrim(p_blocker_detail),'')='' or coalesce(btrim(p_verification_method),'')='' then raise exception 'Boundary requires exact blocker and verification method'; end if;
  if nullif(btrim(coalesce(p_owner_action,'')),'') is not null and p_required_environment not in ('pc','phone','local_browser','any_device','work') then raise exception 'Boundary owner action requires valid environment'; end if;
  if p_checkpoint_id is not null and not exists(select 1 from public.command_center_project_checkpoints where owner_id=u and project_id=r.project_id and checkpoint_id=p_checkpoint_id) then raise exception 'Boundary checkpoint scope mismatch'; end if;
  if nullif(btrim(coalesce(p_resume_task_id,'')),'') is not null and not exists(select 1 from public.command_center_agency_scheduled_tasks where owner_id=u and project_id=r.project_id and task_id=btrim(p_resume_task_id) and run_ref=r.run_id) then raise exception 'Boundary resume task scope mismatch'; end if;
  perform command_center_private.c3_assert_unique_text_array(p_evidence_refs,'Boundary evidence');
  if cardinality(coalesce(p_evidence_refs,'{}'::text[]))=0 then raise exception 'Boundary requires evidence'; end if;
  insert into public.command_center_agency_boundaries(owner_id,project_id,run_id,run_generation,task_id,boundary_type,blocker_code,blocker_detail,required_environment,owner_action,verification_method,checkpoint_id,resume_task_id,resume_context_ref,evidence_refs,created_at)
  values(u,r.project_id,r.run_id,r.generation,nullif(btrim(coalesce(p_task_id,'')),''),p_boundary_type,btrim(p_blocker_code),btrim(p_blocker_detail),nullif(btrim(coalesce(p_required_environment,'')),''),nullif(btrim(coalesce(p_owner_action,'')),''),btrim(p_verification_method),p_checkpoint_id,nullif(btrim(coalesce(p_resume_task_id,'')),''),nullif(btrim(coalesce(p_resume_context_ref,'')),''),p_evidence_refs,p_created_at)
  returning boundary_id into v_id;
  update public.command_center_agency_runs set state=case when p_owner_action is not null then 'needs_user' else 'blocked' end,blocker=btrim(p_blocker_code),updated_at=p_created_at where owner_id=u and project_id=r.project_id and run_id=r.run_id and state not in ('completed','stopped','failed');
  return v_id;
end $$;

create or replace function public.command_center_agency_resolve_boundary(
  p_boundary_id uuid,p_expected_generation bigint,p_verification_refs text[],p_verified boolean,p_reason text,p_verified_at timestamptz
) returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); b public.command_center_agency_boundaries%rowtype; r public.command_center_agency_runs%rowtype; v_result text; v_resume boolean; begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  select * into b from public.command_center_agency_boundaries where owner_id=u and boundary_id=p_boundary_id for update;
  if not found or b.state<>'open' then raise exception 'Open boundary not found'; end if;
  select * into r from public.command_center_agency_runs where owner_id=u and project_id=b.project_id and run_id=b.run_id for update;
  perform command_center_private.c3_assert_unique_text_array(p_verification_refs,'Boundary verification');
  if cardinality(coalesce(p_verification_refs,'{}'::text[]))=0 or coalesce(btrim(p_reason),'')='' then raise exception 'Boundary resolution requires verification/reason'; end if;
  if r.generation<>p_expected_generation or b.run_generation<>p_expected_generation then v_result:='stale_generation'; v_resume:=false;
  elsif not p_verified then v_result:='verification_failed'; v_resume:=false;
  else v_result:='verified_resolved'; v_resume:=true; end if;
  insert into public.command_center_agency_boundary_resolutions(owner_id,boundary_id,run_generation,verification_refs,result,resume_allowed,reason,verified_at)
  values(u,b.boundary_id,p_expected_generation,p_verification_refs,v_result,v_resume,btrim(p_reason),p_verified_at);
  if v_resume then
    update public.command_center_agency_boundaries set state='resolved',resolved_at=p_verified_at where owner_id=u and boundary_id=b.boundary_id;
    update public.command_center_agency_runs set state='queued',blocker=null,updated_at=p_verified_at where owner_id=u and project_id=b.project_id and run_id=b.run_id and state in ('blocked','needs_user','paused');
  end if;
  return jsonb_build_object('boundary_id',b.boundary_id,'result',v_result,'resume_allowed',v_resume,'run_id',b.run_id,'resume_task_id',b.resume_task_id,'resume_context_ref',b.resume_context_ref,'automatic_work_launch',false);
end $$;

revoke all on function public.command_center_agency_open_boundary(text,text,bigint,text,text,text,text,text,text,text,uuid,text,text,text[],timestamptz) from public,anon;
revoke all on function public.command_center_agency_resolve_boundary(uuid,bigint,text[],boolean,text,timestamptz) from public,anon;
grant execute on function public.command_center_agency_open_boundary(text,text,bigint,text,text,text,text,text,text,text,uuid,text,text,text[],timestamptz) to authenticated;
grant execute on function public.command_center_agency_resolve_boundary(uuid,bigint,text[],boolean,text,timestamptz) to authenticated;