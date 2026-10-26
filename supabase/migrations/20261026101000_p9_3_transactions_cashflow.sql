-- C9 / P9.3 — normalized transaction lifecycle, raw-source lineage, corrections and transfer-safe cashflow.

create table if not exists public.command_center_finance_transaction_history (
  owner_id uuid not null references auth.users(id) on delete cascade,
  transaction_event_id text not null check (btrim(transaction_event_id) <> ''),
  canonical_transaction_ref text not null check (btrim(canonical_transaction_ref) <> ''),
  account_id text not null check (btrim(account_id) <> ''),
  provider_key text not null check (provider_key like 'finance-provider:%'),
  provider_identity text not null check (btrim(provider_identity) <> ''),
  external_transaction_id text not null check (btrim(external_transaction_id) <> ''),
  posting_state text not null check (posting_state in ('pending','posted')),
  occurred_at timestamptz not null,
  posted_at timestamptz,
  observed_at timestamptz not null,
  amount_cents bigint not null,
  currency text not null check (currency ~ '^[A-Z]{3}$'),
  merchant_name text,
  merchant_provenance_refs text[] not null default '{}'::text[],
  category text not null check (btrim(category) <> ''),
  category_provenance_refs text[] not null check (cardinality(category_provenance_refs) > 0),
  classification_source text not null check (classification_source in ('provider','rule','model','owner')),
  classification_confidence numeric not null check (classification_confidence >= 0 and classification_confidence <= 1),
  transfer_group_id text,
  correction_of text,
  raw_source_refs text[] not null check (cardinality(raw_source_refs) > 0),
  protected_action_authorized boolean not null default false check (protected_action_authorized = false),
  primary key(owner_id,transaction_event_id),
  unique(owner_id,provider_key,external_transaction_id,posting_state),
  check ((posting_state='posted' and posted_at is not null) or (posting_state='pending' and posted_at is null)),
  check (merchant_name is null or cardinality(merchant_provenance_refs) > 0)
);

create table if not exists public.command_center_finance_transaction_correction_history (
  owner_id uuid not null references auth.users(id) on delete cascade,
  correction_id text not null check (btrim(correction_id) <> ''),
  canonical_transaction_ref text not null check (btrim(canonical_transaction_ref) <> ''),
  target_transaction_event_id text not null check (btrim(target_transaction_event_id) <> ''),
  category text not null check (btrim(category) <> ''),
  merchant_name text,
  owner_decision_ref text not null check (btrim(owner_decision_ref) <> ''),
  observed_at timestamptz not null,
  provenance_refs text[] not null check (cardinality(provenance_refs) > 0),
  protected_action_authorized boolean not null default false check (protected_action_authorized = false),
  primary key(owner_id,correction_id),
  foreign key(owner_id,target_transaction_event_id) references public.command_center_finance_transaction_history(owner_id,transaction_event_id) on delete restrict
);

create or replace view public.command_center_finance_transactions_current
with (security_invoker=true) as
select distinct on (owner_id,canonical_transaction_ref)
  owner_id, transaction_event_id, canonical_transaction_ref, account_id, provider_key, provider_identity,
  external_transaction_id, posting_state, occurred_at, posted_at, observed_at, amount_cents, currency,
  merchant_name, merchant_provenance_refs, category, category_provenance_refs, classification_source,
  classification_confidence, transfer_group_id, correction_of, raw_source_refs, protected_action_authorized
from public.command_center_finance_transaction_history
order by owner_id,canonical_transaction_ref,(case when posting_state='posted' then 1 else 0 end) desc,observed_at desc;

create or replace view public.command_center_finance_transaction_cashflow_current
with (security_invoker=true) as
with current_rows as (
  select * from public.command_center_finance_transactions_current
), internal_transfer_groups as (
  select owner_id,transfer_group_id
  from current_rows
  where transfer_group_id is not null
  group by owner_id,transfer_group_id
  having count(distinct account_id) > 1 and sum(amount_cents)=0
)
select r.*,
  (g.transfer_group_id is not null) as excluded_internal_transfer
from current_rows r
left join internal_transfer_groups g on g.owner_id=r.owner_id and g.transfer_group_id=r.transfer_group_id;

create or replace function public.command_center_reject_finance_transaction_history_mutation()
returns trigger language plpgsql set search_path to 'public' as $$
begin raise exception 'Finance transaction history is immutable'; end $$;

do $$ declare t text; begin
  foreach t in array array['command_center_finance_transaction_history','command_center_finance_transaction_correction_history'] loop
    execute format('drop trigger if exists %I on public.%I',t || '_immutable',t);
    execute format('create trigger %I before update or delete on public.%I for each row execute function public.command_center_reject_finance_transaction_history_mutation()',t || '_immutable',t);
    execute format('alter table public.%I enable row level security',t);
    execute format('revoke all on table public.%I from public,anon,authenticated',t);
  end loop;
end $$;

grant select,insert on table public.command_center_finance_transaction_history to authenticated;
grant select,insert on table public.command_center_finance_transaction_correction_history to authenticated;
grant select on table public.command_center_finance_transactions_current to authenticated;
grant select on table public.command_center_finance_transaction_cashflow_current to authenticated;

create policy p9_3_finance_transaction_owner_select on public.command_center_finance_transaction_history for select to authenticated
using(owner_id=(select auth.uid()) and (select public.is_command_center_authorized()));
create policy p9_3_finance_transaction_owner_insert on public.command_center_finance_transaction_history for insert to authenticated
with check(owner_id=(select auth.uid()) and (select public.is_command_center_authorized()) and protected_action_authorized=false);
create policy p9_3_finance_correction_owner_select on public.command_center_finance_transaction_correction_history for select to authenticated
using(owner_id=(select auth.uid()) and (select public.is_command_center_authorized()));
create policy p9_3_finance_correction_owner_insert on public.command_center_finance_transaction_correction_history for insert to authenticated
with check(owner_id=(select auth.uid()) and (select public.is_command_center_authorized()) and protected_action_authorized=false);
