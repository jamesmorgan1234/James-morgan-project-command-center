-- C11 / P11.5 — explicit owner approvals and exact protected-change authority with immutable lineage.
create table if not exists public.command_center_book_approval_history (
 owner_id uuid not null references auth.users(id) on delete cascade,
 approval_event_id text not null check(btrim(approval_event_id)<>''), approval_id text not null check(btrim(approval_id)<>''), project_id text not null check(btrim(project_id)<>''), book_id text not null check(btrim(book_id)<>''), kind text not null check(kind in ('title','cover','manuscript','rollout')), target_version integer not null check(target_version>0), target_identity_ref text not null check(btrim(target_identity_ref)<>''), decision text not null check(decision in ('approve','reject','reopen')), owner_action_ref text not null check(btrim(owner_action_ref)<>''), explicit_owner_action boolean not null check(explicit_owner_action=true), decided_at timestamptz not null, supersedes_approval_id text, source_refs text[] not null check(cardinality(source_refs)>0),
 primary key(owner_id,approval_event_id), unique(owner_id,approval_id), check(supersedes_approval_id is null or btrim(supersedes_approval_id)<>'')
);
create table if not exists public.command_center_book_protected_change_authorization_history (
 owner_id uuid not null references auth.users(id) on delete cascade,
 authorization_event_id text not null check(btrim(authorization_event_id)<>''), authorization_id text not null check(btrim(authorization_id)<>''), project_id text not null check(btrim(project_id)<>''), book_id text not null check(btrim(book_id)<>''), kind text not null check(kind in ('title','cover','manuscript','rollout')), from_version integer not null check(from_version>0), to_version integer not null check(to_version>from_version), prior_identity_ref text not null check(btrim(prior_identity_ref)<>''), replacement_identity_ref text not null check(btrim(replacement_identity_ref)<>''), owner_action_ref text not null check(btrim(owner_action_ref)<>''), observed_at timestamptz not null, expires_at timestamptz not null,
 primary key(owner_id,authorization_event_id), unique(owner_id,authorization_id), check(observed_at<expires_at)
);
create or replace view public.command_center_book_approvals_current with (security_invoker=true) as select distinct on(owner_id,project_id,book_id,kind) owner_id,approval_event_id,approval_id,project_id,book_id,kind,target_version,target_identity_ref,decision,owner_action_ref,explicit_owner_action,decided_at,supersedes_approval_id,source_refs from public.command_center_book_approval_history order by owner_id,project_id,book_id,kind,decided_at desc;
create or replace function public.command_center_validate_book_approval_insert() returns trigger language plpgsql set search_path to 'public' as $$
declare prior record; begin
 select * into prior from public.command_center_book_approvals_current a where a.owner_id=new.owner_id and a.project_id=new.project_id and a.book_id=new.book_id and a.kind=new.kind;
 if prior.approval_id is null then
   if new.supersedes_approval_id is not null then raise exception 'Initial approval cannot supersede unknown state'; end if;
   if new.decision='reopen' then raise exception 'Reopen requires existing state'; end if;
 else
   if new.supersedes_approval_id is null or new.supersedes_approval_id<>prior.approval_id then raise exception 'Approval state change must explicitly supersede current approval'; end if;
   if new.target_version<prior.target_version then raise exception 'Approval target version cannot move backward'; end if;
 end if;
 return new;
end $$;
drop trigger if exists command_center_book_approval_validate on public.command_center_book_approval_history; create trigger command_center_book_approval_validate before insert on public.command_center_book_approval_history for each row execute function public.command_center_validate_book_approval_insert();
create or replace function public.command_center_reject_book_approval_evidence_mutation() returns trigger language plpgsql set search_path to 'public' as $$ begin raise exception 'Book approval evidence is immutable'; end $$;
drop trigger if exists command_center_book_approval_history_immutable on public.command_center_book_approval_history; create trigger command_center_book_approval_history_immutable before update or delete on public.command_center_book_approval_history for each row execute function public.command_center_reject_book_approval_evidence_mutation();
drop trigger if exists command_center_book_change_auth_immutable on public.command_center_book_protected_change_authorization_history; create trigger command_center_book_change_auth_immutable before update or delete on public.command_center_book_protected_change_authorization_history for each row execute function public.command_center_reject_book_approval_evidence_mutation();
alter table public.command_center_book_approval_history enable row level security; alter table public.command_center_book_protected_change_authorization_history enable row level security;
revoke all on table public.command_center_book_approval_history,public.command_center_book_protected_change_authorization_history from public,anon,authenticated; grant select,insert on table public.command_center_book_approval_history,public.command_center_book_protected_change_authorization_history to authenticated; grant select on table public.command_center_book_approvals_current to authenticated;
create policy p11_5_book_approval_owner on public.command_center_book_approval_history for all to authenticated using(owner_id=(select auth.uid()) and (select public.is_command_center_authorized())) with check(owner_id=(select auth.uid()) and (select public.is_command_center_authorized()) and explicit_owner_action=true);
create policy p11_5_book_change_auth_owner on public.command_center_book_protected_change_authorization_history for all to authenticated using(owner_id=(select auth.uid()) and (select public.is_command_center_authorized())) with check(owner_id=(select auth.uid()) and (select public.is_command_center_authorized()));
