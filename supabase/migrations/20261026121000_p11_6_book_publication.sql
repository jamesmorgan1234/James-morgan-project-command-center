-- C11 / P11.6 — immutable per-format publication history; live truth requires provider evidence and test orders never establish sales.
create table if not exists public.command_center_book_publication_history (
 owner_id uuid not null references auth.users(id) on delete cascade,
 publication_event_id text not null check(btrim(publication_event_id)<>''), publication_id text not null check(btrim(publication_id)<>''), project_id text not null check(btrim(project_id)<>''), book_id text not null check(btrim(book_id)<>''), format text not null check(format in ('kindle','paperback','hardcover','digital_other')), provider_key text not null check(btrim(provider_key)<>''), state text not null check(state in ('draft','uploaded','submitted','review','live','blocked')),
 provider_receipt_ref text, provider_publication_ref text, submitted_at timestamptz, reviewed_at timestamptz, live_at timestamptz, blocked_reason text, error_ref text, observed_at timestamptz not null, source_refs text[] not null check(cardinality(source_refs)>0), test_order boolean not null default false,
 primary key(owner_id,publication_event_id), unique(owner_id,publication_id),
 check(provider_receipt_ref is null or btrim(provider_receipt_ref)<>''), check(provider_publication_ref is null or btrim(provider_publication_ref)<>''),
 check((state in ('submitted','review','live') and provider_receipt_ref is not null) or state not in ('submitted','review','live')),
 check((state='live' and provider_publication_ref is not null and submitted_at is not null and reviewed_at is not null and live_at is not null) or state<>'live'),
 check((state='review' and submitted_at is not null and reviewed_at is not null) or state<>'review'),
 check((state='submitted' and submitted_at is not null) or state<>'submitted'),
 check((state='blocked' and ((blocked_reason is not null and btrim(blocked_reason)<>'') or (error_ref is not null and btrim(error_ref)<>''))) or (state<>'blocked' and blocked_reason is null and error_ref is null))
);
create or replace view public.command_center_book_publication_current with (security_invoker=true) as select distinct on(owner_id,project_id,book_id,format,provider_key) owner_id,publication_event_id,publication_id,project_id,book_id,format,provider_key,state,provider_receipt_ref,provider_publication_ref,submitted_at,reviewed_at,live_at,blocked_reason,error_ref,observed_at,source_refs,test_order from public.command_center_book_publication_history order by owner_id,project_id,book_id,format,provider_key,observed_at desc;
create or replace function public.command_center_validate_book_publication_transition() returns trigger language plpgsql set search_path to 'public' as $$
declare prior_state text; prior_observed_at timestamptz; prior_publication_ref text; begin
 select state,observed_at,provider_publication_ref into prior_state,prior_observed_at,prior_publication_ref from public.command_center_book_publication_current p where p.owner_id=new.owner_id and p.project_id=new.project_id and p.book_id=new.book_id and p.format=new.format and p.provider_key=new.provider_key;
 if prior_state is null then if new.state not in ('draft','uploaded') then raise exception 'Publication history must begin at draft or uploaded state'; end if; return new; end if;
 if new.observed_at<=prior_observed_at then raise exception 'Publication observation must advance'; end if;
 if prior_state='draft' and new.state not in ('uploaded','blocked') then raise exception 'Invalid publication transition'; end if;
 if prior_state='uploaded' and new.state not in ('submitted','blocked') then raise exception 'Invalid publication transition'; end if;
 if prior_state='submitted' and new.state not in ('review','blocked') then raise exception 'Invalid publication transition'; end if;
 if prior_state='review' and new.state not in ('live','blocked') then raise exception 'Invalid publication transition'; end if;
 if prior_state='live' then raise exception 'Live publication is terminal without an explicit new publication lineage'; end if;
 if prior_state='blocked' and new.state not in ('uploaded','submitted','review') then raise exception 'Invalid publication transition'; end if;
 if prior_publication_ref is not null and new.provider_publication_ref is not null and prior_publication_ref<>new.provider_publication_ref then raise exception 'Provider publication identity cannot be silently substituted'; end if;
 return new;
end $$;
drop trigger if exists command_center_book_publication_transition_validate on public.command_center_book_publication_history; create trigger command_center_book_publication_transition_validate before insert on public.command_center_book_publication_history for each row execute function public.command_center_validate_book_publication_transition();
create or replace function public.command_center_reject_book_publication_evidence_mutation() returns trigger language plpgsql set search_path to 'public' as $$ begin raise exception 'Book publication evidence is immutable'; end $$;
drop trigger if exists command_center_book_publication_immutable on public.command_center_book_publication_history; create trigger command_center_book_publication_immutable before update or delete on public.command_center_book_publication_history for each row execute function public.command_center_reject_book_publication_evidence_mutation();
alter table public.command_center_book_publication_history enable row level security;
revoke all on table public.command_center_book_publication_history from public,anon,authenticated; grant select,insert on table public.command_center_book_publication_history to authenticated; grant select on table public.command_center_book_publication_current to authenticated;
create policy p11_6_book_publication_owner on public.command_center_book_publication_history for all to authenticated using(owner_id=(select auth.uid()) and (select public.is_command_center_authorized())) with check(owner_id=(select auth.uid()) and (select public.is_command_center_authorized()));
