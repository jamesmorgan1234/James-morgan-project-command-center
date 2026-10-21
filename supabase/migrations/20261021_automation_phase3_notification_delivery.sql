-- Command Center Brain — Automation Phase 3: Notification Delivery
-- A scheduler dispatch becomes one durable owner-scoped Command Center alert only when no condition is required
-- or its attached condition evaluates true. This phase delivers alerts; it does not generate reports or execute actions.

create table if not exists public.automation_notifications (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  project_id text null references public.projects(id) on delete set null,
  schedule_id uuid null references public.automation_schedules(id) on delete set null,
  dispatch_id uuid null references public.automation_dispatch_queue(id) on delete set null,
  condition_id uuid null references public.automation_conditions(id) on delete set null,
  title text not null,
  message text not null,
  severity text not null default 'info' check (severity in ('info','attention')),
  status text not null default 'unread' check (status in ('unread','read','archived')),
  delivered_at timestamptz not null default now(),
  read_at timestamptz null,
  browser_shown_at timestamptz null,
  archived_at timestamptz null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists automation_notifications_dispatch_uidx
  on public.automation_notifications(dispatch_id) where dispatch_id is not null;
create index if not exists automation_notifications_owner_status_idx
  on public.automation_notifications(owner_id,status,delivered_at desc);
create index if not exists automation_notifications_owner_project_idx
  on public.automation_notifications(owner_id,project_id,delivered_at desc);

create table if not exists public.automation_notification_preferences (
  owner_id uuid primary key references auth.users(id) on delete cascade,
  browser_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.automation_dispatch_queue
  add column if not exists notification_state text not null default 'pending'
    check (notification_state in ('pending','delivered','suppressed','error')),
  add column if not exists notification_delivered_at timestamptz null;

create index if not exists automation_dispatch_notification_state_idx
  on public.automation_dispatch_queue(owner_id,notification_state,scheduled_for desc);

alter table public.automation_notifications enable row level security;
alter table public.automation_notification_preferences enable row level security;

drop policy if exists automation_notifications_select_own on public.automation_notifications;
create policy automation_notifications_select_own on public.automation_notifications for select using (
  owner_id=(select auth.uid()) and (select public.is_command_center_authorized())
);

drop policy if exists automation_notification_preferences_select_own on public.automation_notification_preferences;
create policy automation_notification_preferences_select_own on public.automation_notification_preferences for select using (
  owner_id=(select auth.uid()) and (select public.is_command_center_authorized())
);
drop policy if exists automation_notification_preferences_insert_own on public.automation_notification_preferences;
create policy automation_notification_preferences_insert_own on public.automation_notification_preferences for insert with check (
  owner_id=(select auth.uid()) and (select public.is_command_center_authorized())
);
drop policy if exists automation_notification_preferences_update_own on public.automation_notification_preferences;
create policy automation_notification_preferences_update_own on public.automation_notification_preferences for update using (
  owner_id=(select auth.uid()) and (select public.is_command_center_authorized())
) with check (
  owner_id=(select auth.uid()) and (select public.is_command_center_authorized())
);
drop policy if exists automation_notification_preferences_delete_own on public.automation_notification_preferences;
create policy automation_notification_preferences_delete_own on public.automation_notification_preferences for delete using (
  owner_id=(select auth.uid()) and (select public.is_command_center_authorized())
);

revoke all on public.automation_notifications from anon, authenticated;
grant select on public.automation_notifications to authenticated;
grant select,insert,update,delete on public.automation_notification_preferences to authenticated;

create or replace function public.command_center_prepare_automation_notification()
returns trigger
language plpgsql
set search_path=public,pg_temp
as $$
begin
  new.title:=btrim(new.title);
  new.message:=btrim(new.message);
  if new.title='' then raise exception 'Notification title is required'; end if;
  if new.message='' then raise exception 'Notification message is required'; end if;
  if new.status='archived' then new.archived_at:=coalesce(new.archived_at,now());
  else new.archived_at:=null;
  end if;
  return new;
end;
$$;

drop trigger if exists automation_notifications_prepare on public.automation_notifications;
create trigger automation_notifications_prepare before insert or update on public.automation_notifications
for each row execute function public.command_center_prepare_automation_notification();

drop trigger if exists automation_notifications_set_updated_at on public.automation_notifications;
create trigger automation_notifications_set_updated_at before update on public.automation_notifications
for each row execute function public.command_center_set_updated_at();

drop trigger if exists automation_notification_preferences_set_updated_at on public.automation_notification_preferences;
create trigger automation_notification_preferences_set_updated_at before update on public.automation_notification_preferences
for each row execute function public.command_center_set_updated_at();

create or replace function public.command_center_notification_set_state(
  p_notification_id uuid,
  p_action text
) returns public.automation_notifications
language plpgsql
security definer
set search_path=public,pg_temp
as $$
declare
  n public.automation_notifications%rowtype;
begin
  if (select auth.uid()) is null then raise exception 'Authentication required'; end if;
  if not (select public.is_command_center_authorized()) then raise exception 'Command Center authorization required'; end if;
  select * into n from public.automation_notifications
  where id=p_notification_id and owner_id=(select auth.uid()) for update;
  if not found then raise exception 'Notification not found'; end if;

  if p_action='read' then
    update public.automation_notifications set status='read',read_at=coalesce(read_at,now()),archived_at=null where id=n.id returning * into n;
  elsif p_action='unread' then
    update public.automation_notifications set status='unread',read_at=null,archived_at=null where id=n.id returning * into n;
  elsif p_action='archive' then
    update public.automation_notifications set status='archived',archived_at=now() where id=n.id returning * into n;
  elsif p_action='restore' then
    update public.automation_notifications set status=case when read_at is null then 'unread' else 'read' end,archived_at=null where id=n.id returning * into n;
  else
    raise exception 'Unsupported notification action';
  end if;
  return n;
end;
$$;

create or replace function public.command_center_notification_mark_browser_shown(p_notification_id uuid)
returns void
language plpgsql
security definer
set search_path=public,pg_temp
as $$
begin
  if (select auth.uid()) is null then raise exception 'Authentication required'; end if;
  if not (select public.is_command_center_authorized()) then raise exception 'Command Center authorization required'; end if;
  update public.automation_notifications
  set browser_shown_at=coalesce(browser_shown_at,now())
  where id=p_notification_id and owner_id=(select auth.uid());
  if not found then raise exception 'Notification not found'; end if;
end;
$$;

revoke all on function public.command_center_notification_set_state(uuid,text) from public,anon;
grant execute on function public.command_center_notification_set_state(uuid,text) to authenticated;
revoke all on function public.command_center_notification_mark_browser_shown(uuid) from public,anon;
grant execute on function public.command_center_notification_mark_browser_shown(uuid) to authenticated;

create or replace function public.command_center_deliver_dispatch_notification()
returns trigger
language plpgsql
security definer
set search_path=public,pg_temp
as $$
declare
  d public.automation_dispatch_queue%rowtype;
  v_notification_id uuid;
  v_delivered_at timestamptz;
begin
  begin
    if new.condition_id is not null and new.condition_state='pending' then
      perform public.command_center_evaluate_condition_internal(new.condition_id,new.id);
    end if;

    select * into d from public.automation_dispatch_queue where id=new.id for update;
    if not found then return new; end if;

    if d.condition_state not in ('not_required','passed') then
      update public.automation_dispatch_queue set notification_state='suppressed' where id=d.id;
      return new;
    end if;

    insert into public.automation_notifications(
      owner_id,project_id,schedule_id,dispatch_id,condition_id,title,message,severity,metadata
    ) values(
      d.owner_id,d.project_id,d.schedule_id,d.id,d.condition_id,
      'Command Center · '||d.schedule_name,
      d.job_label,
      'info',
      jsonb_build_object(
        'notification_delivery_phase',3,
        'condition_state',d.condition_state,
        'scheduled_for',d.scheduled_for
      )
    )
    on conflict do nothing
    returning id,delivered_at into v_notification_id,v_delivered_at;

    if v_notification_id is null then
      select id,delivered_at into v_notification_id,v_delivered_at
      from public.automation_notifications where dispatch_id=d.id;
    end if;

    if v_notification_id is not null then
      update public.automation_dispatch_queue
      set notification_state='delivered',notification_delivered_at=coalesce(v_delivered_at,now())
      where id=d.id;
    else
      update public.automation_dispatch_queue set notification_state='error' where id=d.id;
    end if;
  exception when others then
    update public.automation_dispatch_queue set notification_state='error' where id=new.id;
  end;
  return new;
end;
$$;

drop trigger if exists zz_automation_dispatch_notification_delivery on public.automation_dispatch_queue;
create trigger zz_automation_dispatch_notification_delivery after insert on public.automation_dispatch_queue
for each row execute function public.command_center_deliver_dispatch_notification();

revoke all on function public.command_center_deliver_dispatch_notification() from public,anon,authenticated;
grant execute on function public.command_center_deliver_dispatch_notification() to postgres,service_role;
