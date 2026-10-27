-- Server-provisioned per-session/account capabilities; no owner-wide implicit social access.
create table command_center_private.social_account_capabilities (
 owner_id uuid not null references auth.users(id),session_id uuid not null,account_id text not null,brand_id text not null,company_id text,project_id text,
 assurance text not null check(assurance in ('passkey_uv','fresh_passkey_uv')),verified_at timestamptz not null,expires_at timestamptz not null,
 can_read boolean not null default false,can_write boolean not null default false,allowed_tables text[] not null default '{}',revoked_at timestamptz,contained boolean not null default false,
 primary key(owner_id,session_id,account_id),check(verified_at<expires_at)
);
revoke all on command_center_private.social_account_capabilities from public,anon,authenticated;
grant select,insert,update on command_center_private.social_account_capabilities to service_role;
create function public.command_center_social_row_allowed(p_table text,p_record jsonb,p_write boolean)
returns boolean language plpgsql stable security definer set search_path='' as $$
declare u uuid:=auth.uid();sid text:=auth.jwt()->>'session_id';account text;identity public.command_center_social_identity_map_history;
begin
 if u is null or sid is null or public.is_command_center_authorized() is not true or p_record->>'owner_id' is distinct from u::text then return false;end if;
 account:=coalesce(p_record->>'account_id',p_record->>'canonical_account_id',p_record->>'account_identity_id',p_record->>'intended_account_id');
 if account is null and p_record->>'intent_id' is not null then select account_id into account from public.command_center_social_publish_intents where owner_id=u and intent_id=p_record->>'intent_id';end if;
 if account is null and p_record->>'draft_event_id' is not null then select intended_account_id into account from public.command_center_social_draft_revision_history where owner_id=u and draft_event_id=p_record->>'draft_event_id';end if;
 if account is null then return false;end if;
 select * into identity from public.command_center_social_identity_map_history where owner_id=u and account_identity_id=account order by version desc limit 1;
 if not found then return false;end if;
 if p_record ? 'brand_id' and p_record->>'brand_id' is distinct from identity.brand_id then return false;end if;
 if p_record ? 'company_id' and p_record->>'company_id' is distinct from identity.company_id then return false;end if;
 if p_record ? 'project_id' and p_record->>'project_id' is distinct from identity.project_id then return false;end if;
 return exists(select 1 from command_center_private.social_account_capabilities c join auth.sessions live on live.id=c.session_id and live.user_id=c.owner_id join public.command_center_owner_sessions cs on cs.session_id=c.session_id and cs.owner_id=c.owner_id
 where c.owner_id=u and c.session_id::text=sid and c.account_id=account and c.brand_id=identity.brand_id and c.company_id is not distinct from identity.company_id and c.project_id is not distinct from identity.project_id
 and p_table=any(c.allowed_tables) and c.revoked_at is null and not c.contained and c.verified_at<=now() and c.verified_at>now()-interval '5 minutes' and c.expires_at>now()
 and cs.revoked_at is null and cs.assurance in ('aal2','passkey_uv','fresh_passkey_uv') and (live.not_after is null or live.not_after>now())
 and case when p_write then c.can_write and c.assurance='fresh_passkey_uv' and cs.assurance in ('aal2','fresh_passkey_uv') else c.can_read end);
end $$;
revoke all on function public.command_center_social_row_allowed(text,jsonb,boolean) from public,anon;
grant execute on function public.command_center_social_row_allowed(text,jsonb,boolean) to authenticated;
do $$declare t text;begin
 for t in select c.relname from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r' and c.relname like 'command_center_social_%' loop
 execute format('create policy social_capability_read on public.%I as restrictive for select to authenticated using(public.command_center_social_row_allowed(%L,to_jsonb(%I),false))',t,t,t);
 execute format('create policy social_capability_insert on public.%I as restrictive for insert to authenticated with check(public.command_center_social_row_allowed(%L,to_jsonb(%I),true))',t,t,t);
 execute format('revoke update,delete,truncate on public.%I from authenticated',t);
 end loop;
end $$;
-- Paid assessments cannot be minted into spend permission by application metadata.
revoke insert on public.command_center_social_paid_action_assessment_history from authenticated;
grant select,insert on public.command_center_social_paid_action_assessment_history to service_role;
-- Retain per-revision measured attachment metadata used by sealed-content/profile checks.
-- Missing legacy measurements stay unknown; never invent them or reuse approval for changed bytes.
alter table public.command_center_social_draft_asset_bindings
 add column media_kind text check(media_kind is null or btrim(media_kind)<>''),
 add column width integer check(width is null or width>0),add column height integer check(height is null or height>0),
 add column duration_seconds numeric check(duration_seconds is null or (duration_seconds>=0 and duration_seconds::text not in ('NaN','Infinity','-Infinity')));
