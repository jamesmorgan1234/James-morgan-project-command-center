-- Category 3 A08.3/A08.7 — canonical derived-artifact lineage and invalidation propagation.
-- Every summary, memory, index, vector, export, metric and recommendation is registered
-- beneath one canonical derived record. Source correction/supersession/retraction already
-- restricts/deletes canonical derived records; the trigger below propagates that state to
-- every dependent artifact without creating an independent restore authority.
-- Branch-only migration; this file does not mutate production.

create table if not exists public.command_center_derived_artifacts (
  owner_id uuid not null references auth.users(id) on delete cascade,
  artifact_id text not null,
  derived_id text not null,
  artifact_kind text not null check (artifact_kind in ('summary','memory','index','vector','export','metric','recommendation')),
  state text not null check (state in ('active','restricted','deleted')),
  restriction_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key(owner_id,artifact_id),
  unique(owner_id,derived_id,artifact_id),
  foreign key(owner_id,derived_id)
    references public.command_center_derived_records(owner_id,derived_id)
    on delete restrict,
  check (artifact_id ~ '^artifact:[A-Za-z0-9._:-]{1,240}$'),
  check (updated_at >= created_at),
  check ((state='active' and restriction_reason is null) or (state<>'active' and length(btrim(coalesce(restriction_reason,'')))>0))
);

create index if not exists command_center_derived_artifacts_derived_idx
  on public.command_center_derived_artifacts(owner_id,derived_id,artifact_kind,state);

-- Direct provenance view: artifact -> canonical derived record -> exact source observation/hash.
-- This keeps one source of lineage truth instead of allowing artifact-specific provenance drift.
create or replace view public.command_center_derived_artifact_provenance
with (security_invoker=true)
as
select
  a.owner_id,
  a.artifact_id,
  a.artifact_kind,
  a.state as artifact_state,
  a.derived_id,
  d.state as derived_state,
  dp.observation_id,
  dp.source_id,
  dp.content_hash,
  dp.linked_at
from public.command_center_derived_artifacts a
join public.command_center_derived_records d
  on d.owner_id=a.owner_id and d.derived_id=a.derived_id
join public.command_center_derived_provenance dp
  on dp.owner_id=a.owner_id and dp.derived_id=a.derived_id;

alter table public.command_center_derived_artifacts enable row level security;
revoke all on table public.command_center_derived_artifacts from public, anon, authenticated, service_role;
grant select on table public.command_center_derived_artifacts to authenticated;
revoke all on table public.command_center_derived_artifact_provenance from public, anon, authenticated, service_role;
grant select on table public.command_center_derived_artifact_provenance to authenticated;

drop policy if exists c3_owner_select_derived_artifacts on public.command_center_derived_artifacts;
create policy c3_owner_select_derived_artifacts
  on public.command_center_derived_artifacts
  for select to authenticated
  using (owner_id=(select auth.uid()) and (select public.is_command_center_authorized()));

-- Fail closed against direct or future privileged attempts to silently reactivate artifacts.
create or replace function command_center_private.c3_guard_derived_artifact_transition()
returns trigger
language plpgsql
set search_path=''
as $$
begin
  if old.state in ('restricted','deleted') and new.state='active' then
    raise exception 'Restricted/deleted derived artifact cannot be directly reactivated';
  end if;
  if old.state='deleted' and new.state<>'deleted' then
    raise exception 'Deleted derived artifact state is irreversible';
  end if;
  if new.owner_id is distinct from old.owner_id
     or new.artifact_id is distinct from old.artifact_id
     or new.derived_id is distinct from old.derived_id
     or new.artifact_kind is distinct from old.artifact_kind
     or new.created_at is distinct from old.created_at then
    raise exception 'Derived artifact identity/lineage fields are immutable';
  end if;
  return new;
end
$$;

revoke all on function command_center_private.c3_guard_derived_artifact_transition() from public, anon, authenticated, service_role;

drop trigger if exists c3_guard_derived_artifact_transition on public.command_center_derived_artifacts;
create trigger c3_guard_derived_artifact_transition
before update on public.command_center_derived_artifacts
for each row execute function command_center_private.c3_guard_derived_artifact_transition();

-- Canonical state is authoritative. This trigger is reached by the existing source-observation
-- invalidation path, purpose/privacy restriction paths, and legal-hold release deletion path.
create or replace function command_center_private.c3_propagate_derived_artifact_state()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
declare
  v_reason text;
begin
  if new.state is not distinct from old.state then
    return new;
  end if;

  if new.state='active' then
    -- Canonical active state never silently revives previously restricted/deleted artifacts.
    return new;
  end if;

  v_reason:=coalesce(nullif(btrim(new.restriction_reason),''),'canonical_derived_'||new.state);

  if new.state='restricted' then
    update public.command_center_derived_artifacts
       set state='restricted',
           restriction_reason=v_reason,
           updated_at=greatest(new.updated_at,created_at)
     where owner_id=new.owner_id
       and derived_id=new.derived_id
       and state='active';
  elsif new.state='deleted' then
    update public.command_center_derived_artifacts
       set state='deleted',
           restriction_reason=v_reason,
           updated_at=greatest(new.updated_at,created_at)
     where owner_id=new.owner_id
       and derived_id=new.derived_id
       and state<>'deleted';
  end if;

  return new;
end
$$;

revoke all on function command_center_private.c3_propagate_derived_artifact_state() from public, anon, authenticated, service_role;

drop trigger if exists c3_propagate_derived_artifact_state on public.command_center_derived_records;
create trigger c3_propagate_derived_artifact_state
after update of state on public.command_center_derived_records
for each row execute function command_center_private.c3_propagate_derived_artifact_state();

create or replace function public.command_center_source_register_derived_artifact(
  p_artifact_id text,
  p_derived_id text,
  p_artifact_kind text,
  p_created_at timestamptz
) returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  u uuid:=auth.uid();
  d public.command_center_derived_records%rowtype;
  v_provenance_count bigint;
begin
  if u is null or not public.is_command_center_authorized() then
    raise exception 'Unauthorized';
  end if;
  if coalesce(p_artifact_id,'') !~ '^artifact:[A-Za-z0-9._:-]{1,240}$' then
    raise exception 'Derived artifact id is invalid';
  end if;
  if p_artifact_kind not in ('summary','memory','index','vector','export','metric','recommendation') then
    raise exception 'Unsupported derived artifact kind';
  end if;
  if p_created_at is null then
    raise exception 'Derived artifact creation time is required';
  end if;

  select * into d
  from public.command_center_derived_records
  where owner_id=u and derived_id=btrim(p_derived_id)
  for share;
  if not found then
    raise exception 'Canonical derived record not found';
  end if;
  if d.state<>'active' then
    raise exception 'Derived artifact can only be registered from active canonical derived state';
  end if;

  select count(*) into v_provenance_count
  from public.command_center_derived_provenance
  where owner_id=u and derived_id=d.derived_id;
  if v_provenance_count=0 then
    raise exception 'Derived artifact requires canonical provenance';
  end if;

  insert into public.command_center_derived_artifacts(
    owner_id,artifact_id,derived_id,artifact_kind,state,restriction_reason,created_at,updated_at
  ) values (
    u,btrim(p_artifact_id),d.derived_id,p_artifact_kind,'active',null,p_created_at,p_created_at
  );

  return jsonb_build_object(
    'artifact_id',btrim(p_artifact_id),
    'derived_id',d.derived_id,
    'artifact_kind',p_artifact_kind,
    'state','active',
    'provenance_count',v_provenance_count
  );
end
$$;

-- A use/release check must re-read current canonical and artifact state. There is no cache of
-- prior authority here, and no restore RPC. Payload state, when present, must also be present.
create or replace function public.command_center_source_assert_derived_artifact_usable(
  p_artifact_id text
) returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  u uuid:=auth.uid();
  a public.command_center_derived_artifacts%rowtype;
  d public.command_center_derived_records%rowtype;
  p public.command_center_derived_payloads%rowtype;
  v_provenance_count bigint;
begin
  if u is null or not public.is_command_center_authorized() then
    raise exception 'Unauthorized';
  end if;

  select * into a
  from public.command_center_derived_artifacts
  where owner_id=u and artifact_id=btrim(p_artifact_id);
  if not found then
    raise exception 'Derived artifact not found';
  end if;

  select * into d
  from public.command_center_derived_records
  where owner_id=u and derived_id=a.derived_id;
  if not found or a.state<>'active' or d.state<>'active' then
    raise exception 'Derived artifact/canonical state is not active';
  end if;

  select count(*) into v_provenance_count
  from public.command_center_derived_provenance
  where owner_id=u and derived_id=a.derived_id;
  if v_provenance_count=0 then
    raise exception 'Derived artifact canonical provenance is missing';
  end if;

  select * into p
  from public.command_center_derived_payloads
  where owner_id=u and derived_id=a.derived_id;
  if found and p.state<>'present' then
    raise exception 'Derived artifact payload is not usable';
  end if;

  return jsonb_build_object(
    'artifact_id',a.artifact_id,
    'derived_id',a.derived_id,
    'artifact_kind',a.artifact_kind,
    'state','active',
    'provenance_count',v_provenance_count,
    'payload_state',case when p.owner_id is null then 'not_registered' else p.state end
  );
end
$$;

-- Public-schema functions may otherwise inherit PUBLIC execute. Keep the mutation/use path
-- owner-authenticated only; service_role is deliberately not an alternate artifact authority.
revoke all on function public.command_center_source_register_derived_artifact(text,text,text,timestamptz) from public, anon, service_role;
revoke all on function public.command_center_source_assert_derived_artifact_usable(text) from public, anon, service_role;
grant execute on function public.command_center_source_register_derived_artifact(text,text,text,timestamptz) to authenticated;
grant execute on function public.command_center_source_assert_derived_artifact_usable(text) to authenticated;
