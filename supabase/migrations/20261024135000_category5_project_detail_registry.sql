-- Category 5 / P5.9 — durable extensible project-detail section registry.
-- Branch-only migration. No production state is changed by committing this file.

create table if not exists public.command_center_project_detail_sections (
  owner_id uuid not null references auth.users(id) on delete cascade,
  section_key text not null,
  version bigint not null default 1 check (version>=1),
  title text not null,
  sort_order integer not null check (sort_order>=0),
  capability_key text,
  active boolean not null default true,
  source_ref text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key(owner_id,section_key),
  check (section_key ~ '^project-section:[a-z0-9][a-z0-9._:-]{0,159}$'),
  check (length(btrim(title)) between 1 and 200),
  check (capability_key is null or capability_key ~ '^capability:[a-z0-9][a-z0-9._:-]{0,159}$'),
  check (length(btrim(source_ref)) between 1 and 1000),
  check (updated_at>=created_at)
);

create table if not exists public.command_center_project_type_detail_sections (
  owner_id uuid not null,
  type_key text not null,
  section_key text not null,
  required boolean not null default false,
  source_ref text not null,
  created_at timestamptz not null default now(),
  primary key(owner_id,type_key,section_key),
  foreign key(owner_id,type_key) references public.command_center_project_types(owner_id,type_key) on delete cascade,
  foreign key(owner_id,section_key) references public.command_center_project_detail_sections(owner_id,section_key) on delete restrict,
  check (length(btrim(source_ref)) between 1 and 1000)
);

create index if not exists command_center_project_detail_order_idx
  on public.command_center_project_detail_sections(owner_id,sort_order,section_key) where active;

-- Browser reads only. Registry mutation stays behind authenticated owner RPCs.
do $$
declare t text;
begin
  foreach t in array array['command_center_project_detail_sections','command_center_project_type_detail_sections'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('revoke all on table public.%I from public,anon,authenticated',t);
    execute format('grant select on table public.%I to authenticated',t);
    execute format('drop policy if exists %I on public.%I','c5_owner_select_'||t,t);
    execute format('create policy %I on public.%I for select to authenticated using (owner_id=(select auth.uid()) and (select public.is_command_center_authorized()))','c5_owner_select_'||t,t);
  end loop;
end $$;

create or replace function public.command_center_project_register_detail_section(
  p_section_key text,p_title text,p_sort_order integer,p_capability_key text,p_source_ref text
)
returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); v_key text:=btrim(coalesce(p_section_key,'')); v_next bigint; v_cap text:=nullif(btrim(coalesce(p_capability_key,'')),''); begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  if v_key !~ '^project-section:[a-z0-9][a-z0-9._:-]{0,159}$' then raise exception 'Invalid project detail section key'; end if;
  if coalesce(btrim(p_title),'')='' or coalesce(btrim(p_source_ref),'')='' or coalesce(p_sort_order,-1)<0 then raise exception 'Invalid project detail section'; end if;
  if v_cap is not null and v_cap !~ '^capability:[a-z0-9][a-z0-9._:-]{0,159}$' then raise exception 'Invalid capability key'; end if;
  select version+1 into v_next from public.command_center_project_detail_sections where owner_id=u and section_key=v_key for update;
  if v_next is null then
    insert into public.command_center_project_detail_sections(owner_id,section_key,version,title,sort_order,capability_key,source_ref)
    values(u,v_key,1,btrim(p_title),p_sort_order,v_cap,btrim(p_source_ref));
    v_next:=1;
  else
    update public.command_center_project_detail_sections
      set version=v_next,title=btrim(p_title),sort_order=p_sort_order,capability_key=v_cap,source_ref=btrim(p_source_ref),active=true,updated_at=now()
      where owner_id=u and section_key=v_key;
  end if;
  return jsonb_build_object('section_key',v_key,'version',v_next);
end $$;

create or replace function public.command_center_project_bind_detail_section(
  p_type_key text,p_section_key text,p_required boolean,p_source_ref text
)
returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); v_type text:=btrim(coalesce(p_type_key,'')); v_section text:=btrim(coalesce(p_section_key,'')); begin
  if u is null or not public.is_command_center_authorized() then raise exception 'Unauthorized'; end if;
  if not exists(select 1 from public.command_center_project_types where owner_id=u and type_key=v_type and active) then raise exception 'Project type not found'; end if;
  if not exists(select 1 from public.command_center_project_detail_sections where owner_id=u and section_key=v_section and active) then raise exception 'Project detail section not found'; end if;
  if coalesce(btrim(p_source_ref),'')='' then raise exception 'Binding source is required'; end if;
  insert into public.command_center_project_type_detail_sections(owner_id,type_key,section_key,required,source_ref)
  values(u,v_type,v_section,coalesce(p_required,false),btrim(p_source_ref))
  on conflict(owner_id,type_key,section_key) do update set required=excluded.required,source_ref=excluded.source_ref;
  return jsonb_build_object('type_key',v_type,'section_key',v_section,'required',coalesce(p_required,false));
end $$;

revoke all on function public.command_center_project_register_detail_section(text,text,integer,text,text) from public,anon;
revoke all on function public.command_center_project_bind_detail_section(text,text,boolean,text) from public,anon;
grant execute on function public.command_center_project_register_detail_section(text,text,integer,text,text) to authenticated;
grant execute on function public.command_center_project_bind_detail_section(text,text,boolean,text) to authenticated;
