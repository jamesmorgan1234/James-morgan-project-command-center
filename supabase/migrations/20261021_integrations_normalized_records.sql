-- Normalized non-metric records for email/messages and future provider objects.
-- Social metrics remain in integration_metrics; account records remain source-attributed.

create table if not exists public.integration_records (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  connection_id uuid not null references public.integration_connections(id) on delete cascade,
  project_id text null references public.projects(id) on delete set null,
  source_event_id uuid null references public.integration_source_events(id) on delete set null,
  record_type text not null,
  external_record_id text not null,
  parent_external_id text null,
  title text null,
  summary text null,
  status text null,
  occurred_at timestamptz null,
  data jsonb not null default '{}'::jsonb,
  verified boolean not null default true,
  source text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(owner_id,connection_id,record_type,external_record_id)
);

create index if not exists integration_records_owner_type_time_idx
  on public.integration_records(owner_id,record_type,occurred_at desc);
create index if not exists integration_records_connection_time_idx
  on public.integration_records(connection_id,occurred_at desc);
create index if not exists integration_records_project_idx
  on public.integration_records(project_id,record_type,occurred_at desc)
  where project_id is not null;
create index if not exists integration_records_source_event_idx
  on public.integration_records(source_event_id)
  where source_event_id is not null;

alter table public.integration_records enable row level security;
drop policy if exists integration_records_select_own on public.integration_records;
create policy integration_records_select_own on public.integration_records
for select to authenticated
using (owner_id=(select auth.uid()) and (select public.is_command_center_authorized()));

revoke all on public.integration_records from anon,authenticated;
grant select on public.integration_records to authenticated;

drop trigger if exists integration_records_updated_at on public.integration_records;
create trigger integration_records_updated_at before update on public.integration_records
for each row execute function public.command_center_set_updated_at();

create or replace function command_center_private.normalize_integration_payload(
  p_owner uuid,
  p_connection uuid,
  p_event uuid,
  p_payload jsonb,
  p_observed timestamptz
)
returns integer
language plpgsql
security definer
set search_path=''
as $$
declare
  c public.integration_connections%rowtype;
  n integer:=0;
  v numeric;
  cur text;
  k text;
  item jsonb;
  rid text;
  rtype text;
  occurred timestamptz;
begin
  select * into c from public.integration_connections where id=p_connection and owner_id=p_owner;
  if not found then raise exception 'Connection not found'; end if;

  cur:=upper(coalesce(p_payload->>'currency','USD'));
  foreach k in array array['followers','subscribers','views','likes','comments','shares','watch_time_seconds','revenue'] loop
    begin v:=(p_payload->>k)::numeric; exception when others then v:=null; end;
    if v is not null then
      insert into public.integration_metrics(owner_id,connection_id,project_id,source_event_id,metric_key,value_numeric,unit,currency,observed_at,verified,source,metadata)
      values(
        p_owner,p_connection,c.project_id,p_event,
        case k
          when 'followers' then 'social.followers'
          when 'subscribers' then 'social.subscribers'
          when 'views' then 'content.views'
          when 'likes' then 'content.likes'
          when 'comments' then 'content.comments'
          when 'shares' then 'content.shares'
          when 'watch_time_seconds' then 'content.watch_time_seconds'
          when 'revenue' then 'revenue.reported'
        end,
        v,
        case when k='watch_time_seconds' then 'seconds' when k='revenue' then 'currency' else 'count' end,
        case when k='revenue' then cur else null end,
        p_observed,true,'integration:'||c.provider_key||':'||c.id::text,
        jsonb_build_object('provider_key',c.provider_key,'account_label',c.account_label,'external_account_id',c.external_account_id)
      );
      n:=n+1;
    end if;
  end loop;

  if jsonb_typeof(p_payload->'messages')='array' then
    for item in select value from jsonb_array_elements(p_payload->'messages') loop
      rid:=coalesce(nullif(btrim(item->>'id'),''),nullif(btrim(item->>'message_id'),''));
      if rid is null then continue; end if;
      begin occurred:=coalesce((item->>'received_at')::timestamptz,(item->>'sent_at')::timestamptz,p_observed); exception when others then occurred:=p_observed; end;
      insert into public.integration_records(owner_id,connection_id,project_id,source_event_id,record_type,external_record_id,parent_external_id,title,summary,status,occurred_at,data,verified,source)
      values(
        p_owner,p_connection,c.project_id,p_event,'email.message',rid,
        coalesce(item->>'thread_id',item->>'conversation_id'),
        item->>'subject',coalesce(item->>'snippet',item->>'preview'),
        case when lower(coalesce(item->>'unread','false'))='true' then 'unread' else 'read' end,
        occurred,
        jsonb_strip_nulls(jsonb_build_object(
          'from',item->'from','to',item->'to','cc',item->'cc','bcc',item->'bcc',
          'labels',coalesce(item->'labels',item->'folders'),
          'attachments',item->'attachments',
          'has_full_body',coalesce((item->>'has_full_body')::boolean,false)
        )),
        true,'integration:'||c.provider_key||':'||c.id::text
      )
      on conflict(owner_id,connection_id,record_type,external_record_id) do update set
        project_id=excluded.project_id,
        source_event_id=excluded.source_event_id,
        parent_external_id=excluded.parent_external_id,
        title=excluded.title,
        summary=excluded.summary,
        status=excluded.status,
        occurred_at=excluded.occurred_at,
        data=excluded.data,
        verified=true,
        source=excluded.source,
        updated_at=now();
      n:=n+1;
    end loop;
  end if;

  if jsonb_typeof(p_payload->'records')='array' then
    for item in select value from jsonb_array_elements(p_payload->'records') loop
      rid:=nullif(btrim(item->>'id'),'');
      rtype:=nullif(btrim(item->>'type'),'');
      if rid is null or rtype is null then continue; end if;
      begin occurred:=coalesce((item->>'occurred_at')::timestamptz,p_observed); exception when others then occurred:=p_observed; end;
      insert into public.integration_records(owner_id,connection_id,project_id,source_event_id,record_type,external_record_id,parent_external_id,title,summary,status,occurred_at,data,verified,source)
      values(p_owner,p_connection,c.project_id,p_event,rtype,rid,item->>'parent_id',item->>'title',item->>'summary',item->>'status',occurred,coalesce(item->'data','{}'::jsonb),true,'integration:'||c.provider_key||':'||c.id::text)
      on conflict(owner_id,connection_id,record_type,external_record_id) do update set
        project_id=excluded.project_id,source_event_id=excluded.source_event_id,parent_external_id=excluded.parent_external_id,title=excluded.title,summary=excluded.summary,status=excluded.status,occurred_at=excluded.occurred_at,data=excluded.data,verified=true,source=excluded.source,updated_at=now();
      n:=n+1;
    end loop;
  end if;

  return n;
end $$;

revoke all on function command_center_private.normalize_integration_payload(uuid,uuid,uuid,jsonb,timestamptz) from public,anon,authenticated;

grant execute on function command_center_private.normalize_integration_payload(uuid,uuid,uuid,jsonb,timestamptz) to service_role;

comment on table public.integration_records is 'Normalized source-attributed non-metric provider records such as email messages. Full sensitive bodies are not stored by the generic normalizer; explicit provider/body permissions are required for deeper content ingestion.';
