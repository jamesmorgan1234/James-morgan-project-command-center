-- Preserve canonical C2 database AAL names. AAL2 alone is insufficient: trusted finance passkey capability remains mandatory.
create or replace function public.command_center_finance_row_allowed(p_table text,p_record jsonb,p_write boolean)
returns boolean language plpgsql stable security definer set search_path='' as $$
declare k jsonb; u uuid := auth.uid(); sid text := auth.jwt()->>'session_id';
begin
 if u is null or sid is null or public.is_command_center_authorized() is not true then return false; end if;
 if p_record->>'owner_id' is distinct from u::text then return false; end if;
 select jsonb_object_agg(a.attname,p_record->a.attname) into k
 from pg_catalog.pg_index i join pg_catalog.pg_attribute a on a.attrelid=i.indrelid and a.attnum=any(i.indkey)
 where i.indrelid=pg_catalog.to_regclass('public.'||pg_catalog.quote_ident(p_table)) and i.indisprimary;
 if k is null then return false; end if;
 return exists (
 select 1 from command_center_private.finance_record_scopes r
 join command_center_private.finance_scopes s on s.owner_id=r.owner_id and s.scope_id=r.scope_id
 join command_center_private.finance_session_capabilities c on c.owner_id=r.owner_id and c.scope_id=r.scope_id
 join auth.sessions live on live.id=c.session_id and live.user_id=c.owner_id
 join public.command_center_owner_sessions cs on cs.session_id=c.session_id and cs.owner_id=c.owner_id
 where r.owner_id=u and r.table_name=p_table and r.record_key=k and c.session_id::text=sid
 and p_table=any(c.allowed_tables) and c.context_domain='finance' and c.company_id is not distinct from s.company_id and c.project_id is not distinct from s.project_id
 and c.revoked_at is null and not c.contained and cs.revoked_at is null
 and (live.not_after is null or live.not_after>now()) and cs.assurance in ('aal2','passkey_uv','fresh_passkey_uv')
 and c.verified_at<=now() and c.verified_at>now()-interval '5 minutes' and c.expires_at>now()
 and case when p_write then c.can_write and c.assurance='fresh_passkey_uv' and cs.assurance in ('aal2','fresh_passkey_uv') else c.can_read end);
end $$;
-- Branch-only. Atomic reservation BEFORE any external dispatch; no provider side effect occurs here.
-- Private state is not a backup-restorable source of authorization. Never rewind this ledger.
create table command_center_private.finance_provider_runtime_state (
 owner_id uuid not null references auth.users(id), provider_key text not null,
 health text not null check(health in ('available','degraded','unavailable','compromised')),
 connection_state text not null, consent_state text not null, credential_state text not null,
 capabilities text[] not null, observed_at timestamptz not null,
 primary key(owner_id,provider_key)
);
create table command_center_private.finance_action_attempts (
 owner_id uuid not null references auth.users(id), attempt_id text not null check(btrim(attempt_id)<>''),
 intent_id text not null, authorization_ref text not null, intent_hash text not null,
 provider_key text not null, action_kind text not null, account_refs text[] not null,
 amount_cents bigint, session_id uuid not null, verified_at timestamptz not null,
 reserved_at timestamptz not null default now(), authorization_evidence_refs text[] not null,
 primary key(owner_id,attempt_id), unique(owner_id,intent_id), unique(owner_id,authorization_ref), unique(owner_id,intent_hash)
);
create table command_center_private.finance_action_outcomes (
 owner_id uuid not null, attempt_id text not null, event_id text not null,
 outcome text not null check(outcome in ('failed_before_dispatch','uncertain','partial','confirmed_executed','confirmed_not_executed')),
 receipt_ref text, reconciliation_ref text not null check(btrim(reconciliation_ref)<>''),
 observed_at timestamptz not null default now(), evidence_refs text[] not null check(cardinality(evidence_refs)>0),
 primary key(owner_id,event_id), foreign key(owner_id,attempt_id) references command_center_private.finance_action_attempts(owner_id,attempt_id),
 unique(owner_id,receipt_ref), check(outcome not in ('confirmed_executed','confirmed_not_executed') or nullif(btrim(receipt_ref),'') is not null)
);
revoke all on command_center_private.finance_provider_runtime_state,command_center_private.finance_action_attempts,command_center_private.finance_action_outcomes from public,anon,authenticated;
create trigger finance_attempts_immutable before update or delete on command_center_private.finance_action_attempts for each row execute function public.command_center_reject_finance_action_history_mutation();
create trigger finance_outcomes_immutable before update or delete on command_center_private.finance_action_outcomes for each row execute function public.command_center_reject_finance_action_history_mutation();

create function public.command_center_finance_reserve_attempt(p_intent text,p_authorization text,p_attempt text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid := auth.uid(); i public.command_center_finance_action_intent_history;
 a public.command_center_finance_action_authorization_history; h command_center_private.finance_provider_runtime_state;
 existing command_center_private.finance_action_attempts; required_capability text;
begin
 if u is null or public.is_command_center_authorized() is not true then raise exception 'Finance authorization denied'; end if;
 if nullif(btrim(p_attempt),'') is null then raise exception 'Attempt identity required'; end if;
 select * into i from public.command_center_finance_action_intent_history where owner_id=u and intent_id=p_intent;
 if not found or not public.command_center_finance_row_allowed('command_center_finance_action_intent_history',to_jsonb(i),true) then raise exception 'Finance capability denied'; end if;
 -- Serialize contenders on authoritative intent row, without mutating immutable evidence.
 perform 1 from public.command_center_finance_action_intent_history where owner_id=u and intent_id=p_intent for update;
 select * into existing from command_center_private.finance_action_attempts where owner_id=u and (attempt_id=p_attempt or intent_id=p_intent or authorization_ref=p_authorization or intent_hash=i.intent_hash);
 if found then
  if existing.attempt_id=p_attempt and existing.intent_id=p_intent and existing.authorization_ref=p_authorization then
   return jsonb_build_object('attemptId',existing.attempt_id,'dispatchAllowed',false,'state','reconciliation_required');
  end if;
  raise exception 'Financial replay or uncertain prior attempt blocked';
 end if;
 select * into a from public.command_center_finance_action_authorization_history where owner_id=u and authorization_ref=p_authorization;
 if not found then raise exception 'Exact financial authorization missing'; end if;
 if i.source<>'owner_request' or a.intent_id<>i.intent_id or a.action_kind<>i.action_kind or a.provider_key<>i.provider_key
 or a.account_refs is distinct from i.account_refs or a.amount_cents is distinct from i.amount_cents or a.intent_hash<>i.intent_hash
 or i.exact_owner_authorization_ref<>a.authorization_ref or a.consumed or not a.one_time or a.assurance<>'fresh_passkey_uv'
 or a.authorized_at<i.created_at or a.authorized_at>now() or a.expires_at<=now() or a.authorized_at<now()-interval '5 minutes'
 or cardinality(a.evidence_refs)=0 or exists(select 1 from unnest(a.evidence_refs) r where nullif(btrim(r),'') is null) then raise exception 'Financial authorization stale mismatched or consumed'; end if;
 if cardinality(i.account_refs)<>(select count(distinct r) from unnest(i.account_refs) r) or cardinality(i.account_refs)=0 or exists(select 1 from unnest(i.account_refs) r where nullif(btrim(r),'') is null)
 or (i.action_kind in ('transfer','payment','trade','purchase') and (i.amount_cents is null or i.amount_cents<=0))
 or (i.amount_cents is not null and (i.amount_cents<=0 or i.amount_cents>9007199254740991)) then raise exception 'Invalid exact financial amount/account scope'; end if;
 select * into h from command_center_private.finance_provider_runtime_state where owner_id=u and provider_key=i.provider_key for share;
 if not found or h.health<>'available' or h.connection_state<>'connected' or h.consent_state<>'granted' or h.credential_state<>'healthy'
 or h.observed_at>now() or h.observed_at<now()-interval '30 seconds' then raise exception 'Financial provider state unavailable stale revoked or compromised'; end if;
 required_capability:=case i.action_kind when 'transfer' then 'transfer.write' when 'payment' then 'payment.write' else 'action.'||i.action_kind end;
 if (required_capability=any(h.capabilities)) is not true then raise exception 'Exact provider action capability missing'; end if;
 if exists(select 1 from public.command_center_finance_action_execution_history where owner_id=u and (intent_id=i.intent_id or authorization_ref=a.authorization_ref)) then raise exception 'Prior financial execution blocks replay'; end if;
 insert into command_center_private.finance_action_attempts(owner_id,attempt_id,intent_id,authorization_ref,intent_hash,provider_key,action_kind,account_refs,amount_cents,session_id,verified_at,authorization_evidence_refs)
 values(u,p_attempt,i.intent_id,a.authorization_ref,i.intent_hash,i.provider_key,i.action_kind,i.account_refs,i.amount_cents,(auth.jwt()->>'session_id')::uuid,a.authorized_at,a.evidence_refs);
 -- Not a provider dispatch API. Trusted server must commit before dispatch and never expose this as money movement authority.
 return jsonb_build_object('attemptId',p_attempt,'dispatchAllowed',false,'state','reserved_requires_trusted_dispatch');
end $$;
revoke all on function public.command_center_finance_reserve_attempt(text,text,text) from public,anon;
grant execute on function public.command_center_finance_reserve_attempt(text,text,text) to authenticated;

-- Trusted reconciliation only, unavailable to ordinary clients/providers. Exact receipt envelope required.
create function command_center_private.finance_record_outcome(p_owner uuid,p_attempt text,p_event text,p_outcome text,p_receipt text,p_reconciliation text,p_evidence text[],p_provider text,p_accounts text[],p_amount bigint,p_hash text)
returns void language plpgsql security definer set search_path='' as $$
declare a command_center_private.finance_action_attempts; e command_center_private.finance_action_outcomes;
begin
 if nullif(btrim(p_event),'') is null or nullif(btrim(p_reconciliation),'') is null or coalesce(cardinality(p_evidence),0)=0 or exists(select 1 from unnest(p_evidence) r where nullif(btrim(r),'') is null) then raise exception 'Outcome identity and verified evidence required'; end if;
 select * into a from command_center_private.finance_action_attempts where owner_id=p_owner and attempt_id=p_attempt for update;
 if not found then raise exception 'Unknown financial attempt'; end if;
 if p_provider is distinct from a.provider_key or p_accounts is distinct from a.account_refs or p_amount is distinct from a.amount_cents or p_hash is distinct from a.intent_hash then raise exception 'Provider receipt scope mismatch'; end if;
 select * into e from command_center_private.finance_action_outcomes where owner_id=p_owner and event_id=p_event;
 if found then
  if e.attempt_id=p_attempt and e.outcome=p_outcome and e.receipt_ref is not distinct from p_receipt and e.reconciliation_ref=p_reconciliation and e.evidence_refs=p_evidence then return; end if;
  raise exception 'Outcome event identity collision';
 end if;
 if exists(select 1 from command_center_private.finance_action_outcomes where owner_id=p_owner and attempt_id=p_attempt and outcome in ('confirmed_executed','confirmed_not_executed','failed_before_dispatch')) then raise exception 'Final outcome is immutable; conflicting provider evidence requires incident reconciliation'; end if;
 insert into command_center_private.finance_action_outcomes(owner_id,attempt_id,event_id,outcome,receipt_ref,reconciliation_ref,evidence_refs)
 values(p_owner,p_attempt,p_event,p_outcome,p_receipt,p_reconciliation,p_evidence);
end $$;
revoke all on function command_center_private.finance_record_outcome(uuid,text,text,text,text,text,text[],text,text[],bigint,text) from public,anon,authenticated;
-- Explicit trusted-server permissions only; never issue this role/key to clients, providers or subordinate domains.
-- Classification identity is append-only. Capability/provider updates support immediate revocation/containment.
grant usage on schema command_center_private to service_role;
grant select,insert on command_center_private.finance_scopes,command_center_private.finance_record_scopes to service_role;
grant select,insert,update on command_center_private.finance_session_capabilities,command_center_private.finance_provider_runtime_state to service_role;
grant select on command_center_private.finance_action_attempts,command_center_private.finance_action_outcomes to service_role;
grant execute on function command_center_private.finance_record_outcome(uuid,text,text,text,text,text,text[],text,text[],bigint,text) to service_role;
