alter table public.command_center_social_metric_history alter column value drop not null,
 add column truth_state text not null default 'known' check(truth_state in ('known','unknown','unavailable','partial','conflicting')),
 add column source_kind text not null default 'provider_reported' check(source_kind in ('observed','provider_reported','calculated','inferred')),
 add column reporting_window_start timestamptz,add column reporting_window_end timestamptz,
 add constraint social_metric_truth_value check((truth_state in ('known','partial') and value is not null and value::text not in ('NaN','Infinity','-Infinity') and value>=0) or (truth_state in ('unknown','unavailable','conflicting') and value is null)),
 add constraint social_metric_window check((reporting_window_start is null and reporting_window_end is null) or (reporting_window_start is not null and reporting_window_end is not null and reporting_window_start<=reporting_window_end and reporting_window_end<=observed_at)),
 add constraint social_metric_inference check(source_kind<>'inferred' or confidence='estimated');
create table command_center_private.social_verified_outcomes (
 owner_id uuid not null,outcome_ref text not null,brand_id text not null,account_id text not null,
 amount numeric not null check(amount>=0 and amount::text not in ('NaN','Infinity','-Infinity')),currency text not null check(currency ~ '^[A-Z]{3}$'),
 observed_at timestamptz not null,source_refs text[] not null check(cardinality(source_refs)>0),test_data boolean not null,
 primary key(owner_id,outcome_ref)
);
revoke all on command_center_private.social_verified_outcomes from public,anon,authenticated,service_role;
grant select,insert on command_center_private.social_verified_outcomes to service_role;
create trigger social_outcomes_immutable before update or delete on command_center_private.social_verified_outcomes for each row execute function public.command_center_reject_social_publish_evidence_mutation();
create function public.command_center_guard_social_analytics_truth() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if not exists(select 1 from public.command_center_social_identity_map_history where owner_id=new.owner_id and brand_id=new.brand_id and account_identity_id=new.account_id) then raise exception 'Analytics canonical brand/account mismatch'; end if;
 if tg_table_name='command_center_social_attribution_history' then
 if new.outcome_kind='revenue' and not exists(select 1 from command_center_private.social_verified_outcomes o where o.owner_id=new.owner_id and o.outcome_ref=new.outcome_ref and o.brand_id=new.brand_id and o.account_id=new.account_id and o.amount=new.amount and o.currency=new.currency and not o.test_data and o.observed_at<=new.observed_at) then raise exception 'Confirmed revenue requires independent non-test outcome evidence'; end if;
 end if;
 return new;
end $$;
revoke all on function public.command_center_guard_social_analytics_truth() from public,anon,authenticated;
create trigger social_metric_truth_guard before insert on public.command_center_social_metric_history for each row execute function public.command_center_guard_social_analytics_truth();
create trigger social_attribution_truth_guard before insert on public.command_center_social_attribution_history for each row execute function public.command_center_guard_social_analytics_truth();
revoke insert on public.command_center_social_metric_history,public.command_center_social_attribution_history from authenticated;
grant select,insert on public.command_center_social_metric_history,public.command_center_social_attribution_history to service_role;
alter table public.command_center_social_attribution_history
 add column attribution_confidence text not null default 'estimated' check(attribution_confidence in ('confirmed','estimated')),
 add column attribution_basis text not null default 'unknown' check(attribution_basis in ('unknown','direct_provider','declared_assumption')),
 add column attribution_evidence_refs text[] not null default '{}',add column assumption_refs text[] not null default '{}',
 add constraint social_causal_attribution_evidence check(attribution_confidence<>'confirmed' or (attribution_basis='direct_provider' and cardinality(attribution_evidence_refs)>0)),
 add constraint social_attribution_assumptions check(attribution_basis<>'declared_assumption' or cardinality(assumption_refs)>0);
create or replace view public.command_center_social_metrics_current with (security_invoker=true) as select distinct on(owner_id,metric_id) owner_id,metric_event_id,metric_id,brand_id,account_id,content_ref,metric,value,unit,observed_at,collected_at,source_refs,confidence,freshness_max_age_ms,truth_state,source_kind,reporting_window_start,reporting_window_end from public.command_center_social_metric_history order by owner_id,metric_id,observed_at desc,collected_at desc;
create or replace view public.command_center_social_attributions_current with (security_invoker=true) as select distinct on(owner_id,attribution_id) owner_id,attribution_event_id,attribution_id,brand_id,account_id,source_metric_ids,outcome_kind,outcome_ref,amount,currency,confidence,source_refs,observed_at,attribution_confidence,attribution_basis,attribution_evidence_refs,assumption_refs from public.command_center_social_attribution_history order by owner_id,attribution_id,observed_at desc;
