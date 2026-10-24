-- Category 2 / P2.3 — canonical owner session + device inventory and revocation.
-- Branch-only migration. Do not treat this as applied production state until provider deployment is authorized and verified.

create table if not exists public.command_center_owner_devices (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  client_device_id uuid not null,
  label text not null default 'Owner device',
  platform text,
  trust_state text not null default 'untrusted' check (trust_state in ('untrusted','trusted','revoked')),
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  revoked_at timestamptz,
  revoked_reason text,
  unique (owner_id, client_device_id)
);

create table if not exists public.command_center_owner_sessions (
  session_id uuid primary key,
  owner_id uuid not null,
  device_id uuid references public.command_center_owner_devices(id) on delete set null,
  assurance text not null default 'unknown',
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  revoked_at timestamptz,
  revoked_reason text
);

create index if not exists command_center_owner_devices_owner_seen_idx
  on public.command_center_owner_devices(owner_id, last_seen_at desc);
create index if not exists command_center_owner_sessions_owner_seen_idx
  on public.command_center_owner_sessions(owner_id, last_seen_at desc);
create index if not exists command_center_owner_sessions_device_idx
  on public.command_center_owner_sessions(device_id) where device_id is not null;

alter table public.command_center_owner_devices enable row level security;
alter table public.command_center_owner_sessions enable row level security;

revoke all on table public.command_center_owner_devices from public, anon, authenticated;
revoke all on table public.command_center_owner_sessions from public, anon, authenticated;
grant select on table public.command_center_owner_devices to authenticated;
grant select on table public.command_center_owner_sessions to authenticated;

drop policy if exists command_center_owner_devices_select_own on public.command_center_owner_devices;
create policy command_center_owner_devices_select_own
on public.command_center_owner_devices
for select
to authenticated
using (owner_id = (select auth.uid()));

drop policy if exists command_center_owner_sessions_select_own on public.command_center_owner_sessions;
create policy command_center_owner_sessions_select_own
on public.command_center_owner_sessions
for select
to authenticated
using (owner_id = (select auth.uid()));

-- Extend the canonical authorization decision instead of creating parallel authority.
-- Existing sessions remain compatible until touched, but an explicit local session or
-- device revocation immediately denies the signed JWT session even before JWT expiry.
create or replace function public.is_command_center_authorized()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.command_center_members m
    join auth.sessions s
      on s.user_id = m.user_id
     and s.id::text = (select auth.jwt()->>'session_id')
    left join public.command_center_owner_sessions cs
      on cs.owner_id = m.user_id
     and cs.session_id = s.id
    left join public.command_center_owner_devices cd
      on cd.owner_id = m.user_id
     and cd.id = cs.device_id
    where m.user_id = (select auth.uid())
      and m.access_status = 'active'
      and m.revoked_at is null
      and (s.not_after is null or s.not_after > now())
      and cs.revoked_at is null
      and cd.revoked_at is null
      and coalesce(cd.trust_state, 'untrusted') <> 'revoked'
      and (
        not exists (
          select 1 from auth.mfa_factors f
          where f.user_id = m.user_id and f.status = 'verified'
        )
        or (select auth.jwt()->>'aal') = 'aal2'
      )
  );
$$;

revoke all on function public.is_command_center_authorized() from public, anon;
grant execute on function public.is_command_center_authorized() to authenticated, service_role;

create or replace function public.command_center_touch_current_session(
  p_client_device_id uuid,
  p_label text default null,
  p_platform text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_owner uuid := auth.uid();
  v_session uuid := nullif(auth.jwt()->>'session_id','')::uuid;
  v_device uuid;
  v_existing_device uuid;
  v_device_revoked timestamptz;
begin
  if v_owner is null or v_session is null or not public.is_command_center_authorized() then
    raise exception 'not authorized';
  end if;
  if p_client_device_id is null then
    raise exception 'client device id is required';
  end if;

  insert into public.command_center_owner_devices(owner_id, client_device_id, label, platform)
  values (
    v_owner,
    p_client_device_id,
    coalesce(nullif(left(trim(coalesce(p_label,'')), 120), ''), 'Owner device'),
    nullif(left(trim(coalesce(p_platform,'')), 120), '')
  )
  on conflict (owner_id, client_device_id) do update
    set label = case when excluded.label = 'Owner device' then public.command_center_owner_devices.label else excluded.label end,
        platform = coalesce(excluded.platform, public.command_center_owner_devices.platform),
        last_seen_at = now()
  returning id, revoked_at into v_device, v_device_revoked;

  if v_device_revoked is not null then
    raise exception 'device revoked';
  end if;

  select device_id into v_existing_device
  from public.command_center_owner_sessions
  where session_id = v_session and owner_id = v_owner;

  if v_existing_device is not null and v_existing_device <> v_device then
    raise exception 'session device binding mismatch';
  end if;

  insert into public.command_center_owner_sessions(
    session_id, owner_id, device_id, assurance, first_seen_at, last_seen_at
  ) values (
    v_session, v_owner, v_device, coalesce(auth.jwt()->>'aal','unknown'), now(), now()
  )
  on conflict (session_id) do update
    set device_id = coalesce(public.command_center_owner_sessions.device_id, excluded.device_id),
        assurance = excluded.assurance,
        last_seen_at = now()
  where public.command_center_owner_sessions.owner_id = excluded.owner_id
    and public.command_center_owner_sessions.revoked_at is null;

  if not found then
    raise exception 'session revoked or owner mismatch';
  end if;

  return v_device;
end;
$$;

create or replace function public.command_center_list_owner_sessions()
returns table (
  session_id uuid,
  device_id uuid,
  device_label text,
  platform text,
  trust_state text,
  assurance text,
  session_created_at timestamptz,
  last_seen_at timestamptz,
  not_after timestamptz,
  revoked_at timestamptz,
  revoked_reason text,
  is_current boolean
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_owner uuid := auth.uid();
  v_current uuid := nullif(auth.jwt()->>'session_id','')::uuid;
begin
  if v_owner is null or v_current is null or not public.is_command_center_authorized() then
    raise exception 'not authorized';
  end if;

  return query
  select
    s.id,
    cs.device_id,
    coalesce(cd.label, 'Unregistered session'),
    cd.platform,
    coalesce(cd.trust_state, 'untrusted'),
    coalesce(cs.assurance, s.aal::text, 'unknown'),
    s.created_at,
    coalesce(cs.last_seen_at, s.refreshed_at at time zone 'UTC', s.updated_at, s.created_at),
    s.not_after,
    cs.revoked_at,
    cs.revoked_reason,
    s.id = v_current
  from auth.sessions s
  left join public.command_center_owner_sessions cs
    on cs.owner_id = v_owner and cs.session_id = s.id
  left join public.command_center_owner_devices cd
    on cd.owner_id = v_owner and cd.id = cs.device_id
  where s.user_id = v_owner
  order by coalesce(cs.last_seen_at, s.updated_at, s.created_at) desc;
end;
$$;

create or replace function public.command_center_revoke_owner_session(
  p_session_id uuid,
  p_reason text default 'owner_revoked'
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_owner uuid := auth.uid();
begin
  if v_owner is null or not public.is_command_center_authorized() then
    raise exception 'not authorized';
  end if;
  if p_session_id is null or not exists (
    select 1 from auth.sessions s where s.id = p_session_id and s.user_id = v_owner
  ) then
    raise exception 'unknown owner session';
  end if;

  insert into public.command_center_owner_sessions(
    session_id, owner_id, assurance, first_seen_at, last_seen_at, revoked_at, revoked_reason
  )
  select s.id, v_owner, coalesce(s.aal::text,'unknown'), s.created_at,
         coalesce(s.updated_at,s.created_at), now(),
         coalesce(nullif(left(trim(coalesce(p_reason,'')), 240), ''), 'owner_revoked')
  from auth.sessions s
  where s.id = p_session_id and s.user_id = v_owner
  on conflict (session_id) do update
    set revoked_at = coalesce(public.command_center_owner_sessions.revoked_at, now()),
        revoked_reason = coalesce(public.command_center_owner_sessions.revoked_reason, excluded.revoked_reason)
  where public.command_center_owner_sessions.owner_id = excluded.owner_id;

  return true;
end;
$$;

create or replace function public.command_center_revoke_owner_device(
  p_device_id uuid,
  p_reason text default 'owner_revoked_device'
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_owner uuid := auth.uid();
  v_count integer := 0;
  v_reason text := coalesce(nullif(left(trim(coalesce(p_reason,'')), 240), ''), 'owner_revoked_device');
begin
  if v_owner is null or not public.is_command_center_authorized() then
    raise exception 'not authorized';
  end if;

  update public.command_center_owner_devices
  set trust_state = 'revoked',
      revoked_at = coalesce(revoked_at, now()),
      revoked_reason = coalesce(revoked_reason, v_reason)
  where id = p_device_id and owner_id = v_owner;
  if not found then
    raise exception 'unknown owner device';
  end if;

  update public.command_center_owner_sessions
  set revoked_at = coalesce(revoked_at, now()),
      revoked_reason = coalesce(revoked_reason, v_reason)
  where device_id = p_device_id and owner_id = v_owner and revoked_at is null;
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke all on function public.command_center_touch_current_session(uuid,text,text) from public, anon;
revoke all on function public.command_center_list_owner_sessions() from public, anon;
revoke all on function public.command_center_revoke_owner_session(uuid,text) from public, anon;
revoke all on function public.command_center_revoke_owner_device(uuid,text) from public, anon;
grant execute on function public.command_center_touch_current_session(uuid,text,text) to authenticated;
grant execute on function public.command_center_list_owner_sessions() to authenticated;
grant execute on function public.command_center_revoke_owner_session(uuid,text) to authenticated;
grant execute on function public.command_center_revoke_owner_device(uuid,text) to authenticated;
