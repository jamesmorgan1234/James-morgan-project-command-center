-- Owner correction 2026-10-23:
-- These ten titles are individual books. They are not a series, trilogy, bundle, or collection.
-- "Individual Books" is an organizational umbrella/category only; each title remains its own project.
-- Former filing-type wording is retained only as internal compatibility metadata for the existing Agent target detector.

begin;

update public.cc7_projects
set category='Amazon Books / KDP — Individual Book',
    source_status=case
      when id in (
        'kdp-daily-progress-planner',
        'kdp-a-stronger-you',
        'kdp-simple-budgeting-workbook',
        'kdp-take-control-of-your-money',
        'kdp-garage-door-business-blueprint'
      ) then 'Owner correction 2026-10-23: independent individual book project; previous filing type: independent workbook project; Individual Books umbrella only.'
      else 'Owner correction 2026-10-23: independent individual book project; previous filing type: independent standalone book project; Individual Books umbrella only.'
    end,
    updated_at=now()
where id in (
  'kdp-daily-progress-planner',
  'kdp-a-stronger-you',
  'kdp-simple-budgeting-workbook',
  'kdp-take-control-of-your-money',
  'kdp-garage-door-business-blueprint',
  'kdp-pieces-i-never-got-back',
  'kdp-a-calmer-mind',
  'kdp-broken-but-still-here',
  'kdp-moving-forward-anyway',
  'kdp-alpha-mindset'
);

commit;
