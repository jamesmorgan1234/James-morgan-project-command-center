-- Preserve the source checkpoint alongside the project profile. Import labels and
-- absent percentages are not evidence of zero completion. No financial data,
-- historical metric, completed work, or owner execution permission is changed.
alter table public.command_center_project_profiles
  add column if not exists stage text,
  add column if not exists next_action text,
  add column if not exists blocker text,
  add column if not exists status_observed_at timestamptz,
  add column if not exists status_source_refs text[] not null default '{}'::text[],
  add column if not exists progress_summary text;

update public.command_center_project_profiles p
set stage=c.stage,next_action=c.next_action,blocker=c.blocker,
    status_observed_at=case when c.last_verified ~ '^\d{4}-\d{2}-\d{2}' then c.last_verified::timestamptz else c.updated_at end,
    status_source_refs=array['supabase:cc7_projects:'||c.id]
from public.cc7_projects c
where p.owner_id=c.owner_id and p.project_id=c.id and p.stage is null;

-- ARO's frozen candidate is already built and tested. These are saved checkpoint
-- results, not tests rerun by this migration. No supported numeric denominator
-- exists, and the remaining host/certification gates must not be marked complete.
update public.command_center_project_profiles
set status='Software candidate verified / final integration',
    stage='Frozen candidate verified: 876/876 regression tests and 92/92 compile checks. Remaining: genuine Command Center provider-host integration and final operational certification.',
    verification='Saved 2026-10-25 candidate evidence: 876/876 PASS; 92/92 compile PASS; 86 migrations; integrity ok/ok. Not a fresh runtime certification.',
    progress_summary='Final integration',
    next_action='Connect and verify the genuine $0 Command Center host capabilities, then resume final readiness, independent operational certification and unlock against the frozen candidate.',
    blocker='Host capabilities not connected: task_synthesis, independent_qa, public_research, account_state_checker, external_result_monitor. Operational certification and roadmap unlock remain incomplete.',
    status_observed_at='2026-10-25T22:56:50Z',
    status_source_refs=array['library:libfile_98069b48f5fc8191b81e67c4421d879c','library:libfile_0e960c0bed888191ac1a44369f05b7b8','sha256:720bbbcf3d170e2a9927384d65da7afa1702d6a46adf52d1df60c1f32b14c232'],
    version=version+1,updated_at=now()
where project_id='aro' and status='Recovered first-class project';

-- The production shell used JSON for an empty work-unit column. Align it to the
-- existing Category 5 migration, rather than inventing replacement authoring RPCs.
do $$ begin
  if exists(select 1 from information_schema.columns where table_schema='public' and table_name='command_center_project_work_units' and column_name='acceptance_criteria' and data_type='jsonb') then
    if exists(select 1 from public.command_center_project_work_units) then
      raise exception 'Work units exist; review criteria conversion before applying';
    end if;
    alter table public.command_center_project_work_units alter column acceptance_criteria drop default;
    alter table public.command_center_project_work_units alter column acceptance_criteria type text[] using '{}'::text[];
    alter table public.command_center_project_work_units alter column acceptance_criteria set default '{}'::text[];
  end if;
end $$;
alter table public.command_center_project_roadmaps add column if not exists superseded_at timestamptz;

-- Existing Category 5 validator, copied verbatim from its authoritative registry migration.
create or replace function command_center_private.c5_assert_unique_text_array(p_values text[],p_label text)
returns void language plpgsql immutable set search_path='' as $$
begin
  if exists(select 1 from unnest(coalesce(p_values,'{}'::text[])) v where coalesce(btrim(v),'')='') then
    raise exception '% entries cannot be blank',p_label;
  end if;
  if exists(select 1 from unnest(coalesce(p_values,'{}'::text[])) v group by v having count(*)>1) then
    raise exception '% entries must be unique',p_label;
  end if;
end $$;
revoke all on function command_center_private.c5_assert_unique_text_array(text[],text) from public,anon,authenticated;


-- Newer VeloClip source checkpoint supersedes the imported checkpoint-090/TLS-only
-- description. Keep the canonical 094 baseline distinct from its unpromoted draft.
update public.command_center_project_profiles
set status='Substantial build / release verification',
    stage='Checkpoint094 OFFLINE_CANONICAL: 305 files; saved historical regression 1535/1535 PASS. Separate 308-file unpromoted draft: 199/199 focused PASS; no complete-suite run.',
    verification='2026-10-24 exhaustive audit snapshot: Checkpoint094 retained; older 087-092 must not overwrite it. Draft and canonical bytes require verification on the source device.',
    next_action='Resume the exact Checkpoint094 working draft; verify source bytes and remaining writer/model, media, worker/recovery and release checks before promotion or live provider acceptance.',
    blocker='Current Windows source is required for further build verification. No production writing model is accepted; publishing remains disabled and live provider acceptance is unverified.',
    status_observed_at='2026-10-24T00:00:00Z',
    status_source_refs=array['library:libfile_ca675b19aba88191b0e1da73eb746ad9','sha256:1be04e2a14a98ea06bb16d05fcc61aca74e4947b7e75e8f3669c14a1cd6a6701'],
    version=version+1,updated_at=now()
where project_id='velo-clip' and status='Blocked / local HTTPS trust';
