-- C11 / P11.4 additive publication metadata detail lineage. Repository-only migration; no production application is authorized by this commit.
create table if not exists public.command_center_book_publication_metadata_detail_history (
  owner_id uuid not null references auth.users(id) on delete cascade,
  metadata_event_id text not null check(btrim(metadata_event_id)<>''),
  project_id text not null check(btrim(project_id)<>''),
  book_id text not null check(btrim(book_id)<>''),
  version integer not null check(version>0),
  canonical_title text not null check(btrim(canonical_title)<>''),
  subtitle text,
  edition text not null check(btrim(edition)<>''),
  author_identity_ref text not null check(btrim(author_identity_ref)<>''),
  author_display_name text not null check(btrim(author_display_name)<>''),
  isbn_ref text,
  trim_size text not null check(btrim(trim_size)<>''),
  bleed boolean not null,
  print_specifications_ref text not null check(btrim(print_specifications_ref)<>''),
  formats text[] not null check(cardinality(formats)>0),
  package_manifest_ref text not null check(btrim(package_manifest_ref)<>''),
  file_mappings jsonb not null,
  prices jsonb not null default '[]'::jsonb,
  source_refs text[] not null check(cardinality(source_refs)>0),
  observed_at timestamptz not null,
  primary key(owner_id,metadata_event_id),
  unique(owner_id,book_id,version),
  check(subtitle is null or btrim(subtitle)<>''),
  check(isbn_ref is null or btrim(isbn_ref)<>''),
  check(formats <@ array['kindle','paperback','hardcover','digital_other','collection_kindle','collection_paperback','collection_hardcover']::text[]),
  check(jsonb_typeof(file_mappings)='array'),
  check(jsonb_typeof(prices)='array')
);

create or replace view public.command_center_book_publication_metadata_details_current with (security_invoker=true) as
select distinct on(owner_id,book_id) owner_id,metadata_event_id,project_id,book_id,version,canonical_title,subtitle,edition,author_identity_ref,author_display_name,isbn_ref,trim_size,bleed,print_specifications_ref,formats,package_manifest_ref,file_mappings,prices,source_refs,observed_at
from public.command_center_book_publication_metadata_detail_history
order by owner_id,book_id,version desc,observed_at desc;

create or replace function public.command_center_reject_book_publication_metadata_detail_mutation() returns trigger language plpgsql set search_path to 'public' as $$ begin raise exception 'Book publication metadata detail evidence is immutable'; end $$;
drop trigger if exists command_center_book_publication_metadata_detail_immutable on public.command_center_book_publication_metadata_detail_history;
create trigger command_center_book_publication_metadata_detail_immutable before update or delete on public.command_center_book_publication_metadata_detail_history for each row execute function public.command_center_reject_book_publication_metadata_detail_mutation();

alter table public.command_center_book_publication_metadata_detail_history enable row level security;
revoke all on table public.command_center_book_publication_metadata_detail_history from public,anon,authenticated;
grant select,insert on table public.command_center_book_publication_metadata_detail_history to authenticated;
grant select on table public.command_center_book_publication_metadata_details_current to authenticated;
create policy p11_4_book_publication_metadata_detail_owner on public.command_center_book_publication_metadata_detail_history for all to authenticated
using(owner_id=(select auth.uid()) and (select public.is_command_center_authorized()))
with check(owner_id=(select auth.uid()) and (select public.is_command_center_authorized()));
