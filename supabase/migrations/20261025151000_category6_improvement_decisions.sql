-- Category 6 / P6.13 — governed owner decisions for Improvements Center proposals.
-- Branch-only migration. Decisions remain explicit; accepted proposals still do not mutate roadmap directly.

create table if not exists public.command_center_brain_improvement_decisions (
  owner_id uuid not null references auth.users(id) on delete cascade,
  improvement_id uuid not null references public.command_center_brain_improvement_proposals(improvement_id) on delete restrict,
  decision text not null check (decision in ('accepted','rejected')),
  owner_decision_ref text not null check (length(btrim(owner_decision_ref)) between 1 and 1000),
  evidence_refs text[] not null check (cardinality(evidence_refs)>0),
  decided_at timestamptz not null default now(),
  primary key(owner_id,improvement_id)
);

alter table public.command_center_brain_improvement_decisions enable row level security;
revoke all on table public.command_center_brain_improvement_decisions from public,anon,authenticated;
grant select on table public.command_center_brain_improvement_decisions to authenticated;
drop policy if exists c6_owner_select_command_center_brain_improvement_decisions on public.command_center_brain_improvement_decisions;
create policy c6_owner_select_command_center_brain_improvement_decisions
  on public.command_center_brain_improvement_decisions
  for select to authenticated
  using (owner_id=(select auth.uid()) and (select public.is_command_center_authorized()));

create or replace function public.command_center_brain_decide_improvement(
  p_improvement_id uuid,
  p_expected_state text,
  p_decision text,
  p_owner_decision_ref text,
  p_evidence_refs text[]
) returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  u uuid:=auth.uid();
  i public.command_center_brain_improvement_proposals%rowtype;
  v_now timestamptz:=now();
begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  if p_decision not in ('accepted','rejected') then raise exception 'Improvement decision must be accepted or rejected'; end if;
  if coalesce(btrim(p_owner_decision_ref),'')='' then raise exception 'Improvement decision requires owner decision reference'; end if;
  perform command_center_private.c3_assert_unique_text_array(p_evidence_refs,'Improvement decision evidence');
  if cardinality(coalesce(p_evidence_refs,'{}'::text[]))=0 then raise exception 'Improvement decision requires evidence'; end if;

  select * into i
  from public.command_center_brain_improvement_proposals
  where owner_id=u and improvement_id=p_improvement_id
  for update;
  if not found then raise exception 'Improvement proposal not found'; end if;

  if i.state<>p_expected_state then raise exception 'Improvement state changed; refresh before deciding'; end if;
  if i.state<>'proposed' then raise exception 'Only a proposed improvement may be decided'; end if;

  insert into public.command_center_brain_improvement_decisions(owner_id,improvement_id,decision,owner_decision_ref,evidence_refs,decided_at)
  values(u,i.improvement_id,p_decision,btrim(p_owner_decision_ref),p_evidence_refs,v_now);

  update public.command_center_brain_improvement_proposals
  set state=p_decision, decided_at=v_now
  where owner_id=u and improvement_id=i.improvement_id;

  return jsonb_build_object(
    'improvement_id',i.improvement_id,
    'state',p_decision,
    'owner_decision_ref',btrim(p_owner_decision_ref),
    'evidence_refs',p_evidence_refs,
    'decided_at',v_now,
    'installs_automatically',false,
    'roadmap_mutated',false
  );
end $$;

revoke all on function public.command_center_brain_decide_improvement(uuid,text,text,text,text[]) from public,anon;
grant execute on function public.command_center_brain_decide_improvement(uuid,text,text,text,text[]) to authenticated;
