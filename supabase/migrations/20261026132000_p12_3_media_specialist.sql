-- C12 / P12.3 — media specialist source rights/provenance and protected workflow evidence.
create table if not exists public.command_center_media_source_history (
 owner_id uuid not null references auth.users(id) on delete cascade,
 source_event_id text not null check(btrim(source_event_id)<>''), source_id text not null check(btrim(source_id)<>''), source_ref text not null check(btrim(source_ref)<>''), content_ref text not null check(btrim(content_ref)<>''), rights_refs text[] not null check(cardinality(rights_refs)>0), provenance_refs text[] not null check(cardinality(provenance_refs)>0), truth_owner text not null default 'specialist:media' check(truth_owner='specialist:media'), observed_at timestamptz not null,
 primary key(owner_id,source_event_id), unique(owner_id,source_id,observed_at)
);
create table if not exists public.command_center_media_workflow_route_history (
 owner_id uuid not null references auth.users(id) on delete cascade,
 route_event_id text not null check(btrim(route_event_id)<>''), stage text not null check(stage in ('research','production','publishing','analytics','revenue')), capability_key text not null check(btrim(capability_key)<>''), provider_adapter_key text, protected_action boolean not null, truth_owner text not null default 'specialist:media' check(truth_owner='specialist:media'), observed_at timestamptz not null,
 primary key(owner_id,route_event_id), check(provider_adapter_key is null or btrim(provider_adapter_key)<>'')
);
create table if not exists public.command_center_media_publish_authorization_history (
 owner_id uuid not null references auth.users(id) on delete cascade,
 publish_event_id text not null check(btrim(publish_event_id)<>''),
 source_id text not null check(btrim(source_id)<>''),
 content_ref text not null check(btrim(content_ref)<>''),
 authorization_evidence_id text not null check(authorization_evidence_id ~ '^evd_[a-z0-9]+(?:-[a-z0-9]+)*$'),
 truth_owner text not null default 'specialist:media' check(truth_owner='specialist:media'),
 observed_at timestamptz not null,
 primary key(owner_id,publish_event_id)
);
create or replace function public.command_center_reject_media_evidence_mutation() returns trigger language plpgsql set search_path to 'public' as $$ begin raise exception 'Media evidence is immutable'; end $$;
drop trigger if exists command_center_media_source_immutable on public.command_center_media_source_history; create trigger command_center_media_source_immutable before update or delete on public.command_center_media_source_history for each row execute function public.command_center_reject_media_evidence_mutation();
drop trigger if exists command_center_media_route_immutable on public.command_center_media_workflow_route_history; create trigger command_center_media_route_immutable before update or delete on public.command_center_media_workflow_route_history for each row execute function public.command_center_reject_media_evidence_mutation();
drop trigger if exists command_center_media_publish_authorization_immutable on public.command_center_media_publish_authorization_history; create trigger command_center_media_publish_authorization_immutable before update or delete on public.command_center_media_publish_authorization_history for each row execute function public.command_center_reject_media_evidence_mutation();
alter table public.command_center_media_source_history enable row level security; alter table public.command_center_media_workflow_route_history enable row level security; alter table public.command_center_media_publish_authorization_history enable row level security;
revoke all on table public.command_center_media_source_history,public.command_center_media_workflow_route_history,public.command_center_media_publish_authorization_history from public,anon,authenticated; grant select,insert on table public.command_center_media_source_history,public.command_center_media_workflow_route_history,public.command_center_media_publish_authorization_history to authenticated;
create policy p12_3_media_source_owner on public.command_center_media_source_history for all to authenticated using(owner_id=(select auth.uid()) and (select public.is_command_center_authorized())) with check(owner_id=(select auth.uid()) and (select public.is_command_center_authorized()) and truth_owner='specialist:media');
create policy p12_3_media_route_owner on public.command_center_media_workflow_route_history for all to authenticated using(owner_id=(select auth.uid()) and (select public.is_command_center_authorized())) with check(owner_id=(select auth.uid()) and (select public.is_command_center_authorized()) and truth_owner='specialist:media');
create policy p12_3_media_publish_authorization_owner on public.command_center_media_publish_authorization_history for all to authenticated using(owner_id=(select auth.uid()) and (select public.is_command_center_authorized())) with check(owner_id=(select auth.uid()) and (select public.is_command_center_authorized()) and truth_owner='specialist:media');
