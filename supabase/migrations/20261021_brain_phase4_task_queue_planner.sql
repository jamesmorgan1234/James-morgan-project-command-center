create table if not exists public.brain_plans (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  project_id text references public.projects(id) on delete set null,
  context_packet_id uuid references public.brain_context_packets(id) on delete set null,
  title text not null,
  objective text not null default '',
  status text not null default 'draft' check (status in ('draft','active','paused','completed','archived')),
  priority smallint not null default 3 check (priority between 1 and 5),
  target_date date,
  source_ref text,
  metadata jsonb not null default '{}'::jsonb,
  completed_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.brain_tasks (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  plan_id uuid references public.brain_plans(id) on delete cascade,
  project_id text references public.projects(id) on delete set null,
  context_packet_id uuid references public.brain_context_packets(id) on delete set null,
  parent_id uuid references public.brain_tasks(id) on delete set null,
  title text not null,
  details text not null default '',
  status text not null default 'backlog' check (status in ('backlog','ready','in_progress','blocked','done','archived')),
  priority smallint not null default 3 check (priority between 1 and 5),
  sort_order integer not null default 0 check (sort_order >= 0),
  due_at timestamptz,
  source_ref text,
  metadata jsonb not null default '{}'::jsonb,
  completed_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.brain_plans enable row level security;
alter table public.brain_tasks enable row level security;
revoke all on public.brain_plans from anon;
revoke all on public.brain_tasks from anon;
grant select, insert, update, delete on public.brain_plans to authenticated;
grant select, insert, update, delete on public.brain_tasks to authenticated;

create policy brain_plans_select_own on public.brain_plans for select to authenticated
using (owner_id = (select auth.uid()) and (select public.is_command_center_authorized()));
create policy brain_plans_insert_own on public.brain_plans for insert to authenticated
with check (owner_id = (select auth.uid()) and (select public.is_command_center_authorized()));
create policy brain_plans_update_own on public.brain_plans for update to authenticated
using (owner_id = (select auth.uid()) and (select public.is_command_center_authorized()))
with check (owner_id = (select auth.uid()) and (select public.is_command_center_authorized()));
create policy brain_plans_delete_own on public.brain_plans for delete to authenticated
using (owner_id = (select auth.uid()) and (select public.is_command_center_authorized()));

create policy brain_tasks_select_own on public.brain_tasks for select to authenticated
using (owner_id = (select auth.uid()) and (select public.is_command_center_authorized()));
create policy brain_tasks_insert_own on public.brain_tasks for insert to authenticated
with check (owner_id = (select auth.uid()) and (select public.is_command_center_authorized()));
create policy brain_tasks_update_own on public.brain_tasks for update to authenticated
using (owner_id = (select auth.uid()) and (select public.is_command_center_authorized()))
with check (owner_id = (select auth.uid()) and (select public.is_command_center_authorized()));
create policy brain_tasks_delete_own on public.brain_tasks for delete to authenticated
using (owner_id = (select auth.uid()) and (select public.is_command_center_authorized()));

create index brain_plans_owner_updated_idx on public.brain_plans(owner_id, updated_at desc);
create index brain_plans_owner_project_idx on public.brain_plans(owner_id, project_id, updated_at desc);
create index brain_plans_owner_status_idx on public.brain_plans(owner_id, status, updated_at desc);
create index brain_tasks_owner_updated_idx on public.brain_tasks(owner_id, updated_at desc);
create index brain_tasks_owner_plan_order_idx on public.brain_tasks(owner_id, plan_id, sort_order, created_at);
create index brain_tasks_owner_project_status_idx on public.brain_tasks(owner_id, project_id, status, priority desc);

create trigger brain_plans_set_updated_at
before update on public.brain_plans
for each row execute function public.command_center_set_updated_at();

create trigger brain_tasks_set_updated_at
before update on public.brain_tasks
for each row execute function public.command_center_set_updated_at();
