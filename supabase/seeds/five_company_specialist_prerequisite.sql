-- PREPARED ONLY: if this helper is absent, use this exact repository-defined prerequisite.
-- Extracted unchanged from 20261024114000_category3_knowledge_provenance_invariant.sql.
-- Then apply the existing 20261026010000_pif3_specialist_model_registry.sql before five_company_import.sql.
-- Requires separate production authorization; no unrelated Category 3 migration is rerun.
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
