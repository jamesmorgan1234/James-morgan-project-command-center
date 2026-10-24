-- Category 7 / P7.21 — deterministic orchestration/workload replay evidence.
-- Branch-only migration. Replay uses recorded choices only and never executes protected side effects.

create table if not exists public.command_center_agency_replay_choices (
  owner_id uuid not null references auth.users(id) on delete cascade,
  project_id text not null,
  run_id text not null,
  sequence bigint not null check (sequence>=1),
  kind text not null check (kind in ('scheduler','policy','model','provider','time','random','retry','conflict','barrier','recovery')),
  input_hash text not null check (input_hash ~ '^[a-f0-9]{64}$'),
  output_hash text not null check (output_hash ~ '^[a-f0-9]{64}$'),
  chosen_value_ref text not null check (length(btrim(chosen_value_ref)) between 1 and 1000),
  chosen_value_hash text not null check (chosen_value_hash ~ '^[a-f0-9]{64}$'),
  evidence_refs text[] not null,
  recorded_at timestamptz not null default now(),
  primary key(owner_id,project_id,run_id,sequence),
  foreign key(owner_id,project_id,run_id) references public.command_center_agency_runs(owner_id,project_id,run_id) on delete cascade,
  check (cardinality(evidence_refs)>0)
);

create table if not exists public.command_center_agency_replay_runs (
  replay_id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  project_id text not null,
  source_run_id text not null,
  fixture_ref text not null check (length(btrim(fixture_ref)) between 1 and 1000),
  fixture_hash text not null check (fixture_hash ~ '^[a-f0-9]{64}$'),
  expected_choice_count integer not null check (expected_choice_count>=0),
  observed_choice_count integer not null check (observed_choice_count>=0),
  result text not null check (result in ('matched','mismatch','invalid_fixture')),
  mismatch_sequence bigint,
  protected_side_effects_executed boolean not null default false check (protected_side_effects_executed=false),
  evidence_refs text[] not null,
  replayed_at timestamptz not null,
  recorded_at timestamptz not null default now(),
  foreign key(owner_id,project_id,source_run_id) references public.command_center_agency_runs(owner_id,project_id,run_id) on delete restrict,
  check (cardinality(evidence_refs)>0),
  check ((result='matched' and mismatch_sequence is null and expected_choice_count=observed_choice_count) or result<>'matched'),
  check (replayed_at<=recorded_at + interval '5 minutes')
);
create index if not exists command_center_agency_replay_runs_idx
  on public.command_center_agency_replay_runs(owner_id,project_id,source_run_id,replayed_at desc,replay_id);

do $$
declare t text;
begin
  foreach t in array array['command_center_agency_replay_choices','command_center_agency_replay_runs'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('revoke all on table public.%I from public,anon,authenticated',t);
    execute format('grant select on table public.%I to authenticated',t);
    execute format('drop policy if exists %I on public.%I','c7_owner_select_'||t,t);
    execute format('create policy %I on public.%I for select to authenticated using (owner_id=(select auth.uid()) and (select public.is_command_center_authorized()))','c7_owner_select_'||t,t);
  end loop;
end $$;

create or replace function public.command_center_agency_record_replay_choice(
  p_project_id text,p_run_id text,p_sequence bigint,p_kind text,p_input_hash text,p_output_hash text,p_chosen_value_ref text,p_chosen_value_hash text,p_evidence_refs text[]
) returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); expected bigint; begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  if not exists(select 1 from public.command_center_agency_runs where owner_id=u and project_id=btrim(p_project_id) and run_id=btrim(p_run_id)) then raise exception 'Replay source run not found'; end if;
  if p_kind not in ('scheduler','policy','model','provider','time','random','retry','conflict','barrier','recovery') then raise exception 'Invalid replay choice kind'; end if;
  if coalesce(p_input_hash,'') !~ '^[a-f0-9]{64}$' or coalesce(p_output_hash,'') !~ '^[a-f0-9]{64}$' or coalesce(p_chosen_value_hash,'') !~ '^[a-f0-9]{64}$' or coalesce(btrim(p_chosen_value_ref),'')='' then raise exception 'Replay choice requires stable hashes/reference'; end if;
  perform command_center_private.c3_assert_unique_text_array(p_evidence_refs,'Replay choice evidence');
  if cardinality(coalesce(p_evidence_refs,'{}'::text[]))=0 then raise exception 'Replay choice requires evidence'; end if;
  select coalesce(max(sequence),0)+1 into expected from public.command_center_agency_replay_choices where owner_id=u and project_id=btrim(p_project_id) and run_id=btrim(p_run_id);
  if p_sequence<>expected then raise exception 'Replay sequence gap: expected %, got %',expected,p_sequence; end if;
  insert into public.command_center_agency_replay_choices(owner_id,project_id,run_id,sequence,kind,input_hash,output_hash,chosen_value_ref,chosen_value_hash,evidence_refs)
  values(u,btrim(p_project_id),btrim(p_run_id),p_sequence,p_kind,p_input_hash,p_output_hash,btrim(p_chosen_value_ref),p_chosen_value_hash,p_evidence_refs);
  return jsonb_build_object('run_id',btrim(p_run_id),'sequence',p_sequence,'kind',p_kind,'recorded',true);
end $$;

create or replace function public.command_center_agency_replay_fixture(
  p_project_id text,p_source_run_id text,p_fixture_ref text,p_fixture_hash text,p_expected_choices jsonb,p_evidence_refs text[],p_replayed_at timestamptz
) returns jsonb language plpgsql security definer set search_path='' as $$
declare
  u uuid:=auth.uid();
  actual record;
  expected jsonb;
  idx integer:=0;
  observed integer:=0;
  expected_count integer;
  mismatch bigint;
  v_result text:='matched';
  v_id uuid;
begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  if not exists(select 1 from public.command_center_agency_runs where owner_id=u and project_id=btrim(p_project_id) and run_id=btrim(p_source_run_id)) then raise exception 'Replay source run not found'; end if;
  if coalesce(btrim(p_fixture_ref),'')='' or coalesce(p_fixture_hash,'') !~ '^[a-f0-9]{64}$' or jsonb_typeof(p_expected_choices)<>'array' then raise exception 'Invalid replay fixture'; end if;
  perform command_center_private.c3_assert_unique_text_array(p_evidence_refs,'Replay fixture evidence');
  if cardinality(coalesce(p_evidence_refs,'{}'::text[]))=0 then raise exception 'Replay requires evidence'; end if;
  expected_count:=jsonb_array_length(p_expected_choices);
  for actual in select * from public.command_center_agency_replay_choices where owner_id=u and project_id=btrim(p_project_id) and run_id=btrim(p_source_run_id) order by sequence loop
    observed:=observed+1; idx:=idx+1;
    if idx>expected_count then mismatch:=actual.sequence; v_result:='mismatch'; exit; end if;
    expected:=p_expected_choices->(idx-1);
    if coalesce((expected->>'sequence')::bigint,-1)<>actual.sequence
       or coalesce(expected->>'kind','')<>actual.kind
       or coalesce(expected->>'inputHash','')<>actual.input_hash
       or coalesce(expected->>'outputHash','')<>actual.output_hash
       or coalesce(expected->>'chosenValueHash','')<>actual.chosen_value_hash then
      mismatch:=actual.sequence; v_result:='mismatch'; exit;
    end if;
  end loop;
  if v_result='matched' and observed<>expected_count then v_result:='mismatch'; mismatch:=observed+1; end if;
  insert into public.command_center_agency_replay_runs(owner_id,project_id,source_run_id,fixture_ref,fixture_hash,expected_choice_count,observed_choice_count,result,mismatch_sequence,evidence_refs,replayed_at)
  values(u,btrim(p_project_id),btrim(p_source_run_id),btrim(p_fixture_ref),p_fixture_hash,expected_count,observed,v_result,mismatch,p_evidence_refs,p_replayed_at) returning replay_id into v_id;
  return jsonb_build_object('replay_id',v_id,'result',v_result,'expected_choice_count',expected_count,'observed_choice_count',observed,'mismatch_sequence',mismatch,'protected_side_effects_executed',false);
end $$;

revoke all on function public.command_center_agency_record_replay_choice(text,text,bigint,text,text,text,text,text,text[]) from public,anon;
revoke all on function public.command_center_agency_replay_fixture(text,text,text,text,jsonb,text[],timestamptz) from public,anon;
grant execute on function public.command_center_agency_record_replay_choice(text,text,bigint,text,text,text,text,text,text[]) to authenticated;
grant execute on function public.command_center_agency_replay_fixture(text,text,text,text,jsonb,text[],timestamptz) to authenticated;
