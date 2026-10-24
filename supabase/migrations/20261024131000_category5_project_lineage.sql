-- Category 5 / P5.2 — append-only project lineage, rename, mission, alias, merge and supersession history.
-- Branch-only migration. No production state is changed by committing this file.

create table if not exists public.command_center_project_lineage_events (
  event_id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  project_id text not null,
  event_type text not null check (event_type in ('created','renamed','mission_changed','alias_added','merged','superseded','forked','branched','reactivated','retired')),
  occurred_at timestamptz not null,
  owner_decision_ref text,
  from_name text,
  to_name text,
  from_mission text,
  to_mission text,
  alias text,
  related_project_id text,
  evidence_refs text[] not null,
  recorded_at timestamptz not null default now(),
  foreign key(owner_id,project_id) references public.command_center_project_profiles(owner_id,project_id) on delete cascade,
  foreign key(owner_id,related_project_id) references public.command_center_project_profiles(owner_id,project_id) on delete restrict,
  check (cardinality(evidence_refs)>0),
  check (occurred_at<=recorded_at + interval '5 minutes'),
  check (event_type='created' or owner_decision_ref is not null),
  check (owner_decision_ref is null or length(btrim(owner_decision_ref)) between 1 and 1000),
  check (event_type<>'renamed' or (length(btrim(coalesce(from_name,'')))>0 and length(btrim(coalesce(to_name,'')))>0 and from_name<>to_name)),
  check (event_type<>'mission_changed' or (length(btrim(coalesce(from_mission,'')))>0 and length(btrim(coalesce(to_mission,'')))>0 and from_mission<>to_mission)),
  check (event_type<>'alias_added' or length(btrim(coalesce(alias,'')))>0),
  check (event_type not in ('merged','superseded','forked','branched') or related_project_id is not null),
  check (related_project_id is null or related_project_id<>project_id)
);
create index if not exists command_center_project_lineage_project_idx
  on public.command_center_project_lineage_events(owner_id,project_id,occurred_at,event_id);
create unique index if not exists command_center_project_lineage_alias_once_idx
  on public.command_center_project_lineage_events(owner_id,project_id,lower(alias))
  where event_type='alias_added' and alias is not null;

alter table public.command_center_project_lineage_events enable row level security;
revoke all on table public.command_center_project_lineage_events from public,anon,authenticated;
grant select on table public.command_center_project_lineage_events to authenticated;
drop policy if exists c5_owner_select_project_lineage on public.command_center_project_lineage_events;
create policy c5_owner_select_project_lineage
  on public.command_center_project_lineage_events for select to authenticated
  using (owner_id=(select auth.uid()) and (select public.is_command_center_authorized()));

create or replace function public.command_center_project_append_lineage(
  p_project_id text,
  p_event_type text,
  p_occurred_at timestamptz,
  p_owner_decision_ref text,
  p_from_name text,
  p_to_name text,
  p_from_mission text,
  p_to_mission text,
  p_alias text,
  p_related_project_id text,
  p_evidence_refs text[]
)
returns uuid language plpgsql security definer set search_path='' as $$
declare
  u uuid:=auth.uid();
  v_event_id uuid;
  v_type text:=btrim(coalesce(p_event_type,''));
begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  if not exists(select 1 from public.command_center_project_profiles where owner_id=u and project_id=btrim(p_project_id)) then raise exception 'Project not found'; end if;
  perform command_center_private.c5_assert_unique_text_array(p_evidence_refs,'Lineage evidence');
  if cardinality(coalesce(p_evidence_refs,'{}'::text[]))=0 then raise exception 'Lineage evidence is required'; end if;
  if v_type<>'created' and coalesce(btrim(p_owner_decision_ref),'')='' then raise exception 'Owner decision evidence is required'; end if;

  insert into public.command_center_project_lineage_events(
    owner_id,project_id,event_type,occurred_at,owner_decision_ref,from_name,to_name,from_mission,to_mission,alias,related_project_id,evidence_refs
  ) values(
    u,btrim(p_project_id),v_type,p_occurred_at,nullif(btrim(coalesce(p_owner_decision_ref,'')),''),
    nullif(btrim(coalesce(p_from_name,'')),''),nullif(btrim(coalesce(p_to_name,'')),''),
    nullif(btrim(coalesce(p_from_mission,'')),''),nullif(btrim(coalesce(p_to_mission,'')),''),
    nullif(btrim(coalesce(p_alias,'')),''),nullif(btrim(coalesce(p_related_project_id,'')),''),p_evidence_refs
  ) returning event_id into v_event_id;

  return v_event_id;
end $$;

revoke all on function public.command_center_project_append_lineage(text,text,timestamptz,text,text,text,text,text,text,text,text[]) from public,anon;
grant execute on function public.command_center_project_append_lineage(text,text,timestamptz,text,text,text,text,text,text,text,text[]) to authenticated;
