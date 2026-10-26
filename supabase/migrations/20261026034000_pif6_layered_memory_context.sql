-- PIF.6 — layered memory, revalidation and compiled context. Branch-only; no production mutation.

create table if not exists public.command_center_memory_layers (
  owner_id uuid not null references auth.users(id) on delete cascade,
  memory_id text not null,
  memory_version bigint not null check(memory_version >= 1),
  layer text not null check(layer in ('owner_system','ecosystem_validated','specialist_local','procedural','negative','quarantined','historical')),
  company_id text,
  project_id text,
  brain_id text,
  task_classes text[] not null default '{}'::text[],
  condition_refs text[] not null default '{}'::text[],
  dependency_refs text[] not null default '{}'::text[],
  method_refs text[] not null default '{}'::text[],
  permission_refs text[] not null default '{}'::text[],
  budget_refs text[] not null default '{}'::text[],
  contradiction_refs text[] not null default '{}'::text[],
  operational_eligible boolean not null default false,
  expires_at timestamptz,
  revalidate_after timestamptz,
  invalidated_at timestamptz,
  invalidation_evidence_refs text[] not null default '{}'::text[],
  created_at timestamptz not null default now(),
  primary key(owner_id, memory_id, memory_version),
  check(not (layer in ('quarantined','historical') and operational_eligible)),
  check(invalidated_at is null or cardinality(invalidation_evidence_refs) > 0)
);

create table if not exists public.command_center_context_compilations (
  owner_id uuid not null references auth.users(id) on delete cascade,
  context_id text not null,
  company_id text,
  project_id text,
  task_class text not null,
  built_at timestamptz not null,
  max_budget_units numeric not null check(max_budget_units >= 0),
  used_budget_units numeric not null check(used_budget_units >= 0 and used_budget_units <= max_budget_units),
  exact_version_refs text[] not null,
  included_refs jsonb not null check(jsonb_typeof(included_refs) = 'array'),
  omitted_refs jsonb not null check(jsonb_typeof(omitted_refs) = 'array'),
  method_refs text[] not null default '{}'::text[],
  permission_refs text[] not null default '{}'::text[],
  budget_refs text[] not null default '{}'::text[],
  created_at timestamptz not null default now(),
  primary key(owner_id, context_id),
  check(cardinality(exact_version_refs) >= 0)
);

create index if not exists command_center_memory_layers_scope_idx
  on public.command_center_memory_layers(owner_id, company_id, project_id, layer);
create index if not exists command_center_memory_layers_dependency_idx
  on public.command_center_memory_layers using gin(dependency_refs);
create index if not exists command_center_context_versions_idx
  on public.command_center_context_compilations using gin(exact_version_refs);

do $$ declare t text; begin
  foreach t in array array['command_center_memory_layers','command_center_context_compilations'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on table public.%I from public,anon,authenticated', t);
    execute format('grant select on table public.%I to authenticated', t);
    execute format('drop policy if exists %I on public.%I', 'pif6_owner_select_'||t, t);
    execute format('create policy %I on public.%I for select to authenticated using (owner_id=(select auth.uid()) and (select public.is_command_center_authorized()))', 'pif6_owner_select_'||t, t);
  end loop;
end $$;
