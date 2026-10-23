-- Owner correction 2026-10-23:
-- These ten titles are individual books. They are not a series, trilogy, bundle, or collection.
-- "Individual Books" is an organizational umbrella/category only; each title remains its own project.

begin;

update public.cc7_projects
set category='Amazon Books / KDP — Individual Book',
    source_status=regexp_replace(
      coalesce(source_status,''),
      '(independent workbook project|independent standalone book project)',
      'independent individual book project',
      'gi'
    ),
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
