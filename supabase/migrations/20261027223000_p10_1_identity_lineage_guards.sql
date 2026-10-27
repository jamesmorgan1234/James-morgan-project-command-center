-- Branch-only: validate existing history before installing guards; never rewrite ambiguous identity.
do $$ begin
 if exists(select 1 from public.command_center_social_identity_map_history group by owner_id,canonical_identity_id having count(distinct jsonb_build_array(entity_id,company_id,brand_id,project_id,account_identity_id,platform,platform_identity_id))>1)
 or exists(select 1 from public.command_center_social_identity_map_history group by owner_id,platform,platform_identity_id having count(distinct canonical_identity_id)>1)
 or exists(select 1 from public.command_center_social_identity_map_history group by owner_id,account_identity_id having count(distinct canonical_identity_id)>1)
 then raise exception 'Ambiguous existing social identity requires explicit reconciliation'; end if;
end $$;
create function public.command_center_guard_social_identity_lineage() returns trigger language plpgsql security definer set search_path='' as $$
declare prior public.command_center_social_identity_map_history;
begin
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(new.owner_id::text,101));
 if cardinality(new.ownership_refs)=0 or cardinality(new.authorization_scope_refs)=0 or cardinality(new.lineage_refs)=0
 or exists(select 1 from unnest(new.ownership_refs||new.authorization_scope_refs||new.lineage_refs||new.aliases) r where nullif(btrim(r),'') is null) then raise exception 'Social identity evidence must be nonblank'; end if;
 if exists(select 1 from public.command_center_social_identity_map_history where owner_id=new.owner_id and canonical_identity_id<>new.canonical_identity_id and ((platform=new.platform and platform_identity_id=new.platform_identity_id) or account_identity_id=new.account_identity_id)) then raise exception 'Social account already bound to another canonical identity'; end if;
 select * into prior from public.command_center_social_identity_map_history where owner_id=new.owner_id and canonical_identity_id=new.canonical_identity_id order by version desc limit 1;
 if found then
 if jsonb_build_array(new.entity_id,new.company_id,new.brand_id,new.project_id,new.account_identity_id,new.platform,new.platform_identity_id) is distinct from jsonb_build_array(prior.entity_id,prior.company_id,prior.brand_id,prior.project_id,prior.account_identity_id,prior.platform,prior.platform_identity_id) then raise exception 'Canonical social identity cannot be substituted'; end if;
 if new.version<>prior.version+1 or new.observed_at<prior.observed_at then raise exception 'Social identity version/time must advance'; end if;
 if not prior.lineage_refs<@new.lineage_refs or not prior.aliases<@new.aliases or (new.display_name<>prior.display_name and not prior.display_name=any(new.aliases)) then raise exception 'Historical social identity lineage/aliases must be retained'; end if;
 elsif new.version<>1 then raise exception 'Initial social identity version must be one'; end if;
 return new;
end $$;
revoke all on function public.command_center_guard_social_identity_lineage() from public,anon,authenticated;
create trigger social_identity_lineage_guard before insert on public.command_center_social_identity_map_history for each row execute function public.command_center_guard_social_identity_lineage();
