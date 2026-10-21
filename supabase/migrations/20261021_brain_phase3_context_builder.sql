create table if not exists public.brain_context_packets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  project_id text references public.projects(id) on delete set null,
  title text not null,
  purpose text not null default '',
  query_text text not null default '',
  context_text text not null default '',
  context_json jsonb not null default '{}'::jsonb,
  source_snapshot jsonb not null default '{}'::jsonb,
  memory_ids uuid[] not null default '{}'::uuid[],
  metric_keys text[] not null default '{}'::text[],
  build_version smallint not null default 1 check (build_version > 0),
  status text not null default 'active' check (status in ('active','archived')),
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.brain_context_packets enable row level security;
revoke all on public.brain_context_packets from anon;
grant select, insert, update, delete on public.brain_context_packets to authenticated;

create policy brain_context_packets_select_own on public.brain_context_packets
for select to authenticated
using (owner_id = (select auth.uid()) and (select public.is_command_center_authorized()));

create policy brain_context_packets_insert_own on public.brain_context_packets
for insert to authenticated
with check (owner_id = (select auth.uid()) and (select public.is_command_center_authorized()));

create policy brain_context_packets_update_own on public.brain_context_packets
for update to authenticated
using (owner_id = (select auth.uid()) and (select public.is_command_center_authorized()))
with check (owner_id = (select auth.uid()) and (select public.is_command_center_authorized()));

create policy brain_context_packets_delete_own on public.brain_context_packets
for delete to authenticated
using (owner_id = (select auth.uid()) and (select public.is_command_center_authorized()));

create index brain_context_packets_owner_updated_idx on public.brain_context_packets(owner_id, updated_at desc);
create index brain_context_packets_owner_project_idx on public.brain_context_packets(owner_id, project_id, updated_at desc);
create index brain_context_packets_owner_status_idx on public.brain_context_packets(owner_id, status, updated_at desc);
create index brain_context_packets_memory_ids_idx on public.brain_context_packets using gin(memory_ids);

create trigger brain_context_packets_set_updated_at
before update on public.brain_context_packets
for each row execute function public.command_center_set_updated_at();
