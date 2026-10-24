-- Category 3 / P3.8-P3.9 — durable historical ChatGPT-export staging, full message graph and project-container lineage.
-- Branch-only migration. Staging is evidence only: it never mutates canonical projects or activates work.

create table if not exists public.command_center_historical_conversations (
  owner_id uuid not null references auth.users(id) on delete cascade,
  batch_id uuid not null references public.command_center_import_batches(id) on delete cascade,
  conversation_id text not null,
  title text not null,
  template_id text,
  node_count integer not null check (node_count >= 0),
  branch_point_count integer not null default 0 check (branch_point_count >= 0),
  redacted_node_count integer not null default 0 check (redacted_node_count >= 0),
  lineage_class text not null check (lineage_class in ('project_container_member','standalone_candidate')),
  reconciliation_state text not null default 'staged' check (reconciliation_state in ('staged','reconciled','ignored')),
  created_at timestamptz not null default now(),
  primary key(owner_id,batch_id,conversation_id),
  check (length(btrim(conversation_id)) between 1 and 500),
  check (length(title) <= 1000)
);

create table if not exists public.command_center_historical_message_nodes (
  owner_id uuid not null references auth.users(id) on delete cascade,
  batch_id uuid not null,
  conversation_id text not null,
  node_id text not null,
  parent_node_id text,
  message_id text,
  role text,
  child_count integer not null default 0 check (child_count >= 0),
  content_state text not null check (content_state in ('none','keep','redact')),
  text_content text,
  content_hash text,
  created_at timestamptz not null default now(),
  primary key(owner_id,batch_id,conversation_id,node_id),
  foreign key(owner_id,batch_id,conversation_id)
    references public.command_center_historical_conversations(owner_id,batch_id,conversation_id) on delete cascade,
  check (length(btrim(node_id)) between 1 and 500),
  check (parent_node_id is null or btrim(parent_node_id)<>''),
  check ((content_state='keep' and text_content is not null and content_hash ~ '^[a-f0-9]{64}$') or
         (content_state in ('none','redact') and text_content is null and content_hash is null))
);

create table if not exists public.command_center_historical_message_edges (
  owner_id uuid not null references auth.users(id) on delete cascade,
  batch_id uuid not null,
  conversation_id text not null,
  parent_node_id text not null,
  child_node_id text not null,
  ordinal integer not null check (ordinal >= 0),
  created_at timestamptz not null default now(),
  primary key(owner_id,batch_id,conversation_id,parent_node_id,child_node_id),
  unique(owner_id,batch_id,conversation_id,parent_node_id,ordinal),
  foreign key(owner_id,batch_id,conversation_id,parent_node_id)
    references public.command_center_historical_message_nodes(owner_id,batch_id,conversation_id,node_id) on delete cascade,
  foreign key(owner_id,batch_id,conversation_id,child_node_id)
    references public.command_center_historical_message_nodes(owner_id,batch_id,conversation_id,node_id) on delete cascade,
  check (parent_node_id<>child_node_id)
);

create index if not exists command_center_historical_template_idx
  on public.command_center_historical_conversations(owner_id,template_id)
  where template_id is not null;
create index if not exists command_center_historical_standalone_idx
  on public.command_center_historical_conversations(owner_id,batch_id)
  where lineage_class='standalone_candidate';

-- Historical evidence is read-only to browser roles.
do $$
declare t text;
begin
  foreach t in array array['command_center_historical_conversations','command_center_historical_message_nodes','command_center_historical_message_edges'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('revoke all on table public.%I from public, anon, authenticated',t);
    execute format('grant select on table public.%I to authenticated',t);
    execute format('drop policy if exists %I on public.%I','c3_owner_select_'||t,t);
    execute format(
      'create policy %I on public.%I for select to authenticated using (owner_id=(select auth.uid()) and (select public.is_command_center_authorized()))',
      'c3_owner_select_'||t,t
    );
  end loop;
end $$;

create or replace function command_center_private.c3_historical_text_safe(p_text text)
returns boolean
language sql
immutable
set search_path=''
as $$
  select p_text is not null
     and p_text !~* '(Bearer[[:space:]]+[A-Za-z0-9._~+/=-]{12,}|sk-[A-Za-z0-9_-]{12,}|ghp_[A-Za-z0-9]{20,}|-----BEGIN[[:space:]][A-Z ]*PRIVATE KEY-----)';
$$;
revoke all on function command_center_private.c3_historical_text_safe(text) from public,anon,authenticated;

create or replace function public.command_center_stage_historical_export(
  p_batch_id uuid,
  p_source_ref text,
  p_stage jsonb
) returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  u uuid:=auth.uid();
  conv jsonb;
  node jsonb;
  child jsonb;
  v_conversation_id text;
  v_title text;
  v_template_id text;
  v_node_id text;
  v_parent text;
  v_role text;
  v_message_id text;
  v_state text;
  v_text text;
  v_hash text;
  v_node_count integer;
  v_branch_count integer;
  v_redacted integer;
  v_conversations integer:=0;
  v_nodes integer:=0;
  v_redacted_total integer:=0;
  v_manifest_hash text;
  v_children jsonb;
  v_ordinal integer;
begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  if p_batch_id is null or coalesce(btrim(p_source_ref),'')='' or jsonb_typeof(p_stage)<>'object' or jsonb_typeof(p_stage->'conversations')<>'array' then
    raise exception 'Historical batch identity, provenance and staged conversations are required';
  end if;
  if coalesce(p_stage->>'batchId','')<>p_batch_id::text then raise exception 'Historical stage batch identity mismatch'; end if;
  if exists(select 1 from public.command_center_import_batches where owner_id=u and id=p_batch_id) then raise exception 'Import batch already exists'; end if;

  v_manifest_hash:=encode(extensions.digest(p_stage::text,'sha256'),'hex');
  insert into public.command_center_import_batches(id,owner_id,import_kind,source_ref,state,manifest_hash)
  values(p_batch_id,u,'historical_chat_export',btrim(p_source_ref),'staged',v_manifest_hash);

  -- Pass 1: conversations and every mapping node. No title/final-message shortcut is permitted.
  for conv in select value from jsonb_array_elements(p_stage->'conversations') loop
    v_conversation_id:=btrim(coalesce(conv->>'conversationId',''));
    v_title:=coalesce(conv->>'title','Untitled');
    v_template_id:=nullif(btrim(coalesce(conv->>'templateId','')),'');
    if v_conversation_id='' or jsonb_typeof(conv->'nodes')<>'array' then raise exception 'Historical conversation identity and node mapping are required'; end if;
    if exists(select 1 from public.command_center_historical_conversations where owner_id=u and batch_id=p_batch_id and conversation_id=v_conversation_id) then raise exception 'Duplicate conversation id inside historical batch'; end if;
    v_node_count:=jsonb_array_length(conv->'nodes');
    v_branch_count:=0; v_redacted:=0;
    for node in select value from jsonb_array_elements(conv->'nodes') loop
      if jsonb_typeof(coalesce(node->'children','[]'::jsonb))<>'array' then raise exception 'Historical node children must be an array'; end if;
      if jsonb_array_length(coalesce(node->'children','[]'::jsonb))>1 then v_branch_count:=v_branch_count+1; end if;
      if node->>'contentState'='redact' then v_redacted:=v_redacted+1; end if;
    end loop;
    insert into public.command_center_historical_conversations(owner_id,batch_id,conversation_id,title,template_id,node_count,branch_point_count,redacted_node_count,lineage_class)
    values(u,p_batch_id,v_conversation_id,left(v_title,1000),v_template_id,v_node_count,v_branch_count,v_redacted,case when v_template_id is null then 'standalone_candidate' else 'project_container_member' end);

    for node in select value from jsonb_array_elements(conv->'nodes') loop
      v_node_id:=btrim(coalesce(node->>'id',''));
      v_parent:=nullif(btrim(coalesce(node->>'parent','')),'');
      v_role:=nullif(btrim(coalesce(node->>'role','')),'');
      v_message_id:=nullif(btrim(coalesce(node->>'messageId','')),'');
      v_state:=coalesce(node->>'contentState','none');
      v_text:=case when v_state='keep' then node->>'text' else null end;
      v_children:=coalesce(node->'children','[]'::jsonb);
      if v_node_id='' or v_state not in ('none','keep','redact') then raise exception 'Invalid historical mapping node'; end if;
      if v_state='keep' and not command_center_private.c3_historical_text_safe(v_text) then raise exception 'Historical node contains secret-shaped content and must be redacted before staging'; end if;
      if v_state<>'keep' and node ? 'text' then raise exception 'Redacted/empty historical nodes cannot retain text content'; end if;
      v_hash:=case when v_state='keep' then encode(extensions.digest(v_text,'sha256'),'hex') else null end;
      insert into public.command_center_historical_message_nodes(owner_id,batch_id,conversation_id,node_id,parent_node_id,message_id,role,child_count,content_state,text_content,content_hash)
      values(u,p_batch_id,v_conversation_id,v_node_id,v_parent,v_message_id,v_role,jsonb_array_length(v_children),v_state,v_text,v_hash);
      v_nodes:=v_nodes+1;
    end loop;
    v_conversations:=v_conversations+1;
    v_redacted_total:=v_redacted_total+v_redacted;
  end loop;

  -- Pass 2: explicit graph edges; every child must exist and agree with its stored parent.
  for conv in select value from jsonb_array_elements(p_stage->'conversations') loop
    v_conversation_id:=btrim(conv->>'conversationId');
    for node in select value from jsonb_array_elements(conv->'nodes') loop
      v_node_id:=btrim(node->>'id');
      v_ordinal:=0;
      for child in select value from jsonb_array_elements(coalesce(node->'children','[]'::jsonb)) loop
        if jsonb_typeof(child)<>'string' then raise exception 'Historical child node id must be text'; end if;
        if not exists(
          select 1 from public.command_center_historical_message_nodes n
          where n.owner_id=u and n.batch_id=p_batch_id and n.conversation_id=v_conversation_id
            and n.node_id=child#>>'{}' and n.parent_node_id=v_node_id
        ) then raise exception 'Historical parent/child graph mismatch'; end if;
        insert into public.command_center_historical_message_edges(owner_id,batch_id,conversation_id,parent_node_id,child_node_id,ordinal)
        values(u,p_batch_id,v_conversation_id,v_node_id,child#>>'{}',v_ordinal);
        v_ordinal:=v_ordinal+1;
      end loop;
    end loop;
  end loop;

  if exists(
    select 1 from public.command_center_historical_message_nodes n
    where n.owner_id=u and n.batch_id=p_batch_id and n.parent_node_id is not null
      and not exists(
        select 1 from public.command_center_historical_message_edges e
        where e.owner_id=n.owner_id and e.batch_id=n.batch_id and e.conversation_id=n.conversation_id and e.child_node_id=n.node_id and e.parent_node_id=n.parent_node_id
      )
  ) then raise exception 'Historical graph contains orphan parent references'; end if;

  update public.command_center_import_batches
     set state='validated',item_count=v_nodes,redacted_count=v_redacted_total,validated_at=now()
   where owner_id=u and id=p_batch_id;

  return jsonb_build_object(
    'batch_id',p_batch_id,'state','validated','conversation_count',v_conversations,'node_count',v_nodes,'redacted_node_count',v_redacted_total,
    'canonical_mutated',false,'projects_created',false,'projects_activated',false
  );
end $$;

revoke all on function public.command_center_stage_historical_export(uuid,text,jsonb) from public,anon;
grant execute on function public.command_center_stage_historical_export(uuid,text,jsonb) to authenticated;
