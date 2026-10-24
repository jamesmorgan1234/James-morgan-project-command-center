-- Category 7 / P7.3 — durable scheduler leadership, leases and fencing.
-- Branch-only migration. Transactional row locking prevents two valid leaders for one owner/scheduler scope.

create table if not exists public.command_center_agency_scheduler_leases (
  owner_id uuid not null references auth.users(id) on delete cascade,
  scheduler_scope text not null,
  leader_id text not null,
  term bigint not null check (term>=1),
  fencing_token bigint not null check (fencing_token>=1),
  acquired_at timestamptz not null,
  expires_at timestamptz not null,
  updated_at timestamptz not null default now(),
  primary key(owner_id,scheduler_scope),
  check (scheduler_scope ~ '^[a-z0-9][a-z0-9._:-]{0,160}$'),
  check (length(btrim(leader_id)) between 1 and 240),
  check (expires_at>acquired_at),
  check (updated_at>=acquired_at)
);

create table if not exists public.command_center_agency_scheduler_leadership_events (
  event_id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  scheduler_scope text not null,
  leader_id text not null,
  term bigint not null,
  fencing_token bigint not null,
  event_type text not null check (event_type in ('acquired','renewed','expired_takeover','released')),
  acquired_at timestamptz not null,
  expires_at timestamptz not null,
  evidence_refs text[] not null,
  recorded_at timestamptz not null default now(),
  check (cardinality(evidence_refs)>0),
  check (expires_at>acquired_at)
);
create unique index if not exists command_center_agency_scheduler_fence_unique
  on public.command_center_agency_scheduler_leadership_events(owner_id,scheduler_scope,fencing_token);
create index if not exists command_center_agency_scheduler_events_idx
  on public.command_center_agency_scheduler_leadership_events(owner_id,scheduler_scope,term desc,fencing_token desc);

do $$
declare t text;
begin
  foreach t in array array['command_center_agency_scheduler_leases','command_center_agency_scheduler_leadership_events'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('revoke all on table public.%I from public,anon,authenticated',t);
    execute format('grant select on table public.%I to authenticated',t);
    execute format('drop policy if exists %I on public.%I','c7_owner_select_'||t,t);
    execute format('create policy %I on public.%I for select to authenticated using (owner_id=(select auth.uid()) and (select public.is_command_center_authorized()))','c7_owner_select_'||t,t);
  end loop;
end $$;

create or replace function public.command_center_agency_acquire_scheduler_leadership(
  p_scheduler_scope text,p_candidate_id text,p_now timestamptz,p_expires_at timestamptz,p_evidence_refs text[]
) returns jsonb language plpgsql security definer set search_path='' as $$
declare
  u uuid:=auth.uid();
  current_lease public.command_center_agency_scheduler_leases%rowtype;
  v_term bigint;
  v_fence bigint;
  v_event text;
begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  if coalesce(btrim(p_scheduler_scope),'') !~ '^[a-z0-9][a-z0-9._:-]{0,160}$' or coalesce(btrim(p_candidate_id),'')='' then raise exception 'Scheduler scope/candidate required'; end if;
  if p_expires_at<=p_now then raise exception 'Scheduler lease must expire after acquisition time'; end if;
  perform command_center_private.c3_assert_unique_text_array(p_evidence_refs,'Scheduler leadership evidence');
  if cardinality(coalesce(p_evidence_refs,'{}'::text[]))=0 then raise exception 'Scheduler leadership requires evidence'; end if;

  select * into current_lease from public.command_center_agency_scheduler_leases
  where owner_id=u and scheduler_scope=btrim(p_scheduler_scope) for update;

  if found and current_lease.expires_at>p_now and current_lease.leader_id<>btrim(p_candidate_id) then
    raise exception 'Scheduler leadership already held by another live leader';
  end if;

  if found then
    v_term:=current_lease.term+1;
    v_fence:=current_lease.fencing_token+1;
    v_event:=case when current_lease.expires_at<=p_now and current_lease.leader_id<>btrim(p_candidate_id) then 'expired_takeover' else 'renewed' end;
    update public.command_center_agency_scheduler_leases
    set leader_id=btrim(p_candidate_id),term=v_term,fencing_token=v_fence,acquired_at=p_now,expires_at=p_expires_at,updated_at=p_now
    where owner_id=u and scheduler_scope=current_lease.scheduler_scope;
  else
    v_term:=1; v_fence:=1; v_event:='acquired';
    insert into public.command_center_agency_scheduler_leases(owner_id,scheduler_scope,leader_id,term,fencing_token,acquired_at,expires_at,updated_at)
    values(u,btrim(p_scheduler_scope),btrim(p_candidate_id),v_term,v_fence,p_now,p_expires_at,p_now);
  end if;

  insert into public.command_center_agency_scheduler_leadership_events(owner_id,scheduler_scope,leader_id,term,fencing_token,event_type,acquired_at,expires_at,evidence_refs)
  values(u,btrim(p_scheduler_scope),btrim(p_candidate_id),v_term,v_fence,v_event,p_now,p_expires_at,p_evidence_refs);

  return jsonb_build_object('scheduler_scope',btrim(p_scheduler_scope),'leader_id',btrim(p_candidate_id),'term',v_term,'fencing_token',v_fence,'expires_at',p_expires_at);
end $$;

create or replace function public.command_center_agency_assert_scheduler_leader(
  p_scheduler_scope text,p_leader_id text,p_fencing_token bigint,p_now timestamptz
) returns boolean language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); l public.command_center_agency_scheduler_leases%rowtype; begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  select * into l from public.command_center_agency_scheduler_leases where owner_id=u and scheduler_scope=btrim(p_scheduler_scope);
  if not found or l.leader_id<>btrim(p_leader_id) or l.fencing_token<>p_fencing_token then raise exception 'Scheduler leadership/fencing mismatch'; end if;
  if p_now>=l.expires_at then raise exception 'Scheduler leadership expired'; end if;
  return true;
end $$;

create or replace function public.command_center_agency_release_scheduler_leadership(
  p_scheduler_scope text,p_leader_id text,p_fencing_token bigint,p_now timestamptz,p_evidence_refs text[]
) returns boolean language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); l public.command_center_agency_scheduler_leases%rowtype; begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  select * into l from public.command_center_agency_scheduler_leases where owner_id=u and scheduler_scope=btrim(p_scheduler_scope) for update;
  if not found or l.leader_id<>btrim(p_leader_id) or l.fencing_token<>p_fencing_token then raise exception 'Scheduler leadership/fencing mismatch'; end if;
  perform command_center_private.c3_assert_unique_text_array(p_evidence_refs,'Scheduler release evidence');
  if cardinality(coalesce(p_evidence_refs,'{}'::text[]))=0 then raise exception 'Scheduler release requires evidence'; end if;
  insert into public.command_center_agency_scheduler_leadership_events(owner_id,scheduler_scope,leader_id,term,fencing_token,event_type,acquired_at,expires_at,evidence_refs)
  values(u,l.scheduler_scope,l.leader_id,l.term,l.fencing_token,'released',l.acquired_at,greatest(p_now,l.acquired_at + interval '1 microsecond'),p_evidence_refs);
  delete from public.command_center_agency_scheduler_leases where owner_id=u and scheduler_scope=l.scheduler_scope;
  return true;
end $$;

revoke all on function public.command_center_agency_acquire_scheduler_leadership(text,text,timestamptz,timestamptz,text[]) from public,anon;
revoke all on function public.command_center_agency_assert_scheduler_leader(text,text,bigint,timestamptz) from public,anon;
revoke all on function public.command_center_agency_release_scheduler_leadership(text,text,bigint,timestamptz,text[]) from public,anon;
grant execute on function public.command_center_agency_acquire_scheduler_leadership(text,text,timestamptz,timestamptz,text[]) to authenticated;
grant execute on function public.command_center_agency_assert_scheduler_leader(text,text,bigint,timestamptz) to authenticated;
grant execute on function public.command_center_agency_release_scheduler_leadership(text,text,bigint,timestamptz,text[]) to authenticated;
