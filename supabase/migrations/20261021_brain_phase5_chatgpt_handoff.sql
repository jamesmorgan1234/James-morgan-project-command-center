-- Project Brain Phase 5 — ChatGPT Handoff Loop
-- Idempotent canonical schema matching the already-provisioned production table.

create table if not exists public.brain_handoffs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  project_id text null references public.projects(id) on delete set null,
  context_packet_id uuid null references public.brain_context_packets(id) on delete set null,
  plan_id uuid null references public.brain_plans(id) on delete set null,
  task_ids uuid[] not null default '{}'::uuid[],
  title text not null,
  destination text not null default 'chatgpt' check (destination = 'chatgpt'),
  handoff_text text not null default '',
  response_text text not null default '',
  response_source_ref text null,
  status text not null default 'draft' check (status in ('draft','sent','returned','verified','archived')),
  metadata jsonb not null default '{}'::jsonb,
  sent_at timestamptz null,
  returned_at timestamptz null,
  verified_at timestamptz null,
  archived_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists brain_handoffs_owner_project_idx on public.brain_handoffs(owner_id,project_id,updated_at desc);
create index if not exists brain_handoffs_owner_status_idx on public.brain_handoffs(owner_id,status,updated_at desc);
create index if not exists brain_handoffs_owner_updated_idx on public.brain_handoffs(owner_id,updated_at desc);
create index if not exists brain_handoffs_task_ids_idx on public.brain_handoffs using gin(task_ids);

alter table public.brain_handoffs enable row level security;

drop policy if exists brain_handoffs_select_own on public.brain_handoffs;
create policy brain_handoffs_select_own on public.brain_handoffs for select using (
  owner_id=(select auth.uid()) and (select public.is_command_center_authorized())
);
drop policy if exists brain_handoffs_insert_own on public.brain_handoffs;
create policy brain_handoffs_insert_own on public.brain_handoffs for insert with check (
  owner_id=(select auth.uid()) and (select public.is_command_center_authorized())
);
drop policy if exists brain_handoffs_update_own on public.brain_handoffs;
create policy brain_handoffs_update_own on public.brain_handoffs for update using (
  owner_id=(select auth.uid()) and (select public.is_command_center_authorized())
) with check (
  owner_id=(select auth.uid()) and (select public.is_command_center_authorized())
);
drop policy if exists brain_handoffs_delete_own on public.brain_handoffs;
create policy brain_handoffs_delete_own on public.brain_handoffs for delete using (
  owner_id=(select auth.uid()) and (select public.is_command_center_authorized())
);

drop trigger if exists brain_handoffs_set_updated_at on public.brain_handoffs;
create trigger brain_handoffs_set_updated_at before update on public.brain_handoffs
for each row execute function public.command_center_set_updated_at();
