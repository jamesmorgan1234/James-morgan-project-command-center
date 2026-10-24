-- Category 6 / P6.7 — persistent natural Brain conversation with explicit intent and no side-effect authority.
-- Branch-only migration. Conversation records discussion/evidence only.

create table if not exists public.command_center_brain_conversations (
  owner_id uuid not null references auth.users(id) on delete cascade,
  conversation_id uuid primary key default gen_random_uuid(),
  project_id text,
  title text not null check (length(btrim(title)) between 1 and 500),
  state text not null default 'active' check (state in ('active','closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key(owner_id,project_id) references public.command_center_project_profiles(owner_id,project_id) on delete restrict,
  check (updated_at>=created_at)
);

create table if not exists public.command_center_brain_conversation_turns (
  owner_id uuid not null references auth.users(id) on delete cascade,
  turn_id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.command_center_brain_conversations(conversation_id) on delete cascade,
  project_id text,
  role text not null check (role in ('owner','brain','system')),
  intent text check (intent is null or intent in ('question','owner_input','decision','rule_change','idea','research','proposal','agent_request','protected_action_request')),
  protected_action_possible boolean not null default false,
  redaction_state text not null check (redaction_state in ('safe_text','redacted','reference_only')),
  safe_text text,
  content_ref text not null check (length(btrim(content_ref)) between 1 and 1000),
  content_hash text not null check (content_hash ~ '^[a-f0-9]{64}$'),
  evidence_refs text[] not null default '{}'::text[],
  canonical_writes_authorized boolean not null default false check (canonical_writes_authorized=false),
  created_at timestamptz not null,
  recorded_at timestamptz not null default now(),
  check ((redaction_state='safe_text' and safe_text is not null and length(btrim(safe_text))>0) or (redaction_state<>'safe_text' and safe_text is null)),
  check (created_at<=recorded_at + interval '5 minutes')
);
create index if not exists command_center_brain_conversation_turns_idx
  on public.command_center_brain_conversation_turns(owner_id,conversation_id,created_at,turn_id);

-- Browser roles can read their conversation evidence, but cannot directly write conversation rows.
do $$
declare t text;
begin
  foreach t in array array['command_center_brain_conversations','command_center_brain_conversation_turns'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('revoke all on table public.%I from public,anon,authenticated',t);
    execute format('grant select on table public.%I to authenticated',t);
    execute format('drop policy if exists %I on public.%I','c6_owner_select_'||t,t);
    execute format('create policy %I on public.%I for select to authenticated using (owner_id=(select auth.uid()) and (select public.is_command_center_authorized()))','c6_owner_select_'||t,t);
  end loop;
end $$;

create or replace function public.command_center_brain_create_conversation(p_project_id text,p_title text)
returns uuid language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); v_project text:=nullif(btrim(coalesce(p_project_id,'')),''); v_id uuid; begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  if coalesce(btrim(p_title),'')='' then raise exception 'Conversation title required'; end if;
  if v_project is not null and not exists(select 1 from public.command_center_project_profiles where owner_id=u and project_id=v_project) then raise exception 'Conversation project not found'; end if;
  insert into public.command_center_brain_conversations(owner_id,project_id,title) values(u,v_project,btrim(p_title)) returning conversation_id into v_id;
  return v_id;
end $$;

create or replace function public.command_center_brain_record_turn(
  p_conversation_id uuid,p_role text,p_intent text,p_protected_action_possible boolean,p_redaction_state text,p_safe_text text,p_content_ref text,p_content_hash text,p_evidence_refs text[],p_created_at timestamptz
) returns uuid language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); c public.command_center_brain_conversations%rowtype; v_turn uuid; begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  select * into c from public.command_center_brain_conversations where owner_id=u and conversation_id=p_conversation_id;
  if not found or c.state<>'active' then raise exception 'Active conversation not found'; end if;
  if p_role not in ('owner','brain','system') then raise exception 'Invalid conversation role'; end if;
  if p_intent is not null and p_intent not in ('question','owner_input','decision','rule_change','idea','research','proposal','agent_request','protected_action_request') then raise exception 'Invalid conversation intent'; end if;
  if p_redaction_state not in ('safe_text','redacted','reference_only') then raise exception 'Invalid conversation redaction state'; end if;
  if (p_redaction_state='safe_text' and coalesce(btrim(p_safe_text),'')='') or (p_redaction_state<>'safe_text' and p_safe_text is not null) then raise exception 'Conversation text/redaction mismatch'; end if;
  if coalesce(btrim(p_content_ref),'')='' or coalesce(p_content_hash,'') !~ '^[a-f0-9]{64}$' then raise exception 'Conversation content reference/hash required'; end if;
  perform command_center_private.c3_assert_unique_text_array(p_evidence_refs,'Conversation evidence');
  insert into public.command_center_brain_conversation_turns(owner_id,conversation_id,project_id,role,intent,protected_action_possible,redaction_state,safe_text,content_ref,content_hash,evidence_refs,created_at)
  values(u,c.conversation_id,c.project_id,p_role,p_intent,p_protected_action_possible,p_redaction_state,case when p_redaction_state='safe_text' then btrim(p_safe_text) else null end,btrim(p_content_ref),p_content_hash,coalesce(p_evidence_refs,'{}'::text[]),p_created_at)
  returning turn_id into v_turn;
  update public.command_center_brain_conversations set updated_at=now() where owner_id=u and conversation_id=c.conversation_id;
  return v_turn;
end $$;

revoke all on function public.command_center_brain_create_conversation(text,text) from public,anon;
revoke all on function public.command_center_brain_record_turn(uuid,text,text,boolean,text,text,text,text,text[],timestamptz) from public,anon;
grant execute on function public.command_center_brain_create_conversation(text,text) to authenticated;
grant execute on function public.command_center_brain_record_turn(uuid,text,text,boolean,text,text,text,text,text[],timestamptz) to authenticated;
