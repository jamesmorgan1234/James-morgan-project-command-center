-- Command Center Analytics: phases 1-7.
-- Verified source data remains canonical; Analytics adds catalog, history, rollups,
-- trends, goals, and deterministic anomaly findings without fake observations.

create table if not exists public.analytics_metric_catalog (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  metric_key text not null,
  label text not null,
  unit text null,
  value_kind text not null default 'numeric' check (value_kind in ('numeric','text','mixed')),
  rollup_method text not null default 'latest' check (rollup_method in ('sum','average','latest','none')),
  direction text not null default 'neutral' check (direction in ('up','down','neutral')),
  decimals smallint not null default 2 check (decimals between 0 and 6),
  anomaly_threshold_percent numeric null check (anomaly_threshold_percent is null or anomaly_threshold_percent > 0),
  active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(owner_id,metric_key)
);

create table if not exists public.analytics_metric_history (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  source_record_id uuid not null,
  project_id text not null references public.projects(id) on delete cascade,
  metric_key text not null,
  label text not null,
  value_numeric numeric null,
  value_text text null,
  unit text null,
  currency text null,
  observed_at timestamptz not null,
  verified boolean not null default true,
  source text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(owner_id,source_record_id,metric_key,observed_at)
);

create table if not exists public.analytics_goals (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  scope_kind text not null check (scope_kind in ('project','portfolio')),
  project_id text null references public.projects(id) on delete cascade,
  title text not null,
  metric_key text not null,
  unit text not null default '',
  currency text not null default '',
  target_numeric numeric not null,
  comparison text not null default 'gte' check (comparison in ('gte','lte')),
  due_at timestamptz null,
  status text not null default 'active' check (status in ('active','paused','archived')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((scope_kind='project' and project_id is not null) or (scope_kind='portfolio' and project_id is null))
);

create table if not exists public.analytics_anomalies (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  project_id text null references public.projects(id) on delete cascade,
  connection_id uuid null references public.integration_connections(id) on delete set null,
  source_key text not null,
  metric_key text not null,
  unit text null,
  currency text null,
  previous_value numeric not null,
  current_value numeric not null,
  delta_numeric numeric not null,
  delta_percent numeric not null,
  threshold_percent numeric not null,
  observed_at timestamptz not null,
  status text not null default 'new' check (status in ('new','acknowledged','archived')),
  source text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(owner_id,source_key,metric_key,observed_at)
);

create index if not exists analytics_metric_catalog_owner_active_idx on public.analytics_metric_catalog(owner_id,active,metric_key);
create index if not exists analytics_metric_history_owner_project_metric_time_idx on public.analytics_metric_history(owner_id,project_id,metric_key,observed_at desc);
create index if not exists analytics_metric_history_source_record_idx on public.analytics_metric_history(source_record_id);
create index if not exists analytics_goals_owner_status_idx on public.analytics_goals(owner_id,status,created_at desc);
create index if not exists analytics_goals_project_idx on public.analytics_goals(project_id) where project_id is not null;
create index if not exists analytics_anomalies_owner_status_time_idx on public.analytics_anomalies(owner_id,status,observed_at desc);
create index if not exists analytics_anomalies_project_idx on public.analytics_anomalies(project_id) where project_id is not null;
create index if not exists analytics_anomalies_connection_idx on public.analytics_anomalies(connection_id) where connection_id is not null;

alter table public.analytics_metric_catalog enable row level security;
alter table public.analytics_metric_history enable row level security;
alter table public.analytics_goals enable row level security;
alter table public.analytics_anomalies enable row level security;

drop policy if exists analytics_metric_catalog_select_own on public.analytics_metric_catalog;
create policy analytics_metric_catalog_select_own on public.analytics_metric_catalog for select to authenticated
using (owner_id=(select auth.uid()) and (select public.is_command_center_authorized()));
drop policy if exists analytics_metric_catalog_update_own on public.analytics_metric_catalog;
create policy analytics_metric_catalog_update_own on public.analytics_metric_catalog for update to authenticated
using (owner_id=(select auth.uid()) and (select public.is_command_center_authorized()))
with check (owner_id=(select auth.uid()) and (select public.is_command_center_authorized()));

drop policy if exists analytics_metric_history_select_own on public.analytics_metric_history;
create policy analytics_metric_history_select_own on public.analytics_metric_history for select to authenticated
using (owner_id=(select auth.uid()) and (select public.is_command_center_authorized()));

drop policy if exists analytics_goals_select_own on public.analytics_goals;
create policy analytics_goals_select_own on public.analytics_goals for select to authenticated
using (owner_id=(select auth.uid()) and (select public.is_command_center_authorized()));
drop policy if exists analytics_goals_insert_own on public.analytics_goals;
create policy analytics_goals_insert_own on public.analytics_goals for insert to authenticated
with check (owner_id=(select auth.uid()) and (select public.is_command_center_authorized()));
drop policy if exists analytics_goals_update_own on public.analytics_goals;
create policy analytics_goals_update_own on public.analytics_goals for update to authenticated
using (owner_id=(select auth.uid()) and (select public.is_command_center_authorized()))
with check (owner_id=(select auth.uid()) and (select public.is_command_center_authorized()));
drop policy if exists analytics_goals_delete_own on public.analytics_goals;
create policy analytics_goals_delete_own on public.analytics_goals for delete to authenticated
using (owner_id=(select auth.uid()) and (select public.is_command_center_authorized()));

drop policy if exists analytics_anomalies_select_own on public.analytics_anomalies;
create policy analytics_anomalies_select_own on public.analytics_anomalies for select to authenticated
using (owner_id=(select auth.uid()) and (select public.is_command_center_authorized()));
drop policy if exists analytics_anomalies_update_own on public.analytics_anomalies;
create policy analytics_anomalies_update_own on public.analytics_anomalies for update to authenticated
using (owner_id=(select auth.uid()) and (select public.is_command_center_authorized()))
with check (owner_id=(select auth.uid()) and (select public.is_command_center_authorized()));

revoke all on public.analytics_metric_catalog from anon,authenticated;
revoke all on public.analytics_metric_history from anon,authenticated;
revoke all on public.analytics_goals from anon,authenticated;
revoke all on public.analytics_anomalies from anon,authenticated;
grant select,update on public.analytics_metric_catalog to authenticated;
grant select on public.analytics_metric_history to authenticated;
grant select,insert,update,delete on public.analytics_goals to authenticated;
grant select,update on public.analytics_anomalies to authenticated;
grant all on public.analytics_metric_catalog,public.analytics_metric_history,public.analytics_goals,public.analytics_anomalies to service_role;

drop trigger if exists analytics_metric_catalog_updated_at on public.analytics_metric_catalog;
create trigger analytics_metric_catalog_updated_at before update on public.analytics_metric_catalog for each row execute function public.command_center_set_updated_at();
drop trigger if exists analytics_goals_updated_at on public.analytics_goals;
create trigger analytics_goals_updated_at before update on public.analytics_goals for each row execute function public.command_center_set_updated_at();
drop trigger if exists analytics_anomalies_updated_at on public.analytics_anomalies;
create trigger analytics_anomalies_updated_at before update on public.analytics_anomalies for each row execute function public.command_center_set_updated_at();

create schema if not exists command_center_private;
revoke all on schema command_center_private from public,anon,authenticated;

create or replace function command_center_private.analytics_rollup_method(p_key text,p_unit text,p_numeric boolean)
returns text language plpgsql immutable set search_path='' as $$
declare k text:=lower(coalesce(p_key,'')); u text:=lower(coalesce(p_unit,''));
begin
  if not p_numeric then return 'latest'; end if;
  if u in ('percent','percentage') or k like '%percent%' then return 'latest'; end if;
  if k in ('social.followers','social.subscribers','content.views','content.likes','content.comments','content.shares','content.watch_time_seconds','revenue.reported','verified_revenue_usd') then return 'sum'; end if;
  if k like '%revenue%' or k like '%royalt%' or k like '%mrr%' then return 'sum'; end if;
  if u in ('count','followers','subscribers','views','likes','comments','shares','seconds','customers','books','products','titles','sales','jobs','offers') then return 'sum'; end if;
  return 'latest';
end $$;

create or replace function command_center_private.analytics_ensure_catalog(p_owner uuid,p_key text,p_label text,p_unit text,p_numeric boolean)
returns void language plpgsql security definer set search_path='' as $$
declare kind text:=case when p_numeric then 'numeric' else 'text' end; rollup text;
begin
  if p_owner is null or nullif(btrim(p_key),'') is null then return; end if;
  rollup:=command_center_private.analytics_rollup_method(p_key,p_unit,p_numeric);
  insert into public.analytics_metric_catalog(owner_id,metric_key,label,unit,value_kind,rollup_method,direction,decimals,metadata)
  values(p_owner,btrim(p_key),coalesce(nullif(btrim(p_label),''),initcap(replace(replace(p_key,'.',' '),'_',' '))),nullif(btrim(coalesce(p_unit,'')),''),kind,rollup,'neutral',case when lower(coalesce(p_unit,'')) in ('usd','eur','gbp','cad','aud') or lower(p_key) like '%revenue%' or lower(p_key) like '%royalt%' or lower(p_key) like '%mrr%' then 2 else 1 end,jsonb_build_object('discovered_from','source_data'))
  on conflict(owner_id,metric_key) do update set
    unit=coalesce(public.analytics_metric_catalog.unit,excluded.unit),
    value_kind=case when public.analytics_metric_catalog.value_kind=excluded.value_kind then public.analytics_metric_catalog.value_kind else 'mixed' end,
    metadata=public.analytics_metric_catalog.metadata||jsonb_build_object('last_discovered_at',now());
end $$;

create or replace function command_center_private.analytics_capture_legacy_metric()
returns trigger language plpgsql security definer set search_path='' as $$
declare currency_code text;
begin
  perform command_center_private.analytics_ensure_catalog(new.owner_id,new.key,new.label,new.unit,new.value_numeric is not null);
  if new.verified and (tg_op='INSERT' or old.verified is distinct from new.verified or old.value_numeric is distinct from new.value_numeric or old.value_text is distinct from new.value_text or old.unit is distinct from new.unit or old.label is distinct from new.label or old.source is distinct from new.source) then
    currency_code:=case when upper(coalesce(new.unit,'')) in ('USD','EUR','GBP','CAD','AUD','JPY') then upper(new.unit) else null end;
    insert into public.analytics_metric_history(owner_id,source_record_id,project_id,metric_key,label,value_numeric,value_text,unit,currency,observed_at,verified,source,metadata)
    values(new.owner_id,new.id,new.project_id,new.key,new.label,new.value_numeric,new.value_text,new.unit,currency_code,coalesce(new.updated_at,now()),true,coalesce(nullif(new.source,''),'metrics:'||new.id::text),jsonb_build_object('legacy_metric_id',new.id,'show_on_card',new.show_on_card))
    on conflict(owner_id,source_record_id,metric_key,observed_at) do nothing;
  end if;
  return new;
end $$;

create or replace function command_center_private.analytics_catalog_integration_metric()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  perform command_center_private.analytics_ensure_catalog(new.owner_id,new.metric_key,initcap(replace(replace(new.metric_key,'.',' '),'_',' ')),new.unit,new.value_numeric is not null);
  return new;
end $$;

revoke all on function command_center_private.analytics_rollup_method(text,text,boolean) from public,anon,authenticated;
revoke all on function command_center_private.analytics_ensure_catalog(uuid,text,text,text,boolean) from public,anon,authenticated;
revoke all on function command_center_private.analytics_capture_legacy_metric() from public,anon,authenticated;
revoke all on function command_center_private.analytics_catalog_integration_metric() from public,anon,authenticated;
grant execute on function command_center_private.analytics_rollup_method(text,text,boolean) to service_role;
grant execute on function command_center_private.analytics_ensure_catalog(uuid,text,text,text,boolean) to service_role;
grant execute on function command_center_private.analytics_capture_legacy_metric() to service_role;
grant execute on function command_center_private.analytics_catalog_integration_metric() to service_role;

insert into public.analytics_metric_catalog(owner_id,metric_key,label,unit,value_kind,rollup_method,direction,decimals,metadata)
select distinct on(m.owner_id,m.key)
  m.owner_id,m.key,m.label,m.unit,
  case when m.value_numeric is not null then 'numeric' else 'text' end,
  command_center_private.analytics_rollup_method(m.key,m.unit,m.value_numeric is not null),
  'neutral',
  case when lower(coalesce(m.unit,'')) in ('usd','eur','gbp','cad','aud') or lower(m.key) like '%revenue%' or lower(m.key) like '%royalt%' or lower(m.key) like '%mrr%' then 2 else 1 end,
  jsonb_build_object('discovered_from','metrics_backfill')
from public.metrics m
order by m.owner_id,m.key,m.updated_at desc
on conflict(owner_id,metric_key) do nothing;

insert into public.analytics_metric_catalog(owner_id,metric_key,label,unit,value_kind,rollup_method,direction,decimals,metadata)
select distinct on(m.owner_id,m.metric_key)
  m.owner_id,m.metric_key,initcap(replace(replace(m.metric_key,'.',' '),'_',' ')),m.unit,
  case when m.value_numeric is not null then 'numeric' else 'text' end,
  command_center_private.analytics_rollup_method(m.metric_key,m.unit,m.value_numeric is not null),
  'neutral',
  case when m.currency is not null or lower(m.metric_key) like '%revenue%' then 2 else 1 end,
  jsonb_build_object('discovered_from','integration_backfill')
from public.integration_metrics m
order by m.owner_id,m.metric_key,m.observed_at desc
on conflict(owner_id,metric_key) do nothing;

insert into public.analytics_metric_history(owner_id,source_record_id,project_id,metric_key,label,value_numeric,value_text,unit,currency,observed_at,verified,source,metadata)
select m.owner_id,m.id,m.project_id,m.key,m.label,m.value_numeric,m.value_text,m.unit,
  case when upper(coalesce(m.unit,'')) in ('USD','EUR','GBP','CAD','AUD','JPY') then upper(m.unit) else null end,
  coalesce(m.updated_at,m.created_at),true,coalesce(nullif(m.source,''),'metrics:'||m.id::text),jsonb_build_object('legacy_metric_id',m.id,'show_on_card',m.show_on_card,'backfilled',true)
from public.metrics m where m.verified
on conflict(owner_id,source_record_id,metric_key,observed_at) do nothing;

drop trigger if exists analytics_capture_legacy_metric on public.metrics;
create trigger analytics_capture_legacy_metric after insert or update of key,label,value_numeric,value_text,unit,verified,source on public.metrics for each row execute function command_center_private.analytics_capture_legacy_metric();
drop trigger if exists analytics_catalog_integration_metric on public.integration_metrics;
create trigger analytics_catalog_integration_metric after insert or update of metric_key,value_numeric,value_text,unit,currency,verified on public.integration_metrics for each row execute function command_center_private.analytics_catalog_integration_metric();

create or replace view public.analytics_metric_series with (security_invoker=true) as
select h.owner_id,h.project_id,null::uuid as connection_id,'legacy'::text as source_kind,'legacy:'||h.source_record_id::text as source_key,h.metric_key,h.label,h.value_numeric,h.value_text,h.unit,h.currency,h.observed_at,h.verified,h.source,h.metadata,h.created_at
from public.analytics_metric_history h
union all
select m.owner_id,m.project_id,m.connection_id,'integration'::text as source_kind,'integration:'||m.connection_id::text as source_key,m.metric_key,initcap(replace(replace(m.metric_key,'.',' '),'_',' ')) as label,m.value_numeric,m.value_text,m.unit,m.currency,m.observed_at,m.verified,m.source,m.metadata,m.created_at
from public.integration_metrics m;

create or replace view public.analytics_latest_by_source with (security_invoker=true) as
select distinct on(owner_id,source_key,metric_key,coalesce(unit,''),coalesce(currency,''))
  owner_id,project_id,connection_id,source_kind,source_key,metric_key,label,value_numeric,value_text,unit,currency,observed_at,source,metadata
from public.analytics_metric_series
where verified
order by owner_id,source_key,metric_key,coalesce(unit,''),coalesce(currency,''),observed_at desc,created_at desc;

create or replace view public.analytics_project_kpis with (security_invoker=true) as
select s.owner_id,s.project_id,s.metric_key,max(c.label) as label,s.unit,s.currency,max(c.rollup_method) as rollup_method,
  case max(c.rollup_method)
    when 'sum' then sum(s.value_numeric)
    when 'average' then avg(s.value_numeric)
    when 'latest' then (array_agg(s.value_numeric order by s.observed_at desc) filter(where s.value_numeric is not null))[1]
    when 'none' then case when count(s.value_numeric)=1 then max(s.value_numeric) else null end
  end as value_numeric,
  case max(c.rollup_method)
    when 'latest' then (array_agg(s.value_text order by s.observed_at desc) filter(where s.value_text is not null))[1]
    when 'none' then case when count(s.value_text)=1 then max(s.value_text) else null end
    else null
  end as value_text,
  count(*)::integer as source_count,max(s.observed_at) as observed_at,true as verified
from public.analytics_latest_by_source s
join public.analytics_metric_catalog c on c.owner_id=s.owner_id and c.metric_key=s.metric_key and c.active
where s.project_id is not null
group by s.owner_id,s.project_id,s.metric_key,s.unit,s.currency;

create or replace view public.analytics_portfolio_rollups with (security_invoker=true) as
select s.owner_id,s.metric_key,max(c.label) as label,s.unit,s.currency,max(c.rollup_method) as rollup_method,
  case max(c.rollup_method)
    when 'sum' then sum(s.value_numeric)
    when 'average' then avg(s.value_numeric)
    when 'latest' then (array_agg(s.value_numeric order by s.observed_at desc) filter(where s.value_numeric is not null))[1]
    when 'none' then case when count(s.value_numeric)=1 then max(s.value_numeric) else null end
  end as value_numeric,
  case max(c.rollup_method)
    when 'latest' then (array_agg(s.value_text order by s.observed_at desc) filter(where s.value_text is not null))[1]
    when 'none' then case when count(s.value_text)=1 then max(s.value_text) else null end
    else null
  end as value_text,
  count(*)::integer as source_count,count(distinct s.project_id)::integer as project_count,max(s.observed_at) as observed_at,true as verified
from public.analytics_latest_by_source s
join public.analytics_metric_catalog c on c.owner_id=s.owner_id and c.metric_key=s.metric_key and c.active
group by s.owner_id,s.metric_key,s.unit,s.currency;

create or replace view public.analytics_goal_progress with (security_invoker=true) as
select g.id,g.owner_id,g.scope_kind,g.project_id,g.title,g.metric_key,g.unit,g.currency,g.target_numeric,g.comparison,g.due_at,g.status,
  p.value_numeric as current_value,p.observed_at as current_observed_at,
  case when p.value_numeric is null then null when g.comparison='gte' then p.value_numeric>=g.target_numeric else p.value_numeric<=g.target_numeric end as achieved,
  case
    when p.value_numeric is null then null
    when g.comparison='gte' and g.target_numeric<>0 then trunc((p.value_numeric/g.target_numeric)*100,1)
    when g.comparison='lte' and p.value_numeric<=g.target_numeric then 100::numeric
    when g.comparison='lte' and p.value_numeric<>0 then trunc((g.target_numeric/p.value_numeric)*100,1)
    else null
  end as progress_percent,
  g.created_at,g.updated_at
from public.analytics_goals g
left join public.analytics_project_kpis p on g.scope_kind='project' and p.owner_id=g.owner_id and p.project_id=g.project_id and p.metric_key=g.metric_key and coalesce(p.unit,'')=g.unit and coalesce(p.currency,'')=g.currency
where g.scope_kind='project'
union all
select g.id,g.owner_id,g.scope_kind,g.project_id,g.title,g.metric_key,g.unit,g.currency,g.target_numeric,g.comparison,g.due_at,g.status,
  p.value_numeric as current_value,p.observed_at as current_observed_at,
  case when p.value_numeric is null then null when g.comparison='gte' then p.value_numeric>=g.target_numeric else p.value_numeric<=g.target_numeric end as achieved,
  case
    when p.value_numeric is null then null
    when g.comparison='gte' and g.target_numeric<>0 then trunc((p.value_numeric/g.target_numeric)*100,1)
    when g.comparison='lte' and p.value_numeric<=g.target_numeric then 100::numeric
    when g.comparison='lte' and p.value_numeric<>0 then trunc((g.target_numeric/p.value_numeric)*100,1)
    else null
  end as progress_percent,
  g.created_at,g.updated_at
from public.analytics_goals g
left join public.analytics_portfolio_rollups p on g.scope_kind='portfolio' and p.owner_id=g.owner_id and p.metric_key=g.metric_key and coalesce(p.unit,'')=g.unit and coalesce(p.currency,'')=g.currency
where g.scope_kind='portfolio';

revoke all on public.analytics_metric_series,public.analytics_latest_by_source,public.analytics_project_kpis,public.analytics_portfolio_rollups,public.analytics_goal_progress from anon,authenticated;
grant select on public.analytics_metric_series,public.analytics_latest_by_source,public.analytics_project_kpis,public.analytics_portfolio_rollups,public.analytics_goal_progress to authenticated,service_role;

create or replace function public.command_center_analytics_scan_anomalies(p_project_id text default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=(select auth.uid()); inserted_count integer:=0;
begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  with ranked as (
    select s.*,c.anomaly_threshold_percent,
      row_number() over(partition by s.owner_id,s.source_key,s.metric_key,coalesce(s.unit,''),coalesce(s.currency,'') order by s.observed_at desc,s.created_at desc) as rn
    from public.analytics_metric_series s
    join public.analytics_metric_catalog c on c.owner_id=s.owner_id and c.metric_key=s.metric_key and c.active
    where s.owner_id=u and s.verified and s.value_numeric is not null and c.anomaly_threshold_percent is not null and c.anomaly_threshold_percent>0
      and (p_project_id is null or s.project_id=p_project_id)
  ), pairs as (
    select a.owner_id,a.project_id,a.connection_id,a.source_key,a.metric_key,a.unit,a.currency,a.value_numeric as current_value,b.value_numeric as previous_value,a.observed_at,a.source,a.anomaly_threshold_percent
    from ranked a join ranked b on b.owner_id=a.owner_id and b.source_key=a.source_key and b.metric_key=a.metric_key and coalesce(b.unit,'')=coalesce(a.unit,'') and coalesce(b.currency,'')=coalesce(a.currency,'') and b.rn=2
    where a.rn=1 and b.value_numeric<>0
  ), candidates as (
    select p.*,(p.current_value-p.previous_value) as delta_numeric,trunc(((p.current_value-p.previous_value)/abs(p.previous_value))*100,4) as delta_percent
    from pairs p
  )
  insert into public.analytics_anomalies(owner_id,project_id,connection_id,source_key,metric_key,unit,currency,previous_value,current_value,delta_numeric,delta_percent,threshold_percent,observed_at,status,source,metadata)
  select owner_id,project_id,connection_id,source_key,metric_key,unit,currency,previous_value,current_value,delta_numeric,delta_percent,anomaly_threshold_percent,observed_at,'new',source,jsonb_build_object('detector','consecutive_verified_percent_change')
  from candidates where abs(delta_percent)>=anomaly_threshold_percent
  on conflict(owner_id,source_key,metric_key,observed_at) do nothing;
  get diagnostics inserted_count=row_count;
  return jsonb_build_object('ok',true,'inserted',inserted_count);
end $$;

revoke all on function public.command_center_analytics_scan_anomalies(text) from public,anon,authenticated;
grant execute on function public.command_center_analytics_scan_anomalies(text) to authenticated,service_role;

comment on table public.analytics_metric_catalog is 'Owner-scoped Analytics metric definitions. Catalog rows describe real source metrics and do not create metric observations.';
comment on table public.analytics_metric_history is 'Append-only verified history snapshots for the current-state legacy metrics table.';
comment on table public.analytics_goals is 'Owner-controlled project or portfolio metric targets.';
comment on table public.analytics_anomalies is 'Deterministic review signals created only from verified consecutive observations with an explicit catalog threshold.';
comment on view public.analytics_metric_series is 'Security-invoker union of legacy metric history and provider Integration metric history.';
comment on view public.analytics_project_kpis is 'Latest verified project KPIs aggregated only according to owner metric-catalog rollup rules.';
comment on view public.analytics_portfolio_rollups is 'Portfolio-level verified rollups grouped by compatible metric key, unit, and currency.';