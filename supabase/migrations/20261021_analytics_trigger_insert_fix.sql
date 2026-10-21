-- Avoid referencing OLD during INSERT trigger execution.
create or replace function command_center_private.analytics_capture_legacy_metric()
returns trigger language plpgsql security definer set search_path='' as $$
declare
  currency_code text;
  should_capture boolean:=false;
begin
  perform command_center_private.analytics_ensure_catalog(new.owner_id,new.key,new.label,new.unit,new.value_numeric is not null);

  if tg_op='INSERT' then
    should_capture:=new.verified;
  elsif tg_op='UPDATE' then
    should_capture:=new.verified and (
      old.verified is distinct from new.verified or
      old.value_numeric is distinct from new.value_numeric or
      old.value_text is distinct from new.value_text or
      old.unit is distinct from new.unit or
      old.label is distinct from new.label or
      old.source is distinct from new.source
    );
  end if;

  if should_capture then
    currency_code:=case when upper(coalesce(new.unit,'')) in ('USD','EUR','GBP','CAD','AUD','JPY') then upper(new.unit) else null end;
    insert into public.analytics_metric_history(owner_id,source_record_id,project_id,metric_key,label,value_numeric,value_text,unit,currency,observed_at,verified,source,metadata)
    values(new.owner_id,new.id,new.project_id,new.key,new.label,new.value_numeric,new.value_text,new.unit,currency_code,coalesce(new.updated_at,now()),true,coalesce(nullif(new.source,''),'metrics:'||new.id::text),jsonb_build_object('legacy_metric_id',new.id,'show_on_card',new.show_on_card))
    on conflict(owner_id,source_record_id,metric_key,observed_at) do nothing;
  end if;
  return new;
end $$;

revoke all on function command_center_private.analytics_capture_legacy_metric() from public,anon,authenticated;
grant execute on function command_center_private.analytics_capture_legacy_metric() to service_role;