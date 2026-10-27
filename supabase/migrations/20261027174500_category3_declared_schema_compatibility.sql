-- Branch-only compatibility hardening. Current canonical wire schema is v1;
-- record versions remain independently monotonic. Future schema adoption must
-- explicitly replace these constraints in a reviewed compatibility migration.
-- Validation fails atomically if prior data does not satisfy the declared contract.
begin;
alter table public.command_center_canonical_entities
  add constraint c3_canonical_supported_schema check (schema_version = 1) not valid;
alter table public.command_center_canonical_entity_versions
  add constraint c3_canonical_history_supported_schema check (schema_version = 1) not valid;
alter table public.command_center_knowledge_claims
  add constraint c3_knowledge_concrete_known_value check (truth_state <> 'known' or value_jsonb <> 'null'::jsonb) not valid;
alter table public.command_center_canonical_entities validate constraint c3_canonical_supported_schema;
alter table public.command_center_canonical_entity_versions validate constraint c3_canonical_history_supported_schema;
alter table public.command_center_knowledge_claims validate constraint c3_knowledge_concrete_known_value;
commit;
