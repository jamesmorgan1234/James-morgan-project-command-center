-- Old evidence remains unknown rather than silently inferred healthy.
alter table public.command_center_social_connection_history add column credential_state text not null default 'unknown' check(credential_state in ('unknown','healthy','degraded','expired','revoked'));
create function public.command_center_guard_social_connection_identity() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if not exists(select 1 from public.command_center_social_identity_map_history where owner_id=new.owner_id and account_identity_id=new.canonical_account_id and platform_identity_id=new.platform_identity_id) then raise exception 'Social connection canonical account/platform identity mismatch'; end if;
 if exists(select 1 from unnest(new.evidence_refs||new.granted_scopes) r where nullif(btrim(r),'') is null) then raise exception 'Social connection scopes/evidence must be nonblank'; end if;
 if new.observed_at>now()+interval '30 seconds' then raise exception 'Future connection observation'; end if;
 if new.credential_ref ~* '(Bearer[[:space:]]|[?&](token|access_token|secret)=|-----BEGIN .*PRIVATE KEY)' then raise exception 'Credential material forbidden in social metadata'; end if;
 return new;
end $$;
revoke all on function public.command_center_guard_social_connection_identity() from public,anon,authenticated;
create trigger social_connection_identity_guard before insert on public.command_center_social_connection_history for each row execute function public.command_center_guard_social_connection_identity();
create or replace view public.command_center_social_connections_current with (security_invoker=true) as select distinct on(owner_id,connection_id) owner_id,connection_event_id,connection_id,canonical_account_id,platform_identity_id,state,credential_ref,granted_scopes,provider_health,token_present,verified_at,observed_at,required_owner_action_ref,reconnect_ref,evidence_refs,secrets_exposed,protected_action_authorized,credential_state from public.command_center_social_connection_history order by owner_id,connection_id,observed_at desc;
