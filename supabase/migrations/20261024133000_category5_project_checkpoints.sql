-- Category 5 / P5.4 — durable project checkpoints and deterministic resume pointers.
-- Branch-only migration. No production state is changed by committing this file.

create table if not exists public.command_center_project_checkpoints (
  checkpoint_id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  project_id text not null,
  roadmap_version bigint not null,
  exact_next_work_unit_id text,
  blocker text,
  required_environment text check (required_environment is null or required_environment in ('pc','phone','local_browser','any_device')),
  owner_action text,
  verification_method text not null,
  evidence_refs text[] not null,
  resume_state_hash text not null check (resume_state_hash ~ '^[a-f0-9]{64}$'),
  created_at timestamptz not null,
  recorded_at timestamptz not null default now(),
  foreign key(owner_id,project_id,roadmap_version) references public.command_center_project_roadmaps(owner_id,project_id,version) on delete restrict,
  check (cardinality(evidence_refs)>0),
  check (length(btrim(verification_method)) between 1 and 1000),
  check (owner_action is null or required_environment is not null),
  check (created_at<=recorded_at + interval '5 minutes')
);
create index if not exists command_center_project_checkpoints_latest_idx
  on public.command_center_project_checkpoints(owner_id,project_id,created_at desc,checkpoint_id desc);

alter table public.command_center_project_checkpoints enable row level security;
revoke all on table public.command_center_project_checkpoints from public,anon,authenticated;
grant select on table public.command_center_project_checkpoints to authenticated;
drop policy if exists c5_owner_select_project_checkpoints on public.command_center_project_checkpoints;
create policy c5_owner_select_project_checkpoints
  on public.command_center_project_checkpoints for select to authenticated
  using (owner_id=(select auth.uid()) and (select public.is_command_center_authorized()));

create or replace function public.command_center_project_append_checkpoint(
  p_project_id text,
  p_roadmap_version bigint,
  p_exact_next_work_unit_id text,
  p_blocker text,
  p_required_environment text,
  p_owner_action text,
  p_verification_method text,
  p_evidence_refs text[],
  p_resume_state_hash text,
  p_created_at timestamptz
)
returns uuid language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); v_id uuid; v_next text:=nullif(btrim(coalesce(p_exact_next_work_unit_id,'')),''); begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  if not exists(select 1 from public.command_center_project_roadmaps where owner_id=u and project_id=btrim(p_project_id) and version=p_roadmap_version) then raise exception 'Roadmap version not found'; end if;
  if v_next is not null and not exists(select 1 from public.command_center_project_work_units where owner_id=u and project_id=btrim(p_project_id) and roadmap_version=p_roadmap_version and work_unit_id=v_next) then raise exception 'Exact next work unit not found in roadmap version'; end if;
  if coalesce(btrim(p_verification_method),'')='' then raise exception 'Checkpoint verification method is required'; end if;
  perform command_center_private.c5_assert_unique_text_array(p_evidence_refs,'Checkpoint evidence');
  if cardinality(coalesce(p_evidence_refs,'{}'::text[]))=0 then raise exception 'Checkpoint evidence is required'; end if;
  if coalesce(p_resume_state_hash,'') !~ '^[a-f0-9]{64}$' then raise exception 'Resume-state hash must be SHA-256 hex'; end if;
  if nullif(btrim(coalesce(p_owner_action,'')),'') is not null and p_required_environment not in ('pc','phone','local_browser','any_device') then raise exception 'Owner action requires a valid environment'; end if;

  insert into public.command_center_project_checkpoints(owner_id,project_id,roadmap_version,exact_next_work_unit_id,blocker,required_environment,owner_action,verification_method,evidence_refs,resume_state_hash,created_at)
  values(u,btrim(p_project_id),p_roadmap_version,v_next,nullif(btrim(coalesce(p_blocker,'')),''),nullif(btrim(coalesce(p_required_environment,'')),''),nullif(btrim(coalesce(p_owner_action,'')),''),btrim(p_verification_method),p_evidence_refs,p_resume_state_hash,p_created_at)
  returning checkpoint_id into v_id;
  return v_id;
end $$;

revoke all on function public.command_center_project_append_checkpoint(text,bigint,text,text,text,text,text,text[],text,timestamptz) from public,anon;
grant execute on function public.command_center_project_append_checkpoint(text,bigint,text,text,text,text,text,text[],text,timestamptz) to authenticated;
