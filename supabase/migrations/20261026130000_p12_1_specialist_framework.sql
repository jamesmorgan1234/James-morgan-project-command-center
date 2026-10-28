-- C12 / P12.1 — generic specialist framework contracts without hard-coded project names.
-- Each framework event is bound to an exact PIF.3 canonical specialist version; P12 never becomes a parallel authority store.
create table if not exists public.command_center_specialist_framework_history (
 owner_id uuid not null references auth.users(id) on delete cascade,
 framework_event_id text not null check(btrim(framework_event_id)<>''),
 type_key text not null check(btrim(type_key)<>''),
 version integer not null check(version>0),
 specialist_id text not null check(btrim(specialist_id)<>''),
 specialist_version bigint not null check(specialist_version>0),
 capability_owners jsonb not null check(jsonb_typeof(capability_owners)='object' and capability_owners<>'{}'::jsonb),
 data_contracts text[] not null check(cardinality(data_contracts)>0),
 brain_hooks text[] not null default '{}'::text[],
 agency_hooks text[] not null default '{}'::text[],
 detail_sections text[] not null check(cardinality(detail_sections)>0),
 metric_keys text[] not null default '{}'::text[],
 provider_adapters text[] not null default '{}'::text[],
 isolation_class text not null check(btrim(isolation_class)<>''),
 source_refs text[] not null check(cardinality(source_refs)>0),
 observed_at timestamptz not null,
 primary key(owner_id,framework_event_id),
 unique(owner_id,type_key,version),
 foreign key(owner_id,specialist_id,specialist_version) references public.command_center_specialist_brain_versions(owner_id,specialist_id,version)
);
create or replace view public.command_center_specialist_framework_current with (security_invoker=true) as
 select distinct on(owner_id,type_key) owner_id,framework_event_id,type_key,version,specialist_id,specialist_version,capability_owners,data_contracts,brain_hooks,agency_hooks,detail_sections,metric_keys,provider_adapters,isolation_class,source_refs,observed_at
 from public.command_center_specialist_framework_history order by owner_id,type_key,version desc,observed_at desc;
create or replace function public.command_center_reject_specialist_framework_mutation() returns trigger language plpgsql set search_path to 'public' as $$ begin raise exception 'Specialist framework evidence is immutable'; end $$;
drop trigger if exists command_center_specialist_framework_immutable on public.command_center_specialist_framework_history;
create trigger command_center_specialist_framework_immutable before update or delete on public.command_center_specialist_framework_history for each row execute function public.command_center_reject_specialist_framework_mutation();
alter table public.command_center_specialist_framework_history enable row level security;
revoke all on table public.command_center_specialist_framework_history from public,anon,authenticated;
grant select,insert on table public.command_center_specialist_framework_history to authenticated;
grant select on table public.command_center_specialist_framework_current to authenticated;
create policy p12_1_specialist_framework_owner on public.command_center_specialist_framework_history for all to authenticated using(owner_id=(select auth.uid()) and (select public.is_command_center_authorized())) with check(owner_id=(select auth.uid()) and (select public.is_command_center_authorized()));
