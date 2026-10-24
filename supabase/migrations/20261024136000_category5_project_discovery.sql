-- Category 5 / P5.10 — durable project discovery, duplicate signals and owner-governed dispositions.
-- Branch-only migration. No production state is changed by committing this file.
-- Discovery evidence never mutates canonical project identity by itself.

create table if not exists public.command_center_project_candidates (
  owner_id uuid not null references auth.users(id) on delete cascade,
  candidate_id text not null,
  proposed_name text not null,
  mission text not null,
  source_refs text[] not null,
  state text not null default 'open' check (state in ('open','decided')),
  created_at timestamptz not null default now(),
  decided_at timestamptz,
  primary key(owner_id,candidate_id),
  check (length(btrim(candidate_id)) between 1 and 240),
  check (length(btrim(proposed_name)) between 1 and 500),
  check (length(btrim(mission)) between 1 and 4000),
  check (cardinality(source_refs)>0),
  check ((state='open' and decided_at is null) or (state='decided' and decided_at is not null))
);

create table if not exists public.command_center_project_duplicate_signals (
  signal_id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  candidate_id text not null,
  project_id text not null,
  score numeric(8,7) not null check (score>=0 and score<=1),
  reason text not null,
  evidence_refs text[] not null,
  observed_at timestamptz not null,
  created_at timestamptz not null default now(),
  unique(owner_id,candidate_id,project_id,reason),
  foreign key(owner_id,candidate_id) references public.command_center_project_candidates(owner_id,candidate_id) on delete cascade,
  foreign key(owner_id,project_id) references public.command_center_project_profiles(owner_id,project_id) on delete cascade,
  check (length(btrim(reason)) between 1 and 500),
  check (cardinality(evidence_refs)>0)
);

create table if not exists public.command_center_project_candidate_decisions (
  decision_id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  candidate_id text not null,
  disposition text not null check (disposition in ('merge','ignore','keep_separate','add','park','reject','research')),
  target_project_id text,
  owner_decision_ref text not null,
  rationale text,
  decided_at timestamptz not null,
  created_at timestamptz not null default now(),
  unique(owner_id,candidate_id),
  foreign key(owner_id,candidate_id) references public.command_center_project_candidates(owner_id,candidate_id) on delete restrict,
  foreign key(owner_id,target_project_id) references public.command_center_project_profiles(owner_id,project_id) on delete restrict,
  check (length(btrim(owner_decision_ref)) between 1 and 1000),
  check (disposition<>'merge' or target_project_id is not null)
);

-- Browser roles may read discovery evidence but cannot write/merge/delete it directly.
do $$
declare t text;
begin
  foreach t in array array['command_center_project_candidates','command_center_project_duplicate_signals','command_center_project_candidate_decisions'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('revoke all on table public.%I from public,anon,authenticated',t);
    execute format('grant select on table public.%I to authenticated',t);
    execute format('drop policy if exists %I on public.%I','c5_owner_select_'||t,t);
    execute format('create policy %I on public.%I for select to authenticated using (owner_id=(select auth.uid()) and (select public.is_command_center_authorized()))','c5_owner_select_'||t,t);
  end loop;
end $$;

create or replace function public.command_center_project_stage_candidate(
  p_candidate_id text,p_proposed_name text,p_mission text,p_source_refs text[]
)
returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); v_id text:=btrim(coalesce(p_candidate_id,'')); begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  if v_id='' or coalesce(btrim(p_proposed_name),'')='' or coalesce(btrim(p_mission),'')='' then raise exception 'Candidate identity, name and mission are required'; end if;
  perform command_center_private.c5_assert_unique_text_array(p_source_refs,'Candidate provenance');
  if cardinality(coalesce(p_source_refs,'{}'::text[]))=0 then raise exception 'Candidate provenance is required'; end if;
  insert into public.command_center_project_candidates(owner_id,candidate_id,proposed_name,mission,source_refs)
  values(u,v_id,btrim(p_proposed_name),btrim(p_mission),p_source_refs);
  return jsonb_build_object('candidate_id',v_id,'state','open');
end $$;

create or replace function public.command_center_project_record_duplicate_signal(
  p_candidate_id text,p_project_id text,p_score numeric,p_reason text,p_evidence_refs text[],p_observed_at timestamptz
)
returns uuid language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); v_id uuid; begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  if not exists(select 1 from public.command_center_project_candidates where owner_id=u and candidate_id=btrim(p_candidate_id) and state='open') then raise exception 'Open project candidate not found'; end if;
  if not exists(select 1 from public.command_center_project_profiles where owner_id=u and project_id=btrim(p_project_id)) then raise exception 'Comparison project not found'; end if;
  if p_score<0 or p_score>1 or coalesce(btrim(p_reason),'')='' then raise exception 'Invalid duplicate signal'; end if;
  perform command_center_private.c5_assert_unique_text_array(p_evidence_refs,'Duplicate signal evidence');
  if cardinality(coalesce(p_evidence_refs,'{}'::text[]))=0 then raise exception 'Duplicate signal evidence is required'; end if;
  insert into public.command_center_project_duplicate_signals(owner_id,candidate_id,project_id,score,reason,evidence_refs,observed_at)
  values(u,btrim(p_candidate_id),btrim(p_project_id),p_score,btrim(p_reason),p_evidence_refs,p_observed_at)
  returning signal_id into v_id;
  return v_id;
end $$;

create or replace function public.command_center_project_decide_candidate(
  p_candidate_id text,p_disposition text,p_target_project_id text,p_owner_decision_ref text,p_rationale text,p_decided_at timestamptz
)
returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); v_candidate text:=btrim(coalesce(p_candidate_id,'')); v_disp text:=btrim(coalesce(p_disposition,'')); v_target text:=nullif(btrim(coalesce(p_target_project_id,'')),''); begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  if v_disp not in ('merge','ignore','keep_separate','add','park','reject','research') then raise exception 'Invalid candidate disposition'; end if;
  if coalesce(btrim(p_owner_decision_ref),'')='' then raise exception 'Explicit owner decision evidence is required'; end if;
  if v_disp='merge' and v_target is null then raise exception 'Merge disposition requires target project'; end if;
  if v_target is not null and not exists(select 1 from public.command_center_project_profiles where owner_id=u and project_id=v_target) then raise exception 'Target project not found'; end if;
  update public.command_center_project_candidates set state='decided',decided_at=p_decided_at
    where owner_id=u and candidate_id=v_candidate and state='open';
  if not found then raise exception 'Open candidate not found'; end if;
  insert into public.command_center_project_candidate_decisions(owner_id,candidate_id,disposition,target_project_id,owner_decision_ref,rationale,decided_at)
  values(u,v_candidate,v_disp,v_target,btrim(p_owner_decision_ref),nullif(btrim(coalesce(p_rationale,'')),''),p_decided_at);
  -- Deliberately no canonical project mutation here. Merge/add/retire actions require their own governed execution path.
  return jsonb_build_object('candidate_id',v_candidate,'disposition',v_disp,'target_project_id',v_target,'canonical_mutation',false);
end $$;

revoke all on function public.command_center_project_stage_candidate(text,text,text,text[]) from public,anon;
revoke all on function public.command_center_project_record_duplicate_signal(text,text,numeric,text,text[],timestamptz) from public,anon;
revoke all on function public.command_center_project_decide_candidate(text,text,text,text,text,timestamptz) from public,anon;
grant execute on function public.command_center_project_stage_candidate(text,text,text,text[]) to authenticated;
grant execute on function public.command_center_project_record_duplicate_signal(text,text,numeric,text,text[],timestamptz) to authenticated;
grant execute on function public.command_center_project_decide_candidate(text,text,text,text,text,timestamptz) to authenticated;
