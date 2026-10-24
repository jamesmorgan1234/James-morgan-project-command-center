-- Category 3 / P3.2 — storage-level provenance integrity for knowledge claims.
-- Branch-only migration. No production state changes until an authorized migration window.

create or replace function command_center_private.c3_text_array_unique_nonblank(p_values text[])
returns boolean
language sql
immutable
strict
set search_path=''
as $$
  select cardinality(p_values) > 0
     and not exists (
       select 1
       from unnest(p_values) as v(value)
       where v.value is null or btrim(v.value) = ''
     )
     and cardinality(p_values) = (
       select count(distinct v.value)
       from unnest(p_values) as v(value)
     );
$$;

revoke all on function command_center_private.c3_text_array_unique_nonblank(text[]) from public, anon, authenticated;

do $$
begin
  if exists (
    select 1
    from public.command_center_knowledge_claims
    where not command_center_private.c3_text_array_unique_nonblank(source_refs)
  ) then
    raise exception 'Existing knowledge provenance violates unique nonblank source_refs invariant';
  end if;
end $$;

alter table public.command_center_knowledge_claims
  drop constraint if exists command_center_knowledge_source_refs_unique_nonblank;

alter table public.command_center_knowledge_claims
  add constraint command_center_knowledge_source_refs_unique_nonblank
  check (command_center_private.c3_text_array_unique_nonblank(source_refs));
