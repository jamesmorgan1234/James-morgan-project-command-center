-- C9 / P9.9 — finance failure/recovery evidence, fail-closed reconciliation and uncertain-action barriers.
create table if not exists public.command_center_finance_recovery_evidence_history (
 owner_id uuid not null references auth.users(id) on delete cascade,
 recovery_event_id text not null check(btrim(recovery_event_id)<>''), provider_key text not null check(provider_key like 'finance-provider:%'),
 incident_kind text not null check(incident_kind in ('provider_error','stale_balance','partial_sync','duplicate','account_relink','compromised_provider','restore','protected_action_uncertain','protected_action_rollback')),
 disposition text not null check(disposition in ('accept','defer','reject','manual_review')), reason text not null check(btrim(reason)<>''),
 evidence_refs text[] not null check(cardinality(evidence_refs)>0), audit_ref text not null check(btrim(audit_ref)<>''),
 integrity_verified boolean not null, provenance_verified boolean not null, provider_health text not null check(provider_health in ('available','degraded','unavailable','compromised')),
 canonical_identity_preserved boolean not null, action_replay_allowed boolean not null default false check(action_replay_allowed=false), rollback_authorized boolean not null default false check(rollback_authorized=false),
 fail_closed boolean not null default true check(fail_closed=true), protected_action_authorized boolean not null default false check(protected_action_authorized=false), observed_at timestamptz not null,
 primary key(owner_id,recovery_event_id)
);
create table if not exists public.command_center_finance_uncertain_action_evidence_history (
 owner_id uuid not null references auth.users(id) on delete cascade, uncertain_event_id text not null check(btrim(uncertain_event_id)<>''),
 intent_id text not null check(btrim(intent_id)<>''), prior_execution_refs text[] not null default '{}'::text[], receipt_refs text[] not null default '{}'::text[],
 provider_reconciliation_refs text[] not null default '{}'::text[], replay_allowed boolean not null default false check(replay_allowed=false), rollback_authorized boolean not null default false check(rollback_authorized=false),
 resolution text not null check(resolution in ('pending_manual_review','confirmed_executed','confirmed_not_executed','superseded_by_new_authorization')),
 evidence_refs text[] not null check(cardinality(evidence_refs)>0), observed_at timestamptz not null, primary key(owner_id,uncertain_event_id)
);
create or replace function public.command_center_reject_finance_recovery_evidence_mutation() returns trigger language plpgsql set search_path to 'public' as $$ begin raise exception 'Finance recovery evidence history is immutable'; end $$;
do $$ declare t text; begin foreach t in array array['command_center_finance_recovery_evidence_history','command_center_finance_uncertain_action_evidence_history'] loop execute format('drop trigger if exists %I on public.%I',t||'_immutable',t); execute format('create trigger %I before update or delete on public.%I for each row execute function public.command_center_reject_finance_recovery_evidence_mutation()',t||'_immutable',t); execute format('alter table public.%I enable row level security',t); execute format('revoke all on table public.%I from public,anon,authenticated',t); end loop; end $$;
grant select,insert on table public.command_center_finance_recovery_evidence_history to authenticated; grant select,insert on table public.command_center_finance_uncertain_action_evidence_history to authenticated;
create policy p9_9_recovery_owner_select on public.command_center_finance_recovery_evidence_history for select to authenticated using(owner_id=(select auth.uid()) and (select public.is_command_center_authorized()));
create policy p9_9_recovery_owner_insert on public.command_center_finance_recovery_evidence_history for insert to authenticated with check(owner_id=(select auth.uid()) and (select public.is_command_center_authorized()) and action_replay_allowed=false and rollback_authorized=false and fail_closed=true and protected_action_authorized=false);
create policy p9_9_uncertain_owner_select on public.command_center_finance_uncertain_action_evidence_history for select to authenticated using(owner_id=(select auth.uid()) and (select public.is_command_center_authorized()));
create policy p9_9_uncertain_owner_insert on public.command_center_finance_uncertain_action_evidence_history for insert to authenticated with check(owner_id=(select auth.uid()) and (select public.is_command_center_authorized()) and replay_allowed=false and rollback_authorized=false);
