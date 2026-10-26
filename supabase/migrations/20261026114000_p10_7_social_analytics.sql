-- C10 / P10.7 — immutable social analytics/attribution evidence with explicit freshness and confirmed-vs-estimated truth.
create table if not exists public.command_center_social_metric_history (
 owner_id uuid not null references auth.users(id) on delete cascade,
 metric_event_id text not null check(btrim(metric_event_id)<>''), metric_id text not null check(btrim(metric_id)<>''), brand_id text not null check(btrim(brand_id)<>''), account_id text not null check(btrim(account_id)<>''), content_ref text,
 metric text not null check(btrim(metric)<>''), value numeric not null check(value>=0), unit text not null check(btrim(unit)<>''), observed_at timestamptz not null, collected_at timestamptz not null,
 source_refs text[] not null check(cardinality(source_refs)>0), confidence text not null check(confidence in ('confirmed','estimated')), freshness_max_age_ms bigint not null check(freshness_max_age_ms>=0),
 primary key(owner_id,metric_event_id), unique(owner_id,metric_id,observed_at), check(observed_at<=collected_at), check(content_ref is null or btrim(content_ref)<>'')
);
create table if not exists public.command_center_social_attribution_history (
 owner_id uuid not null references auth.users(id) on delete cascade,
 attribution_event_id text not null check(btrim(attribution_event_id)<>''), attribution_id text not null check(btrim(attribution_id)<>''), brand_id text not null check(btrim(brand_id)<>''), account_id text not null check(btrim(account_id)<>''),
 source_metric_ids text[] not null check(cardinality(source_metric_ids)>0), outcome_kind text not null check(outcome_kind in ('traffic','lead','sale','revenue')), outcome_ref text not null check(btrim(outcome_ref)<>''),
 amount numeric, currency text, confidence text not null check(confidence in ('confirmed','estimated')), source_refs text[] not null check(cardinality(source_refs)>0), observed_at timestamptz not null,
 primary key(owner_id,attribution_event_id), unique(owner_id,attribution_id,observed_at),
 check((outcome_kind='revenue' and amount is not null and amount>=0 and currency is not null and btrim(currency)<>'' and confidence='confirmed') or (outcome_kind<>'revenue' and amount is null and currency is null))
);
create or replace function public.command_center_validate_social_attribution_metric_scope() returns trigger language plpgsql set search_path to 'public' as $$
declare source_metric_id text; begin
  foreach source_metric_id in array new.source_metric_ids loop
    if not exists(select 1 from public.command_center_social_metric_history m where m.owner_id=new.owner_id and m.metric_id=source_metric_id and m.brand_id=new.brand_id and m.account_id=new.account_id) then
      raise exception 'Social attribution references unknown scoped metric';
    end if;
  end loop;
  return new;
end $$;
drop trigger if exists command_center_social_attribution_scope_validate on public.command_center_social_attribution_history; create trigger command_center_social_attribution_scope_validate before insert on public.command_center_social_attribution_history for each row execute function public.command_center_validate_social_attribution_metric_scope();
create or replace view public.command_center_social_metrics_current with (security_invoker=true) as select distinct on(owner_id,metric_id) owner_id,metric_event_id,metric_id,brand_id,account_id,content_ref,metric,value,unit,observed_at,collected_at,source_refs,confidence,freshness_max_age_ms from public.command_center_social_metric_history order by owner_id,metric_id,collected_at desc,observed_at desc;
create or replace view public.command_center_social_attributions_current with (security_invoker=true) as select distinct on(owner_id,attribution_id) owner_id,attribution_event_id,attribution_id,brand_id,account_id,source_metric_ids,outcome_kind,outcome_ref,amount,currency,confidence,source_refs,observed_at from public.command_center_social_attribution_history order by owner_id,attribution_id,observed_at desc;
create or replace function public.command_center_reject_social_analytics_evidence_mutation() returns trigger language plpgsql set search_path to 'public' as $$ begin raise exception 'Social analytics evidence is immutable'; end $$;
drop trigger if exists command_center_social_metric_history_immutable on public.command_center_social_metric_history; create trigger command_center_social_metric_history_immutable before update or delete on public.command_center_social_metric_history for each row execute function public.command_center_reject_social_analytics_evidence_mutation();
drop trigger if exists command_center_social_attribution_history_immutable on public.command_center_social_attribution_history; create trigger command_center_social_attribution_history_immutable before update or delete on public.command_center_social_attribution_history for each row execute function public.command_center_reject_social_analytics_evidence_mutation();
alter table public.command_center_social_metric_history enable row level security; alter table public.command_center_social_attribution_history enable row level security;
revoke all on table public.command_center_social_metric_history,public.command_center_social_attribution_history from public,anon,authenticated; grant select,insert on table public.command_center_social_metric_history,public.command_center_social_attribution_history to authenticated; grant select on table public.command_center_social_metrics_current,public.command_center_social_attributions_current to authenticated;
create policy p10_7_social_metric_owner on public.command_center_social_metric_history for all to authenticated using(owner_id=(select auth.uid()) and (select public.is_command_center_authorized())) with check(owner_id=(select auth.uid()) and (select public.is_command_center_authorized()));
create policy p10_7_social_attribution_owner on public.command_center_social_attribution_history for all to authenticated using(owner_id=(select auth.uid()) and (select public.is_command_center_authorized())) with check(owner_id=(select auth.uid()) and (select public.is_command_center_authorized()));
