-- Category 6 / P6.3 — durable Brain memory governance.
-- Branch-only migration. Committing this file does not change production.

alter table public.command_center_brain_memories
  drop constraint if exists command_center_brain_memories_kind_check;

alter table public.command_center_brain_memories
  add constraint command_center_brain_memories_kind_check
  check (kind in ('fact','decision','rule','preference','goal','asset','history','owner_input','constraint','instruction','unknown','observation','precedent'));

alter table public.command_center_brain_memories
  add column if not exists retention_policy text not null default 'project_lifetime'
    check (retention_policy in ('permanent','project_lifetime','time_bounded','owner_review','legal_hold')),
  add column if not exists retention_expires_at timestamptz,
  add column if not exists retention_reason text not null default 'default_project_lifetime'
    check (length(btrim(retention_reason)) between 1 and 500),
  add constraint command_center_brain_memory_retention_window_check
    check ((retention_policy='time_bounded' and retention_expires_at is not null) or (retention_policy<>'time_bounded' and retention_expires_at is null));

create table if not exists public.command_center_brain_memory_retention_events (
  event_id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  memory_id uuid not null references public.command_center_brain_memories(memory_id) on delete cascade,
  previous_policy text,
  new_policy text not null check (new_policy in ('permanent','project_lifetime','time_bounded','owner_review','legal_hold')),
  previous_expires_at timestamptz,
  new_expires_at timestamptz,
  reason text not null check (length(btrim(reason)) between 1 and 500),
  evidence_refs text[] not null check (cardinality(evidence_refs) > 0),
  occurred_at timestamptz not null,
  recorded_at timestamptz not null default now(),
  check ((new_policy='time_bounded' and new_expires_at is not null) or (new_policy<>'time_bounded' and new_expires_at is null)),
  check (occurred_at <= recorded_at + interval '5 minutes')
);
create index if not exists command_center_brain_memory_retention_events_idx
  on public.command_center_brain_memory_retention_events(owner_id,memory_id,occurred_at,event_id);

alter table public.command_center_brain_memory_retention_events enable row level security;
revoke all on table public.command_center_brain_memory_retention_events from public,anon,authenticated;
grant select on table public.command_center_brain_memory_retention_events to authenticated;
drop policy if exists c6_owner_select_brain_memory_retention_events on public.command_center_brain_memory_retention_events;
create policy c6_owner_select_brain_memory_retention_events
  on public.command_center_brain_memory_retention_events for select to authenticated
  using (owner_id=(select auth.uid()) and (select public.is_command_center_authorized()));

create or replace function public.command_center_brain_set_memory_retention(
  p_memory_id uuid,
  p_new_policy text,
  p_new_expires_at timestamptz,
  p_reason text,
  p_evidence_refs text[],
  p_occurred_at timestamptz
)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
  u uuid:=auth.uid();
  m public.command_center_brain_memories%rowtype;
begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  if p_new_policy not in ('permanent','project_lifetime','time_bounded','owner_review','legal_hold') then raise exception 'Invalid memory retention policy'; end if;
  if (p_new_policy='time_bounded' and p_new_expires_at is null) or (p_new_policy<>'time_bounded' and p_new_expires_at is not null) then raise exception 'Retention expiry does not match policy'; end if;
  if coalesce(btrim(p_reason),'')='' then raise exception 'Retention change requires reason'; end if;
  perform command_center_private.c5_assert_unique_text_array(p_evidence_refs,'Memory retention evidence');
  if cardinality(coalesce(p_evidence_refs,'{}'::text[]))=0 then raise exception 'Retention change requires evidence'; end if;

  select * into m from public.command_center_brain_memories where owner_id=u and memory_id=p_memory_id for update;
  if not found then raise exception 'Brain memory not found'; end if;

  update public.command_center_brain_memories
  set retention_policy=p_new_policy,retention_expires_at=p_new_expires_at,retention_reason=btrim(p_reason)
  where owner_id=u and memory_id=m.memory_id;

  insert into public.command_center_brain_memory_retention_events(
    owner_id,memory_id,previous_policy,new_policy,previous_expires_at,new_expires_at,reason,evidence_refs,occurred_at
  ) values(
    u,m.memory_id,m.retention_policy,p_new_policy,m.retention_expires_at,p_new_expires_at,btrim(p_reason),p_evidence_refs,p_occurred_at
  );

  return jsonb_build_object('memory_id',m.memory_id,'retention_policy',p_new_policy,'retention_expires_at',p_new_expires_at);
end $$;

revoke all on function public.command_center_brain_set_memory_retention(uuid,text,timestamptz,text,text[],timestamptz) from public,anon;
grant execute on function public.command_center_brain_set_memory_retention(uuid,text,timestamptz,text,text[],timestamptz) to authenticated;
