-- C8 / P8.4 — owner-scoped contacts and follow-up recommendations.
-- No table or function in this phase authorizes or queues communication sends.

create table if not exists public.command_center_personal_contacts (
  owner_id uuid not null references auth.users(id) on delete cascade,
  contact_id text not null check (btrim(contact_id) <> ''),
  display_name text not null check (btrim(display_name) <> ''),
  sensitivity text not null check (sensitivity in ('internal','sensitive','protected')),
  relationship_context_refs text[] not null default '{}'::text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key(owner_id, contact_id)
);

create table if not exists public.command_center_personal_followups (
  owner_id uuid not null references auth.users(id) on delete cascade,
  followup_id text not null check (btrim(followup_id) <> ''),
  contact_id text not null check (btrim(contact_id) <> ''),
  due_at timestamptz,
  reason text not null check (btrim(reason) <> ''),
  state text not null check (state in ('open','done','dismissed')),
  communication_boundary text not null check (communication_boundary in ('recommend_only','draft_allowed','send_requires_authorization')),
  source_refs text[] not null check (cardinality(source_refs) > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key(owner_id, followup_id),
  foreign key(owner_id, contact_id) references public.command_center_personal_contacts(owner_id, contact_id) on delete restrict
);

create index if not exists command_center_personal_contacts_sensitivity_idx
  on public.command_center_personal_contacts(owner_id, sensitivity);
create index if not exists command_center_personal_followups_due_idx
  on public.command_center_personal_followups(owner_id, state, due_at);

create or replace function public.command_center_personal_contacts_set_updated_at()
returns trigger language plpgsql set search_path to 'public' as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists command_center_personal_contacts_set_updated_at on public.command_center_personal_contacts;
create trigger command_center_personal_contacts_set_updated_at before update on public.command_center_personal_contacts
for each row execute function public.command_center_personal_contacts_set_updated_at();

drop trigger if exists command_center_personal_followups_set_updated_at on public.command_center_personal_followups;
create trigger command_center_personal_followups_set_updated_at before update on public.command_center_personal_followups
for each row execute function public.command_center_personal_contacts_set_updated_at();

do $$ declare t text; begin
  foreach t in array array['command_center_personal_contacts','command_center_personal_followups'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on table public.%I from public,anon,authenticated', t);
    execute format('grant select,insert,update on table public.%I to authenticated', t);
    execute format('create policy %I on public.%I for all to authenticated using (owner_id=(select auth.uid()) and (select public.is_command_center_authorized())) with check (owner_id=(select auth.uid()) and (select public.is_command_center_authorized()))', 'p8_4_owner_all_'||t, t);
  end loop;
end $$;
