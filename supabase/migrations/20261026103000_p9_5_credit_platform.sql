-- C9 / P9.5 — credit report identity, factors/accounts/utilization, privacy and refresh truth.

create table if not exists public.command_center_credit_report_history (
  owner_id uuid not null references auth.users(id) on delete cascade,
  report_event_id text not null check (btrim(report_event_id) <> ''),
  report_id text not null check (btrim(report_id) <> ''),
  provider text not null check (btrim(provider) <> ''),
  model text not null check (btrim(model) <> ''),
  report_date date not null,
  observed_at timestamptz not null,
  refresh_state text not null check (refresh_state in ('fresh','stale','pending','unavailable')),
  source_refs text[] not null check (cardinality(source_refs) > 0),
  protected_action_authorized boolean not null default false check (protected_action_authorized = false),
  primary key(owner_id,report_event_id),
  unique(owner_id,report_id,provider,model,report_date,observed_at)
);

create table if not exists public.command_center_credit_score_history (
  owner_id uuid not null,
  score_event_id text not null check (btrim(score_event_id) <> ''),
  report_event_id text not null,
  report_id text not null check (btrim(report_id) <> ''),
  provider text not null check (btrim(provider) <> ''),
  model text not null check (btrim(model) <> ''),
  report_date date not null,
  score integer not null check (score >= 0 and score <= 1000),
  observed_at timestamptz not null,
  source_refs text[] not null check (cardinality(source_refs) > 0),
  protected_action_authorized boolean not null default false check (protected_action_authorized = false),
  primary key(owner_id,score_event_id),
  foreign key(owner_id,report_event_id) references public.command_center_credit_report_history(owner_id,report_event_id) on delete restrict
);

create table if not exists public.command_center_credit_factor_history (
  owner_id uuid not null,
  factor_event_id text not null check (btrim(factor_event_id) <> ''),
  report_event_id text not null,
  report_id text not null check (btrim(report_id) <> ''),
  provider text not null check (btrim(provider) <> ''),
  model text not null check (btrim(model) <> ''),
  report_date date not null,
  factor_key text not null check (btrim(factor_key) <> ''),
  impact text not null check (impact in ('positive','negative','neutral','unknown')),
  observed_at timestamptz not null,
  evidence_refs text[] not null check (cardinality(evidence_refs) > 0),
  protected_action_authorized boolean not null default false check (protected_action_authorized = false),
  primary key(owner_id,factor_event_id),
  foreign key(owner_id,report_event_id) references public.command_center_credit_report_history(owner_id,report_event_id) on delete restrict
);

create table if not exists public.command_center_credit_account_history (
  owner_id uuid not null,
  credit_account_event_id text not null check (btrim(credit_account_event_id) <> ''),
  report_event_id text not null,
  report_id text not null check (btrim(report_id) <> ''),
  provider text not null check (btrim(provider) <> ''),
  model text not null check (btrim(model) <> ''),
  report_date date not null,
  account_ref text not null check (btrim(account_ref) <> ''),
  creditor_name text not null check (btrim(creditor_name) <> ''),
  account_state text not null check (account_state in ('open','closed','unknown')),
  balance_cents bigint,
  credit_limit_cents bigint check (credit_limit_cents is null or credit_limit_cents >= 0),
  utilization_basis_points integer,
  observed_at timestamptz not null,
  evidence_refs text[] not null check (cardinality(evidence_refs) > 0),
  protected_action_authorized boolean not null default false check (protected_action_authorized = false),
  primary key(owner_id,credit_account_event_id),
  foreign key(owner_id,report_event_id) references public.command_center_credit_report_history(owner_id,report_event_id) on delete restrict,
  check (utilization_basis_points is null or (balance_cents is not null and credit_limit_cents is not null and credit_limit_cents > 0))
);

create or replace view public.command_center_credit_reports_current
with (security_invoker=true) as
select distinct on (owner_id,provider,model)
  owner_id,report_event_id,report_id,provider,model,report_date,observed_at,refresh_state,source_refs,protected_action_authorized
from public.command_center_credit_report_history
order by owner_id,provider,model,report_date desc,observed_at desc;

create or replace function public.command_center_reject_credit_history_mutation()
returns trigger language plpgsql set search_path to 'public' as $$
begin raise exception 'Credit history is immutable'; end $$;

do $$ declare t text; begin
  foreach t in array array['command_center_credit_report_history','command_center_credit_score_history','command_center_credit_factor_history','command_center_credit_account_history'] loop
    execute format('drop trigger if exists %I on public.%I',t || '_immutable',t);
    execute format('create trigger %I before update or delete on public.%I for each row execute function public.command_center_reject_credit_history_mutation()',t || '_immutable',t);
    execute format('alter table public.%I enable row level security',t);
    execute format('revoke all on table public.%I from public,anon,authenticated',t);
  end loop;
end $$;

grant select,insert on table public.command_center_credit_report_history to authenticated;
grant select,insert on table public.command_center_credit_score_history to authenticated;
grant select,insert on table public.command_center_credit_factor_history to authenticated;
grant select,insert on table public.command_center_credit_account_history to authenticated;
grant select on table public.command_center_credit_reports_current to authenticated;

create policy p9_5_credit_report_owner_select on public.command_center_credit_report_history for select to authenticated
using(owner_id=(select auth.uid()) and (select public.is_command_center_authorized()));
create policy p9_5_credit_report_owner_insert on public.command_center_credit_report_history for insert to authenticated
with check(owner_id=(select auth.uid()) and (select public.is_command_center_authorized()) and protected_action_authorized=false);
create policy p9_5_credit_score_owner_select on public.command_center_credit_score_history for select to authenticated
using(owner_id=(select auth.uid()) and (select public.is_command_center_authorized()));
create policy p9_5_credit_score_owner_insert on public.command_center_credit_score_history for insert to authenticated
with check(owner_id=(select auth.uid()) and (select public.is_command_center_authorized()) and protected_action_authorized=false);
create policy p9_5_credit_factor_owner_select on public.command_center_credit_factor_history for select to authenticated
using(owner_id=(select auth.uid()) and (select public.is_command_center_authorized()));
create policy p9_5_credit_factor_owner_insert on public.command_center_credit_factor_history for insert to authenticated
with check(owner_id=(select auth.uid()) and (select public.is_command_center_authorized()) and protected_action_authorized=false);
create policy p9_5_credit_account_owner_select on public.command_center_credit_account_history for select to authenticated
using(owner_id=(select auth.uid()) and (select public.is_command_center_authorized()));
create policy p9_5_credit_account_owner_insert on public.command_center_credit_account_history for insert to authenticated
with check(owner_id=(select auth.uid()) and (select public.is_command_center_authorized()) and protected_action_authorized=false);
