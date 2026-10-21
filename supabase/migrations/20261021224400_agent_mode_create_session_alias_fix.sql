-- Fix PL/pgSQL record/table alias shadowing in Agent Mode session creation.
create or replace function public.command_center_agent_create_session(
  p_objective text,
  p_project_ids text[],
  p_primary_project_id text,
  p_success_criteria jsonb default '[]'::jsonb,
  p_excluded_scope jsonb default '[]'::jsonb,
  p_permission_envelope jsonb default '{"allowed_tool_categories":[],"allow_work":false}'::jsonb,
  p_execution_policy jsonb default '{}'::jsonb,
  p_books_targets jsonb default '{}'::jsonb,
  p_dry_run boolean default false,
  p_scope_mode text default 'explicit_multi_project'
) returns uuid language plpgsql security definer set search_path to '' as $$
declare
  u uuid:=(select auth.uid());
  sid uuid;
  proj record;
  n integer;
begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  if coalesce(btrim(p_objective),'')='' then raise exception 'Agent objective is required'; end if;
  if p_scope_mode not in ('project_only','explicit_multi_project') then raise exception 'Invalid Agent scope mode'; end if;
  if p_project_ids is null or cardinality(p_project_ids)=0 then raise exception 'Explicit project scope is required'; end if;
  select count(*) into n from (select distinct x from unnest(p_project_ids) x) q;
  if n<>cardinality(p_project_ids) then raise exception 'Duplicate project IDs are not allowed'; end if;
  if p_scope_mode='project_only' and cardinality(p_project_ids)<>1 then raise exception 'Project-only Agent Mode requires exactly one project'; end if;
  if not (p_primary_project_id=any(p_project_ids)) then raise exception 'Primary project must be inside explicit project scope'; end if;
  if jsonb_typeof(coalesce(p_permission_envelope,'{}'::jsonb))<>'object' then raise exception 'Permission envelope must be an object'; end if;
  if jsonb_typeof(coalesce(p_permission_envelope->'allowed_tool_categories','[]'::jsonb))<>'array' then raise exception 'allowed_tool_categories must be an array'; end if;
  if jsonb_typeof(coalesce(p_books_targets,'{}'::jsonb))<>'object' then raise exception 'Books targets must be an object'; end if;
  if exists(select 1 from unnest(p_project_ids) x(id) left join public.projects prj on prj.id=x.id and prj.owner_id=u where prj.id is null) then raise exception 'Project scope contains a missing or unauthorized project'; end if;
  for proj in select prj.id,prj.category from public.projects prj join unnest(p_project_ids) x(id) on x.id=prj.id where prj.owner_id=u loop
    if lower(coalesce(proj.category,'')) like '%book%' and coalesce(btrim(p_books_targets->>proj.id),'')='' then
      raise exception 'Books project % requires an explicit named Books target',proj.id;
    end if;
  end loop;
  insert into public.agent_sessions(owner_id,objective,success_criteria,excluded_scope,scope_mode,primary_project_id,current_project_id,permission_envelope,execution_policy,dry_run)
  values(u,btrim(p_objective),coalesce(p_success_criteria,'[]'::jsonb),coalesce(p_excluded_scope,'[]'::jsonb),p_scope_mode,p_primary_project_id,p_primary_project_id,coalesce(p_permission_envelope,'{}'::jsonb),coalesce(p_execution_policy,'{}'::jsonb),coalesce(p_dry_run,false)) returning id into sid;
  insert into public.agent_session_projects(session_id,owner_id,project_id,sort_order,project_role,books_target)
  select sid,u,x.id,x.ord-1,case when x.id=p_primary_project_id then 'primary' else 'secondary' end,nullif(btrim(p_books_targets->>x.id),'')
  from unnest(p_project_ids) with ordinality x(id,ord);
  perform public.command_center_agent_log_event(u,sid,p_primary_project_id,null,'session_created','Agent session created',jsonb_build_object('scope_mode',p_scope_mode));
  return sid;
end $$;

revoke execute on function public.command_center_agent_create_session(text,text[],text,jsonb,jsonb,jsonb,jsonb,jsonb,boolean,text) from public,anon;
grant execute on function public.command_center_agent_create_session(text,text[],text,jsonb,jsonb,jsonb,jsonb,jsonb,boolean,text) to authenticated;
