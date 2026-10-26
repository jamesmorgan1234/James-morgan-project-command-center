-- C11 / P11.2 — immutable manuscript/cover/interior/asset lineage with exact protected replacement authorization.
create table if not exists public.command_center_book_asset_replacement_authorization_history (
 owner_id uuid not null references auth.users(id) on delete cascade,
 authorization_event_id text not null check(btrim(authorization_event_id)<>''), authorization_ref text not null check(btrim(authorization_ref)<>''), book_id text not null check(btrim(book_id)<>''), kind text not null check(btrim(kind)<>''), prior_content_hash text not null check(btrim(prior_content_hash)<>''), replacement_content_hash text not null check(btrim(replacement_content_hash)<>''), observed_at timestamptz not null, expires_at timestamptz not null,
 primary key(owner_id,authorization_event_id), unique(owner_id,authorization_ref), check(observed_at<expires_at)
);
create table if not exists public.command_center_book_asset_history (
 owner_id uuid not null references auth.users(id) on delete cascade,
 asset_event_id text not null check(btrim(asset_event_id)<>''), asset_identity_id text not null check(btrim(asset_identity_id)<>''), project_id text not null check(btrim(project_id)<>''), book_id text not null check(btrim(book_id)<>''), kind text not null check(kind in ('manuscript','cover','interior','metadata','package','cover_front','cover_wrap','illustration','worksheet','source_art')), version integer not null check(version>0),
 file_ref text not null check(btrim(file_ref)<>''), content_hash text not null check(btrim(content_hash)<>''), origin text not null check(origin in ('original','recovered_original','reconstruction')), source_refs text[] not null check(cardinality(source_refs)>0), reconstruction_refs text[] not null default '{}'::text[], approved boolean not null, approval_ref text, protected boolean not null, authoritative boolean not null, authority_basis_ref text not null check(btrim(authority_basis_ref)<>''), replacement_authorization_ref text, observed_at timestamptz not null,
 primary key(owner_id,asset_event_id), unique(owner_id,asset_identity_id,version),
 check((approved=false and approval_ref is null) or (approved=true and approval_ref is not null and btrim(approval_ref)<>'')), check(protected=false or approved=true), check((origin='reconstruction' and cardinality(reconstruction_refs)>0) or (origin<>'reconstruction' and cardinality(reconstruction_refs)=0)), check(replacement_authorization_ref is null or btrim(replacement_authorization_ref)<>'')
);
create or replace view public.command_center_book_assets_current with (security_invoker=true) as select distinct on(owner_id,book_id,kind) owner_id,asset_event_id,asset_identity_id,project_id,book_id,kind,version,file_ref,content_hash,origin,source_refs,reconstruction_refs,approved,approval_ref,protected,authoritative,authority_basis_ref,replacement_authorization_ref,observed_at from public.command_center_book_asset_history order by owner_id,book_id,kind,version desc,observed_at desc;
create or replace function public.command_center_validate_book_asset_insert() returns trigger language plpgsql set search_path to 'public' as $$
declare prior record; auth record; begin
 select * into prior from public.command_center_book_assets_current a where a.owner_id=new.owner_id and a.book_id=new.book_id and a.kind=new.kind;
 if prior.asset_identity_id is not null then
   if prior.asset_identity_id<>new.asset_identity_id or prior.project_id<>new.project_id then raise exception 'Canonical book asset lineage cannot be silently substituted'; end if;
   if new.version<=prior.version then raise exception 'Book asset version must advance'; end if;
   if prior.protected and prior.content_hash<>new.content_hash then
     if new.replacement_authorization_ref is null then raise exception 'Protected approved asset cannot be silently replaced'; end if;
     select * into auth from public.command_center_book_asset_replacement_authorization_history r where r.owner_id=new.owner_id and r.authorization_ref=new.replacement_authorization_ref;
     if auth.authorization_ref is null or auth.book_id<>new.book_id or auth.kind<>new.kind or auth.prior_content_hash<>prior.content_hash or auth.replacement_content_hash<>new.content_hash or auth.observed_at>new.observed_at or auth.expires_at<=new.observed_at then raise exception 'Protected asset replacement authorization must bind exact current replacement'; end if;
   end if;
 end if;
 return new;
end $$;
drop trigger if exists command_center_book_asset_validate on public.command_center_book_asset_history; create trigger command_center_book_asset_validate before insert on public.command_center_book_asset_history for each row execute function public.command_center_validate_book_asset_insert();
create or replace function public.command_center_reject_book_asset_evidence_mutation() returns trigger language plpgsql set search_path to 'public' as $$ begin raise exception 'Book asset evidence is immutable'; end $$;
drop trigger if exists command_center_book_asset_auth_immutable on public.command_center_book_asset_replacement_authorization_history; create trigger command_center_book_asset_auth_immutable before update or delete on public.command_center_book_asset_replacement_authorization_history for each row execute function public.command_center_reject_book_asset_evidence_mutation();
drop trigger if exists command_center_book_asset_history_immutable on public.command_center_book_asset_history; create trigger command_center_book_asset_history_immutable before update or delete on public.command_center_book_asset_history for each row execute function public.command_center_reject_book_asset_evidence_mutation();
alter table public.command_center_book_asset_replacement_authorization_history enable row level security; alter table public.command_center_book_asset_history enable row level security;
revoke all on table public.command_center_book_asset_replacement_authorization_history,public.command_center_book_asset_history from public,anon,authenticated; grant select,insert on table public.command_center_book_asset_replacement_authorization_history,public.command_center_book_asset_history to authenticated; grant select on table public.command_center_book_assets_current to authenticated;
create policy p11_2_book_asset_replacement_auth_owner on public.command_center_book_asset_replacement_authorization_history for all to authenticated using(owner_id=(select auth.uid()) and (select public.is_command_center_authorized())) with check(owner_id=(select auth.uid()) and (select public.is_command_center_authorized()));
create policy p11_2_book_asset_owner on public.command_center_book_asset_history for all to authenticated using(owner_id=(select auth.uid()) and (select public.is_command_center_authorized())) with check(owner_id=(select auth.uid()) and (select public.is_command_center_authorized()));
