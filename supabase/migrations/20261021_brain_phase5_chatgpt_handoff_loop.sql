create table if not exists public.brain_handoffs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  project_id text references public.projects(id) on delete set null,
  context_packet_id uuid references public.brain_context_packets(id) on delete set null,
  plan_id uuid references public.brain_plans(id) on delete set null,
  task_ids uuid[] not null default '{}'::uuid[],
  title text not null,
  destination text not null default 'chatgpt' check (destination in ('chatgpt')),
  handoff_text text not null default '',
  response_text text not null default '',
  response_source_ref text,
  status text not null default 'draft' check (status in ('draft','sent','returned','verified','archived')),
  metadata jsonb not null default '{}'::jsonb,
  sent_at timestamptz,
  returned_at timestamptz,
  verified_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.brain_handoffs enable row level security;
revoke all on public.brain_handoffs from anon;
grant select, insert, update, delete on public.brain_handoffs to authenticated;

create policy brain_handoffs_select_own on public.brain_handoffs for select to authenticated
using (owner_id = (select auth.uid()) and (select public.is_command_center_authorized()));
create policy brain_handoffs_insert_own on public.brain_handoffs for insert to authenticated
with check (owner_id = (select auth.uid()) and (select public.is_command_center_authorized()));
create policy brain_handoffs_update_own on public.brain_handoffs for update to authenticated
using (owner_id = (select auth.uid()) and (select public.is_command_center_authorized()))
with check (owner_id = (select auth.uid()) and (select public.is_command_center_authorized()));
create policy brain_handoffs_delete_own on public.brain_handoffs for delete to authenticated
using (owner_id = (select auth.uid()) and (select public.is_command_center_authorized()));

create index brain_handoffs_owner_updated_idx on public.brain_handoffs(owner_id, updated_at desc);
create index brain_handoffs_owner_project_idx on public.brain_handoffs(owner_id, project_id, updated_at desc);
create index brain_handoffs_owner_status_idx on public.brain_handoffs(owner_id, status, updated_at desc);
create index brain_handoffs_task_ids_idx on public.brain_handoffs using gin(task_ids);

create trigger brain_handoffs_set_updated_at
before update on public.brain_handoffs
for each row execute function public.command_center_set_updated_at();

create or replace function public.verify_brain_handoff_result(p_handoff_id uuid, p_memory_title text default null)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_owner uuid := auth.uid();
  v_handoff public.brain_handoffs%rowtype;
  v_memory_id uuid;
  v_title text;
begin
  if v_owner is null or not public.is_command_center_authorized() then
    raise exception 'Not authorized';
  end if;
  select * into v_handoff
  from public.brain_handoffs
  where id = p_handoff_id and owner_id = v_owner
  for update;
  if not found then raise exception 'Handoff not found'; end if;
  if btrim(coalesce(v_handoff.response_text,'')) = '' then raise exception 'Returned response is required'; end if;
  if v_handoff.status = 'verified' then
    select (metadata->>'verified_memory_id')::uuid into v_memory_id from public.brain_handoffs where id=p_handoff_id;
    return v_memory_id;
  end if;
  v_title := coalesce(nullif(btrim(p_memory_title),''), 'Verified ChatGPT result · ' || v_handoff.title);
  insert into public.brain_memories(
    owner_id, project_id, memory_type, title, body, tags, importance, origin,
    trust_state, source_ref, sharing_scope, metadata, status
  ) values (
    v_owner, v_handoff.project_id, 'reference', v_title, v_handoff.response_text,
    array['chatgpt-handoff','verified-result'], 4, 'chat', 'verified',
    coalesce(v_handoff.response_source_ref, 'brain_handoff:'||v_handoff.id::text),
    case when v_handoff.project_id is null then 'command_center' else 'project' end,
    jsonb_build_object('handoff_id',v_handoff.id,'context_packet_id',v_handoff.context_packet_id,'plan_id',v_handoff.plan_id),
    'active'
  ) returning id into v_memory_id;
  update public.brain_handoffs
  set status='verified', verified_at=now(), metadata=coalesce(metadata,'{}'::jsonb)||jsonb_build_object('verified_memory_id',v_memory_id)
  where id=p_handoff_id and owner_id=v_owner;
  return v_memory_id;
end;
$$;

grant execute on function public.verify_brain_handoff_result(uuid,text) to authenticated;
revoke execute on function public.verify_brain_handoff_result(uuid,text) from anon;
