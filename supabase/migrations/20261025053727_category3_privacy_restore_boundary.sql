-- Category 3 post-audit privacy/restore boundary.
-- Separates erasable derived payload material from durable lifecycle/audit metadata,
-- propagates derived invalidation into payload restriction/erasure, and keeps restore
-- fail-closed by exposing no database mutation that can resurrect restricted/erased material.
-- Branch-only migration. Committing this file does not mutate production Supabase.

create table if not exists public.command_center_derived_payloads (
  owner_id uuid not null references auth.users(id) on delete cascade,
  derived_id text not null,
  state text not null check (state in ('present','restricted','erased')),
  payload_ref text,
  content_hash text,
  key_version bigint,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key(owner_id,derived_id),
  foreign key(owner_id,derived_id)
    references public.command_center_derived_records(owner_id,derived_id)
    on delete cascade,
  check (updated_at >= created_at),
  check (
    (state='erased' and payload_ref is null and content_hash is null and key_version is null)
    or
    (
      state in ('present','restricted')
      and length(btrim(coalesce(payload_ref,''))) between 1 and 2000
      and content_hash ~ '^[a-f0-9]{64}$'
      and key_version >= 1
    )
  )
);

create index if not exists command_center_derived_payload_state_idx
  on public.command_center_derived_payloads(owner_id,state,updated_at desc);

create table if not exists public.command_center_derived_payload_audit (
  event_id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  derived_id text not null,
  action text not null check (action in ('registered','restricted','erased')),
  reason text not null,
  evidence_refs text[] not null,
  recorded_at timestamptz not null default now(),
  foreign key(owner_id,derived_id)
    references public.command_center_derived_records(owner_id,derived_id)
    on delete cascade,
  check (length(btrim(reason)) between 1 and 1000),
  check (cardinality(evidence_refs) > 0)
);

create index if not exists command_center_derived_payload_audit_history_idx
  on public.command_center_derived_payload_audit(owner_id,derived_id,recorded_at,event_id);

-- Public-schema payload material is never directly writable. Active material is readable
-- only while both payload and canonical derived lifecycle are active. Restricted/erased
-- payload rows therefore cannot leak through the Data API while audit metadata remains visible.
alter table public.command_center_derived_payloads enable row level security;
alter table public.command_center_derived_payload_audit enable row level security;

revoke all on table public.command_center_derived_payloads from public, anon, authenticated, service_role;
revoke all on table public.command_center_derived_payload_audit from public, anon, authenticated, service_role;
grant select on table public.command_center_derived_payloads to authenticated;
grant select on table public.command_center_derived_payload_audit to authenticated;

drop policy if exists c3_owner_select_derived_payloads on public.command_center_derived_payloads;
create policy c3_owner_select_derived_payloads
  on public.command_center_derived_payloads
  for select
  to authenticated
  using (
    owner_id=(select auth.uid())
    and (select public.is_command_center_authorized())
    and state='present'
    and exists (
      select 1
      from public.command_center_derived_records d
      where d.owner_id=command_center_derived_payloads.owner_id
        and d.derived_id=command_center_derived_payloads.derived_id
        and d.state='active'
    )
  );

drop policy if exists c3_owner_select_derived_payload_audit on public.command_center_derived_payload_audit;
create policy c3_owner_select_derived_payload_audit
  on public.command_center_derived_payload_audit
  for select
  to authenticated
  using (
    owner_id=(select auth.uid())
    and (select public.is_command_center_authorized())
  );

-- Defense in depth: even privileged application code cannot turn erased material back on,
-- nor can it promote restricted material to present without a future purpose-built executor.
-- Current restore truth is evaluated in the application contract; this migration deliberately
-- provides no restore RPC so a client cannot bypass that gate with forged booleans/evidence.
create or replace function command_center_private.c3_guard_derived_payload_transition()
returns trigger
language plpgsql
set search_path=''
as $$
begin
  if old.state='erased' and (
    new.state<>'erased'
    or new.payload_ref is not null
    or new.content_hash is not null
    or new.key_version is not null
  ) then
    raise exception 'Erased derived payload material cannot be restored';
  end if;

  if old.state='restricted' and new.state='present' then
    raise exception 'Restricted derived payload requires current restore revalidation; direct restoration is forbidden';
  end if;

  if new.state='erased' and (
    new.payload_ref is not null
    or new.content_hash is not null
    or new.key_version is not null
  ) then
    raise exception 'Erased derived payload must remove all payload material';
  end if;

  return new;
end
$$;

revoke all on function command_center_private.c3_guard_derived_payload_transition() from public, anon, authenticated, service_role;

drop trigger if exists c3_guard_derived_payload_transition on public.command_center_derived_payloads;
create trigger c3_guard_derived_payload_transition
before update on public.command_center_derived_payloads
for each row execute function command_center_private.c3_guard_derived_payload_transition();

-- Canonical derived lifecycle remains authoritative. Existing source correction/retraction
-- code already transitions command_center_derived_records; this trigger propagates those
-- transitions to payload material so stale content cannot remain readable or restorable.
create or replace function command_center_private.c3_sync_derived_payload_lifecycle()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
declare
  v_changed boolean:=false;
  v_reason text;
  v_recorded_at timestamptz:=clock_timestamp();
begin
  if new.state is not distinct from old.state then
    return new;
  end if;

  v_reason:=coalesce(nullif(btrim(new.restriction_reason),''),'derived_state_'||new.state);

  if new.state='restricted' then
    update public.command_center_derived_payloads
       set state='restricted',
           updated_at=greatest(v_recorded_at,created_at)
     where owner_id=new.owner_id
       and derived_id=new.derived_id
       and state='present';
    get diagnostics v_changed = row_count;

    if v_changed then
      insert into public.command_center_derived_payload_audit(
        owner_id,derived_id,action,reason,evidence_refs,recorded_at
      ) values (
        new.owner_id,new.derived_id,'restricted',v_reason,
        array['derived-record:'||new.derived_id],v_recorded_at
      );
    end if;
  elsif new.state='deleted' then
    if new.legal_hold then
      raise exception 'Legal hold forbids derived payload erasure';
    end if;

    update public.command_center_derived_payloads
       set state='erased',
           payload_ref=null,
           content_hash=null,
           key_version=null,
           updated_at=greatest(v_recorded_at,created_at)
     where owner_id=new.owner_id
       and derived_id=new.derived_id
       and state<>'erased';
    get diagnostics v_changed = row_count;

    if v_changed then
      insert into public.command_center_derived_payload_audit(
        owner_id,derived_id,action,reason,evidence_refs,recorded_at
      ) values (
        new.owner_id,new.derived_id,'erased',v_reason,
        array['derived-record:'||new.derived_id],v_recorded_at
      );
    end if;
  end if;

  return new;
end
$$;

revoke all on function command_center_private.c3_sync_derived_payload_lifecycle() from public, anon, authenticated, service_role;

drop trigger if exists c3_sync_derived_payload_lifecycle on public.command_center_derived_records;
create trigger c3_sync_derived_payload_lifecycle
after update of state on public.command_center_derived_records
for each row execute function command_center_private.c3_sync_derived_payload_lifecycle();

create or replace function public.command_center_source_register_derived_payload(
  p_derived_id text,
  p_payload_ref text,
  p_content_hash text,
  p_key_version bigint,
  p_reason text,
  p_evidence_refs text[]
) returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  u uuid:=auth.uid();
  d public.command_center_derived_records%rowtype;
  v_now timestamptz:=clock_timestamp();
begin
  if u is null or not public.is_command_center_authorized() then
    raise exception 'Unauthorized';
  end if;
  if coalesce(p_derived_id,'') !~ '^derived:[A-Za-z0-9._:-]{1,240}$' then
    raise exception 'Derived payload id is invalid';
  end if;
  if length(btrim(coalesce(p_payload_ref,''))) not between 1 and 2000 then
    raise exception 'Derived payload reference is required';
  end if;
  if coalesce(p_content_hash,'') !~ '^[a-f0-9]{64}$' then
    raise exception 'Derived payload requires lowercase sha256 content hash';
  end if;
  if p_key_version is null or p_key_version<1 then
    raise exception 'Derived payload requires positive key version';
  end if;
  if length(btrim(coalesce(p_reason,''))) not between 1 and 1000 then
    raise exception 'Derived payload audit reason is required';
  end if;
  perform command_center_private.c3_assert_unique_text_array(p_evidence_refs,'Derived payload audit evidence');
  if cardinality(coalesce(p_evidence_refs,'{}'::text[]))=0 then
    raise exception 'Derived payload audit evidence is required';
  end if;

  select * into d
  from public.command_center_derived_records
  where owner_id=u and derived_id=p_derived_id
  for update;

  if not found then
    raise exception 'Unknown derived record';
  end if;
  if d.state<>'active' then
    raise exception 'Derived payload can only be registered for active derived records';
  end if;

  insert into public.command_center_derived_payloads(
    owner_id,derived_id,state,payload_ref,content_hash,key_version,created_at,updated_at
  ) values (
    u,p_derived_id,'present',btrim(p_payload_ref),p_content_hash,p_key_version,v_now,v_now
  );

  insert into public.command_center_derived_payload_audit(
    owner_id,derived_id,action,reason,evidence_refs,recorded_at
  ) values (
    u,p_derived_id,'registered',btrim(p_reason),p_evidence_refs,v_now
  );

  return jsonb_build_object(
    'derived_id',p_derived_id,
    'state','present',
    'registered_at',v_now
  );
end
$$;

create or replace function public.command_center_source_restrict_derived_payload(
  p_derived_id text,
  p_reason text,
  p_evidence_refs text[]
) returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  u uuid:=auth.uid();
  d public.command_center_derived_records%rowtype;
  p public.command_center_derived_payloads%rowtype;
  v_now timestamptz:=clock_timestamp();
begin
  if u is null or not public.is_command_center_authorized() then
    raise exception 'Unauthorized';
  end if;
  if length(btrim(coalesce(p_reason,''))) not between 1 and 1000 then
    raise exception 'Derived payload restriction reason is required';
  end if;
  perform command_center_private.c3_assert_unique_text_array(p_evidence_refs,'Derived payload restriction evidence');
  if cardinality(coalesce(p_evidence_refs,'{}'::text[]))=0 then
    raise exception 'Derived payload restriction evidence is required';
  end if;

  select * into d
  from public.command_center_derived_records
  where owner_id=u and derived_id=p_derived_id
  for update;
  if not found or d.state='deleted' then
    raise exception 'Derived payload cannot be restricted for missing/deleted derived record';
  end if;

  select * into p
  from public.command_center_derived_payloads
  where owner_id=u and derived_id=p_derived_id
  for update;
  if not found then
    raise exception 'Unknown derived payload';
  end if;
  if p.state='erased' then
    raise exception 'Erased derived payload cannot be restricted or restored';
  end if;
  if p.state='restricted' then
    raise exception 'Derived payload is already restricted';
  end if;

  update public.command_center_derived_payloads
     set state='restricted',updated_at=greatest(v_now,created_at)
   where owner_id=u and derived_id=p_derived_id;

  if d.state='active' then
    update public.command_center_derived_records
       set state='restricted',restriction_reason=btrim(p_reason),updated_at=greatest(v_now,created_at)
     where owner_id=u and derived_id=p_derived_id;
  end if;

  insert into public.command_center_derived_payload_audit(
    owner_id,derived_id,action,reason,evidence_refs,recorded_at
  ) values (
    u,p_derived_id,'restricted',btrim(p_reason),p_evidence_refs,v_now
  );

  return jsonb_build_object(
    'derived_id',p_derived_id,
    'state','restricted',
    'restricted_at',v_now
  );
end
$$;

create or replace function public.command_center_source_erase_derived_payload(
  p_derived_id text,
  p_reason text,
  p_evidence_refs text[]
) returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  u uuid:=auth.uid();
  d public.command_center_derived_records%rowtype;
  p public.command_center_derived_payloads%rowtype;
  v_now timestamptz:=clock_timestamp();
begin
  if u is null or not public.is_command_center_authorized() then
    raise exception 'Unauthorized';
  end if;
  if length(btrim(coalesce(p_reason,''))) not between 1 and 1000 then
    raise exception 'Derived payload erasure reason is required';
  end if;
  perform command_center_private.c3_assert_unique_text_array(p_evidence_refs,'Derived payload erasure evidence');
  if cardinality(coalesce(p_evidence_refs,'{}'::text[]))=0 then
    raise exception 'Derived payload erasure evidence is required';
  end if;

  select * into d
  from public.command_center_derived_records
  where owner_id=u and derived_id=p_derived_id
  for update;
  if not found then
    raise exception 'Unknown derived record';
  end if;
  if d.legal_hold then
    raise exception 'Legal hold blocks derived payload erasure';
  end if;

  select * into p
  from public.command_center_derived_payloads
  where owner_id=u and derived_id=p_derived_id
  for update;
  if not found then
    raise exception 'Unknown derived payload';
  end if;
  if p.state='erased' then
    raise exception 'Derived payload is already erased';
  end if;

  update public.command_center_derived_payloads
     set state='erased',
         payload_ref=null,
         content_hash=null,
         key_version=null,
         updated_at=greatest(v_now,created_at)
   where owner_id=u and derived_id=p_derived_id;

  if d.state<>'deleted' then
    update public.command_center_derived_records
       set state='deleted',restriction_reason=btrim(p_reason),updated_at=greatest(v_now,created_at)
     where owner_id=u and derived_id=p_derived_id;
  end if;

  insert into public.command_center_derived_payload_audit(
    owner_id,derived_id,action,reason,evidence_refs,recorded_at
  ) values (
    u,p_derived_id,'erased',btrim(p_reason),p_evidence_refs,v_now
  );

  return jsonb_build_object(
    'derived_id',p_derived_id,
    'state','erased',
    'erased_at',v_now
  );
end
$$;

-- New public functions are executable by PUBLIC by default on many existing Supabase projects.
-- Revoke first, then opt in only the authenticated owner path enforced inside each function.
revoke all on function public.command_center_source_register_derived_payload(text,text,text,bigint,text,text[]) from public, anon, service_role;
revoke all on function public.command_center_source_restrict_derived_payload(text,text,text[]) from public, anon, service_role;
revoke all on function public.command_center_source_erase_derived_payload(text,text,text[]) from public, anon, service_role;
grant execute on function public.command_center_source_register_derived_payload(text,text,text,bigint,text,text[]) to authenticated;
grant execute on function public.command_center_source_restrict_derived_payload(text,text,text[]) to authenticated;
grant execute on function public.command_center_source_erase_derived_payload(text,text,text[]) to authenticated;
