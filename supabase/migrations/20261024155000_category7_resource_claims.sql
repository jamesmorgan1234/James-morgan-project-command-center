-- Category 7 / P7.5 — durable shared-resource claims and mutation serialization.
-- Branch-only migration. Multi-resource bundles lock stable resource keys in sorted order to avoid deadlock cycles.

create table if not exists public.command_center_agency_resource_claims (
  claim_id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  project_id text not null,
  claimant_ref text not null,
  resource_key text not null,
  mode text not null check (mode in ('shared','exclusive')),
  generation bigint not null check (generation>=1),
  acquired_at timestamptz not null,
  expires_at timestamptz not null,
  evidence_refs text[] not null,
  released_at timestamptz,
  recorded_at timestamptz not null default now(),
  foreign key(owner_id,project_id) references public.command_center_project_profiles(owner_id,project_id) on delete cascade,
  unique(owner_id,claimant_ref,resource_key,generation),
  check (length(btrim(claimant_ref)) between 1 and 500),
  check (length(btrim(resource_key)) between 1 and 500),
  check (expires_at>acquired_at),
  check (cardinality(evidence_refs)>0),
  check (released_at is null or released_at>=acquired_at)
);
create index if not exists command_center_agency_resource_active_idx
  on public.command_center_agency_resource_claims(owner_id,resource_key,expires_at,mode)
  where released_at is null;

alter table public.command_center_agency_resource_claims enable row level security;
revoke all on table public.command_center_agency_resource_claims from public,anon,authenticated;
grant select on table public.command_center_agency_resource_claims to authenticated;
drop policy if exists c7_owner_select_agency_resource_claims on public.command_center_agency_resource_claims;
create policy c7_owner_select_agency_resource_claims
  on public.command_center_agency_resource_claims for select to authenticated
  using (owner_id=(select auth.uid()) and (select public.is_command_center_authorized()));

create or replace function public.command_center_agency_claim_resources(
  p_project_id text,
  p_claimant_ref text,
  p_requests jsonb,
  p_generation bigint,
  p_now timestamptz,
  p_expires_at timestamptz,
  p_evidence_refs text[]
)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
  u uuid:=auth.uid();
  r record;
  v_count integer:=0;
begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  if not exists(select 1 from public.command_center_project_profiles where owner_id=u and project_id=btrim(p_project_id)) then raise exception 'Resource claim project not found'; end if;
  if coalesce(btrim(p_claimant_ref),'')='' or coalesce(p_generation,0)<1 then raise exception 'Resource claimant/generation required'; end if;
  if p_expires_at<=p_now then raise exception 'Resource claim expiry must be in the future'; end if;
  if jsonb_typeof(p_requests)<>'array' or jsonb_array_length(p_requests)=0 then raise exception 'Resource request bundle must be a non-empty array'; end if;
  if exists(select 1 from jsonb_array_elements(p_requests) x where coalesce(btrim(x->>'resourceKey'),'')='' or coalesce(x->>'mode','') not in ('shared','exclusive')) then raise exception 'Invalid resource request'; end if;
  if (select count(*) from jsonb_array_elements(p_requests))<>(select count(distinct btrim(x->>'resourceKey')) from jsonb_array_elements(p_requests) x) then raise exception 'Resource request bundle cannot contain duplicate keys'; end if;
  perform command_center_private.c3_assert_unique_text_array(p_evidence_refs,'Resource claim evidence');
  if cardinality(coalesce(p_evidence_refs,'{}'::text[]))=0 then raise exception 'Resource claim requires evidence'; end if;

  -- Acquire transaction-scoped locks in globally stable resource-key order. Competing bundles use the same order, preventing deadlock cycles.
  for r in
    select btrim(x->>'resourceKey') as resource_key, x->>'mode' as mode
    from jsonb_array_elements(p_requests) x
    order by btrim(x->>'resourceKey')
  loop
    perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(u::text||':'||r.resource_key,0));
    update public.command_center_agency_resource_claims
      set released_at=p_now
      where owner_id=u and resource_key=r.resource_key and released_at is null and expires_at<=p_now;
    if exists(
      select 1 from public.command_center_agency_resource_claims c
      where c.owner_id=u and c.resource_key=r.resource_key and c.released_at is null and c.expires_at>p_now
        and c.claimant_ref<>btrim(p_claimant_ref)
        and (c.mode='exclusive' or r.mode='exclusive')
    ) then raise exception 'Resource conflict: %',r.resource_key; end if;
  end loop;

  for r in
    select btrim(x->>'resourceKey') as resource_key, x->>'mode' as mode
    from jsonb_array_elements(p_requests) x
    order by btrim(x->>'resourceKey')
  loop
    insert into public.command_center_agency_resource_claims(owner_id,project_id,claimant_ref,resource_key,mode,generation,acquired_at,expires_at,evidence_refs)
    values(u,btrim(p_project_id),btrim(p_claimant_ref),r.resource_key,r.mode,p_generation,p_now,p_expires_at,p_evidence_refs);
    v_count:=v_count+1;
  end loop;

  return jsonb_build_object('claimant_ref',btrim(p_claimant_ref),'generation',p_generation,'claim_count',v_count,'expires_at',p_expires_at,'serialized',true);
end $$;

create or replace function public.command_center_agency_release_resources(
  p_claimant_ref text,p_generation bigint,p_now timestamptz,p_evidence_refs text[]
) returns integer language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); v_count integer; begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  perform command_center_private.c3_assert_unique_text_array(p_evidence_refs,'Resource release evidence');
  if cardinality(coalesce(p_evidence_refs,'{}'::text[]))=0 then raise exception 'Resource release requires evidence'; end if;
  update public.command_center_agency_resource_claims set released_at=p_now,evidence_refs=p_evidence_refs
  where owner_id=u and claimant_ref=btrim(p_claimant_ref) and generation=p_generation and released_at is null and p_now<expires_at;
  get diagnostics v_count = row_count;
  return v_count;
end $$;

revoke all on function public.command_center_agency_claim_resources(text,text,jsonb,bigint,timestamptz,timestamptz,text[]) from public,anon;
revoke all on function public.command_center_agency_release_resources(text,bigint,timestamptz,text[]) from public,anon;
grant execute on function public.command_center_agency_claim_resources(text,text,jsonb,bigint,timestamptz,timestamptz,text[]) to authenticated;
grant execute on function public.command_center_agency_release_resources(text,bigint,timestamptz,text[]) to authenticated;
