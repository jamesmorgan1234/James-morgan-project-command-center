-- C12 / P12.4
create table if not exists public.command_center_commerce_project_binding_history (
 owner_id uuid not null references auth.users(id) on delete cascade,
 binding_event_id text not null,
 binding_id text not null,
 project_id text not null,
 company_id text not null,
 store_account_ref text not null,
 supplier_account_refs text[] not null,
 provider_refs text[] not null,
 source_refs text[] not null,
 truth_owner text not null default 'specialist:commerce' check(truth_owner='specialist:commerce'),
 observed_at timestamptz not null,
 primary key(owner_id,binding_event_id), unique(owner_id,binding_id)
);
create table if not exists public.command_center_commerce_state_history (
 owner_id uuid not null references auth.users(id) on delete cascade,
 state_event_id text not null,
 project_id text not null,
 domain text not null check(domain in ('catalog','supplier','pricing','fulfillment','marketing','revenue')),
 canonical_ref text not null,
 state text not null,
 source_refs text[] not null,
 observed_at timestamptz not null,
 primary key(owner_id,state_event_id)
);
create or replace function public.command_center_reject_commerce_evidence_mutation() returns trigger language plpgsql set search_path to 'public' as $$ begin raise exception 'Commerce evidence is immutable'; end $$;
create trigger command_center_commerce_binding_immutable before update or delete on public.command_center_commerce_project_binding_history for each row execute function public.command_center_reject_commerce_evidence_mutation();
create trigger command_center_commerce_state_immutable before update or delete on public.command_center_commerce_state_history for each row execute function public.command_center_reject_commerce_evidence_mutation();
alter table public.command_center_commerce_project_binding_history enable row level security;
alter table public.command_center_commerce_state_history enable row level security;
create policy p12_4_commerce_binding_owner on public.command_center_commerce_project_binding_history for all to authenticated using(owner_id=(select auth.uid()) and (select public.is_command_center_authorized())) with check(owner_id=(select auth.uid()) and (select public.is_command_center_authorized()));
create policy p12_4_commerce_state_owner on public.command_center_commerce_state_history for all to authenticated using(owner_id=(select auth.uid()) and (select public.is_command_center_authorized())) with check(owner_id=(select auth.uid()) and (select public.is_command_center_authorized()));
