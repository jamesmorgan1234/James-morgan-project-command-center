-- C9 / P9.6 — goals/debt/budget/cashflow decision scenarios with explicit assumptions and evidence.
create table if not exists public.command_center_finance_decision_scenario_history (
  owner_id uuid not null references auth.users(id) on delete cascade,
  scenario_event_id text not null check (btrim(scenario_event_id)<>''),
  scenario_id text not null check (btrim(scenario_id)<>''),
  name text not null check (btrim(name)<>''),
  currency text not null check (currency ~ '^[A-Z]{3}$'),
  resulting_cents bigint not null,
  low_sensitivity_cents bigint not null,
  high_sensitivity_cents bigint not null,
  verified_input_keys text[] not null default '{}'::text[],
  assumption_keys text[] not null default '{}'::text[],
  evidence_refs text[] not null default '{}'::text[],
  assumption_refs text[] not null default '{}'::text[],
  goal_refs text[] not null default '{}'::text[],
  budget_refs text[] not null default '{}'::text[],
  debt_refs text[] not null default '{}'::text[],
  cashflow_refs text[] not null default '{}'::text[],
  score_forecast integer,
  outcome_promise boolean not null default false check (outcome_promise=false),
  protected_action_authorized boolean not null default false check (protected_action_authorized=false),
  observed_at timestamptz not null,
  primary key(owner_id,scenario_event_id),
  unique(owner_id,scenario_id,observed_at),
  check (low_sensitivity_cents <= resulting_cents and resulting_cents <= high_sensitivity_cents),
  check (score_forecast is null)
);
create table if not exists public.command_center_finance_decision_recommendation_history (
  owner_id uuid not null references auth.users(id) on delete cascade,
  recommendation_id text not null check (btrim(recommendation_id)<>''),
  scenario_id text not null check (btrim(scenario_id)<>''),
  title text not null check (btrim(title)<>''),
  rationale text not null check (btrim(rationale)<>''),
  evidence_refs text[] not null check (cardinality(evidence_refs)>0),
  assumption_refs text[] not null default '{}'::text[],
  score_forecast integer,
  outcome_promise boolean not null default false check (outcome_promise=false),
  protected_action_authorized boolean not null default false check (protected_action_authorized=false),
  observed_at timestamptz not null,
  primary key(owner_id,recommendation_id),
  check (score_forecast is null)
);
create or replace function public.command_center_reject_finance_decision_history_mutation()
returns trigger language plpgsql set search_path to 'public' as $$ begin raise exception 'Finance decision history is immutable'; end $$;
do $$ declare t text; begin foreach t in array array['command_center_finance_decision_scenario_history','command_center_finance_decision_recommendation_history'] loop execute format('drop trigger if exists %I on public.%I',t||'_immutable',t); execute format('create trigger %I before update or delete on public.%I for each row execute function public.command_center_reject_finance_decision_history_mutation()',t||'_immutable',t); execute format('alter table public.%I enable row level security',t); execute format('revoke all on table public.%I from public,anon,authenticated',t); end loop; end $$;
grant select,insert on table public.command_center_finance_decision_scenario_history to authenticated;
grant select,insert on table public.command_center_finance_decision_recommendation_history to authenticated;
create policy p9_6_scenario_owner_select on public.command_center_finance_decision_scenario_history for select to authenticated using(owner_id=(select auth.uid()) and (select public.is_command_center_authorized()));
create policy p9_6_scenario_owner_insert on public.command_center_finance_decision_scenario_history for insert to authenticated with check(owner_id=(select auth.uid()) and (select public.is_command_center_authorized()) and score_forecast is null and outcome_promise=false and protected_action_authorized=false);
create policy p9_6_recommendation_owner_select on public.command_center_finance_decision_recommendation_history for select to authenticated using(owner_id=(select auth.uid()) and (select public.is_command_center_authorized()));
create policy p9_6_recommendation_owner_insert on public.command_center_finance_decision_recommendation_history for insert to authenticated with check(owner_id=(select auth.uid()) and (select public.is_command_center_authorized()) and score_forecast is null and outcome_promise=false and protected_action_authorized=false);
