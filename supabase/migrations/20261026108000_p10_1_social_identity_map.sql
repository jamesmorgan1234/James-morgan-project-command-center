-- C10 / P10.1 — entity/brand/project/platform account identity map with immutable lineage.
create table if not exists public.command_center_social_identity_map_history (
 owner_id uuid not null references auth.users(id) on delete cascade,
 identity_event_id text not null check(btrim(identity_event_id)<>''), canonical_identity_id text not null check(btrim(canonical_identity_id)<>''),
 entity_id text not null check(btrim(entity_id)<>''), company_id text, brand_id text not null check(btrim(brand_id)<>''), project_id text,
 account_identity_id text not null check(btrim(account_identity_id)<>''), platform text not null check(platform in ('youtube','tiktok','instagram','facebook','pinterest','x','other')),
 platform_identity_id text not null check(btrim(platform_identity_id)<>''), display_name text not null check(btrim(display_name)<>''), aliases text[] not null default '{}'::text[],
 ownership_refs text[] not null check(cardinality(ownership_refs)>0), authorization_scope_refs text[] not null check(cardinality(authorization_scope_refs)>0), lineage_refs text[] not null check(cardinality(lineage_refs)>0),
 observed_at timestamptz not null, version integer not null check(version>0), primary key(owner_id,identity_event_id),
 unique(owner_id,canonical_identity_id,version), unique(owner_id,platform,platform_identity_id,version),
 check(company_id is null or btrim(company_id)<>''), check(project_id is null or btrim(project_id)<>'')
);
create or replace view public.command_center_social_identity_map_current with (security_invoker=true) as
select distinct on(owner_id,canonical_identity_id) owner_id,identity_event_id,canonical_identity_id,entity_id,company_id,brand_id,project_id,account_identity_id,platform,platform_identity_id,display_name,aliases,ownership_refs,authorization_scope_refs,lineage_refs,observed_at,version
from public.command_center_social_identity_map_history order by owner_id,canonical_identity_id,version desc,observed_at desc;
create or replace function public.command_center_reject_social_identity_history_mutation() returns trigger language plpgsql set search_path to 'public' as $$ begin raise exception 'Social identity history is immutable'; end $$;
drop trigger if exists command_center_social_identity_history_immutable on public.command_center_social_identity_map_history;
create trigger command_center_social_identity_history_immutable before update or delete on public.command_center_social_identity_map_history for each row execute function public.command_center_reject_social_identity_history_mutation();
alter table public.command_center_social_identity_map_history enable row level security; revoke all on table public.command_center_social_identity_map_history from public,anon,authenticated; grant select,insert on table public.command_center_social_identity_map_history to authenticated; grant select on table public.command_center_social_identity_map_current to authenticated;
create policy p10_1_social_identity_owner_select on public.command_center_social_identity_map_history for select to authenticated using(owner_id=(select auth.uid()) and (select public.is_command_center_authorized()));
create policy p10_1_social_identity_owner_insert on public.command_center_social_identity_map_history for insert to authenticated with check(owner_id=(select auth.uid()) and (select public.is_command_center_authorized()));
