-- Preserve the verified per-title scope from the former filing umbrellas after the
-- ten titles were split into independent Individual Book projects.
-- Each title previously carried production-package weight 2 complete plus one
-- remaining publishing-pipeline weight 1, so the inherited current scope is 2/3.

update public.cc7_projects
set verification='Exact approved cover locked; production-complete state preserved from the verified book file. This is an independent individual book under the Individual Books organizational umbrella; it is not a series, collection, or bundle.',
    updated_at=now()
where id in (
  'kdp-daily-progress-planner','kdp-a-stronger-you','kdp-simple-budgeting-workbook','kdp-take-control-of-your-money','kdp-garage-door-business-blueprint',
  'kdp-pieces-i-never-got-back','kdp-a-calmer-mind','kdp-broken-but-still-here','kdp-moving-forward-anyway','kdp-alpha-mindset'
);

insert into public.cc7_metrics (
  owner_id,project_id,key,label,value_numeric,value_text,unit,verified,source,show_on_card,updated_at
)
select p.owner_id,p.id,'current_scope_progress_percent','Current scope progress',66.6,
       jsonb_build_object(
         'status','current',
         'contract_version',1,
         'scope_revision','individual-book-split-v1',
         'completed_weight',2,
         'total_weight',3,
         'basis','Inherited from the previously verified per-title umbrella scope: production package weight 2 complete; remaining publishing pipeline weight 1 pending.'
       )::text,
       'percent',true,'verified individual-book split from authoritative umbrella scope',false,now()
from public.cc7_projects p
where p.id in (
  'kdp-daily-progress-planner','kdp-a-stronger-you','kdp-simple-budgeting-workbook','kdp-take-control-of-your-money','kdp-garage-door-business-blueprint',
  'kdp-pieces-i-never-got-back','kdp-a-calmer-mind','kdp-broken-but-still-here','kdp-moving-forward-anyway','kdp-alpha-mindset'
)
on conflict (owner_id,project_id,key) do update set
  label=excluded.label,
  value_numeric=excluded.value_numeric,
  value_text=excluded.value_text,
  unit=excluded.unit,
  verified=excluded.verified,
  source=excluded.source,
  show_on_card=excluded.show_on_card,
  updated_at=excluded.updated_at;
