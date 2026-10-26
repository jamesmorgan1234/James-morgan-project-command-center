-- C8 / P8.5 — durable Needs Me grouping and resolution.

create table if not exists public.command_center_owner_needs (
  owner_id uuid not null references auth.users(id) on delete cascade,
  need_id text not null check (btrim(need_id) <> ''),
  need_key text not null check (btrim(need_key) <> ''),
  title text not null check (btrim(title) <> ''),
  reason text not null check (btrim(reason) <> ''),
  urgency text not null check (urgency in ('critical','high','normal','low')),
  required_environment text not null check (required_environment in ('pc','phone','local_browser','any_device')),
  owner_action text not null check (btrim(owner_action) <> ''),
  unlock_refs text[] not null check (cardinality(unlock_refs) > 0),
  resume_refs text[] not null check (cardinality(resume_refs) > 0),
  source_refs text[] not null check (cardinality(source_refs) > 0),
  state text not null check (state in ('open','acknowledged','resolved')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key(owner_id, need_id),
  unique(owner_id, need_key)
);

create table if not exists public.command_center_need_resolutions (
  owner_id uuid not null references auth.users(id) on delete cascade,
  need_key text not null,
  resolved_need_id text not null,
  resolved_at timestamptz not null,
  evidence_refs text[] not null check (cardinality(evidence_refs) > 0),
  unlock_refs text[] not null check (cardinality(unlock_refs) > 0),
  resume_refs text[] not null check (cardinality(resume_refs) > 0),
  created_at timestamptz not null default now(),
  primary key(owner_id, need_key),
  foreign key(owner_id,resolved_need_id) references public.command_center_owner_needs(owner_id,need_id) on delete restrict
);

create index if not exists command_center_owner_needs_open_idx
  on public.command_center_owner_needs(owner_id,state,urgency);
create index if not exists command_center_owner_needs_resume_idx
  on public.command_center_owner_needs using gin(resume_refs);
create index if not exists command_center_need_resolutions_unlock_idx
  on public.command_center_need_resolutions using gin(unlock_refs);

create or replace function public.command_center_needs_me_set_updated_at()
returns trigger language plpgsql set search_path to 'public' as $$
begin new.updated_at=now(); return new; end $$;

drop trigger if exists command_center_owner_needs_set_updated_at on public.command_center_owner_needs;
create trigger command_center_owner_needs_set_updated_at before update on public.command_center_owner_needs
for each row execute function public.command_center_needs_me_set_updated_at();

create or replace function public.command_center_reject_need_resolution_mutation()
returns trigger language plpgsql set search_path to 'public' as $$
begin raise exception 'Needs Me resolution history is immutable'; end $$;

drop trigger if exists command_center_need_resolutions_immutable on public.command_center_need_resolutions;
create trigger command_center_need_resolutions_immutable before update or delete on public.command_center_need_resolutions
for each row execute function public.command_center_reject_need_resolution_mutation();

create or replace function public.command_center_resolve_owner_need(
  p_need_key text,
  p_resolved_at timestamptz,
  p_evidence_refs text[]
)
returns table(unlock_refs text[], resume_refs text[])
language plpgsql security definer set search_path to 'public' as $$
declare
  v_owner uuid := (select auth.uid());
  v_need public.command_center_owner_needs%rowtype;
begin
  if v_owner is null or not (select public.is_command_center_authorized()) then raise exception 'Authorized owner required'; end if;
  if btrim(coalesce(p_need_key,''))='' or coalesce(cardinality(p_evidence_refs),0)=0 then raise exception 'Need key and evidence are required'; end if;
  select * into v_need from public.command_center_owner_needs where owner_id=v_owner and need_key=p_need_key for update;
  if not found then raise exception 'Unknown Needs Me key'; end if;
  if exists(select 1 from public.command_center_need_resolutions where owner_id=v_owner and need_key=p_need_key) then
    return query select r.unlock_refs,r.resume_refs from public.command_center_need_resolutions r where r.owner_id=v_owner and r.need_key=p_need_key;
    return;
  end if;
  update public.command_center_owner_needs set state='resolved' where owner_id=v_owner and need_id=v_need.need_id;
  insert into public.command_center_need_resolutions(owner_id,need_key,resolved_need_id,resolved_at,evidence_refs,unlock_refs,resume_refs)
  values(v_owner,p_need_key,v_need.need_id,p_resolved_at,p_evidence_refs,v_need.unlock_refs,v_need.resume_refs);
  return query select v_need.unlock_refs,v_need.resume_refs;
end $$;

do $$ declare t text; begin
  foreach t in array array['command_center_owner_needs','command_center_need_resolutions'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('revoke all on table public.%I from public,anon,authenticated',t);
  end loop;
end $$;

grant select,insert,update on table public.command_center_owner_needs to authenticated;
grant select on table public.command_center_need_resolutions to authenticated;
grant execute on function public.command_center_resolve_owner_need(text,timestamptz,text[]) to authenticated;

create policy p8_5_owner_needs_all on public.command_center_owner_needs for all to authenticated
using(owner_id=(select auth.uid()) and (select public.is_command_center_authorized()))
with check(owner_id=(select auth.uid()) and (select public.is_command_center_authorized()));
create policy p8_5_need_resolutions_select on public.command_center_need_resolutions for select to authenticated
using(owner_id=(select auth.uid()) and (select public.is_command_center_authorized()));
