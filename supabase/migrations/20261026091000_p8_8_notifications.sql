-- C8 / P8.8 — notification intents, delivery receipts, and acknowledgements.
-- Sensitive payloads remain at source; notification records carry only governed presentation data/references.

create table if not exists public.command_center_notification_intents (
  owner_id uuid not null references auth.users(id) on delete cascade,
  intent_id text not null check (btrim(intent_id) <> ''),
  dedupe_key text not null check (btrim(dedupe_key) <> ''),
  severity text not null check (severity in ('critical','high','normal','low')),
  title text not null check (btrim(title) <> ''),
  body text not null,
  sensitivity_rank integer not null check (sensitivity_rank >= 0),
  deep_link text,
  source_refs text[] not null check (cardinality(source_refs) > 0),
  created_at timestamptz not null default now(),
  primary key(owner_id,intent_id)
);

create table if not exists public.command_center_notification_deliveries (
  owner_id uuid not null references auth.users(id) on delete cascade,
  delivery_id uuid primary key default gen_random_uuid(),
  channel text not null check (btrim(channel) <> ''),
  dedupe_key text not null check (btrim(dedupe_key) <> ''),
  intent_ids text[] not null check (cardinality(intent_ids) > 0),
  severity text not null check (severity in ('critical','high','normal','low')),
  minimized boolean not null,
  delivered_at timestamptz not null default now(),
  evidence_refs text[] not null check (cardinality(evidence_refs) > 0)
);

create table if not exists public.command_center_notification_acknowledgements (
  owner_id uuid not null references auth.users(id) on delete cascade,
  intent_id text not null,
  acknowledged_at timestamptz not null,
  evidence_refs text[] not null check (cardinality(evidence_refs) > 0),
  created_at timestamptz not null default now(),
  primary key(owner_id,intent_id),
  foreign key(owner_id,intent_id) references public.command_center_notification_intents(owner_id,intent_id) on delete restrict
);

create index if not exists command_center_notification_dedupe_idx
  on public.command_center_notification_intents(owner_id,dedupe_key,severity);
create index if not exists command_center_notification_delivery_idx
  on public.command_center_notification_deliveries(owner_id,delivered_at desc);

create or replace function public.command_center_reject_notification_ack_mutation()
returns trigger language plpgsql set search_path to 'public' as $$
begin raise exception 'Notification acknowledgement history is immutable'; end $$;

drop trigger if exists command_center_notification_acknowledgements_immutable on public.command_center_notification_acknowledgements;
create trigger command_center_notification_acknowledgements_immutable before update or delete on public.command_center_notification_acknowledgements
for each row execute function public.command_center_reject_notification_ack_mutation();

do $$ declare t text; begin
  foreach t in array array['command_center_notification_intents','command_center_notification_deliveries','command_center_notification_acknowledgements'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('revoke all on table public.%I from public,anon,authenticated',t);
  end loop;
end $$;

grant select,insert on table public.command_center_notification_intents to authenticated;
grant select,insert on table public.command_center_notification_deliveries to authenticated;
grant select,insert on table public.command_center_notification_acknowledgements to authenticated;

create policy p8_8_notification_intents_owner on public.command_center_notification_intents for all to authenticated
using(owner_id=(select auth.uid()) and (select public.is_command_center_authorized()))
with check(owner_id=(select auth.uid()) and (select public.is_command_center_authorized()));
create policy p8_8_notification_deliveries_owner on public.command_center_notification_deliveries for all to authenticated
using(owner_id=(select auth.uid()) and (select public.is_command_center_authorized()))
with check(owner_id=(select auth.uid()) and (select public.is_command_center_authorized()));
create policy p8_8_notification_ack_owner on public.command_center_notification_acknowledgements for select to authenticated
using(owner_id=(select auth.uid()) and (select public.is_command_center_authorized()));
create policy p8_8_notification_ack_insert on public.command_center_notification_acknowledgements for insert to authenticated
with check(owner_id=(select auth.uid()) and (select public.is_command_center_authorized()));
