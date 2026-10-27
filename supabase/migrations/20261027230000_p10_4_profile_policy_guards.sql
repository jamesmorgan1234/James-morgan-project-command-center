alter table public.command_center_social_platform_profile_history add column policy_version text,add column deprecated_at timestamptz;
create function public.command_center_guard_social_profile_policy() returns trigger language plpgsql security definer set search_path='' as $$
declare prior public.command_center_social_platform_profile_history;
begin
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(new.owner_id::text,104));
 if not exists(select 1 from public.command_center_social_platform_adapter_history where owner_id=new.owner_id and adapter_id=new.adapter_id and adapter_version=new.adapter_version and platform=new.platform) then raise exception 'Profile adapter platform mismatch'; end if;
 select * into prior from public.command_center_social_platform_profile_history where owner_id=new.owner_id and profile_key=new.profile_key order by profile_version desc limit 1;
 if found and (new.platform<>prior.platform or new.adapter_id<>prior.adapter_id or new.profile_version<=prior.profile_version or new.observed_at<prior.observed_at) then raise exception 'Profile lineage/version/time mismatch'; end if;
 if new.policy_version is not null and btrim(new.policy_version)='' then raise exception 'Policy version must be explicit'; end if;
 if exists(select 1 from unnest(new.source_refs||new.allowed_media_kinds||new.required_disclosure_tags) r where nullif(btrim(r),'') is null) then raise exception 'Profile evidence/media/disclosures cannot be blank'; end if;
 return new;
end $$;
revoke all on function public.command_center_guard_social_profile_policy() from public,anon,authenticated;
create trigger social_profile_policy_guard before insert on public.command_center_social_platform_profile_history for each row execute function public.command_center_guard_social_profile_policy();
