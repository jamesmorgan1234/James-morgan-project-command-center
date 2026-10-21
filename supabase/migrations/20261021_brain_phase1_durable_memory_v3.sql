-- Command Center Project Brain — Phase 1: Durable Memory v3
create table if not exists public.brain_memories (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  project_id text null references public.projects(id) on delete set null,
  memory_type text not null default 'note' check (memory_type = any (array['decision','fact','preference','constraint','checkpoint','reference','note','approved_asset','reusable_implementation']::text[])),
  title text not null check (char_length(btrim(title)) between 1 and 160),
  body text not null default '',
  tags text[] not null default '{}'::text[],
  importance smallint not null default 3 check (importance between 1 and 5),
  origin text not null default 'manual' check (origin = any (array['manual','system','project','chat','import','internet','automation','agent']::text[])),
  trust_state text not null default 'observed' check (trust_state = any (array['draft','observed','verified','approved','locked']::text[])),
  source_ref text null,
  source_observed_at timestamptz null,
  canonical_key text null,
  content_hash text null,
  sharing_scope text not null default 'private_project' check (sharing_scope = any (array['private_project','command_center_shared']::text[])),
  promoted_at timestamptz null,
  supersedes_id uuid null references public.brain_memories(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  status text not null default 'active' check (status = any (array['active','archived','superseded']::text[])),
  archived_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.brain_memories is 'Project Brain durable memory ledger with trust, provenance, canonical relationships, approved-asset and reusable-implementation support.';
comment on column public.brain_memories.metadata is 'Structured extension point for later Brain phases; never rendered as raw JSON in normal UI.';
alter table public.brain_memories enable row level security;
revoke all on table public.brain_memories from anon;
grant select, insert, update, delete on table public.brain_memories to authenticated;
grant all on table public.brain_memories to service_role;
drop policy if exists brain_memories_select_own on public.brain_memories;
create policy brain_memories_select_own on public.brain_memories for select to authenticated using (owner_id=(select auth.uid()) and (select public.is_command_center_authorized()));
drop policy if exists brain_memories_insert_own on public.brain_memories;
create policy brain_memories_insert_own on public.brain_memories for insert to authenticated with check (owner_id=(select auth.uid()) and (select public.is_command_center_authorized()));
drop policy if exists brain_memories_update_own on public.brain_memories;
create policy brain_memories_update_own on public.brain_memories for update to authenticated using (owner_id=(select auth.uid()) and (select public.is_command_center_authorized())) with check (owner_id=(select auth.uid()) and (select public.is_command_center_authorized()));
drop policy if exists brain_memories_delete_own on public.brain_memories;
create policy brain_memories_delete_own on public.brain_memories for delete to authenticated using (owner_id=(select auth.uid()) and (select public.is_command_center_authorized()));
create index if not exists brain_memories_owner_updated_idx on public.brain_memories(owner_id,updated_at desc);
create index if not exists brain_memories_owner_status_idx on public.brain_memories(owner_id,status,updated_at desc);
create index if not exists brain_memories_owner_project_idx on public.brain_memories(owner_id,project_id,updated_at desc);
create index if not exists brain_memories_owner_trust_idx on public.brain_memories(owner_id,trust_state,updated_at desc);
create index if not exists brain_memories_owner_canonical_idx on public.brain_memories(owner_id,canonical_key) where canonical_key is not null;
create index if not exists brain_memories_tags_gin_idx on public.brain_memories using gin(tags);
drop trigger if exists brain_memories_set_updated_at on public.brain_memories;
create trigger brain_memories_set_updated_at before update on public.brain_memories for each row execute function public.command_center_set_updated_at();
