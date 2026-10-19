-- Verified current-scope progress + checkpoint freshness enforcement.
-- Prepared on a protected feature branch. Do not apply to production until separately authorized.

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
  if not new.verified then
    return new;
  end if;

  select sc.id
    into latest_id
  from public.source_checkpoints sc
  where sc.owner_id = new.owner_id
    and sc.project_id = new.project_id
    and sc.verified = true
  order by sc.observed_at desc, sc.captured_at desc, sc.created_at desc, sc.id desc
  limit 1;

  -- Older/out-of-order checkpoint inserts must never overwrite newer progress state.
  if latest_id is distinct from new.id then
    return new;
  end if;

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
      if coalesce(btrim(item ->> 'id'), '') = ''
         or coalesce(btrim(item ->> 'label'), '') = '' then
        manifest_valid := false;
        exit;
      end if;

      item_status := lower(coalesce(item ->> 'status', ''));
      if item_status not in ('pending','in_progress','blocked','complete','excluded') then
        manifest_valid := false;
        exit;
      end if;

      weight_text := item ->> 'weight';
      if weight_text is null or weight_text !~ '^[0-9]+([.][0-9]+)?$' then
        manifest_valid := false;
        exit;
      end if;
      item_weight := weight_text::numeric;
      if item_weight <= 0 then
        manifest_valid := false;
        exit;
      end if;

      item_active := case lower(coalesce(item ->> 'active', 'true'))
        when 'false' then false
        else true
      end;
      if item_status = 'excluded' then
        item_active := false;
      end if;

      item_verified := lower(coalesce(item ->> 'verified', 'false')) = 'true';

      if item_active then
        total_weight := total_weight + item_weight;
        if item_status = 'complete' and item_verified then
          completed_weight := completed_weight + item_weight;
        end if;
      end if;
    end loop;
  end if;

  if not manifest_valid or total_weight <= 0 then
    insert into public.metrics (
      owner_id, project_id, key, label, value_numeric, value_text, unit,
      verified, source, show_on_card, updated_at
    ) values (
      new.owner_id,
      new.project_id,
      'current_scope_progress_percent',
      'Current scope progress',
      null,
      jsonb_build_object(
        'status','stale',
        'reason','Newest verified checkpoint is missing a valid scope manifest',
        'checkpoint_id',new.id,
        'observed_at',new.observed_at
      )::text,
      'percent',
      false,
      'checkpoint:' || new.id::text,
      false,
      now()
    )
    on conflict (owner_id, project_id, key) do update set
      label = excluded.label,
      value_numeric = null,
      value_text = excluded.value_text,
      unit = excluded.unit,
      verified = false,
      source = excluded.source,
      show_on_card = false,
      updated_at = now();
    return new;
  end if;

  progress_percent := round((completed_weight * 100.0) / total_weight);

  insert into public.metrics (
    owner_id, project_id, key, label, value_numeric, value_text, unit,
    verified, source, show_on_card, updated_at
  ) values (
    new.owner_id,
    new.project_id,
    'current_scope_progress_percent',
    'Current scope progress',
    progress_percent,
    jsonb_build_object(
      'status','current',
      'contract_version',1,
      'scope_revision',scope_doc ->> 'revision',
      'completed_weight',completed_weight,
      'total_weight',total_weight,
      'checkpoint_id',new.id,
      'observed_at',new.observed_at
    )::text,
    'percent',
    true,
    'checkpoint:' || new.id::text,
    false,
    now()
  )
  on conflict (owner_id, project_id, key) do update set
    label = excluded.label,
    value_numeric = excluded.value_numeric,
    value_text = excluded.value_text,
    unit = excluded.unit,
    verified = true,
    source = excluded.source,
    show_on_card = false,
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists command_center_scope_progress_checkpoint_trg on public.source_checkpoints;
create trigger command_center_scope_progress_checkpoint_trg
after insert or update of state_json, verified, observed_at, captured_at
on public.source_checkpoints
for each row
execute function public.command_center_scope_progress_from_checkpoint();

create or replace function public.command_center_enforce_scope_freshness_on_refresh()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  stale_count integer := 0;
  stale_names text[] := '{}';
begin
  if new.status <> 'completed' then
    return new;
  end if;

  select count(*), coalesce(array_agg(p.name order by p.sort_order, p.name), '{}')
    into stale_count, stale_names
  from public.projects p
  where p.owner_id = new.owner_id
    and exists (
      select 1
      from public.project_sources ps
      where ps.owner_id = p.owner_id
        and ps.project_id = p.id
        and ps.active = true
    )
    and not exists (
      select 1
      from public.metrics m
      where m.owner_id = p.owner_id
        and m.project_id = p.id
        and m.key = 'current_scope_progress_percent'
        and m.verified = true
        and m.value_numeric is not null
        and m.value_numeric between 0 and 100
    );

  if stale_count > 0 then
    new.status := 'partial';
    new.summary := concat_ws(
      ' ',
      nullif(new.summary, ''),
      format(
        'Scope progress freshness: %s tracked project%s require%s a current verified scope checkpoint.',
        stale_count,
        case when stale_count = 1 then '' else 's' end,
        case when stale_count = 1 then 's' else '' end
      )
    );
    new.source_snapshot := coalesce(new.source_snapshot, '{}'::jsonb)
      || jsonb_build_object('scope_progress_stale_projects', to_jsonb(stale_names));
  end if;

  return new;
end;
$$;

drop trigger if exists command_center_scope_freshness_refresh_trg on public.refresh_requests;
create trigger command_center_scope_freshness_refresh_trg
before update of status
on public.refresh_requests
for each row
execute function public.command_center_enforce_scope_freshness_on_refresh();

-- One-time verified current-scope baseline. These values are derived from
-- scope-progress-baselines-v1.json and are not status-word estimates.
with baseline(project_id, pct, completed_weight, total_weight) as (
  values
    ('command-center', 97::numeric, 28::numeric, 29::numeric),
    ('kdp-missing-hour', 73, 16, 22),
    ('kdp-glasswing-pier', 53, 9, 17),
    ('kdp-unfired-world', 53, 9, 17),
    ('kdp-workbooks', 67, 10, 15),
    ('edge-finder', 47, 7, 15),
    ('morgancommerce', 27, 4, 15),
    ('fanvue-veyla', 57, 4, 7),
    ('morgans-garage-doors', 67, 8, 12),
    ('margincrafttools', 50, 6, 12),
    ('coupon-autopilot', 33, 4, 12),
    ('kdp-repeat-button', 100, 8, 8),
    ('kdp-melted-cosmos', 10, 2, 20),
    ('kdp-standalones', 56, 10, 18),
    ('velo-clip', 38, 3, 8),
    ('torevi', 36, 5, 14),
    ('mini-movies', 17, 2, 12),
    ('revocapture', 33, 4, 12)
)
insert into public.metrics (
  owner_id, project_id, key, label, value_numeric, value_text, unit,
  verified, source, show_on_card, updated_at
)
select
  p.owner_id,
  p.id,
  'current_scope_progress_percent',
  'Current scope progress',
  b.pct,
  jsonb_build_object(
    'status','current',
    'contract_version',1,
    'scope_revision','2026-10-19-baseline-v1',
    'completed_weight',b.completed_weight,
    'total_weight',b.total_weight,
    'baseline_file','scope-progress-baselines-v1.json'
  )::text,
  'percent',
  true,
  'scope_baseline_v1',
  false,
  now()
from public.projects p
join baseline b on b.project_id = p.id
on conflict (owner_id, project_id, key) do update set
  label = excluded.label,
  value_numeric = excluded.value_numeric,
  value_text = excluded.value_text,
  unit = excluded.unit,
  verified = excluded.verified,
  source = excluded.source,
  show_on_card = excluded.show_on_card,
  updated_at = now();
