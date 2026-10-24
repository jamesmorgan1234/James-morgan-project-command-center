-- Category 7 / P7.16 — durable independent verification, QA/security review and separation of duties.
-- Branch-only migration. High/critical-risk executors cannot self-certify completion.

create table if not exists public.command_center_agency_verification_requests (
  verification_request_id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  project_id text not null,
  run_id text not null,
  task_id text not null,
  executor_id text not null,
  verifier_id text not null,
  review_type text not null check (review_type in ('verification','qa','security')),
  risk text not null check (risk in ('low','medium','high','critical')),
  executor_evidence_refs text[] not null,
  requested_at timestamptz not null,
  state text not null default 'pending' check (state in ('pending','accepted','rejected','disputed','cancelled')),
  decided_at timestamptz,
  foreign key(owner_id,project_id,run_id) references public.command_center_agency_runs(owner_id,project_id,run_id) on delete cascade,
  foreign key(owner_id,project_id,task_id) references public.command_center_agency_tasks(owner_id,project_id,task_id) on delete cascade,
  check (length(btrim(executor_id)) between 1 and 240),
  check (length(btrim(verifier_id)) between 1 and 240),
  check (cardinality(executor_evidence_refs)>0),
  check (risk not in ('high','critical') or executor_id<>verifier_id),
  check ((state='pending' and decided_at is null) or (state<>'pending' and decided_at is not null))
);

create table if not exists public.command_center_agency_verification_decisions (
  verification_decision_id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  verification_request_id uuid not null references public.command_center_agency_verification_requests(verification_request_id) on delete cascade,
  project_id text not null,
  task_id text not null,
  verifier_id text not null,
  result text not null check (result in ('accepted','rejected','disputed')),
  reason text not null check (length(btrim(reason)) between 1 and 2000),
  evidence_refs text[] not null,
  independent boolean not null,
  decided_at timestamptz not null,
  recorded_at timestamptz not null default now(),
  check (cardinality(evidence_refs)>0),
  check (decided_at<=recorded_at + interval '5 minutes')
);
create index if not exists command_center_agency_verification_task_idx
  on public.command_center_agency_verification_requests(owner_id,project_id,task_id,state,risk,requested_at);

do $$
declare t text;
begin
  foreach t in array array['command_center_agency_verification_requests','command_center_agency_verification_decisions'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('revoke all on table public.%I from public,anon,authenticated',t);
    execute format('grant select on table public.%I to authenticated',t);
    execute format('drop policy if exists %I on public.%I','c7_owner_select_'||t,t);
    execute format('create policy %I on public.%I for select to authenticated using (owner_id=(select auth.uid()) and (select public.is_command_center_authorized()))','c7_owner_select_'||t,t);
  end loop;
end $$;

create or replace function public.command_center_agency_request_verification(
  p_project_id text,p_run_id text,p_task_id text,p_executor_id text,p_verifier_id text,p_review_type text,p_risk text,p_executor_evidence_refs text[],p_requested_at timestamptz
) returns uuid language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); t public.command_center_agency_tasks%rowtype; v_id uuid; begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  select * into t from public.command_center_agency_tasks where owner_id=u and project_id=btrim(p_project_id) and run_id=btrim(p_run_id) and task_id=btrim(p_task_id);
  if not found then raise exception 'Verification task not found'; end if;
  if p_review_type not in ('verification','qa','security') or p_risk not in ('low','medium','high','critical') then raise exception 'Invalid verification classification'; end if;
  if p_risk<>t.risk then raise exception 'Verification risk must match task risk'; end if;
  if coalesce(btrim(p_executor_id),'')='' or coalesce(btrim(p_verifier_id),'')='' then raise exception 'Executor/verifier identity required'; end if;
  if p_risk in ('high','critical') and btrim(p_executor_id)=btrim(p_verifier_id) then raise exception 'High-risk task requires independent verifier'; end if;
  perform command_center_private.c3_assert_unique_text_array(p_executor_evidence_refs,'Executor verification evidence');
  if cardinality(coalesce(p_executor_evidence_refs,'{}'::text[]))=0 then raise exception 'Verification request requires executor evidence'; end if;
  insert into public.command_center_agency_verification_requests(owner_id,project_id,run_id,task_id,executor_id,verifier_id,review_type,risk,executor_evidence_refs,requested_at)
  values(u,t.project_id,t.run_id,t.task_id,btrim(p_executor_id),btrim(p_verifier_id),p_review_type,p_risk,p_executor_evidence_refs,p_requested_at) returning verification_request_id into v_id;
  return v_id;
end $$;

create or replace function public.command_center_agency_decide_verification(
  p_verification_request_id uuid,p_verifier_id text,p_result text,p_reason text,p_evidence_refs text[],p_decided_at timestamptz
) returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); v public.command_center_agency_verification_requests%rowtype; v_independent boolean; v_id uuid; begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  select * into v from public.command_center_agency_verification_requests where owner_id=u and verification_request_id=p_verification_request_id for update;
  if not found or v.state<>'pending' then raise exception 'Pending verification request not found'; end if;
  if btrim(p_verifier_id)<>v.verifier_id then raise exception 'Verification decision verifier mismatch'; end if;
  if p_result not in ('accepted','rejected','disputed') or coalesce(btrim(p_reason),'')='' then raise exception 'Verification result/reason required'; end if;
  perform command_center_private.c3_assert_unique_text_array(p_evidence_refs,'Verifier evidence');
  if cardinality(coalesce(p_evidence_refs,'{}'::text[]))=0 then raise exception 'Verification decision requires evidence'; end if;
  v_independent:=v.executor_id<>v.verifier_id;
  if v.risk in ('high','critical') and not v_independent then raise exception 'High-risk task requires independent verifier'; end if;
  insert into public.command_center_agency_verification_decisions(owner_id,verification_request_id,project_id,task_id,verifier_id,result,reason,evidence_refs,independent,decided_at)
  values(u,v.verification_request_id,v.project_id,v.task_id,v.verifier_id,p_result,btrim(p_reason),p_evidence_refs,v_independent,p_decided_at) returning verification_decision_id into v_id;
  update public.command_center_agency_verification_requests set state=p_result,decided_at=p_decided_at where owner_id=u and verification_request_id=v.verification_request_id;
  if p_result='accepted' then
    update public.command_center_agency_tasks set state='verified',verification_refs=array_append(verification_refs,'verification-decision:'||v_id::text),updated_at=p_decided_at where owner_id=u and project_id=v.project_id and task_id=v.task_id;
  end if;
  return jsonb_build_object('verification_decision_id',v_id,'task_id',v.task_id,'result',p_result,'independent',v_independent,'task_verified',p_result='accepted');
end $$;

revoke all on function public.command_center_agency_request_verification(text,text,text,text,text,text,text,text[],timestamptz) from public,anon;
revoke all on function public.command_center_agency_decide_verification(uuid,text,text,text,text[],timestamptz) from public,anon;
grant execute on function public.command_center_agency_request_verification(text,text,text,text,text,text,text,text[],timestamptz) to authenticated;
grant execute on function public.command_center_agency_decide_verification(uuid,text,text,text,text[],timestamptz) to authenticated;
