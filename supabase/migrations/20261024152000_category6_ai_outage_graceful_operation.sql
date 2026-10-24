-- Category 6 / P6.14 — durable no-cloud/no-AI graceful-operation capability evidence.
-- Branch-only migration. Core deterministic truth/control must survive external AI outage.

create table if not exists public.command_center_brain_capability_availability (
  owner_id uuid not null references auth.users(id) on delete cascade,
  capability_key text not null,
  requires_ai boolean not null,
  available_offline boolean not null,
  provider_key text,
  state text not null check (state in ('available','degraded','unavailable')),
  evidence_refs text[] not null,
  checked_at timestamptz not null,
  recorded_at timestamptz not null default now(),
  primary key(owner_id,capability_key),
  foreign key(owner_id,provider_key) references public.command_center_provider_registry(owner_id,provider_key) on delete restrict,
  check (capability_key ~ '^[a-z0-9][a-z0-9._:-]{0,160}$'),
  check (cardinality(evidence_refs)>0),
  check (checked_at<=recorded_at + interval '5 minutes')
);

create table if not exists public.command_center_brain_ai_outage_checks (
  outage_check_id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  required_core_keys text[] not null,
  available_core_keys text[] not null,
  unavailable_core_keys text[] not null,
  external_ai_available boolean not null,
  core_truth_operable boolean not null,
  evidence_refs text[] not null,
  checked_at timestamptz not null,
  recorded_at timestamptz not null default now(),
  check (cardinality(required_core_keys)>0),
  check (cardinality(evidence_refs)>0),
  check (core_truth_operable=(cardinality(unavailable_core_keys)=0)),
  check (checked_at<=recorded_at + interval '5 minutes')
);

do $$
declare t text;
begin
  foreach t in array array['command_center_brain_capability_availability','command_center_brain_ai_outage_checks'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('revoke all on table public.%I from public,anon,authenticated',t);
    execute format('grant select on table public.%I to authenticated',t);
    execute format('drop policy if exists %I on public.%I','c6_owner_select_'||t,t);
    execute format('create policy %I on public.%I for select to authenticated using (owner_id=(select auth.uid()) and (select public.is_command_center_authorized()))','c6_owner_select_'||t,t);
  end loop;
end $$;

create or replace function public.command_center_brain_record_ai_outage_check(
  p_external_ai_available boolean,p_evidence_refs text[],p_checked_at timestamptz
) returns jsonb language plpgsql security definer set search_path='' as $$
declare
  u uuid:=auth.uid();
  required text[]:=array['project.read','checkpoint.read','decision.read','rule.read','needs-me.read'];
  available text[];
  unavailable text[];
  k text;
begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  perform command_center_private.c3_assert_unique_text_array(p_evidence_refs,'AI outage evidence');
  if cardinality(coalesce(p_evidence_refs,'{}'::text[]))=0 then raise exception 'AI outage check requires evidence'; end if;
  available:='{}'::text[]; unavailable:='{}'::text[];
  foreach k in array required loop
    if exists(select 1 from public.command_center_brain_capability_availability c where c.owner_id=u and c.capability_key=k and not c.requires_ai and c.available_offline and c.state<>'unavailable') then
      available:=array_append(available,k);
    else
      unavailable:=array_append(unavailable,k);
    end if;
  end loop;
  insert into public.command_center_brain_ai_outage_checks(owner_id,required_core_keys,available_core_keys,unavailable_core_keys,external_ai_available,core_truth_operable,evidence_refs,checked_at)
  values(u,required,available,unavailable,p_external_ai_available,cardinality(unavailable)=0,p_evidence_refs,p_checked_at);
  return jsonb_build_object('external_ai_available',p_external_ai_available,'core_truth_operable',cardinality(unavailable)=0,'available_core_keys',available,'unavailable_core_keys',unavailable);
end $$;

revoke all on function public.command_center_brain_record_ai_outage_check(boolean,text[],timestamptz) from public,anon;
grant execute on function public.command_center_brain_record_ai_outage_check(boolean,text[],timestamptz) to authenticated;
