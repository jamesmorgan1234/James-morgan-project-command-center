-- Category 3 A07.6 — durable refresh checkpoint recovery and derived invalidation acknowledgements.
-- Preserves every committed checkpoint generation, snapshots the exact dependent-derived
-- invalidation set, and prevents worker replacement/recovery from skipping unacknowledged
-- downstream state transitions. Branch-only migration; this file does not mutate production.

create table if not exists public.command_center_source_refresh_checkpoint_history (
  owner_id uuid not null references auth.users(id) on delete cascade,
  source_id text not null,
  generation bigint not null check (generation >= 1),
  checkpoint_ref text not null,
  classification text not null check (classification in ('changed','unchanged','uncertain')),
  content_hash text,
  provider_revision_id text,
  provider_updated_at timestamptz,
  message_count bigint check (message_count is null or message_count >= 0),
  byte_size bigint check (byte_size is null or byte_size >= 0),
  checked_at timestamptz not null,
  successful boolean not null,
  committed_at timestamptz not null,
  primary key(owner_id,source_id,generation),
  foreign key(owner_id,source_id)
    references public.command_center_source_registry(owner_id,source_id)
    on delete cascade,
  check (length(btrim(checkpoint_ref)) between 1 and 1000),
  check (content_hash is null or content_hash ~ '^[a-f0-9]{64}$'),
  check (provider_revision_id is null or length(btrim(provider_revision_id)) between 1 and 1000),
  check (committed_at >= checked_at)
);

create index if not exists command_center_source_refresh_checkpoint_history_latest_idx
  on public.command_center_source_refresh_checkpoint_history(owner_id,source_id,generation desc);

-- Backfill the currently retained checkpoint generation before installing the append-only trigger.
insert into public.command_center_source_refresh_checkpoint_history(
  owner_id,source_id,generation,checkpoint_ref,classification,content_hash,
  provider_revision_id,provider_updated_at,message_count,byte_size,checked_at,successful,committed_at
)
select
  owner_id,source_id,generation,checkpoint_ref,classification,content_hash,
  provider_revision_id,provider_updated_at,message_count,byte_size,checked_at,successful,recorded_at
from public.command_center_source_refresh_checkpoints
on conflict(owner_id,source_id,generation) do nothing;

create or replace function command_center_private.c3_capture_refresh_checkpoint_history()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
declare
  prior public.command_center_source_refresh_checkpoint_history%rowtype;
begin
  select * into prior
  from public.command_center_source_refresh_checkpoint_history
  where owner_id=new.owner_id
    and source_id=new.source_id
    and generation=new.generation
  for update;

  if found then
    if prior.checkpoint_ref is not distinct from new.checkpoint_ref
       and prior.classification is not distinct from new.classification
       and prior.content_hash is not distinct from new.content_hash
       and prior.provider_revision_id is not distinct from new.provider_revision_id
       and prior.provider_updated_at is not distinct from new.provider_updated_at
       and prior.message_count is not distinct from new.message_count
       and prior.byte_size is not distinct from new.byte_size
       and prior.checked_at is not distinct from new.checked_at
       and prior.successful is not distinct from new.successful then
      return new;
    end if;
    raise exception 'Refresh checkpoint history generation is immutable';
  end if;

  insert into public.command_center_source_refresh_checkpoint_history(
    owner_id,source_id,generation,checkpoint_ref,classification,content_hash,
    provider_revision_id,provider_updated_at,message_count,byte_size,checked_at,successful,committed_at
  ) values (
    new.owner_id,new.source_id,new.generation,new.checkpoint_ref,new.classification,new.content_hash,
    new.provider_revision_id,new.provider_updated_at,new.message_count,new.byte_size,new.checked_at,new.successful,new.recorded_at
  );
  return new;
end
$$;

revoke all on function command_center_private.c3_capture_refresh_checkpoint_history() from public, anon, authenticated, service_role;

drop trigger if exists c3_capture_refresh_checkpoint_history on public.command_center_source_refresh_checkpoints;
create trigger c3_capture_refresh_checkpoint_history
after insert or update on public.command_center_source_refresh_checkpoints
for each row execute function command_center_private.c3_capture_refresh_checkpoint_history();

create table if not exists public.command_center_source_refresh_derived_expectation_sets (
  owner_id uuid not null references auth.users(id) on delete cascade,
  source_id text not null,
  generation bigint not null check (generation >= 1),
  invalidated_observation_id text not null,
  expected_count bigint not null check (expected_count >= 0),
  captured_at timestamptz not null,
  primary key(owner_id,source_id,generation),
  foreign key(owner_id,source_id,generation)
    references public.command_center_source_refresh_checkpoint_history(owner_id,source_id,generation)
    on delete cascade,
  foreign key(owner_id,invalidated_observation_id)
    references public.command_center_source_observations(owner_id,observation_id)
    on delete restrict
);

create table if not exists public.command_center_source_refresh_derived_expectations (
  owner_id uuid not null references auth.users(id) on delete cascade,
  source_id text not null,
  generation bigint not null check (generation >= 1),
  derived_id text not null,
  observation_id text not null,
  resulting_state text not null check (resulting_state in ('deleted','restricted')),
  captured_at timestamptz not null,
  primary key(owner_id,source_id,generation,derived_id),
  unique(owner_id,source_id,generation,derived_id,observation_id,resulting_state),
  foreign key(owner_id,source_id,generation)
    references public.command_center_source_refresh_derived_expectation_sets(owner_id,source_id,generation)
    on delete cascade,
  foreign key(owner_id,derived_id)
    references public.command_center_derived_records(owner_id,derived_id)
    on delete cascade,
  foreign key(owner_id,observation_id)
    references public.command_center_source_observations(owner_id,observation_id)
    on delete restrict
);

create index if not exists command_center_source_refresh_derived_expectation_observation_idx
  on public.command_center_source_refresh_derived_expectations(owner_id,observation_id,derived_id);

create table if not exists public.command_center_source_refresh_derived_acknowledgements (
  owner_id uuid not null references auth.users(id) on delete cascade,
  source_id text not null,
  generation bigint not null check (generation >= 1),
  derived_id text not null,
  observation_id text not null,
  resulting_state text not null check (resulting_state in ('deleted','restricted')),
  evidence_refs text[] not null,
  acknowledged_at timestamptz not null,
  recorded_at timestamptz not null default now(),
  primary key(owner_id,source_id,generation,derived_id),
  foreign key(owner_id,source_id,generation,derived_id,observation_id,resulting_state)
    references public.command_center_source_refresh_derived_expectations(
      owner_id,source_id,generation,derived_id,observation_id,resulting_state
    ) on delete cascade,
  check (cardinality(evidence_refs) > 0),
  check (recorded_at >= acknowledged_at)
);

create index if not exists command_center_source_refresh_derived_ack_history_idx
  on public.command_center_source_refresh_derived_acknowledgements(owner_id,source_id,generation,acknowledged_at,derived_id);

-- These tables are durable recovery evidence, not alternate mutation authorities.
-- Application roles may read owner-scoped evidence, but direct writes are denied.
alter table public.command_center_source_refresh_checkpoint_history enable row level security;
alter table public.command_center_source_refresh_derived_expectation_sets enable row level security;
alter table public.command_center_source_refresh_derived_expectations enable row level security;
alter table public.command_center_source_refresh_derived_acknowledgements enable row level security;

revoke all on table public.command_center_source_refresh_checkpoint_history from public, anon, authenticated, service_role;
revoke all on table public.command_center_source_refresh_derived_expectation_sets from public, anon, authenticated, service_role;
revoke all on table public.command_center_source_refresh_derived_expectations from public, anon, authenticated, service_role;
revoke all on table public.command_center_source_refresh_derived_acknowledgements from public, anon, authenticated, service_role;

grant select on table public.command_center_source_refresh_checkpoint_history to authenticated;
grant select on table public.command_center_source_refresh_derived_expectation_sets to authenticated;
grant select on table public.command_center_source_refresh_derived_expectations to authenticated;
grant select on table public.command_center_source_refresh_derived_acknowledgements to authenticated;

drop policy if exists c3_owner_select_source_refresh_checkpoint_history on public.command_center_source_refresh_checkpoint_history;
create policy c3_owner_select_source_refresh_checkpoint_history
  on public.command_center_source_refresh_checkpoint_history
  for select to authenticated
  using (owner_id=(select auth.uid()) and (select public.is_command_center_authorized()));

drop policy if exists c3_owner_select_source_refresh_derived_expectation_sets on public.command_center_source_refresh_derived_expectation_sets;
create policy c3_owner_select_source_refresh_derived_expectation_sets
  on public.command_center_source_refresh_derived_expectation_sets
  for select to authenticated
  using (owner_id=(select auth.uid()) and (select public.is_command_center_authorized()));

drop policy if exists c3_owner_select_source_refresh_derived_expectations on public.command_center_source_refresh_derived_expectations;
create policy c3_owner_select_source_refresh_derived_expectations
  on public.command_center_source_refresh_derived_expectations
  for select to authenticated
  using (owner_id=(select auth.uid()) and (select public.is_command_center_authorized()));

drop policy if exists c3_owner_select_source_refresh_derived_acknowledgements on public.command_center_source_refresh_derived_acknowledgements;
create policy c3_owner_select_source_refresh_derived_acknowledgements
  on public.command_center_source_refresh_derived_acknowledgements
  for select to authenticated
  using (owner_id=(select auth.uid()) and (select public.is_command_center_authorized()));

create or replace function public.command_center_source_capture_refresh_derived_expectations(
  p_source_id text,
  p_generation bigint,
  p_invalidated_observation_id text,
  p_captured_at timestamptz
) returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  u uuid:=auth.uid();
  h public.command_center_source_refresh_checkpoint_history%rowtype;
  o public.command_center_source_observations%rowtype;
  prior public.command_center_source_refresh_derived_expectation_sets%rowtype;
  v_expected_count bigint;
begin
  if u is null or not public.is_command_center_authorized() then
    raise exception 'Unauthorized';
  end if;
  if p_generation is null or p_generation<1 then
    raise exception 'Refresh generation must be positive';
  end if;

  select * into h
  from public.command_center_source_refresh_checkpoint_history
  where owner_id=u and source_id=btrim(p_source_id) and generation=p_generation;
  if not found then
    raise exception 'Committed refresh checkpoint generation not found';
  end if;
  if not h.successful then
    raise exception 'Unsuccessful refresh checkpoint cannot capture derived expectations';
  end if;
  if h.classification='unchanged' then
    raise exception 'Unchanged refresh checkpoint cannot require derived invalidation acknowledgements';
  end if;
  if p_captured_at<h.checked_at then
    raise exception 'Derived expectation snapshot cannot predate checkpoint';
  end if;

  select * into o
  from public.command_center_source_observations
  where owner_id=u
    and source_id=h.source_id
    and observation_id=btrim(p_invalidated_observation_id);
  if not found then
    raise exception 'Invalidated source observation not found';
  end if;
  if o.state in ('current','corrected') then
    raise exception 'Derived expectation snapshot requires non-current invalidated observation';
  end if;

  if exists(
    select 1
    from public.command_center_derived_provenance dp
    join public.command_center_derived_records d
      on d.owner_id=dp.owner_id and d.derived_id=dp.derived_id
    where dp.owner_id=u
      and dp.source_id=h.source_id
      and dp.observation_id=o.observation_id
      and d.state not in ('deleted','restricted')
  ) then
    raise exception 'Dependent derived invalidation is incomplete';
  end if;

  select count(*) into v_expected_count
  from public.command_center_derived_provenance dp
  where dp.owner_id=u
    and dp.source_id=h.source_id
    and dp.observation_id=o.observation_id;

  select * into prior
  from public.command_center_source_refresh_derived_expectation_sets
  where owner_id=u and source_id=h.source_id and generation=p_generation
  for update;
  if found then
    if prior.invalidated_observation_id=o.observation_id
       and prior.expected_count=v_expected_count then
      return jsonb_build_object(
        'source_id',h.source_id,
        'generation',p_generation,
        'invalidated_observation_id',o.observation_id,
        'expected_count',prior.expected_count,
        'duplicate_capture',true
      );
    end if;
    raise exception 'Refresh derived expectation generation already captured differently';
  end if;

  insert into public.command_center_source_refresh_derived_expectation_sets(
    owner_id,source_id,generation,invalidated_observation_id,expected_count,captured_at
  ) values (
    u,h.source_id,p_generation,o.observation_id,v_expected_count,p_captured_at
  );

  insert into public.command_center_source_refresh_derived_expectations(
    owner_id,source_id,generation,derived_id,observation_id,resulting_state,captured_at
  )
  select
    u,h.source_id,p_generation,dp.derived_id,o.observation_id,d.state,p_captured_at
  from public.command_center_derived_provenance dp
  join public.command_center_derived_records d
    on d.owner_id=dp.owner_id and d.derived_id=dp.derived_id
  where dp.owner_id=u
    and dp.source_id=h.source_id
    and dp.observation_id=o.observation_id
  order by dp.derived_id;

  return jsonb_build_object(
    'source_id',h.source_id,
    'generation',p_generation,
    'invalidated_observation_id',o.observation_id,
    'expected_count',v_expected_count,
    'duplicate_capture',false
  );
end
$$;

create or replace function public.command_center_source_acknowledge_derived_invalidation(
  p_source_id text,
  p_generation bigint,
  p_derived_id text,
  p_observation_id text,
  p_resulting_state text,
  p_acknowledged_at timestamptz,
  p_evidence_refs text[]
) returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  u uuid:=auth.uid();
  e public.command_center_source_refresh_derived_expectations%rowtype;
  s public.command_center_source_refresh_derived_expectation_sets%rowtype;
  h public.command_center_source_refresh_checkpoint_history%rowtype;
  d public.command_center_derived_records%rowtype;
  prior public.command_center_source_refresh_derived_acknowledgements%rowtype;
begin
  if u is null or not public.is_command_center_authorized() then
    raise exception 'Unauthorized';
  end if;
  perform command_center_private.c3_assert_unique_text_array(p_evidence_refs,'Derived projection acknowledgement evidence');
  if cardinality(coalesce(p_evidence_refs,'{}'::text[]))=0 then
    raise exception 'Derived projection acknowledgement evidence is required';
  end if;

  select * into e
  from public.command_center_source_refresh_derived_expectations
  where owner_id=u
    and source_id=btrim(p_source_id)
    and generation=p_generation
    and derived_id=btrim(p_derived_id)
  for update;
  if not found then
    raise exception 'Expected derived invalidation not found';
  end if;
  if e.observation_id is distinct from btrim(p_observation_id)
     or e.resulting_state is distinct from p_resulting_state then
    raise exception 'Derived projection acknowledgement does not match expected invalidation';
  end if;

  select * into s
  from public.command_center_source_refresh_derived_expectation_sets
  where owner_id=u and source_id=e.source_id and generation=e.generation;
  select * into h
  from public.command_center_source_refresh_checkpoint_history
  where owner_id=u and source_id=e.source_id and generation=e.generation;
  if p_acknowledged_at<greatest(s.captured_at,h.checked_at) then
    raise exception 'Derived projection acknowledgement predates checkpoint/expectation snapshot';
  end if;

  select * into d
  from public.command_center_derived_records
  where owner_id=u and derived_id=e.derived_id;
  if not found or d.state is distinct from e.resulting_state then
    raise exception 'Derived projection current state no longer matches expected invalidation';
  end if;

  select * into prior
  from public.command_center_source_refresh_derived_acknowledgements
  where owner_id=u and source_id=e.source_id and generation=e.generation and derived_id=e.derived_id
  for update;
  if found then
    if prior.observation_id=e.observation_id
       and prior.resulting_state=e.resulting_state
       and prior.acknowledged_at=p_acknowledged_at
       and prior.evidence_refs=p_evidence_refs then
      return jsonb_build_object(
        'source_id',e.source_id,
        'generation',e.generation,
        'derived_id',e.derived_id,
        'acknowledged',true,
        'duplicate_acknowledgement',true
      );
    end if;
    raise exception 'Conflicting derived projection acknowledgement';
  end if;

  insert into public.command_center_source_refresh_derived_acknowledgements(
    owner_id,source_id,generation,derived_id,observation_id,resulting_state,evidence_refs,acknowledged_at
  ) values (
    u,e.source_id,e.generation,e.derived_id,e.observation_id,e.resulting_state,p_evidence_refs,p_acknowledged_at
  );

  return jsonb_build_object(
    'source_id',e.source_id,
    'generation',e.generation,
    'derived_id',e.derived_id,
    'acknowledged',true,
    'duplicate_acknowledgement',false
  );
end
$$;

create or replace function public.command_center_source_refresh_recovery_status(
  p_source_id text,
  p_requested_generation bigint
) returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  u uuid:=auth.uid();
  h public.command_center_source_refresh_checkpoint_history%rowtype;
  s public.command_center_source_refresh_derived_expectation_sets%rowtype;
  v_pending text[];
  v_action text;
  v_reason text;
begin
  if u is null or not public.is_command_center_authorized() then
    raise exception 'Unauthorized';
  end if;
  if p_requested_generation is null or p_requested_generation<1 then
    raise exception 'Refresh recovery requested generation must be positive';
  end if;

  select * into h
  from public.command_center_source_refresh_checkpoint_history
  where owner_id=u and source_id=btrim(p_source_id)
  order by generation desc
  limit 1;

  if not found then
    return jsonb_build_object(
      'source_id',btrim(p_source_id),
      'requested_generation',p_requested_generation,
      'action','restart_source',
      'reason','checkpoint_missing',
      'pending_derived_ids','[]'::jsonb
    );
  end if;
  if h.generation>p_requested_generation then
    raise exception 'Refresh recovery requested generation is stale';
  end if;
  if not h.successful then
    return jsonb_build_object(
      'source_id',h.source_id,
      'requested_generation',p_requested_generation,
      'checkpoint_generation',h.generation,
      'checkpoint_ref',h.checkpoint_ref,
      'action','restart_source',
      'reason','checkpoint_unsuccessful',
      'pending_derived_ids','[]'::jsonb
    );
  end if;

  select * into s
  from public.command_center_source_refresh_derived_expectation_sets
  where owner_id=u and source_id=h.source_id and generation=h.generation;

  if h.classification<>'unchanged' and not found then
    return jsonb_build_object(
      'source_id',h.source_id,
      'requested_generation',p_requested_generation,
      'checkpoint_generation',h.generation,
      'checkpoint_ref',h.checkpoint_ref,
      'action','awaiting_derived_expectation_snapshot',
      'reason','dependent_derived_expectation_snapshot_missing',
      'pending_derived_ids','[]'::jsonb
    );
  end if;

  select coalesce(array_agg(e.derived_id order by e.derived_id),'{}'::text[])
    into v_pending
  from public.command_center_source_refresh_derived_expectations e
  left join public.command_center_source_refresh_derived_acknowledgements a
    on a.owner_id=e.owner_id
   and a.source_id=e.source_id
   and a.generation=e.generation
   and a.derived_id=e.derived_id
  where e.owner_id=u
    and e.source_id=h.source_id
    and e.generation=h.generation
    and a.derived_id is null;

  if cardinality(v_pending)>0 then
    return jsonb_build_object(
      'source_id',h.source_id,
      'requested_generation',p_requested_generation,
      'checkpoint_generation',h.generation,
      'checkpoint_ref',h.checkpoint_ref,
      'action','awaiting_derived_acknowledgements',
      'reason','dependent_derived_invalidation_unacknowledged',
      'pending_derived_ids',to_jsonb(v_pending)
    );
  end if;

  if p_requested_generation=h.generation then
    v_action:='complete';
    v_reason:='checkpoint_and_derived_acknowledgements_complete';
  else
    v_action:='resume_from_checkpoint';
    v_reason:='prior_checkpoint_closed_and_resumable';
  end if;

  return jsonb_build_object(
    'source_id',h.source_id,
    'requested_generation',p_requested_generation,
    'checkpoint_generation',h.generation,
    'checkpoint_ref',h.checkpoint_ref,
    'action',v_action,
    'reason',v_reason,
    'pending_derived_ids','[]'::jsonb
  );
end
$$;

-- Public-schema functions receive PUBLIC execute by default on many existing projects.
-- Revoke first; grant only the authenticated owner path enforced inside each function.
revoke all on function public.command_center_source_capture_refresh_derived_expectations(text,bigint,text,timestamptz) from public, anon, service_role;
revoke all on function public.command_center_source_acknowledge_derived_invalidation(text,bigint,text,text,text,timestamptz,text[]) from public, anon, service_role;
revoke all on function public.command_center_source_refresh_recovery_status(text,bigint) from public, anon, service_role;

grant execute on function public.command_center_source_capture_refresh_derived_expectations(text,bigint,text,timestamptz) to authenticated;
grant execute on function public.command_center_source_acknowledge_derived_invalidation(text,bigint,text,text,text,timestamptz,text[]) to authenticated;
grant execute on function public.command_center_source_refresh_recovery_status(text,bigint) to authenticated;
