-- Category 7 / P7.4 — durable task leases, fencing, heartbeat, reclaim and idempotent commit.
-- Branch-only migration. Late/stale workers cannot commit after generation/fence loss.

create table if not exists public.command_center_agency_task_claims (
  owner_id uuid not null references auth.users(id) on delete cascade,
  project_id text not null,
  task_id text not null,
  worker_id text not null,
  generation bigint not null check (generation>=1),
  fencing_token bigint not null check (fencing_token>=1),
  status text not null check (status in ('claimed','released','committed')),
  retry_count integer not null default 0 check (retry_count>=0),
  idempotency_key text not null,
  claimed_at timestamptz not null,
  heartbeat_at timestamptz not null,
  expires_at timestamptz not null,
  updated_at timestamptz not null default now(),
  primary key(owner_id,project_id,task_id),
  foreign key(owner_id,project_id) references public.command_center_project_profiles(owner_id,project_id) on delete cascade,
  check (length(btrim(task_id)) between 1 and 240),
  check (length(btrim(worker_id)) between 1 and 240),
  check (length(btrim(idempotency_key)) between 1 and 500),
  check (expires_at>claimed_at),
  check (heartbeat_at>=claimed_at and heartbeat_at<expires_at)
);

create table if not exists public.command_center_agency_task_claim_events (
  event_id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  project_id text not null,
  task_id text not null,
  worker_id text not null,
  generation bigint not null,
  fencing_token bigint not null,
  event_type text not null check (event_type in ('claimed','reclaimed','heartbeat','released','committed','rejected_stale')),
  retry_count integer not null,
  idempotency_key text not null,
  evidence_refs text[] not null,
  occurred_at timestamptz not null,
  recorded_at timestamptz not null default now(),
  check (cardinality(evidence_refs)>0),
  check (occurred_at<=recorded_at + interval '5 minutes')
);
create index if not exists command_center_agency_task_claim_events_idx
  on public.command_center_agency_task_claim_events(owner_id,project_id,task_id,generation,event_id);

create table if not exists public.command_center_agency_task_commits (
  commit_id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  project_id text not null,
  task_id text not null,
  generation bigint not null,
  fencing_token bigint not null,
  worker_id text not null,
  idempotency_key text not null,
  result_ref text not null check (length(btrim(result_ref)) between 1 and 1000),
  result_hash text not null check (result_hash ~ '^[a-f0-9]{64}$'),
  evidence_refs text[] not null,
  committed_at timestamptz not null,
  recorded_at timestamptz not null default now(),
  unique(owner_id,project_id,task_id),
  unique(owner_id,idempotency_key),
  check (cardinality(evidence_refs)>0),
  check (committed_at<=recorded_at + interval '5 minutes')
);

do $$
declare t text;
begin
  foreach t in array array['command_center_agency_task_claims','command_center_agency_task_claim_events','command_center_agency_task_commits'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('revoke all on table public.%I from public,anon,authenticated',t);
    execute format('grant select on table public.%I to authenticated',t);
    execute format('drop policy if exists %I on public.%I','c7_owner_select_'||t,t);
    execute format('create policy %I on public.%I for select to authenticated using (owner_id=(select auth.uid()) and (select public.is_command_center_authorized()))','c7_owner_select_'||t,t);
  end loop;
end $$;

create or replace function public.command_center_agency_claim_task(
  p_project_id text,p_task_id text,p_worker_id text,p_idempotency_key text,p_now timestamptz,p_expires_at timestamptz,p_evidence_refs text[]
) returns jsonb language plpgsql security definer set search_path='' as $$
declare
  u uuid:=auth.uid();
  c public.command_center_agency_task_claims%rowtype;
  v_generation bigint;
  v_fence bigint;
  v_retry integer;
  v_event text;
begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  if not exists(select 1 from public.command_center_project_profiles where owner_id=u and project_id=btrim(p_project_id)) then raise exception 'Task project not found'; end if;
  if coalesce(btrim(p_task_id),'')='' or coalesce(btrim(p_worker_id),'')='' or coalesce(btrim(p_idempotency_key),'')='' then raise exception 'Task/worker/idempotency identity required'; end if;
  if p_expires_at<=p_now then raise exception 'Task claim expiry must be in the future'; end if;
  perform command_center_private.c3_assert_unique_text_array(p_evidence_refs,'Task claim evidence');
  if cardinality(coalesce(p_evidence_refs,'{}'::text[]))=0 then raise exception 'Task claim requires evidence'; end if;
  if exists(select 1 from public.command_center_agency_task_commits where owner_id=u and project_id=btrim(p_project_id) and task_id=btrim(p_task_id)) then raise exception 'Committed task cannot be reclaimed'; end if;

  select * into c from public.command_center_agency_task_claims where owner_id=u and project_id=btrim(p_project_id) and task_id=btrim(p_task_id) for update;
  if found and c.status='claimed' and c.expires_at>p_now then raise exception 'Task already claimed by live worker'; end if;

  if found then
    v_generation:=c.generation+1;
    v_fence:=c.fencing_token+1;
    v_retry:=c.retry_count+1;
    v_event:='reclaimed';
    update public.command_center_agency_task_claims set worker_id=btrim(p_worker_id),generation=v_generation,fencing_token=v_fence,status='claimed',retry_count=v_retry,idempotency_key=btrim(p_idempotency_key),claimed_at=p_now,heartbeat_at=p_now,expires_at=p_expires_at,updated_at=p_now where owner_id=u and project_id=c.project_id and task_id=c.task_id;
  else
    v_generation:=1; v_fence:=1; v_retry:=0; v_event:='claimed';
    insert into public.command_center_agency_task_claims(owner_id,project_id,task_id,worker_id,generation,fencing_token,status,retry_count,idempotency_key,claimed_at,heartbeat_at,expires_at,updated_at)
    values(u,btrim(p_project_id),btrim(p_task_id),btrim(p_worker_id),v_generation,v_fence,'claimed',v_retry,btrim(p_idempotency_key),p_now,p_now,p_expires_at,p_now);
  end if;

  insert into public.command_center_agency_task_claim_events(owner_id,project_id,task_id,worker_id,generation,fencing_token,event_type,retry_count,idempotency_key,evidence_refs,occurred_at)
  values(u,btrim(p_project_id),btrim(p_task_id),btrim(p_worker_id),v_generation,v_fence,v_event,v_retry,btrim(p_idempotency_key),p_evidence_refs,p_now);
  return jsonb_build_object('project_id',btrim(p_project_id),'task_id',btrim(p_task_id),'worker_id',btrim(p_worker_id),'generation',v_generation,'fencing_token',v_fence,'retry_count',v_retry,'expires_at',p_expires_at);
end $$;

create or replace function public.command_center_agency_heartbeat_task(
  p_project_id text,p_task_id text,p_worker_id text,p_generation bigint,p_fencing_token bigint,p_now timestamptz,p_expires_at timestamptz,p_evidence_refs text[]
) returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); c public.command_center_agency_task_claims%rowtype; begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  select * into c from public.command_center_agency_task_claims where owner_id=u and project_id=btrim(p_project_id) and task_id=btrim(p_task_id) for update;
  if not found or c.status<>'claimed' or c.worker_id<>btrim(p_worker_id) or c.generation<>p_generation or c.fencing_token<>p_fencing_token then raise exception 'Stale worker fencing token rejected'; end if;
  if p_now>=c.expires_at then raise exception 'Expired task claim cannot heartbeat'; end if;
  if p_expires_at<=p_now then raise exception 'Renewal expiry must be in the future'; end if;
  perform command_center_private.c3_assert_unique_text_array(p_evidence_refs,'Task heartbeat evidence');
  if cardinality(coalesce(p_evidence_refs,'{}'::text[]))=0 then raise exception 'Task heartbeat requires evidence'; end if;
  update public.command_center_agency_task_claims set heartbeat_at=p_now,expires_at=p_expires_at,updated_at=p_now where owner_id=u and project_id=c.project_id and task_id=c.task_id;
  insert into public.command_center_agency_task_claim_events(owner_id,project_id,task_id,worker_id,generation,fencing_token,event_type,retry_count,idempotency_key,evidence_refs,occurred_at)
  values(u,c.project_id,c.task_id,c.worker_id,c.generation,c.fencing_token,'heartbeat',c.retry_count,c.idempotency_key,p_evidence_refs,p_now);
  return jsonb_build_object('task_id',c.task_id,'generation',c.generation,'fencing_token',c.fencing_token,'expires_at',p_expires_at);
end $$;

create or replace function public.command_center_agency_commit_task(
  p_project_id text,p_task_id text,p_worker_id text,p_generation bigint,p_fencing_token bigint,p_idempotency_key text,p_result_ref text,p_result_hash text,p_evidence_refs text[],p_now timestamptz
) returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); c public.command_center_agency_task_claims%rowtype; existing public.command_center_agency_task_commits%rowtype; v_commit uuid; begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  select * into existing from public.command_center_agency_task_commits where owner_id=u and project_id=btrim(p_project_id) and task_id=btrim(p_task_id);
  if found then
    if existing.idempotency_key=btrim(p_idempotency_key) and existing.result_hash=p_result_hash then
      return jsonb_build_object('commit_id',existing.commit_id,'task_id',existing.task_id,'duplicate',true,'result_hash',existing.result_hash);
    end if;
    raise exception 'Task already committed with different result/idempotency key';
  end if;
  select * into c from public.command_center_agency_task_claims where owner_id=u and project_id=btrim(p_project_id) and task_id=btrim(p_task_id) for update;
  if not found or c.status<>'claimed' or c.worker_id<>btrim(p_worker_id) or c.generation<>p_generation or c.fencing_token<>p_fencing_token or c.idempotency_key<>btrim(p_idempotency_key) then raise exception 'Stale worker fencing token rejected'; end if;
  if p_now>=c.expires_at then raise exception 'Expired task claim cannot commit'; end if;
  if coalesce(btrim(p_result_ref),'')='' or coalesce(p_result_hash,'') !~ '^[a-f0-9]{64}$' then raise exception 'Task commit requires result reference/hash'; end if;
  perform command_center_private.c3_assert_unique_text_array(p_evidence_refs,'Task commit evidence');
  if cardinality(coalesce(p_evidence_refs,'{}'::text[]))=0 then raise exception 'Task commit requires evidence'; end if;
  insert into public.command_center_agency_task_commits(owner_id,project_id,task_id,generation,fencing_token,worker_id,idempotency_key,result_ref,result_hash,evidence_refs,committed_at)
  values(u,c.project_id,c.task_id,c.generation,c.fencing_token,c.worker_id,c.idempotency_key,btrim(p_result_ref),p_result_hash,p_evidence_refs,p_now) returning commit_id into v_commit;
  update public.command_center_agency_task_claims set status='committed',updated_at=p_now where owner_id=u and project_id=c.project_id and task_id=c.task_id;
  insert into public.command_center_agency_task_claim_events(owner_id,project_id,task_id,worker_id,generation,fencing_token,event_type,retry_count,idempotency_key,evidence_refs,occurred_at)
  values(u,c.project_id,c.task_id,c.worker_id,c.generation,c.fencing_token,'committed',c.retry_count,c.idempotency_key,p_evidence_refs,p_now);
  return jsonb_build_object('commit_id',v_commit,'task_id',c.task_id,'duplicate',false,'result_hash',p_result_hash);
end $$;

create or replace function public.command_center_agency_release_task(
  p_project_id text,p_task_id text,p_worker_id text,p_generation bigint,p_fencing_token bigint,p_now timestamptz,p_evidence_refs text[]
) returns boolean language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); c public.command_center_agency_task_claims%rowtype; begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  select * into c from public.command_center_agency_task_claims where owner_id=u and project_id=btrim(p_project_id) and task_id=btrim(p_task_id) for update;
  if not found or c.status<>'claimed' or c.worker_id<>btrim(p_worker_id) or c.generation<>p_generation or c.fencing_token<>p_fencing_token then raise exception 'Stale worker fencing token rejected'; end if;
  if p_now>=c.expires_at then raise exception 'Expired task claim cannot release'; end if;
  perform command_center_private.c3_assert_unique_text_array(p_evidence_refs,'Task release evidence');
  if cardinality(coalesce(p_evidence_refs,'{}'::text[]))=0 then raise exception 'Task release requires evidence'; end if;
  update public.command_center_agency_task_claims set status='released',updated_at=p_now where owner_id=u and project_id=c.project_id and task_id=c.task_id;
  insert into public.command_center_agency_task_claim_events(owner_id,project_id,task_id,worker_id,generation,fencing_token,event_type,retry_count,idempotency_key,evidence_refs,occurred_at)
  values(u,c.project_id,c.task_id,c.worker_id,c.generation,c.fencing_token,'released',c.retry_count,c.idempotency_key,p_evidence_refs,p_now);
  return true;
end $$;

revoke all on function public.command_center_agency_claim_task(text,text,text,text,timestamptz,timestamptz,text[]) from public,anon;
revoke all on function public.command_center_agency_heartbeat_task(text,text,text,bigint,bigint,timestamptz,timestamptz,text[]) from public,anon;
revoke all on function public.command_center_agency_commit_task(text,text,text,bigint,bigint,text,text,text,text[],timestamptz) from public,anon;
revoke all on function public.command_center_agency_release_task(text,text,text,bigint,bigint,timestamptz,text[]) from public,anon;
grant execute on function public.command_center_agency_claim_task(text,text,text,text,timestamptz,timestamptz,text[]) to authenticated;
grant execute on function public.command_center_agency_heartbeat_task(text,text,text,bigint,bigint,timestamptz,timestamptz,text[]) to authenticated;
grant execute on function public.command_center_agency_commit_task(text,text,text,bigint,bigint,text,text,text,text[],timestamptz) to authenticated;
grant execute on function public.command_center_agency_release_task(text,text,text,bigint,bigint,timestamptz,text[]) to authenticated;
