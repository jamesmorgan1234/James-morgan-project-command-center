-- Command Center Project Brain — Phase 2: Brainstorm Workspace
create table if not exists public.brainstorm_items (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  project_id text null references public.projects(id) on delete set null,
  parent_id uuid null references public.brainstorm_items(id) on delete set null,
  linked_memory_id uuid null references public.brain_memories(id) on delete set null,
  item_type text not null default 'idea' check (item_type = any (array['idea','question','option','risk','experiment','note']::text[])),
  title text not null check (char_length(btrim(title)) between 1 and 160),
  body text not null default '',
  tags text[] not null default '{}'::text[],
  priority smallint not null default 3 check (priority between 1 and 5),
  stage text not null default 'inbox' check (stage = any (array['inbox','exploring','ready','committed','archived']::text[])),
  decision_note text not null default '',
  source_ref text null,
  metadata jsonb not null default '{}'::jsonb,
  committed_at timestamptz null,
  archived_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.brainstorm_items is 'Project Brain Phase 2 workspace for ideas, questions, options, risks and experiments before they become committed knowledge.';
alter table public.brainstorm_items enable row level security;
revoke all on table public.brainstorm_items from anon;
grant select, insert, update, delete on table public.brainstorm_items to authenticated;
grant all on table public.brainstorm_items to service_role;
drop policy if exists brainstorm_items_select_own on public.brainstorm_items;
create policy brainstorm_items_select_own on public.brainstorm_items for select to authenticated using (owner_id=(select auth.uid()) and (select public.is_command_center_authorized()));
drop policy if exists brainstorm_items_insert_own on public.brainstorm_items;
create policy brainstorm_items_insert_own on public.brainstorm_items for insert to authenticated with check (owner_id=(select auth.uid()) and (select public.is_command_center_authorized()));
drop policy if exists brainstorm_items_update_own on public.brainstorm_items;
create policy brainstorm_items_update_own on public.brainstorm_items for update to authenticated using (owner_id=(select auth.uid()) and (select public.is_command_center_authorized())) with check (owner_id=(select auth.uid()) and (select public.is_command_center_authorized()));
drop policy if exists brainstorm_items_delete_own on public.brainstorm_items;
create policy brainstorm_items_delete_own on public.brainstorm_items for delete to authenticated using (owner_id=(select auth.uid()) and (select public.is_command_center_authorized()));
create index if not exists brainstorm_items_owner_updated_idx on public.brainstorm_items(owner_id,updated_at desc);
create index if not exists brainstorm_items_owner_project_idx on public.brainstorm_items(owner_id,project_id,updated_at desc);
create index if not exists brainstorm_items_owner_stage_idx on public.brainstorm_items(owner_id,stage,updated_at desc);
create index if not exists brainstorm_items_tags_gin_idx on public.brainstorm_items using gin(tags);
drop trigger if exists brainstorm_items_set_updated_at on public.brainstorm_items;
create trigger brainstorm_items_set_updated_at before update on public.brainstorm_items for each row execute function public.command_center_set_updated_at();
