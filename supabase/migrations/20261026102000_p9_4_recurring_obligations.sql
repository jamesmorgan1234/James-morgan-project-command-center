-- C9 / P9.4 — recurring activity, obligations, owner corrections, and reminder intents.

create table if not exists public.command_center_finance_recurring_obligation_history (
  owner_id uuid not null references auth.users(id) on delete cascade,
  obligation_event_id text not null check (btrim(obligation_event_id) <> ''),
  obligation_id text not null check (btrim(obligation_id) <> ''),
  flow_kind text not null check (flow_kind in ('income','bill','subscription','debt_payment','transfer','other')),
  counterparty text not null check (btrim(counterparty) <> ''),
  currency text not null check (currency ~ '^[A-Z]{3}$'),
  expected_amount_cents bigint,
  expected_next_at timestamptz,
  cadence_ref text,
  confidence numeric not null check (confidence >= 0 and confidence <= 1),
  detection_evidence_refs text[] not null check (cardinality(detection_evidence_refs) > 0),
  contract_evidence_refs text[] not null default '{}'::text[],
  owner_confirmation_ref text,
  truth_state text not null check (truth_state in ('detected_candidate','confirmed_obligation','ended','dismissed')),
  status text not null check (status in ('candidate','active','paused','overdue','ended','dismissed')),
  observed_at timestamptz not null,
  correction_of text,
  protected_action_authorized boolean not null default false check (protected_action_authorized = false),
  primary key(owner_id,obligation_event_id),
  unique(owner_id,obligation_id,observed_at),
  check (cadence_ref is null or btrim(cadence_ref) <> ''),
  check (owner_confirmation_ref is null or btrim(owner_confirmation_ref) <> ''),
  check (correction_of is null or btrim(correction_of) <> ''),
  check (
    (status in ('active','overdue') and truth_state='confirmed_obligation' and (cardinality(contract_evidence_refs) > 0 or owner_confirmation_ref is not null))
    or status not in ('active','overdue')
  ),
  check (
    truth_state <> 'confirmed_obligation'
    or cardinality(contract_evidence_refs) > 0
    or owner_confirmation_ref is not null
  ),
  check ((status='ended' and truth_state='ended') or status <> 'ended'),
  check ((status='dismissed' and truth_state='dismissed') or status <> 'dismissed')
);

create table if not exists public.command_center_finance_recurring_obligation_correction_history (
  owner_id uuid not null references auth.users(id) on delete cascade,
  correction_id text not null check (btrim(correction_id) <> ''),
  obligation_id text not null check (btrim(obligation_id) <> ''),
  target_obligation_event_id text not null check (btrim(target_obligation_event_id) <> ''),
  owner_decision_ref text not null check (btrim(owner_decision_ref) <> ''),
  expected_amount_cents bigint,
  expected_next_at timestamptz,
  corrected_status text check (corrected_status is null or corrected_status in ('candidate','active','paused','overdue','ended','dismissed')),
  observed_at timestamptz not null,
  evidence_refs text[] not null check (cardinality(evidence_refs) > 0),
  protected_action_authorized boolean not null default false check (protected_action_authorized = false),
  primary key(owner_id,correction_id),
  foreign key(owner_id,target_obligation_event_id) references public.command_center_finance_recurring_obligation_history(owner_id,obligation_event_id) on delete restrict
);

create table if not exists public.command_center_finance_recurring_reminder_intent_history (
  owner_id uuid not null references auth.users(id) on delete cascade,
  reminder_intent_id text not null check (btrim(reminder_intent_id) <> ''),
  obligation_id text not null check (btrim(obligation_id) <> ''),
  due_at timestamptz not null,
  reason text not null check (reason in ('upcoming_obligation','overdue_obligation')),
  evidence_refs text[] not null check (cardinality(evidence_refs) > 0),
  send_authorized boolean not null default false check (send_authorized = false),
  protected_action_authorized boolean not null default false check (protected_action_authorized = false),
  recorded_at timestamptz not null default now(),
  primary key(owner_id,reminder_intent_id)
);

create or replace view public.command_center_finance_recurring_obligations_current
with (security_invoker=true) as
select distinct on (owner_id,obligation_id)
  owner_id, obligation_event_id, obligation_id, flow_kind, counterparty, currency,
  expected_amount_cents, expected_next_at, cadence_ref, confidence, detection_evidence_refs,
  contract_evidence_refs, owner_confirmation_ref, truth_state, status, observed_at, correction_of,
  protected_action_authorized
from public.command_center_finance_recurring_obligation_history
order by owner_id,obligation_id,observed_at desc;

create or replace function public.command_center_reject_finance_recurring_history_mutation()
returns trigger language plpgsql set search_path to 'public' as $$
begin raise exception 'Finance recurring history is immutable'; end $$;

do $$ declare t text; begin
  foreach t in array array['command_center_finance_recurring_obligation_history','command_center_finance_recurring_obligation_correction_history','command_center_finance_recurring_reminder_intent_history'] loop
    execute format('drop trigger if exists %I on public.%I',t || '_immutable',t);
    execute format('create trigger %I before update or delete on public.%I for each row execute function public.command_center_reject_finance_recurring_history_mutation()',t || '_immutable',t);
    execute format('alter table public.%I enable row level security',t);
    execute format('revoke all on table public.%I from public,anon,authenticated',t);
  end loop;
end $$;

grant select,insert on table public.command_center_finance_recurring_obligation_history to authenticated;
grant select,insert on table public.command_center_finance_recurring_obligation_correction_history to authenticated;
grant select,insert on table public.command_center_finance_recurring_reminder_intent_history to authenticated;
grant select on table public.command_center_finance_recurring_obligations_current to authenticated;

create policy p9_4_recurring_owner_select on public.command_center_finance_recurring_obligation_history for select to authenticated
using(owner_id=(select auth.uid()) and (select public.is_command_center_authorized()));
create policy p9_4_recurring_owner_insert on public.command_center_finance_recurring_obligation_history for insert to authenticated
with check(owner_id=(select auth.uid()) and (select public.is_command_center_authorized()) and protected_action_authorized=false);
create policy p9_4_recurring_correction_owner_select on public.command_center_finance_recurring_obligation_correction_history for select to authenticated
using(owner_id=(select auth.uid()) and (select public.is_command_center_authorized()));
create policy p9_4_recurring_correction_owner_insert on public.command_center_finance_recurring_obligation_correction_history for insert to authenticated
with check(owner_id=(select auth.uid()) and (select public.is_command_center_authorized()) and protected_action_authorized=false);
create policy p9_4_recurring_reminder_owner_select on public.command_center_finance_recurring_reminder_intent_history for select to authenticated
using(owner_id=(select auth.uid()) and (select public.is_command_center_authorized()));
create policy p9_4_recurring_reminder_owner_insert on public.command_center_finance_recurring_reminder_intent_history for insert to authenticated
with check(owner_id=(select auth.uid()) and (select public.is_command_center_authorized()) and send_authorized=false and protected_action_authorized=false);
