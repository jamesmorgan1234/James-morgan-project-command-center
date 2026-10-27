-- C11 / P11.5 additive protected approval lifecycle. Repository-only migration; no production application is authorized by this commit.
create table if not exists public.command_center_book_protected_approval_state_history (
  owner_id uuid not null references auth.users(id) on delete cascade,
  state_event_id text not null check(btrim(state_event_id)<>''),
  project_id text not null check(btrim(project_id)<>''),
  book_id text not null check(btrim(book_id)<>''),
  kind text not null check(kind in ('title','subtitle','cover','artwork','manuscript','interior','metadata','pricing','format','rollout','complete_series_cover','package','protected_asset')),
  target_version integer not null check(target_version>0),
  target_identity_ref text not null check(btrim(target_identity_ref)<>''),
  state text not null check(state in ('proposed','draft','reviewed','approved','locked','reopened','superseded','rejected')),
  explicit_owner_action boolean not null default false,
  owner_action_ref text,
  supersedes_event_id text,
  source_refs text[] not null check(cardinality(source_refs)>0),
  observed_at timestamptz not null,
  primary key(owner_id,state_event_id),
  check(owner_action_ref is null or btrim(owner_action_ref)<>''),
  check(supersedes_event_id is null or btrim(supersedes_event_id)<>'')
);

create or replace view public.command_center_book_protected_approval_states_current with (security_invoker=true) as
select distinct on(owner_id,project_id,book_id,kind)
 owner_id,state_event_id,project_id,book_id,kind,target_version,target_identity_ref,state,explicit_owner_action,owner_action_ref,supersedes_event_id,source_refs,observed_at
from public.command_center_book_protected_approval_state_history
order by owner_id,project_id,book_id,kind,observed_at desc,state_event_id desc;

create or replace function public.command_center_validate_book_protected_approval_state_insert() returns trigger language plpgsql set search_path to 'public' as $$
declare
  prior record;
  transition_allowed boolean := false;
  owner_governed boolean := false;
  target_changed boolean := false;
begin
  select * into prior from public.command_center_book_protected_approval_states_current p
  where p.owner_id=new.owner_id and p.project_id=new.project_id and p.book_id=new.book_id and p.kind=new.kind;

  if prior.state_event_id is null then
    if new.supersedes_event_id is not null then raise exception 'Initial book approval state cannot supersede unknown state'; end if;
    if new.state in ('reopened','superseded') then raise exception 'Reopened/superseded state requires existing lineage'; end if;
  else
    if new.supersedes_event_id is null or new.supersedes_event_id<>prior.state_event_id then raise exception 'Book approval state change must explicitly supersede current event'; end if;
    if new.observed_at<=prior.observed_at then raise exception 'Book approval state observation must advance'; end if;
    if new.target_version<prior.target_version then raise exception 'Book approval state target version cannot move backward'; end if;

    transition_allowed := case prior.state
      when 'proposed' then new.state in ('draft','reviewed','rejected')
      when 'draft' then new.state in ('reviewed','rejected')
      when 'reviewed' then new.state in ('draft','approved','rejected')
      when 'approved' then new.state in ('locked','reopened','superseded','rejected')
      when 'locked' then new.state in ('reopened','superseded')
      when 'reopened' then new.state in ('draft','reviewed','rejected','superseded')
      when 'superseded' then false
      when 'rejected' then new.state in ('proposed','draft')
      else false
    end;
    if not transition_allowed then raise exception 'Invalid book approval state transition'; end if;

    target_changed := new.target_version<>prior.target_version or new.target_identity_ref<>prior.target_identity_ref;
    if prior.state in ('approved','locked') and target_changed and new.state not in ('reopened','superseded') then raise exception 'Approved or locked target cannot change without explicit reopen or supersession'; end if;
  end if;

  owner_governed := new.state in ('approved','locked','reopened','superseded','rejected') or coalesce(prior.state in ('approved','locked'),false);
  if owner_governed and (new.explicit_owner_action is not true or new.owner_action_ref is null or btrim(new.owner_action_ref)='') then raise exception 'Protected book approval state change requires explicit owner action evidence'; end if;
  if new.explicit_owner_action is true and (new.owner_action_ref is null or btrim(new.owner_action_ref)='') then raise exception 'Explicit owner action requires owner action evidence'; end if;
  return new;
end $$;

drop trigger if exists command_center_book_protected_approval_state_validate on public.command_center_book_protected_approval_state_history;
create trigger command_center_book_protected_approval_state_validate before insert on public.command_center_book_protected_approval_state_history for each row execute function public.command_center_validate_book_protected_approval_state_insert();

create or replace function public.command_center_reject_book_protected_approval_state_mutation() returns trigger language plpgsql set search_path to 'public' as $$ begin raise exception 'Protected book approval state evidence is immutable'; end $$;
drop trigger if exists command_center_book_protected_approval_state_immutable on public.command_center_book_protected_approval_state_history;
create trigger command_center_book_protected_approval_state_immutable before update or delete on public.command_center_book_protected_approval_state_history for each row execute function public.command_center_reject_book_protected_approval_state_mutation();

alter table public.command_center_book_protected_approval_state_history enable row level security;
revoke all on table public.command_center_book_protected_approval_state_history from public,anon,authenticated;
grant select,insert on table public.command_center_book_protected_approval_state_history to authenticated;
grant select on table public.command_center_book_protected_approval_states_current to authenticated;
create policy p11_5_book_protected_approval_state_owner on public.command_center_book_protected_approval_state_history for all to authenticated
using(owner_id=(select auth.uid()) and (select public.is_command_center_authorized()))
with check(owner_id=(select auth.uid()) and (select public.is_command_center_authorized()));
