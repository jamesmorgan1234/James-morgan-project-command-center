-- Category 6 / P6.11 — durable owner-precedent similarity evidence.
-- Branch-only migration. Historical decisions may inform defaults but can never inherit authorization.

create table if not exists public.command_center_brain_precedent_evaluations (
  evaluation_id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  project_id text,
  precedent_decision_ref text not null,
  precedent_project_type text not null,
  precedent_account_scope text not null,
  precedent_risk_class text not null,
  precedent_cost_class text not null,
  precedent_action_class text not null,
  current_project_type text not null,
  current_account_scope text not null,
  current_risk_class text not null,
  current_cost_class text not null,
  current_action_class text not null,
  applies boolean not null,
  reason text not null check (length(btrim(reason)) between 1 and 1000),
  authorization_inherited boolean not null default false check (authorization_inherited=false),
  evidence_refs text[] not null,
  evaluated_at timestamptz not null,
  recorded_at timestamptz not null default now(),
  foreign key(owner_id,project_id) references public.command_center_project_profiles(owner_id,project_id) on delete restrict,
  check (cardinality(evidence_refs)>0),
  check (evaluated_at<=recorded_at + interval '5 minutes')
);
create index if not exists command_center_brain_precedent_eval_idx
  on public.command_center_brain_precedent_evaluations(owner_id,project_id,evaluated_at desc,evaluation_id);

alter table public.command_center_brain_precedent_evaluations enable row level security;
revoke all on table public.command_center_brain_precedent_evaluations from public,anon,authenticated;
grant select on table public.command_center_brain_precedent_evaluations to authenticated;
drop policy if exists c6_owner_select_brain_precedent_evaluations on public.command_center_brain_precedent_evaluations;
create policy c6_owner_select_brain_precedent_evaluations
  on public.command_center_brain_precedent_evaluations for select to authenticated
  using (owner_id=(select auth.uid()) and (select public.is_command_center_authorized()));

create or replace function public.command_center_brain_record_precedent_evaluation(
  p_project_id text,p_precedent_decision_ref text,p_precedent_project_type text,p_precedent_account_scope text,p_precedent_risk_class text,p_precedent_cost_class text,p_precedent_action_class text,p_current_project_type text,p_current_account_scope text,p_current_risk_class text,p_current_cost_class text,p_current_action_class text,p_reusable_as_default boolean,p_evidence_refs text[],p_evaluated_at timestamptz
) returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); v_applies boolean; v_reason text; v_differences text[]:='{}'::text[]; begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  if nullif(btrim(coalesce(p_project_id,'')),'') is not null and not exists(select 1 from public.command_center_project_profiles where owner_id=u and project_id=btrim(p_project_id)) then raise exception 'Precedent project not found'; end if;
  if coalesce(btrim(p_precedent_decision_ref),'')='' then raise exception 'Precedent decision reference required'; end if;
  perform command_center_private.c3_assert_unique_text_array(p_evidence_refs,'Precedent evidence');
  if cardinality(coalesce(p_evidence_refs,'{}'::text[]))=0 then raise exception 'Precedent evaluation requires evidence'; end if;
  if p_precedent_project_type<>p_current_project_type then v_differences:=array_append(v_differences,'project_type'); end if;
  if p_precedent_account_scope<>p_current_account_scope then v_differences:=array_append(v_differences,'account_scope'); end if;
  if p_precedent_risk_class<>p_current_risk_class then v_differences:=array_append(v_differences,'risk_class'); end if;
  if p_precedent_cost_class<>p_current_cost_class then v_differences:=array_append(v_differences,'cost_class'); end if;
  if p_precedent_action_class<>p_current_action_class then v_differences:=array_append(v_differences,'action_class'); end if;
  if not p_reusable_as_default then v_applies:=false; v_reason:='precedent_not_reusable';
  elsif cardinality(v_differences)>0 then v_applies:=false; v_reason:='material_context_difference:'||array_to_string(v_differences,',');
  else v_applies:=true; v_reason:='same_material_context_default_only'; end if;
  insert into public.command_center_brain_precedent_evaluations(owner_id,project_id,precedent_decision_ref,precedent_project_type,precedent_account_scope,precedent_risk_class,precedent_cost_class,precedent_action_class,current_project_type,current_account_scope,current_risk_class,current_cost_class,current_action_class,applies,reason,authorization_inherited,evidence_refs,evaluated_at)
  values(u,nullif(btrim(coalesce(p_project_id,'')),''),btrim(p_precedent_decision_ref),p_precedent_project_type,p_precedent_account_scope,p_precedent_risk_class,p_precedent_cost_class,p_precedent_action_class,p_current_project_type,p_current_account_scope,p_current_risk_class,p_current_cost_class,p_current_action_class,v_applies,v_reason,false,p_evidence_refs,p_evaluated_at);
  return jsonb_build_object('applies',v_applies,'reason',v_reason,'authorization_inherited',false);
end $$;

revoke all on function public.command_center_brain_record_precedent_evaluation(text,text,text,text,text,text,text,text,text,text,text,text,boolean,text[],timestamptz) from public,anon;
grant execute on function public.command_center_brain_record_precedent_evaluation(text,text,text,text,text,text,text,text,text,text,text,text,boolean,text[],timestamptz) to authenticated;
