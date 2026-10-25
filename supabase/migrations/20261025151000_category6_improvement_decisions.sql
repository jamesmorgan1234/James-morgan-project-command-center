-- Category 6 / P6.13 — governed owner decisions for Improvements Center proposals.
-- Branch-only migration. Decisions remain explicit; accepted proposals still do not mutate roadmap directly.

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
