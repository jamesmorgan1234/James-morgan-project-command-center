-- Category 6 / P6.10 — durable live conversational steering and safe replanning evidence.
-- Branch-only migration. Steering changes plan state; it never broadens authorization.

create table if not exists public.command_center_brain_steering_events (
  steering_event_id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  project_id text not null,
  plan_id uuid references public.command_center_brain_plans(plan_id) on delete restrict,
  command text not null check (command in ('pause','resume','reprioritize','change','redirect')),
  affected_unit_refs text[] not null default '{}'::text[],
  invalidated_unit_refs text[] not null default '{}'::text[],
  preserved_verified_refs text[] not null default '{}'::text[],
  prior_context_ref text,
  new_context_ref text,
  prior_plan_version bigint,
  new_plan_version bigint,
  requires_authorization_recheck boolean not null,
  evidence_refs text[] not null,
  reason text not null check (length(btrim(reason)) between 1 and 1000),
  occurred_at timestamptz not null,
  recorded_at timestamptz not null default now(),
  foreign key(owner_id,project_id) references public.command_center_project_profiles(owner_id,project_id) on delete restrict,
  check (cardinality(evidence_refs)>0),
  check (command not in ('change','redirect','reprioritize') or requires_authorization_recheck=true),
  check (occurred_at<=recorded_at + interval '5 minutes')
);
create index if not exists command_center_brain_steering_events_project_idx
  on public.command_center_brain_steering_events(owner_id,project_id,occurred_at desc,steering_event_id);

alter table public.command_center_brain_steering_events enable row level security;
revoke all on table public.command_center_brain_steering_events from public,anon,authenticated;
grant select on table public.command_center_brain_steering_events to authenticated;
drop policy if exists c6_owner_select_brain_steering_events on public.command_center_brain_steering_events;
create policy c6_owner_select_brain_steering_events
  on public.command_center_brain_steering_events for select to authenticated
  using (owner_id=(select auth.uid()) and (select public.is_command_center_authorized()));

create or replace function public.command_center_brain_record_steering(
  p_project_id text,p_plan_id uuid,p_command text,p_affected_unit_refs text[],p_invalidated_unit_refs text[],p_preserved_verified_refs text[],p_prior_context_ref text,p_new_context_ref text,p_prior_plan_version bigint,p_new_plan_version bigint,p_requires_authorization_recheck boolean,p_evidence_refs text[],p_reason text,p_occurred_at timestamptz
) returns uuid language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); v_id uuid; begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  if not exists(select 1 from public.command_center_project_profiles where owner_id=u and project_id=btrim(p_project_id)) then raise exception 'Steering project not found'; end if;
  if p_plan_id is not null and not exists(select 1 from public.command_center_brain_plans where owner_id=u and plan_id=p_plan_id and coalesce(project_id,'')=btrim(p_project_id)) then raise exception 'Steering plan scope mismatch'; end if;
  if p_command not in ('pause','resume','reprioritize','change','redirect') then raise exception 'Invalid steering command'; end if;
  if p_command in ('change','redirect','reprioritize') and not p_requires_authorization_recheck then raise exception 'Scope-changing steering requires authorization recheck'; end if;
  perform command_center_private.c3_assert_unique_text_array(p_affected_unit_refs,'Steering affected units');
  perform command_center_private.c3_assert_unique_text_array(p_invalidated_unit_refs,'Steering invalidated units');
  perform command_center_private.c3_assert_unique_text_array(p_preserved_verified_refs,'Steering preserved verified units');
  perform command_center_private.c3_assert_unique_text_array(p_evidence_refs,'Steering evidence');
  if cardinality(coalesce(p_evidence_refs,'{}'::text[]))=0 or coalesce(btrim(p_reason),'')='' then raise exception 'Steering requires reason/evidence'; end if;
  if exists(select 1 from unnest(coalesce(p_preserved_verified_refs,'{}'::text[])) x where x=any(coalesce(p_invalidated_unit_refs,'{}'::text[]))) then raise exception 'Verified preserved units cannot also be invalidated'; end if;
  insert into public.command_center_brain_steering_events(owner_id,project_id,plan_id,command,affected_unit_refs,invalidated_unit_refs,preserved_verified_refs,prior_context_ref,new_context_ref,prior_plan_version,new_plan_version,requires_authorization_recheck,evidence_refs,reason,occurred_at)
  values(u,btrim(p_project_id),p_plan_id,p_command,coalesce(p_affected_unit_refs,'{}'::text[]),coalesce(p_invalidated_unit_refs,'{}'::text[]),coalesce(p_preserved_verified_refs,'{}'::text[]),nullif(btrim(coalesce(p_prior_context_ref,'')),''),nullif(btrim(coalesce(p_new_context_ref,'')),''),p_prior_plan_version,p_new_plan_version,p_requires_authorization_recheck,p_evidence_refs,btrim(p_reason),p_occurred_at)
  returning steering_event_id into v_id;
  return v_id;
end $$;

revoke all on function public.command_center_brain_record_steering(text,uuid,text,text[],text[],text[],text,text,bigint,bigint,boolean,text[],text,timestamptz) from public,anon;
grant execute on function public.command_center_brain_record_steering(text,uuid,text,text[],text[],text[],text,text,bigint,bigint,boolean,text[],text,timestamptz) to authenticated;
