-- Command Center Project Brain — Phase 1: Durable Memory
-- Persistent, owner-scoped memory records for manual use now and later Brain phases.

create table if not exists public.brain_memories (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  project_id text null references public.projects(id) on delete set null,
  memory_type text not null default 'note'
    check (memory_type = any (array['decision','fact','preference','constraint','checkpoint','reference','note']::text[])),
  title text not null check (char_length(btrim(title)) between 1 and 160),
  body text not null default '',
  tags text[] not null default '{}'::text[],
  importance smallint not null default 3 check (importance between 1 and 5),
  origin text not null default 'manual'
    check (origin = any (array['manual','system','project','chat','import']::text[])),
  metadata jsonb not null default '{}'::jsonb,
  status text not null default 'active'
    check (status = any (array['active','archived']::text[])),
  archived_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.brain_memories is 'Project Brain durable memory ledger. Phase 1 persistent source of truth for user-owned memories.';
comment on column public.brain_memories.project_id is 'Optional Command Center project scope. Null means Command Center-wide memory.';
comment on column public.brain_memories.origin is 'How the memory entered the ledger. Later Brain phases may add system/chat/project memories through the same contract.';
comment on column public.brain_memories.metadata is 'Structured extension point for later Brain phases; never rendered as raw JSON in the normal UI.';

alter table public.brain_memories enable row level security;

revoke all on table public.brain_memories from anon;
grant select, insert, update, delete on table public.brain_memories to authenticated;
grant all on table public.brain_memories to service_role;

drop policy if exists brain_memories_select_own on public.brain_memories;
create policy brain_memories_select_own
on public.brain_memories for select to authenticated
using (
  owner_id = (select auth.uid())
  and (select public.is_command_center_authorized())
);

drop policy if exists brain_memories_insert_own on public.brain_memories;
create policy brain_memories_insert_own
on public.brain_memories for insert to authenticated
with check (
  owner_id = (select auth.uid())
  and (select public.is_command_center_authorized())
);

drop policy if exists brain_memories_update_own on public.brain_memories;
create policy brain_memories_update_own
on public.brain_memories for update to authenticated
using (
  owner_id = (select auth.uid())
  and (select public.is_command_center_authorized())
)
with check (
  owner_id = (select auth.uid())
  and (select public.is_command_center_authorized())
);

drop policy if exists brain_memories_delete_own on public.brain_memories;
create policy brain_memories_delete_own
on public.brain_memories for delete to authenticated
using (
  owner_id = (select auth.uid())
  and (select public.is_command_center_authorized())
);

create index if not exists brain_memories_owner_updated_idx
  on public.brain_memories (owner_id, updated_at desc);
create index if not exists brain_memories_owner_status_idx
  on public.brain_memories (owner_id, status, updated_at desc);
create index if not exists brain_memories_owner_project_idx
  on public.brain_memories (owner_id, project_id, updated_at desc);
create index if not exists brain_memories_tags_gin_idx
  on public.brain_memories using gin (tags);

drop trigger if exists brain_memories_set_updated_at on public.brain_memories;
create trigger brain_memories_set_updated_at
before update on public.brain_memories
for each row execute function public.command_center_set_updated_at();
