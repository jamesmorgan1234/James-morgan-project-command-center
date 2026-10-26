-- PIF.9 — trace, dependency and version integration. Branch-only; no production mutation.

create table if not exists public.command_center_intelligence_trace_nodes (
  owner_id uuid not null references auth.users(id) on delete cascade,
  trace_node_id text not null,
  node_kind text not null check(node_kind in ('intent','context','policy','router','specialist','method','tool','evidence','verifier','state','decision','outcome','learning','evaluator','ontology','module','configuration','procedure','permission','budget')),
  version bigint not null check(version >= 1),
  privacy_class text not null check(privacy_class in ('ecosystem_shared','domain_shared','company_private','project_private','owner_private')),
  scope_ref text,
  reference_ptr text not null,
  recorded_at timestamptz not null,
  evidence_refs text[] not null,
  created_at timestamptz not null default now(),
  primary key(owner_id, trace_node_id, version),
  check(cardinality(evidence_refs) > 0),
  check((privacy_class in ('domain_shared','company_private','project_private') and scope_ref is not null) or (privacy_class in ('ecosystem_shared','owner_private') and scope_ref is null))
);

create table if not exists public.command_center_intelligence_trace_edges (
  owner_id uuid not null references auth.users(id) on delete cascade,
  trace_edge_id text not null,
  relation text not null check(relation in ('context_for','governs','routes_to','selects','invokes','produces_evidence','verified_by','transitions_to','records_decision','records_outcome','produces_learning','depends_on','evaluated_by','uses_ontology','uses_version')),
  from_node_id text not null,
  from_version bigint not null check(from_version >= 1),
  to_node_id text not null,
  to_version bigint not null check(to_version >= 1),
  version bigint not null check(version >= 1),
  recorded_at timestamptz not null,
  evidence_refs text[] not null,
  created_at timestamptz not null default now(),
  primary key(owner_id, trace_edge_id),
  foreign key(owner_id, from_node_id, from_version) references public.command_center_intelligence_trace_nodes(owner_id, trace_node_id, version) on delete cascade,
  foreign key(owner_id, to_node_id, to_version) references public.command_center_intelligence_trace_nodes(owner_id, trace_node_id, version) on delete cascade,
  check(from_node_id <> to_node_id),
  check(cardinality(evidence_refs) > 0)
);

create table if not exists public.command_center_dependency_invalidations (
  owner_id uuid not null references auth.users(id) on delete cascade,
  invalidation_id text not null,
  changed_ref text not null,
  new_version bigint not null check(new_version >= 1),
  stale_dependent_refs text[] not null,
  evidence_edge_ids text[] not null,
  reason text not null,
  evaluated_at timestamptz not null,
  created_at timestamptz not null default now(),
  primary key(owner_id, invalidation_id),
  check(cardinality(stale_dependent_refs) > 0),
  check(cardinality(evidence_edge_ids) > 0)
);

create index if not exists command_center_trace_node_kind_idx
  on public.command_center_intelligence_trace_nodes(owner_id, node_kind, trace_node_id, version);
create index if not exists command_center_trace_edge_from_idx
  on public.command_center_intelligence_trace_edges(owner_id, from_node_id, from_version);
create index if not exists command_center_trace_edge_to_idx
  on public.command_center_intelligence_trace_edges(owner_id, to_node_id, to_version);
create index if not exists command_center_dependency_invalidation_stale_idx
  on public.command_center_dependency_invalidations using gin(stale_dependent_refs);

do $$ declare t text; begin
  foreach t in array array['command_center_intelligence_trace_nodes','command_center_intelligence_trace_edges','command_center_dependency_invalidations'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on table public.%I from public,anon,authenticated', t);
    execute format('grant select on table public.%I to authenticated', t);
    execute format('drop policy if exists %I on public.%I', 'pif9_owner_select_'||t, t);
    execute format('create policy %I on public.%I for select to authenticated using (owner_id=(select auth.uid()) and (select public.is_command_center_authorized()))', 'pif9_owner_select_'||t, t);
  end loop;
end $$;
