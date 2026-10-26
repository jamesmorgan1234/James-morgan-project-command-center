-- PIF.8 — negative knowledge and transferability. Branch-only; no production mutation.

create table if not exists public.command_center_negative_knowledge (
  owner_id uuid not null references auth.users(id) on delete cascade,
  negative_knowledge_id text not null,
  version bigint not null check(version>=1),
  statement text not null,
  source_regime jsonb not null check(jsonb_typeof(source_regime)='object'),
  contraindication jsonb not null check(jsonb_typeof(contraindication)='object'),
  failure_signature text not null,
  recovery_lessons text[] not null,
  evidence_refs text[] not null,
  evaluator_evidence_refs text[] not null,
  active boolean not null default true,
  invalidated_by_evidence_refs text[] not null default '{}'::text[],
  recorded_at timestamptz not null,
  revalidate_after timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key(owner_id,negative_knowledge_id),
  check(cardinality(recovery_lessons)>0 and cardinality(evidence_refs)>0 and cardinality(evaluator_evidence_refs)>0),
  check(revalidate_after>recorded_at),
  check(not (active and cardinality(invalidated_by_evidence_refs)>0))
);

create table if not exists public.command_center_negative_knowledge_versions (
  owner_id uuid not null references auth.users(id) on delete cascade,
  negative_knowledge_id text not null,
  version bigint not null check(version>=1),
  snapshot jsonb not null check(jsonb_typeof(snapshot)='object'),
  evidence_refs text[] not null,
  recorded_at timestamptz not null default now(),
  primary key(owner_id,negative_knowledge_id,version),
  foreign key(owner_id,negative_knowledge_id) references public.command_center_negative_knowledge(owner_id,negative_knowledge_id) on delete cascade,
  check(cardinality(evidence_refs)>0)
);

create table if not exists public.command_center_transfer_assessments (
  owner_id uuid not null references auth.users(id) on delete cascade,
  transfer_id text not null,
  version bigint not null check(version>=1),
  source_ref text not null,
  source_regime jsonb not null check(jsonb_typeof(source_regime)='object'),
  target_regime jsonb not null check(jsonb_typeof(target_regime)='object'),
  similarity_evidence_refs text[] not null default '{}'::text[],
  applicability_evidence_refs text[] not null default '{}'::text[],
  evaluator_evidence_refs text[] not null default '{}'::text[],
  negative_knowledge_refs text[] not null default '{}'::text[],
  alternative_refs text[] not null default '{}'::text[],
  decision text not null check(decision in ('eligible','rejected','revoked')),
  reason_codes text[] not null,
  evidence_refs text[] not null,
  decided_at timestamptz not null,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  revocation_evidence_refs text[] not null default '{}'::text[],
  created_at timestamptz not null default now(),
  primary key(owner_id,transfer_id,version),
  check(cardinality(reason_codes)>0 and cardinality(evidence_refs)>0),
  check(expires_at>decided_at),
  check(not (decision='eligible' and cardinality(applicability_evidence_refs)=0)),
  check(not (decision='eligible' and cardinality(evaluator_evidence_refs)=0)),
  check(not (decision='revoked' and cardinality(revocation_evidence_refs)=0))
);

create index if not exists command_center_negative_scope_idx on public.command_center_negative_knowledge using gin(contraindication);
create index if not exists command_center_transfer_target_idx on public.command_center_transfer_assessments using gin(target_regime);

do $$ declare t text; begin
  foreach t in array array['command_center_negative_knowledge','command_center_negative_knowledge_versions','command_center_transfer_assessments'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('revoke all on table public.%I from public,anon,authenticated',t);
    execute format('grant select on table public.%I to authenticated',t);
    execute format('drop policy if exists %I on public.%I','pif8_owner_select_'||t,t);
    execute format('create policy %I on public.%I for select to authenticated using (owner_id=(select auth.uid()) and (select public.is_command_center_authorized()))','pif8_owner_select_'||t,t);
  end loop;
end $$;

-- Similarity is never enough by itself. Known contraindications block transfer; invalidated evidence revokes dependents while retaining alternatives.
