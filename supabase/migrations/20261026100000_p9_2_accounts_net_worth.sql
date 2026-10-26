-- C9 / P9.2 — account positions, balances, liabilities/assets, valuation dates and reconciliation truth.

create table if not exists public.command_center_finance_account_position_history (
  owner_id uuid not null references auth.users(id) on delete cascade,
  position_id text not null check (btrim(position_id) <> ''),
  account_id text not null check (btrim(account_id) <> ''),
  provider_key text not null check (provider_key like 'finance-provider:%'),
  external_account_id text not null check (btrim(external_account_id) <> ''),
  account_type text not null check (account_type in ('checking','savings','cash','credit_card','loan','mortgage','investment','retirement','other')),
  account_currency text not null check (account_currency ~ '^[A-Z]{3}$'),
  ownership text not null check (ownership in ('sole','joint','authorized_user','custodial','external')),
  position_class text not null check (position_class in ('asset','liability')),
  position_state text not null check (position_state in ('verified','pending','stale','unavailable')),
  amount_cents bigint,
  currency text check (currency is null or currency ~ '^[A-Z]{3}$'),
  unavailable_reason text,
  valuation_date timestamptz not null,
  observed_at timestamptz not null,
  provenance_refs text[] not null check (cardinality(provenance_refs) > 0),
  protected_action_authorized boolean not null default false check (protected_action_authorized = false),
  primary key(owner_id,position_id),
  unique(owner_id,account_id,observed_at),
  check (valuation_date <= observed_at),
  check (
    (position_state = 'unavailable' and amount_cents is null and currency is null and nullif(btrim(unavailable_reason),'') is not null)
    or
    (position_state <> 'unavailable' and amount_cents is not null and currency = account_currency and unavailable_reason is null)
  )
);

create table if not exists public.command_center_finance_account_reconciliation_history (
  owner_id uuid not null references auth.users(id) on delete cascade,
  reconciliation_id text not null check (btrim(reconciliation_id) <> ''),
  account_id text not null check (btrim(account_id) <> ''),
  current_position_id text,
  incoming_position_id text not null check (btrim(incoming_position_id) <> ''),
  decision text not null check (decision in ('accept_newer','duplicate','reject_stale','manual_conflict')),
  observed_at timestamptz not null,
  evidence_refs text[] not null check (cardinality(evidence_refs) > 0),
  protected_action_authorized boolean not null default false check (protected_action_authorized = false),
  primary key(owner_id,reconciliation_id),
  foreign key(owner_id,incoming_position_id) references public.command_center_finance_account_position_history(owner_id,position_id) on delete restrict,
  foreign key(owner_id,current_position_id) references public.command_center_finance_account_position_history(owner_id,position_id) on delete restrict
);

create or replace view public.command_center_finance_account_positions_current
with (security_invoker=true) as
select distinct on (owner_id,account_id)
  owner_id, position_id, account_id, provider_key, external_account_id, account_type, account_currency,
  ownership, position_class, position_state, amount_cents, currency, unavailable_reason, valuation_date,
  observed_at, provenance_refs, protected_action_authorized
from public.command_center_finance_account_position_history
order by owner_id,account_id,observed_at desc;

create or replace view public.command_center_finance_net_worth_status_current
with (security_invoker=true) as
select
  owner_id,
  account_currency as currency,
  coalesce(sum(case when position_state='verified' and position_class='asset' then amount_cents else 0 end),0)::bigint as verified_assets_cents,
  coalesce(sum(case when position_state='verified' and position_class='liability' then abs(amount_cents) else 0 end),0)::bigint as verified_liabilities_cents,
  coalesce(sum(case when position_state='verified' and position_class='asset' then amount_cents when position_state='verified' and position_class='liability' then -abs(amount_cents) else 0 end),0)::bigint as verified_net_worth_cents,
  count(*) filter (where position_state='verified' and amount_cents=0)::bigint as verified_zero_count,
  count(*) filter (where position_state='pending')::bigint as pending_count,
  count(*) filter (where position_state='stale')::bigint as stale_count,
  count(*) filter (where position_state='unavailable')::bigint as unavailable_count,
  bool_and(position_state='verified') as complete,
  min(valuation_date) as oldest_source_date,
  max(valuation_date) as newest_source_date
from public.command_center_finance_account_positions_current
group by owner_id,account_currency;

create or replace function public.command_center_reject_finance_position_history_mutation()
returns trigger language plpgsql set search_path to 'public' as $$
begin raise exception 'Finance account position history is immutable'; end $$;

do $$ declare t text; begin
  foreach t in array array['command_center_finance_account_position_history','command_center_finance_account_reconciliation_history'] loop
    execute format('drop trigger if exists %I on public.%I',t || '_immutable',t);
    execute format('create trigger %I before update or delete on public.%I for each row execute function public.command_center_reject_finance_position_history_mutation()',t || '_immutable',t);
    execute format('alter table public.%I enable row level security',t);
    execute format('revoke all on table public.%I from public,anon,authenticated',t);
  end loop;
end $$;

grant select,insert on table public.command_center_finance_account_position_history to authenticated;
grant select,insert on table public.command_center_finance_account_reconciliation_history to authenticated;
grant select on table public.command_center_finance_account_positions_current to authenticated;
grant select on table public.command_center_finance_net_worth_status_current to authenticated;

create policy p9_2_finance_positions_owner_select on public.command_center_finance_account_position_history for select to authenticated
using(owner_id=(select auth.uid()) and (select public.is_command_center_authorized()));
create policy p9_2_finance_positions_owner_insert on public.command_center_finance_account_position_history for insert to authenticated
with check(owner_id=(select auth.uid()) and (select public.is_command_center_authorized()) and protected_action_authorized=false);
create policy p9_2_finance_reconciliation_owner_select on public.command_center_finance_account_reconciliation_history for select to authenticated
using(owner_id=(select auth.uid()) and (select public.is_command_center_authorized()));
create policy p9_2_finance_reconciliation_owner_insert on public.command_center_finance_account_reconciliation_history for insert to authenticated
with check(owner_id=(select auth.uid()) and (select public.is_command_center_authorized()) and protected_action_authorized=false);
