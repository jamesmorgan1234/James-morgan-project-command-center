-- C9 / P9.7 — exact-scope, fresh, one-time authorization for protected financial actions.
create table if not exists public.command_center_finance_action_intent_history (
 owner_id uuid not null references auth.users(id) on delete cascade,
 intent_id text not null check(btrim(intent_id)<>''), action_kind text not null check(action_kind in ('transfer','payment','trade','open_account','close_account','change_autopay','cancel_subscription','purchase','account_change')),
 provider_key text not null check(provider_key like 'finance-provider:%'), account_refs text[] not null check(cardinality(account_refs)>0), amount_cents bigint, intent_hash text not null check(btrim(intent_hash)<>''),
 source text not null check(source in ('owner_request','analysis','recommendation','automation')), created_at timestamptz not null, exact_owner_authorization_ref text not null check(btrim(exact_owner_authorization_ref)<>''),
 protected_action_authorized boolean not null default false check(protected_action_authorized=false), primary key(owner_id,intent_id)
);
create table if not exists public.command_center_finance_action_authorization_history (
 owner_id uuid not null references auth.users(id) on delete cascade,
 authorization_ref text not null check(btrim(authorization_ref)<>''), intent_id text not null, action_kind text not null,
 provider_key text not null, account_refs text[] not null check(cardinality(account_refs)>0), amount_cents bigint, intent_hash text not null,
 authorized_at timestamptz not null, expires_at timestamptz not null, assurance text not null check(assurance='fresh_passkey_uv'), one_time boolean not null default true check(one_time=true), consumed boolean not null default false,
 evidence_refs text[] not null check(cardinality(evidence_refs)>0), primary key(owner_id,authorization_ref), foreign key(owner_id,intent_id) references public.command_center_finance_action_intent_history(owner_id,intent_id) on delete restrict,
 check(authorized_at<expires_at)
);
create table if not exists public.command_center_finance_action_execution_history (
 owner_id uuid not null references auth.users(id) on delete cascade,
 execution_ref text not null check(btrim(execution_ref)<>''), intent_id text not null, authorization_ref text not null,
 provider_health_observed_at timestamptz not null, duplicate_side_effect_checked boolean not null check(duplicate_side_effect_checked=true), executed_at timestamptz not null, receipt_refs text[] not null check(cardinality(receipt_refs)>0),
 primary key(owner_id,execution_ref), unique(owner_id,intent_id), unique(owner_id,authorization_ref),
 foreign key(owner_id,intent_id) references public.command_center_finance_action_intent_history(owner_id,intent_id) on delete restrict,
 foreign key(owner_id,authorization_ref) references public.command_center_finance_action_authorization_history(owner_id,authorization_ref) on delete restrict
);
create or replace function public.command_center_reject_finance_action_history_mutation() returns trigger language plpgsql set search_path to 'public' as $$ begin raise exception 'Finance action history is immutable'; end $$;
do $$ declare t text; begin foreach t in array array['command_center_finance_action_intent_history','command_center_finance_action_authorization_history','command_center_finance_action_execution_history'] loop execute format('drop trigger if exists %I on public.%I',t||'_immutable',t); execute format('create trigger %I before update or delete on public.%I for each row execute function public.command_center_reject_finance_action_history_mutation()',t||'_immutable',t); execute format('alter table public.%I enable row level security',t); execute format('revoke all on table public.%I from public,anon,authenticated',t); end loop; end $$;
grant select,insert on table public.command_center_finance_action_intent_history to authenticated; grant select,insert on table public.command_center_finance_action_authorization_history to authenticated; grant select,insert on table public.command_center_finance_action_execution_history to authenticated;
create policy p9_7_intent_owner_select on public.command_center_finance_action_intent_history for select to authenticated using(owner_id=(select auth.uid()) and (select public.is_command_center_authorized()));
create policy p9_7_intent_owner_insert on public.command_center_finance_action_intent_history for insert to authenticated with check(owner_id=(select auth.uid()) and (select public.is_command_center_authorized()) and protected_action_authorized=false);
create policy p9_7_auth_owner_select on public.command_center_finance_action_authorization_history for select to authenticated using(owner_id=(select auth.uid()) and (select public.is_command_center_authorized()));
create policy p9_7_auth_owner_insert on public.command_center_finance_action_authorization_history for insert to authenticated with check(owner_id=(select auth.uid()) and (select public.is_command_center_authorized()) and assurance='fresh_passkey_uv' and one_time=true and consumed=false);
create policy p9_7_exec_owner_select on public.command_center_finance_action_execution_history for select to authenticated using(owner_id=(select auth.uid()) and (select public.is_command_center_authorized()));
create policy p9_7_exec_owner_insert on public.command_center_finance_action_execution_history for insert to authenticated with check(owner_id=(select auth.uid()) and (select public.is_command_center_authorized()) and duplicate_side_effect_checked=true);
