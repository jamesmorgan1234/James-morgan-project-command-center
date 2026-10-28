-- Match protected runtime lifecycle semantics without rewriting historical evidence.
create function command_center_private.p12_8_lifecycle_transition() returns trigger language plpgsql set search_path='' as $$
declare prior public.command_center_specialist_project_history; target public.command_center_specialist_projects;
begin
 perform pg_advisory_xact_lock(hashtextextended(new.owner_user_id::text||':'||new.project_ref,12));
 if not exists(select 1 from public.command_center_specialist_projects p where p.owner_user_id=new.owner_user_id and p.project_ref=new.project_ref and p.type_key=new.type_key and p.canonical_ref=new.canonical_ref) then raise exception 'Lifecycle canonical project binding mismatch';end if;
 select * into prior from public.command_center_specialist_project_history where owner_user_id=new.owner_user_id and project_ref=new.project_ref order by version desc limit 1;
 if not found then
  if new.action<>'register' or new.version<>1 or new.lifecycle_status not in ('active','dormant') or new.replaced_by_project_ref is not null then raise exception 'Lifecycle must begin with valid registration';end if;
 else
  if new.version<>prior.version+1 or new.occurred_at<prior.occurred_at or new.type_key<>prior.type_key or new.canonical_ref<>prior.canonical_ref then raise exception 'Lifecycle version/time/identity conflict';end if;
  if new.action='register' then raise exception 'Duplicate lifecycle registration';end if;
  if new.action in ('rename','merge','replace','dormant','archive') and prior.lifecycle_status not in ('active','dormant') then raise exception 'Inactive lifecycle transition rejected';end if;
  if new.action='rename' and new.lifecycle_status<>prior.lifecycle_status then raise exception 'Rename cannot change lifecycle state';end if;
  if new.action='dormant' and new.lifecycle_status<>'dormant' then raise exception 'Dormant transition invalid';end if;
  if new.action='activate' and (prior.lifecycle_status<>'dormant' or new.lifecycle_status<>'active') then raise exception 'Activation requires dormant source';end if;
  if new.action='archive' and new.lifecycle_status<>'archived' then raise exception 'Archive transition invalid';end if;
  if new.action='recover' and (new.lifecycle_status<>prior.lifecycle_status or new.display_name<>prior.display_name or new.provider_capabilities<>prior.provider_capabilities or new.replaced_by_project_ref is distinct from prior.replaced_by_project_ref) then raise exception 'Recovery cannot resurrect authority/state';end if;
  if new.action in ('merge','replace') then
   select * into target from public.command_center_specialist_projects where owner_user_id=new.owner_user_id and project_ref=new.replaced_by_project_ref;
   if not found or target.project_ref=new.project_ref or target.type_key<>new.type_key or target.lifecycle_status not in ('active','dormant') or new.lifecycle_status<>'replaced' then raise exception 'Replacement/merge target must be distinct live same-owner/type';end if;
  elsif new.replaced_by_project_ref is distinct from prior.replaced_by_project_ref then raise exception 'Replacement lineage cannot be silently changed';end if;
 end if;
 return new;
end$$;
create trigger p12_8_lifecycle_transition before insert on public.command_center_specialist_project_history for each row execute function command_center_private.p12_8_lifecycle_transition();
-- Protected writes occur only through the trusted control-plane server after current C2 checks.
revoke insert,update,delete on public.command_center_specialist_projects,public.command_center_specialist_project_history,public.command_center_specialist_lifecycle_history from public,anon,authenticated;
grant select,insert,update on public.command_center_specialist_projects to service_role;
grant select,insert on public.command_center_specialist_project_history,public.command_center_specialist_lifecycle_history to service_role;
revoke all on function command_center_private.p12_8_lifecycle_transition() from public,anon,authenticated;
create function command_center_private.p12_8_lifecycle_current_projection() returns trigger language plpgsql set search_path='' as $$
begin
 update public.command_center_specialist_projects set display_name=new.display_name,lifecycle_status=new.lifecycle_status,provider_capabilities=new.provider_capabilities,replaced_by_project_ref=new.replaced_by_project_ref,version=new.version,updated_at=greatest(now(),new.occurred_at) where owner_user_id=new.owner_user_id and project_ref=new.project_ref;
 return new;
end$$;
create trigger p12_8_lifecycle_current_projection after insert on public.command_center_specialist_project_history for each row execute function command_center_private.p12_8_lifecycle_current_projection();
revoke all on function command_center_private.p12_8_lifecycle_current_projection() from public,anon,authenticated;
