-- C9 / P9.8 — financial-grade identity/isolation, context minimization, audit and incident containment.
create table if not exists public.command_center_finance_access_audit_history (
 owner_id uuid not null references auth.users(id) on delete cascade,
 access_event_id text not null check(btrim(access_event_id)<>''), subject_owner_id uuid not null,
 context_domain text not null check(context_domain='finance'), company_id text, resource_company_id text,
 assurance text not null, scopes text[] not null, requested_data_classes text[] not null, released_data_classes text[] not null,
 incident_state text not null check(incident_state in ('normal','non_financial_compromise','finance_containment')),
 audit_ref text not null check(btrim(audit_ref)<>''), secrets_exposed boolean not null default false check(secrets_exposed=false),
 credential_refs_exposed text[] not null default '{}'::text[] check(cardinality(credential_refs_exposed)=0),
 protected_action_authorized boolean not null default false check(protected_action_authorized=false), observed_at timestamptz not null,
 primary key(owner_id,access_event_id), check(owner_id=subject_owner_id), check(coalesce(company_id,'')=coalesce(resource_company_id,''))
);
create table if not exists public.command_center_finance_incident_containment_history (
 owner_id uuid not null references auth.users(id) on delete cascade, containment_event_id text not null check(btrim(containment_event_id)<>''),
 incident_state text not null check(incident_state in ('non_financial_compromise','finance_containment')), source_domain text not null check(btrim(source_domain)<>''),
 blocked_finance_access boolean not null default true check(blocked_finance_access=true), evidence_refs text[] not null check(cardinality(evidence_refs)>0), observed_at timestamptz not null,
 primary key(owner_id,containment_event_id)
);
create or replace function public.command_center_reject_finance_access_audit_mutation() returns trigger language plpgsql set search_path to 'public' as $$ begin raise exception 'Finance access audit history is immutable'; end $$;
do $$ declare t text; begin foreach t in array array['command_center_finance_access_audit_history','command_center_finance_incident_containment_history'] loop execute format('drop trigger if exists %I on public.%I',t||'_immutable',t); execute format('create trigger %I before update or delete on public.%I for each row execute function public.command_center_reject_finance_access_audit_mutation()',t||'_immutable',t); execute format('alter table public.%I enable row level security',t); execute format('revoke all on table public.%I from public,anon,authenticated',t); end loop; end $$;
grant select,insert on table public.command_center_finance_access_audit_history to authenticated; grant select,insert on table public.command_center_finance_incident_containment_history to authenticated;
create policy p9_8_access_owner_select on public.command_center_finance_access_audit_history for select to authenticated using(owner_id=(select auth.uid()) and (select public.is_command_center_authorized()));
create policy p9_8_access_owner_insert on public.command_center_finance_access_audit_history for insert to authenticated with check(owner_id=(select auth.uid()) and owner_id=subject_owner_id and (select public.is_command_center_authorized()) and context_domain='finance' and secrets_exposed=false and cardinality(credential_refs_exposed)=0 and protected_action_authorized=false);
create policy p9_8_containment_owner_select on public.command_center_finance_incident_containment_history for select to authenticated using(owner_id=(select auth.uid()) and (select public.is_command_center_authorized()));
create policy p9_8_containment_owner_insert on public.command_center_finance_incident_containment_history for insert to authenticated with check(owner_id=(select auth.uid()) and (select public.is_command_center_authorized()) and blocked_finance_access=true);
