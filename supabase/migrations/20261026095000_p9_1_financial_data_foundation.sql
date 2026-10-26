-- C9 / P9.1 — financial data foundation: provider connection history + canonical primitive history.

create table if not exists public.command_center_finance_provider_connection_history (
  owner_id uuid not null references auth.users(id) on delete cascade,
  provider_key text not null check (provider_key like 'finance-provider:%'),
  provider_identity text not null check (btrim(provider_identity) <> ''),
  connection_state text not null check (connection_state in ('unconfigured','connected','disconnected','expired','revoked')),
  consent_state text not null check (consent_state in ('required','granted','revoked')),
  consent_ref text,
  reconnect_ref text,
  last_successful_sync_at timestamptz,
  observed_at timestamptz not null,
  freshness_seconds integer not null check (freshness_seconds >= 0),
  provenance_refs text[] not null check (cardinality(provenance_refs) > 0),
  protected_action_authorized boolean not null default false check (protected_action_authorized = false),
  primary key(owner_id,provider_key,observed_at),
  check (consent_state <> 'granted' or nullif(btrim(consent_ref),'') is not null),
  check (connection_state not in ('disconnected','expired','revoked') or nullif(btrim(reconnect_ref),'') is not null)
);

create table if not exists public.command_center_finance_primitive_history (
  owner_id uuid not null references auth.users(id) on delete cascade,
  primitive_id text not null check (btrim(primitive_id) <> ''),
  primitive_kind text not null check (primitive_kind in ('account','balance','asset','debt','category','merchant','transaction','valuation','forecast','account_type','connection_state','confidence')),
  canonical_ref text not null check (btrim(canonical_ref) <> ''),
  truth_state text not null check (truth_state in ('realized','projected')),
  observed_at timestamptz not null,
  occurred_at timestamptz,
  account_ref text,
  amount_cents bigint,
  currency text check (currency is null or currency ~ '^[A-Z]{3}$'),
  label text,
  assumption_refs text[] not null default '{}'::text[],
  scenario_ref text,
  confidence_score numeric not null check (confidence_score >= 0 and confidence_score <= 1),
  confidence_basis text not null check (confidence_basis in ('provider','rule','model','owner','verified')),
  confidence_evidence_refs text[] not null default '{}'::text[],
  provider_key text not null check (provider_key like 'finance-provider:%'),
  provider_identity text not null check (btrim(provider_identity) <> ''),
  provider_record_id text not null check (btrim(provider_record_id) <> ''),
  fetched_at timestamptz not null,
  source_freshness text not null check (source_freshness in ('fresh','stale','disconnected','unknown')),
  provenance_refs text[] not null check (cardinality(provenance_refs) > 0),
  protected_action_authorized boolean not null default false check (protected_action_authorized = false),
  primary key(owner_id,primitive_id),
  unique(owner_id,provider_key,provider_record_id,primitive_kind,canonical_ref,observed_at),
  check (amount_cents is null or currency is not null),
  check (truth_state <> 'projected' or cardinality(assumption_refs) > 0),
  check (truth_state <> 'realized' or cardinality(assumption_refs) = 0),
  check (confidence_basis <> 'verified' or cardinality(confidence_evidence_refs) > 0)
);

create or replace view public.command_center_finance_provider_connections_current
with (security_invoker=true) as
select distinct on (owner_id,provider_key)
  owner_id, provider_key, provider_identity, connection_state, consent_state, consent_ref,
  reconnect_ref, last_successful_sync_at, observed_at, freshness_seconds, provenance_refs,
  protected_action_authorized
from public.command_center_finance_provider_connection_history
order by owner_id,provider_key,observed_at desc;

create or replace view public.command_center_finance_primitives_current
with (security_invoker=true) as
select distinct on (owner_id,primitive_kind,canonical_ref)
  owner_id, primitive_id, primitive_kind, canonical_ref, truth_state, observed_at, occurred_at,
  account_ref, amount_cents, currency, label, assumption_refs, scenario_ref,
  confidence_score, confidence_basis, confidence_evidence_refs, provider_key, provider_identity,
  provider_record_id, fetched_at, source_freshness, provenance_refs, protected_action_authorized
from public.command_center_finance_primitive_history
order by owner_id,primitive_kind,canonical_ref,observed_at desc;

create or replace function public.command_center_reject_finance_foundation_history_mutation()
returns trigger language plpgsql set search_path to 'public' as $$
begin raise exception 'Finance foundation history is immutable'; end $$;

do $$ declare t text; begin
  foreach t in array array['command_center_finance_provider_connection_history','command_center_finance_primitive_history'] loop
    execute format('drop trigger if exists %I on public.%I',t || '_immutable',t);
    execute format('create trigger %I before update or delete on public.%I for each row execute function public.command_center_reject_finance_foundation_history_mutation()',t || '_immutable',t);
    execute format('alter table public.%I enable row level security',t);
    execute format('revoke all on table public.%I from public,anon,authenticated',t);
  end loop;
end $$;

grant select,insert on table public.command_center_finance_provider_connection_history to authenticated;
grant select,insert on table public.command_center_finance_primitive_history to authenticated;
grant select on table public.command_center_finance_provider_connections_current to authenticated;
grant select on table public.command_center_finance_primitives_current to authenticated;

create policy p9_1_finance_provider_history_owner_select on public.command_center_finance_provider_connection_history for select to authenticated
using(owner_id=(select auth.uid()) and (select public.is_command_center_authorized()));
create policy p9_1_finance_provider_history_owner_insert on public.command_center_finance_provider_connection_history for insert to authenticated
with check(owner_id=(select auth.uid()) and (select public.is_command_center_authorized()) and protected_action_authorized=false);
create policy p9_1_finance_primitive_history_owner_select on public.command_center_finance_primitive_history for select to authenticated
using(owner_id=(select auth.uid()) and (select public.is_command_center_authorized()));
create policy p9_1_finance_primitive_history_owner_insert on public.command_center_finance_primitive_history for insert to authenticated
with check(owner_id=(select auth.uid()) and (select public.is_command_center_authorized()) and protected_action_authorized=false);
