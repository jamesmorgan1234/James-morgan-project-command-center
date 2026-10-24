-- Category 7 / P7.17 — durable Integration Lead queue and deterministic merge arbitration.
-- Branch-only migration. Overlapping artifact outputs never silently last-write-wins.

create table if not exists public.command_center_agency_integration_batches (
  batch_id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  project_id text not null,
  run_id text not null,
  integration_lead_key text not null,
  state text not null default 'open' check (state in ('open','conflict','ready','accepted','rejected')),
  evidence_refs text[] not null,
  opened_at timestamptz not null,
  decided_at timestamptz,
  foreign key(owner_id,project_id,run_id) references public.command_center_agency_runs(owner_id,project_id,run_id) on delete cascade,
  foreign key(owner_id,integration_lead_key) references public.command_center_agency_leads(owner_id,lead_key) on delete restrict,
  check (cardinality(evidence_refs)>0),
  check ((state in ('open','conflict','ready') and decided_at is null) or (state in ('accepted','rejected') and decided_at is not null))
);

create table if not exists public.command_center_agency_integration_candidates (
  candidate_id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  batch_id uuid not null references public.command_center_agency_integration_batches(batch_id) on delete cascade,
  project_id text not null,
  task_id text not null,
  artifact_key text not null,
  artifact_version bigint not null check (artifact_version>=1),
  content_hash text not null check (content_hash ~ '^[a-f0-9]{64}$'),
  verification_refs text[] not null,
  evidence_refs text[] not null,
  submitted_at timestamptz not null,
  foreign key(owner_id,project_id,task_id) references public.command_center_agency_tasks(owner_id,project_id,task_id) on delete restrict,
  unique(owner_id,batch_id,task_id,artifact_key),
  check (cardinality(verification_refs)>0),
  check (cardinality(evidence_refs)>0),
  check (length(btrim(artifact_key)) between 1 and 500)
);

create table if not exists public.command_center_agency_integration_decisions (
  integration_decision_id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  batch_id uuid not null references public.command_center_agency_integration_batches(batch_id) on delete cascade,
  project_id text not null,
  result text not null check (result in ('accepted','rejected','conflict')),
  accepted_task_ids text[] not null default '{}'::text[],
  conflict_artifact_keys text[] not null default '{}'::text[],
  cross_module_test_refs text[] not null default '{}'::text[],
  reason text not null check (length(btrim(reason)) between 1 and 2000),
  evidence_refs text[] not null,
  decided_at timestamptz not null,
  recorded_at timestamptz not null default now(),
  check (cardinality(evidence_refs)>0),
  check ((result='accepted' and cardinality(conflict_artifact_keys)=0 and cardinality(cross_module_test_refs)>0)
      or (result='conflict' and cardinality(conflict_artifact_keys)>0)
      or result='rejected'),
  check (decided_at<=recorded_at + interval '5 minutes')
);
create index if not exists command_center_agency_integration_candidates_artifact_idx
  on public.command_center_agency_integration_candidates(owner_id,batch_id,artifact_key,artifact_version,content_hash);

do $$
declare t text;
begin
  foreach t in array array['command_center_agency_integration_batches','command_center_agency_integration_candidates','command_center_agency_integration_decisions'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('revoke all on table public.%I from public,anon,authenticated',t);
    execute format('grant select on table public.%I to authenticated',t);
    execute format('drop policy if exists %I on public.%I','c7_owner_select_'||t,t);
    execute format('create policy %I on public.%I for select to authenticated using (owner_id=(select auth.uid()) and (select public.is_command_center_authorized()))','c7_owner_select_'||t,t);
  end loop;
end $$;

create or replace function public.command_center_agency_arbitrate_integration(
  p_batch_id uuid,p_cross_module_test_refs text[],p_evidence_refs text[],p_reason text,p_decided_at timestamptz
) returns jsonb language plpgsql security definer set search_path='' as $$
declare
  u uuid:=auth.uid();
  b public.command_center_agency_integration_batches%rowtype;
  conflicts text[];
  accepted text[];
  v_result text;
  v_id uuid;
begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  select * into b from public.command_center_agency_integration_batches where owner_id=u and batch_id=p_batch_id for update;
  if not found or b.state in ('accepted','rejected') then raise exception 'Open integration batch not found'; end if;
  perform command_center_private.c3_assert_unique_text_array(p_cross_module_test_refs,'Integration cross-module tests');
  perform command_center_private.c3_assert_unique_text_array(p_evidence_refs,'Integration evidence');
  if cardinality(coalesce(p_evidence_refs,'{}'::text[]))=0 or coalesce(btrim(p_reason),'')='' then raise exception 'Integration decision requires reason/evidence'; end if;
  select coalesce(array_agg(artifact_key order by artifact_key),'{}'::text[]) into conflicts
  from (
    select artifact_key
    from public.command_center_agency_integration_candidates
    where owner_id=u and batch_id=b.batch_id
    group by artifact_key
    having count(distinct artifact_version::text||':'||content_hash)>1
  ) x;
  if cardinality(conflicts)>0 then
    v_result:='conflict'; accepted:='{}'::text[];
  else
    if cardinality(coalesce(p_cross_module_test_refs,'{}'::text[]))=0 then raise exception 'Conflict-free integration still requires cross-module test evidence'; end if;
    v_result:='accepted';
    select coalesce(array_agg(distinct task_id order by task_id),'{}'::text[]) into accepted from public.command_center_agency_integration_candidates where owner_id=u and batch_id=b.batch_id;
  end if;
  insert into public.command_center_agency_integration_decisions(owner_id,batch_id,project_id,result,accepted_task_ids,conflict_artifact_keys,cross_module_test_refs,reason,evidence_refs,decided_at)
  values(u,b.batch_id,b.project_id,v_result,accepted,conflicts,coalesce(p_cross_module_test_refs,'{}'::text[]),btrim(p_reason),p_evidence_refs,p_decided_at) returning integration_decision_id into v_id;
  update public.command_center_agency_integration_batches set state=case when v_result='accepted' then 'accepted' else 'conflict' end,decided_at=case when v_result='accepted' then p_decided_at else null end where owner_id=u and batch_id=b.batch_id;
  return jsonb_build_object('integration_decision_id',v_id,'result',v_result,'accepted_task_ids',to_jsonb(accepted),'conflict_artifact_keys',to_jsonb(conflicts),'last_write_wins',false);
end $$;

revoke all on function public.command_center_agency_arbitrate_integration(uuid,text[],text[],text,timestamptz) from public,anon;
grant execute on function public.command_center_agency_arbitrate_integration(uuid,text[],text[],text,timestamptz) to authenticated;
