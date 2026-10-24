-- Category 6 / P6.12 — durable voice adapter/session/transcript evidence on the shared Brain intent engine.
-- Branch-only migration. Voice never bypasses text intent/security rules.

create table if not exists public.command_center_brain_voice_adapters (
  owner_id uuid not null references auth.users(id) on delete cascade,
  adapter_key text not null,
  provider_key text,
  version bigint not null default 1 check (version>=1),
  enabled boolean not null default false,
  health text not null check (health in ('available','degraded','unavailable','unconfigured')),
  capabilities text[] not null default '{}'::text[],
  configuration_ref text,
  local_fallback_supported boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key(owner_id,adapter_key),
  foreign key(owner_id,provider_key) references public.command_center_provider_registry(owner_id,provider_key) on delete restrict,
  check (adapter_key ~ '^speech:[a-z0-9][a-z0-9._:-]{0,160}$'),
  check (updated_at>=created_at)
);

create table if not exists public.command_center_brain_voice_sessions (
  voice_session_id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  project_id text,
  adapter_key text not null,
  permission_state text not null check (permission_state in ('granted','denied','prompt')),
  state text not null check (state in ('open','cancelled','completed','provider_failed')),
  text_fallback_available boolean not null default true check (text_fallback_available=true),
  created_at timestamptz not null default now(),
  ended_at timestamptz,
  foreign key(owner_id,adapter_key) references public.command_center_brain_voice_adapters(owner_id,adapter_key) on delete restrict,
  foreign key(owner_id,project_id) references public.command_center_project_profiles(owner_id,project_id) on delete restrict,
  check (ended_at is null or ended_at>=created_at)
);

create table if not exists public.command_center_brain_voice_transcripts (
  transcript_id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  voice_session_id uuid not null references public.command_center_brain_voice_sessions(voice_session_id) on delete cascade,
  project_id text,
  transcript_ref text not null check (length(btrim(transcript_ref)) between 1 and 1000),
  transcript_hash text not null check (transcript_hash ~ '^[a-f0-9]{64}$'),
  state text not null check (state in ('partial','edited','final','cancelled')),
  intent text check (intent is null or intent in ('question','owner_input','decision','rule_change','idea','research','proposal','agent_request','protected_action_request')),
  protected_action_possible boolean not null default false,
  final_intent_eligible boolean not null default false,
  canonical_writes_authorized boolean not null default false check (canonical_writes_authorized=false),
  evidence_refs text[] not null default '{}'::text[],
  created_at timestamptz not null,
  recorded_at timestamptz not null default now(),
  check (final_intent_eligible=(state='final')),
  check (state='final' or intent is null),
  check (created_at<=recorded_at + interval '5 minutes')
);

do $$
declare t text;
begin
  foreach t in array array['command_center_brain_voice_adapters','command_center_brain_voice_sessions','command_center_brain_voice_transcripts'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('revoke all on table public.%I from public,anon,authenticated',t);
    execute format('grant select on table public.%I to authenticated',t);
    execute format('drop policy if exists %I on public.%I','c6_owner_select_'||t,t);
    execute format('create policy %I on public.%I for select to authenticated using (owner_id=(select auth.uid()) and (select public.is_command_center_authorized()))','c6_owner_select_'||t,t);
  end loop;
end $$;

create or replace function public.command_center_brain_record_voice_session(
  p_project_id text,p_adapter_key text,p_permission_state text,p_state text,p_evidence_refs text[]
) returns uuid language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); a public.command_center_brain_voice_adapters%rowtype; v_id uuid; v_project text:=nullif(btrim(coalesce(p_project_id,'')),''); begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  select * into a from public.command_center_brain_voice_adapters where owner_id=u and adapter_key=btrim(p_adapter_key);
  if not found then raise exception 'Voice adapter not found'; end if;
  if p_permission_state not in ('granted','denied','prompt') or p_state not in ('open','cancelled','completed','provider_failed') then raise exception 'Invalid voice session state'; end if;
  if p_state='open' and (p_permission_state<>'granted' or not a.enabled or a.health<>'available') then raise exception 'Voice session cannot open without granted permission and available adapter'; end if;
  if v_project is not null and not exists(select 1 from public.command_center_project_profiles where owner_id=u and project_id=v_project) then raise exception 'Voice project not found'; end if;
  perform command_center_private.c3_assert_unique_text_array(p_evidence_refs,'Voice session evidence');
  insert into public.command_center_brain_voice_sessions(owner_id,project_id,adapter_key,permission_state,state,ended_at)
  values(u,v_project,a.adapter_key,p_permission_state,p_state,case when p_state='open' then null else now() end) returning voice_session_id into v_id;
  return v_id;
end $$;

create or replace function public.command_center_brain_record_voice_transcript(
  p_voice_session_id uuid,p_transcript_ref text,p_transcript_hash text,p_state text,p_intent text,p_protected_action_possible boolean,p_evidence_refs text[],p_created_at timestamptz
) returns uuid language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); s public.command_center_brain_voice_sessions%rowtype; v_id uuid; begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  select * into s from public.command_center_brain_voice_sessions where owner_id=u and voice_session_id=p_voice_session_id;
  if not found then raise exception 'Voice session not found'; end if;
  if s.permission_state<>'granted' then raise exception 'Voice transcript cannot become intent without granted permission'; end if;
  if p_state not in ('partial','edited','final','cancelled') then raise exception 'Invalid transcript state'; end if;
  if p_state<>'final' and p_intent is not null then raise exception 'Only a final transcript may carry executable intent classification'; end if;
  if p_state='final' and p_intent not in ('question','owner_input','decision','rule_change','idea','research','proposal','agent_request','protected_action_request') then raise exception 'Final transcript requires shared Brain intent classification'; end if;
  if coalesce(btrim(p_transcript_ref),'')='' or coalesce(p_transcript_hash,'') !~ '^[a-f0-9]{64}$' then raise exception 'Voice transcript reference/hash required'; end if;
  perform command_center_private.c3_assert_unique_text_array(p_evidence_refs,'Voice transcript evidence');
  insert into public.command_center_brain_voice_transcripts(owner_id,voice_session_id,project_id,transcript_ref,transcript_hash,state,intent,protected_action_possible,final_intent_eligible,evidence_refs,created_at)
  values(u,s.voice_session_id,s.project_id,btrim(p_transcript_ref),p_transcript_hash,p_state,p_intent,p_protected_action_possible,p_state='final',coalesce(p_evidence_refs,'{}'::text[]),p_created_at)
  returning transcript_id into v_id;
  return v_id;
end $$;

revoke all on function public.command_center_brain_record_voice_session(text,text,text,text,text[]) from public,anon;
revoke all on function public.command_center_brain_record_voice_transcript(uuid,text,text,text,text,boolean,text[],timestamptz) from public,anon;
grant execute on function public.command_center_brain_record_voice_session(text,text,text,text,text[]) to authenticated;
grant execute on function public.command_center_brain_record_voice_transcript(uuid,text,text,text,text,boolean,text[],timestamptz) to authenticated;
