-- Checkpoint-derived roadmap progress, lineage history, and opportunity queue.
-- Additive migration: preserves existing project/checkpoint data.

create table if not exists public.project_lineage_events (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  project_id text not null,
  event_type text not null,
  status text not null default 'current',
  title text not null,
  summary text,
  event_at timestamptz not null default now(),
  source_chat_title text,
  source_ref text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists project_lineage_events_owner_project_time_idx
  on public.project_lineage_events(owner_id, project_id, event_at desc, created_at desc);

alter table public.project_lineage_events enable row level security;

drop policy if exists project_lineage_events_owner_select on public.project_lineage_events;
create policy project_lineage_events_owner_select on public.project_lineage_events
for select using ((owner_id = auth.uid()) and public.is_command_center_authorized());

drop policy if exists project_lineage_events_owner_insert on public.project_lineage_events;
create policy project_lineage_events_owner_insert on public.project_lineage_events
for insert with check ((owner_id = auth.uid()) and public.is_command_center_authorized());

drop policy if exists project_lineage_events_owner_update on public.project_lineage_events;
create policy project_lineage_events_owner_update on public.project_lineage_events
for update using ((owner_id = auth.uid()) and public.is_command_center_authorized())
with check ((owner_id = auth.uid()) and public.is_command_center_authorized());

drop policy if exists project_lineage_events_owner_delete on public.project_lineage_events;
create policy project_lineage_events_owner_delete on public.project_lineage_events
for delete using ((owner_id = auth.uid()) and public.is_command_center_authorized());

create table if not exists public.project_opportunities (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  project_id text not null,
  title text not null,
  category text not null default 'improvement',
  status text not null default 'candidate',
  rationale text,
  expected_benefit text,
  effort text,
  monetary_cost text,
  risk text,
  dependencies jsonb not null default '[]'::jsonb,
  reuse_refs jsonb not null default '[]'::jsonb,
  source_lineage_event_id uuid references public.project_lineage_events(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists project_opportunities_owner_project_status_idx
  on public.project_opportunities(owner_id, project_id, status, updated_at desc);

alter table public.project_opportunities enable row level security;

drop policy if exists project_opportunities_owner_select on public.project_opportunities;
create policy project_opportunities_owner_select on public.project_opportunities
for select using ((owner_id = auth.uid()) and public.is_command_center_authorized());

drop policy if exists project_opportunities_owner_insert on public.project_opportunities;
create policy project_opportunities_owner_insert on public.project_opportunities
for insert with check ((owner_id = auth.uid()) and public.is_command_center_authorized());

drop policy if exists project_opportunities_owner_update on public.project_opportunities;
create policy project_opportunities_owner_update on public.project_opportunities
for update using ((owner_id = auth.uid()) and public.is_command_center_authorized())
with check ((owner_id = auth.uid()) and public.is_command_center_authorized());

drop policy if exists project_opportunities_owner_delete on public.project_opportunities;
create policy project_opportunities_owner_delete on public.project_opportunities
for delete using ((owner_id = auth.uid()) and public.is_command_center_authorized());

-- Preserve verified scope progress to one decimal place rather than rounding to
-- a whole number. Existing validation/freshness semantics are unchanged.
create or replace function public.command_center_scope_progress_from_checkpoint()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  latest_id uuid;
  scope_doc jsonb;
  scope_items jsonb;
  item jsonb;
  item_weight numeric;
  weight_text text;
  item_status text;
  item_active boolean;
  item_verified boolean;
  total_weight numeric := 0;
  completed_weight numeric := 0;
  progress_percent numeric;
  manifest_valid boolean := true;
begin
  if not new.verified then return new; end if;

  select sc.id into latest_id
  from public.source_checkpoints sc
  where sc.owner_id = new.owner_id and sc.project_id = new.project_id and sc.verified = true
  order by sc.observed_at desc, sc.captured_at desc, sc.created_at desc, sc.id desc
  limit 1;

  if latest_id is distinct from new.id then return new; end if;

  scope_doc := new.state_json -> 'scope';
  scope_items := scope_doc -> 'items';

  if scope_doc is null
     or jsonb_typeof(scope_doc) <> 'object'
     or scope_doc ->> 'contract_version' is distinct from '1'
     or scope_items is null
     or jsonb_typeof(scope_items) <> 'array'
     or jsonb_array_length(scope_items) = 0 then
    manifest_valid := false;
  else
    for item in select value from jsonb_array_elements(scope_items)
    loop
      if coalesce(btrim(item ->> 'id'), '') = '' or coalesce(btrim(item ->> 'label'), '') = '' then
        manifest_valid := false; exit;
      end if;

      item_status := lower(coalesce(item ->> 'status', ''));
      if item_status not in ('pending','in_progress','blocked','complete','excluded') then
        manifest_valid := false; exit;
      end if;

      weight_text := item ->> 'weight';
      if weight_text is null or weight_text !~ '^[0-9]+([.][0-9]+)?$' then
        manifest_valid := false; exit;
      end if;
      item_weight := weight_text::numeric;
      if item_weight <= 0 then manifest_valid := false; exit; end if;

      item_active := lower(coalesce(item ->> 'active','true')) <> 'false' and item_status <> 'excluded';
      item_verified := lower(coalesce(item ->> 'verified','false')) = 'true';

      if item_active then
        total_weight := total_weight + item_weight;
        if item_status = 'complete' and item_verified then completed_weight := completed_weight + item_weight; end if;
      end if;
    end loop;
  end if;

  if not manifest_valid or total_weight <= 0 then
    insert into public.metrics(owner_id,project_id,key,label,value_numeric,value_text,unit,verified,source,show_on_card,updated_at)
    values(new.owner_id,new.project_id,'current_scope_progress_percent','Current scope progress',null,
      jsonb_build_object('status','stale','reason','Newest verified checkpoint is missing a valid scope manifest','checkpoint_id',new.id,'observed_at',new.observed_at)::text,
      'percent',false,'checkpoint:'||new.id::text,false,now())
    on conflict (owner_id,project_id,key) do update set
      label=excluded.label,value_numeric=null,value_text=excluded.value_text,unit=excluded.unit,
      verified=false,source=excluded.source,show_on_card=false,updated_at=now();
    return new;
  end if;

  progress_percent := round((completed_weight * 100.0) / total_weight, 1);

  insert into public.metrics(owner_id,project_id,key,label,value_numeric,value_text,unit,verified,source,show_on_card,updated_at)
  values(new.owner_id,new.project_id,'current_scope_progress_percent','Current scope progress',progress_percent,
    jsonb_build_object('status','current','contract_version',1,'scope_revision',scope_doc->>'revision',
      'completed_weight',completed_weight,'total_weight',total_weight,'checkpoint_id',new.id,'observed_at',new.observed_at)::text,
    'percent',true,'checkpoint:'||new.id::text,false,now())
  on conflict (owner_id,project_id,key) do update set
    label=excluded.label,value_numeric=excluded.value_numeric,value_text=excluded.value_text,unit=excluded.unit,
    verified=true,source=excluded.source,show_on_card=false,updated_at=now();

  return new;
end;
$$;

create or replace function public.command_center_roadmap_progress_from_checkpoint()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  latest_id uuid;
  roadmap_doc jsonb;
  categories jsonb;
  category jsonb;
  phase jsonb;
  unit jsonb;
  category_id text;
  category_label text;
  phase_id text;
  phase_label text;
  category_weight numeric;
  phase_weight numeric;
  unit_weight numeric;
  category_total_weight numeric;
  category_completed_weight numeric;
  phase_total_weight numeric;
  phase_completed_weight numeric;
  roadmap_total_weight numeric := 0;
  roadmap_completed_weight numeric := 0;
  phase_progress numeric;
  category_progress numeric;
  roadmap_progress numeric;
  category_order integer := 0;
  phase_order integer;
  unit_state text;
  unit_status text;
  unit_active boolean;
  unit_verified boolean;
  unit_gates_ok boolean;
  phase_state text;
  phase_status text;
  phase_active boolean;
  phase_verified boolean;
  phase_gates_ok boolean;
  manifest_valid boolean := true;
  weight_text text;
begin
  if not new.verified then return new; end if;

  select sc.id into latest_id
  from public.source_checkpoints sc
  where sc.owner_id=new.owner_id and sc.project_id=new.project_id and sc.verified=true
  order by sc.observed_at desc, sc.captured_at desc, sc.created_at desc, sc.id desc
  limit 1;
  if latest_id is distinct from new.id then return new; end if;

  roadmap_doc := new.state_json -> 'roadmap';
  categories := roadmap_doc -> 'categories';

  -- Any newer verified checkpoint that cannot support the roadmap invalidates
  -- older roadmap metrics rather than letting stale percentages linger.
  if roadmap_doc is null
     or jsonb_typeof(roadmap_doc) <> 'object'
     or roadmap_doc ->> 'contract_version' is distinct from '1'
     or categories is null
     or jsonb_typeof(categories) <> 'array'
     or jsonb_array_length(categories)=0 then
    update public.metrics
      set value_numeric=null,
          value_text=jsonb_build_object('status','stale','reason','Newest verified checkpoint is missing a valid roadmap manifest','checkpoint_id',new.id)::text,
          verified=false,
          source='checkpoint:'||new.id::text,
          updated_at=now()
    where owner_id=new.owner_id and project_id=new.project_id and key like 'roadmap.%';
    return new;
  end if;

  -- Start by staling the previous derived set. Metrics present in this manifest
  -- will be re-upserted below; removed units stay stale instead of masquerading
  -- as current.
  update public.metrics
    set value_numeric=null,
        value_text=jsonb_build_object('status','stale','reason','Roadmap unit not present in newest verified manifest','checkpoint_id',new.id)::text,
        verified=false,
        source='checkpoint:'||new.id::text,
        updated_at=now()
  where owner_id=new.owner_id and project_id=new.project_id and key like 'roadmap.%';

  for category in select value from jsonb_array_elements(categories)
  loop
    category_order := category_order + 1;
    category_id := btrim(coalesce(category->>'id',''));
    category_label := btrim(coalesce(category->>'label',''));
    weight_text := category->>'weight';
    if category_id='' or category_label='' or weight_text is null or weight_text !~ '^[0-9]+([.][0-9]+)?$' then manifest_valid:=false; exit; end if;
    category_weight := weight_text::numeric;
    if category_weight <= 0 or jsonb_typeof(category->'phases') <> 'array' or jsonb_array_length(category->'phases')=0 then manifest_valid:=false; exit; end if;

    category_total_weight := 0;
    category_completed_weight := 0;
    phase_order := 0;

    for phase in select value from jsonb_array_elements(category->'phases')
    loop
      phase_order := phase_order + 1;
      phase_id := btrim(coalesce(phase->>'id',''));
      phase_label := btrim(coalesce(phase->>'label',''));
      weight_text := phase->>'weight';
      if phase_id='' or phase_label='' or weight_text is null or weight_text !~ '^[0-9]+([.][0-9]+)?$' then manifest_valid:=false; exit; end if;
      phase_weight := weight_text::numeric;
      if phase_weight <= 0 then manifest_valid:=false; exit; end if;

      phase_state := lower(coalesce(phase->>'state',''));
      phase_status := lower(coalesce(phase->>'status',''));
      phase_active := lower(coalesce(phase->>'active','true')) <> 'false'
                      and phase_state <> 'excluded' and phase_status <> 'excluded';
      if not phase_active then continue; end if;

      phase_total_weight := 0;
      phase_completed_weight := 0;

      if jsonb_typeof(phase->'work_units')='array' and jsonb_array_length(phase->'work_units')>0 then
        for unit in select value from jsonb_array_elements(phase->'work_units')
        loop
          weight_text := unit->>'weight';
          if coalesce(btrim(unit->>'id'),'')='' or weight_text is null or weight_text !~ '^[0-9]+([.][0-9]+)?$' then manifest_valid:=false; exit; end if;
          unit_weight := weight_text::numeric;
          if unit_weight <= 0 then manifest_valid:=false; exit; end if;

          unit_state := lower(coalesce(unit->>'state',''));
          unit_status := lower(coalesce(unit->>'status',''));
          unit_active := lower(coalesce(unit->>'active','true')) <> 'false'
                         and unit_state <> 'excluded' and unit_status <> 'excluded';
          if not unit_active then continue; end if;

          unit_verified := lower(coalesce(unit->>'verified','false'))='true';
          unit_gates_ok := lower(coalesce(unit->>'quality_gate_passed','true')) <> 'false'
                           and lower(coalesce(unit->>'dependencies_satisfied','true')) <> 'false';
          phase_total_weight := phase_total_weight + unit_weight;
          if unit_gates_ok and ((unit_state in ('verified','locked')) or (unit_status='complete' and unit_verified)) then
            phase_completed_weight := phase_completed_weight + unit_weight;
          end if;
        end loop;
        if not manifest_valid then exit; end if;
      else
        phase_total_weight := 1;
        phase_verified := lower(coalesce(phase->>'verified','false'))='true';
        phase_gates_ok := lower(coalesce(phase->>'quality_gate_passed','true')) <> 'false'
                          and lower(coalesce(phase->>'dependencies_satisfied','true')) <> 'false';
        if phase_gates_ok and ((phase_state in ('verified','locked')) or (phase_status='complete' and phase_verified)) then
          phase_completed_weight := 1;
        end if;
      end if;

      if phase_total_weight <= 0 then manifest_valid:=false; exit; end if;
      phase_progress := round((phase_completed_weight*100.0)/phase_total_weight,1);
      category_total_weight := category_total_weight + phase_weight;
      category_completed_weight := category_completed_weight + (phase_weight * phase_progress / 100.0);

      insert into public.metrics(owner_id,project_id,key,label,value_numeric,value_text,unit,verified,source,show_on_card,updated_at)
      values(new.owner_id,new.project_id,'roadmap.'||category_id||'.'||phase_id||'.progress_percent',phase_label,phase_progress,
        jsonb_build_object('status','current','roadmap_revision',roadmap_doc->>'revision','template',roadmap_doc->>'template',
          'category_id',category_id,'category_label',category_label,'category_order',category_order,
          'phase_id',phase_id,'phase_label',phase_label,'phase_order',phase_order,
          'phase_state',coalesce(nullif(phase_state,''),phase_status),'completed_weight',phase_completed_weight,
          'total_weight',phase_total_weight,'checkpoint_id',new.id)::text,
        'percent',true,'checkpoint:'||new.id::text,false,now())
      on conflict (owner_id,project_id,key) do update set
        label=excluded.label,value_numeric=excluded.value_numeric,value_text=excluded.value_text,unit=excluded.unit,
        verified=true,source=excluded.source,show_on_card=false,updated_at=now();
    end loop;

    if not manifest_valid or category_total_weight <= 0 then manifest_valid:=false; exit; end if;
    category_progress := round((category_completed_weight*100.0)/category_total_weight,1);
    roadmap_total_weight := roadmap_total_weight + category_weight;
    roadmap_completed_weight := roadmap_completed_weight + (category_weight * category_progress / 100.0);

    insert into public.metrics(owner_id,project_id,key,label,value_numeric,value_text,unit,verified,source,show_on_card,updated_at)
    values(new.owner_id,new.project_id,'roadmap.'||category_id||'.progress_percent',category_label,category_progress,
      jsonb_build_object('status','current','roadmap_revision',roadmap_doc->>'revision','template',roadmap_doc->>'template',
        'category_id',category_id,'category_label',category_label,'category_order',category_order,
        'completed_weight',category_completed_weight,'total_weight',category_total_weight,'checkpoint_id',new.id)::text,
      'percent',true,'checkpoint:'||new.id::text,false,now())
    on conflict (owner_id,project_id,key) do update set
      label=excluded.label,value_numeric=excluded.value_numeric,value_text=excluded.value_text,unit=excluded.unit,
      verified=true,source=excluded.source,show_on_card=false,updated_at=now();
  end loop;

  if not manifest_valid or roadmap_total_weight <= 0 then
    update public.metrics
      set value_numeric=null,
          value_text=jsonb_build_object('status','stale','reason','Newest verified checkpoint contains an invalid roadmap manifest','checkpoint_id',new.id)::text,
          verified=false,source='checkpoint:'||new.id::text,updated_at=now()
    where owner_id=new.owner_id and project_id=new.project_id and key like 'roadmap.%';
    return new;
  end if;

  roadmap_progress := round((roadmap_completed_weight*100.0)/roadmap_total_weight,1);
  insert into public.metrics(owner_id,project_id,key,label,value_numeric,value_text,unit,verified,source,show_on_card,updated_at)
  values(new.owner_id,new.project_id,'roadmap.current_progress_percent','Roadmap progress',roadmap_progress,
    jsonb_build_object('status','current','roadmap_revision',roadmap_doc->>'revision','template',roadmap_doc->>'template',
      'completed_weight',roadmap_completed_weight,'total_weight',roadmap_total_weight,'checkpoint_id',new.id)::text,
    'percent',true,'checkpoint:'||new.id::text,false,now())
  on conflict (owner_id,project_id,key) do update set
    label=excluded.label,value_numeric=excluded.value_numeric,value_text=excluded.value_text,unit=excluded.unit,
    verified=true,source=excluded.source,show_on_card=false,updated_at=now();

  return new;
end;
$$;

drop trigger if exists command_center_roadmap_progress_checkpoint_trg on public.source_checkpoints;
create trigger command_center_roadmap_progress_checkpoint_trg
after insert or update of state_json, verified, observed_at, captured_at
on public.source_checkpoints
for each row
execute function public.command_center_roadmap_progress_from_checkpoint();
