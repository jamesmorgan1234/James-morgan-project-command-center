-- Project Brain Phase 2 reliability: atomically promote one ready brainstorm item into Durable Memory.
create or replace function public.commit_brainstorm_item(p_item_id uuid, p_decision_note text default null)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_owner uuid := auth.uid();
  v_item public.brainstorm_items%rowtype;
  v_memory public.brain_memories%rowtype;
  v_note text;
begin
  if v_owner is null or not public.is_command_center_authorized() then
    raise exception 'Command Center authorization required';
  end if;

  select * into v_item
  from public.brainstorm_items
  where id = p_item_id and owner_id = v_owner
  for update;

  if not found then
    raise exception 'Brainstorm item not found';
  end if;

  if v_item.stage = 'committed' and v_item.linked_memory_id is not null then
    return jsonb_build_object('brainstorm_id',v_item.id,'memory_id',v_item.linked_memory_id,'already_committed',true);
  end if;

  if v_item.stage <> 'ready' then
    raise exception 'Brainstorm item must be ready before commit';
  end if;

  v_note := coalesce(nullif(btrim(p_decision_note),''),v_item.decision_note,'');

  insert into public.brain_memories (
    owner_id,project_id,memory_type,title,body,tags,importance,origin,trust_state,
    source_ref,canonical_key,sharing_scope,metadata,status
  ) values (
    v_owner,v_item.project_id,'decision',v_item.title,v_item.body,v_item.tags,v_item.priority,
    'manual','verified','Brainstorm Workspace','brainstorm:' || v_item.id::text,'private_project',
    jsonb_build_object('brainstorm_item_id',v_item.id,'decision_note',v_note),'active'
  )
  returning * into v_memory;

  update public.brainstorm_items
  set stage='committed',decision_note=v_note,linked_memory_id=v_memory.id,
      committed_at=now(),archived_at=null
  where id=v_item.id and owner_id=v_owner
  returning * into v_item;

  return jsonb_build_object('brainstorm_id',v_item.id,'memory_id',v_memory.id,'already_committed',false);
end;
$$;

revoke all on function public.commit_brainstorm_item(uuid,text) from public, anon;
grant execute on function public.commit_brainstorm_item(uuid,text) to authenticated;
comment on function public.commit_brainstorm_item(uuid,text) is 'Atomically promotes one ready owner-scoped Brainstorm Workspace item into Durable Memory and links the two records.';
