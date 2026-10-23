-- Owner correction 2026-10-23:
-- Workbooks and standalone books are independent book projects.
-- The old grouped rows remain as hidden filing/history records only.

begin;

with owners as (
  select owner_id from public.cc7_projects where id='kdp-workbooks' limit 1
), rows(id,name,category,status,verification,stage,next_action,blocker,attention,sort_order,last_verified,source_status) as (
  values
  ('kdp-daily-progress-planner','Daily Progress Planner','Amazon Books / KDP — Workbook','Production complete / unpublished','Exact approved cover locked; production-complete state preserved from the verified workbook file. This is an independent workbook, not a series/collection/bundle.','Production complete and ready for KDP platform upload','Upload this workbook’s approved final print package to KDP, run Previewer, enter its own metadata, and submit. Do not upload a write-in EPUB.','No remaining normal-chat production blocker; KDP platform upload/Previewer/submission remain.',true,20161,'2026-10-18','Owner correction 2026-10-23: independent workbook project; Workbooks is a filing category only.'),
  ('kdp-a-stronger-you','A Stronger You','Amazon Books / KDP — Workbook','Production complete / unpublished','Exact approved cover locked; production-complete state preserved from the verified workbook file. This is an independent workbook, not a series/collection/bundle.','Production complete and ready for KDP platform upload','Upload this workbook’s approved final print package to KDP, run Previewer, enter its own metadata, and submit. Do not upload a write-in EPUB.','No remaining normal-chat production blocker; KDP platform upload/Previewer/submission remain.',true,20162,'2026-10-18','Owner correction 2026-10-23: independent workbook project; Workbooks is a filing category only.'),
  ('kdp-simple-budgeting-workbook','Simple Budgeting Workbook','Amazon Books / KDP — Workbook','Production complete / unpublished','Exact approved cover locked; production-complete state preserved from the verified workbook file. This is an independent workbook, not a series/collection/bundle.','Production complete and ready for KDP platform upload','Upload this workbook’s approved final print package to KDP, run Previewer, enter its own metadata, and submit. Do not upload a write-in EPUB.','No remaining normal-chat production blocker; KDP platform upload/Previewer/submission remain.',true,20163,'2026-10-18','Owner correction 2026-10-23: independent workbook project; Workbooks is a filing category only.'),
  ('kdp-take-control-of-your-money','Take Control of Your Money','Amazon Books / KDP — Workbook','Production complete / unpublished','Exact approved cover locked; production-complete state preserved from the verified workbook file. This is an independent workbook, not a series/collection/bundle.','Production complete and ready for KDP platform upload','Upload this workbook’s approved final print package to KDP, run Previewer, enter its own metadata, and submit. Do not upload a write-in EPUB.','No remaining normal-chat production blocker; KDP platform upload/Previewer/submission remain.',true,20164,'2026-10-18','Owner correction 2026-10-23: independent workbook project; Workbooks is a filing category only.'),
  ('kdp-garage-door-business-blueprint','Garage Door Business Blueprint','Amazon Books / KDP — Workbook','Production complete / unpublished','Exact approved cover locked; production-complete state preserved from the verified workbook file. This is an independent workbook, not a series/collection/bundle.','Production complete and ready for KDP platform upload','Upload this workbook’s approved final package to KDP, including its retained Kindle EPUB where applicable; run Previewer, enter its own metadata, and submit.','No remaining normal-chat production blocker; KDP platform upload/Previewer/submission remain.',true,20165,'2026-10-18','Owner correction 2026-10-23: independent workbook project; Workbooks is a filing category only.'),
  ('kdp-pieces-i-never-got-back','Pieces I Never Got Back','Amazon Books / KDP — Standalone Book','Production complete / unpublished','Exact approved cover locked; production-complete/ready state preserved from the verified standalone file. This is an independent book, not a series/collection/bundle.','Production complete and ready for KDP platform upload','Upload this book’s approved final package to KDP, run Previewer, enter its own metadata, and submit.','No remaining normal-chat production blocker; KDP platform upload/Previewer/submission remain.',true,70181,'2026-10-18','Owner correction 2026-10-23: independent standalone book project; Standalone Books is a filing category only.'),
  ('kdp-a-calmer-mind','A Calmer Mind','Amazon Books / KDP — Standalone Book','Production complete / unpublished','Exact approved cover locked; production-complete/ready state preserved from the verified standalone file. This is an independent book, not a series/collection/bundle.','Production complete and ready for KDP platform upload','Upload this book’s approved final package to KDP, run Previewer, enter its own metadata, and submit.','No remaining normal-chat production blocker; KDP platform upload/Previewer/submission remain.',true,70182,'2026-10-18','Owner correction 2026-10-23: independent standalone book project; Standalone Books is a filing category only.'),
  ('kdp-broken-but-still-here','Broken But Still Here','Amazon Books / KDP — Standalone Book','Production complete / unpublished','Exact approved cover locked; production-complete/ready state preserved from the verified standalone file. This is an independent book, not a series/collection/bundle.','Production complete and ready for KDP platform upload','Upload this book’s approved final package to KDP, run Previewer, enter its own metadata, and submit.','No remaining normal-chat production blocker; KDP platform upload/Previewer/submission remain.',true,70183,'2026-10-18','Owner correction 2026-10-23: independent standalone book project; Standalone Books is a filing category only.'),
  ('kdp-moving-forward-anyway','Moving Forward Anyway','Amazon Books / KDP — Standalone Book','Production complete / unpublished','Exact approved cover locked; production-complete/ready state preserved from the verified standalone file. This is an independent book, not a series/collection/bundle.','Production complete and ready for KDP platform upload','Upload this book’s approved final package to KDP, run Previewer, enter its own metadata, and submit.','No remaining normal-chat production blocker; KDP platform upload/Previewer/submission remain.',true,70184,'2026-10-18','Owner correction 2026-10-23: independent standalone book project; Standalone Books is a filing category only.'),
  ('kdp-alpha-mindset','The Alpha Mindset','Amazon Books / KDP — Standalone Book','Production complete / unpublished','Exact approved cover locked; production-complete/ready state preserved from the verified standalone file. This is an independent book, not a series/collection/bundle.','Production complete and ready for KDP platform upload','Upload this book’s approved final package to KDP, run Previewer, enter its own metadata, and submit.','No remaining normal-chat production blocker; KDP platform upload/Previewer/submission remain.',true,70185,'2026-10-18','Owner correction 2026-10-23: independent standalone book project; Standalone Books is a filing category only.')
)
insert into public.cc7_projects(id,owner_id,name,category,status,verification,stage,next_action,blocker,attention,sort_order,last_verified,source_status)
select r.id,o.owner_id,r.name,r.category,r.status,r.verification,r.stage,r.next_action,r.blocker,r.attention,r.sort_order,r.last_verified,r.source_status
from rows r cross join owners o
on conflict (id) do update set
  name=excluded.name,category=excluded.category,status=excluded.status,verification=excluded.verification,stage=excluded.stage,next_action=excluded.next_action,blocker=excluded.blocker,attention=excluded.attention,sort_order=excluded.sort_order,last_verified=excluded.last_verified,source_status=excluded.source_status,updated_at=now();

with map(source_project,source_key,target_project) as (
  values
  ('kdp-workbooks','bookmap.daily-progress-planner.metadata','kdp-daily-progress-planner'),
  ('kdp-workbooks','bookmap.a-stronger-you.metadata','kdp-a-stronger-you'),
  ('kdp-workbooks','bookmap.simple-budgeting-workbook.metadata','kdp-simple-budgeting-workbook'),
  ('kdp-workbooks','bookmap.take-control-of-your-money.metadata','kdp-take-control-of-your-money'),
  ('kdp-workbooks','bookmap.garage-door-business-blueprint.metadata','kdp-garage-door-business-blueprint'),
  ('kdp-standalones','bookmap.pieces-i-never-got-back.metadata','kdp-pieces-i-never-got-back'),
  ('kdp-standalones','bookmap.a-calmer-mind.metadata','kdp-a-calmer-mind'),
  ('kdp-standalones','bookmap.broken-but-still-here.metadata','kdp-broken-but-still-here'),
  ('kdp-standalones','bookmap.moving-forward-anyway.metadata','kdp-moving-forward-anyway'),
  ('kdp-standalones','bookmap.alpha-mindset.metadata','kdp-alpha-mindset')
)
insert into public.cc7_metrics(owner_id,project_id,key,label,value_numeric,value_text,unit,verified,source,show_on_card,created_at,updated_at)
select m.owner_id,map.target_project,m.key,m.label,m.value_numeric,m.value_text,m.unit,m.verified,coalesce(m.source,'')||' | copied to independent book project 2026-10-23',m.show_on_card,m.created_at,now()
from map join public.cc7_metrics m on m.project_id=map.source_project and m.key=map.source_key
on conflict (owner_id,project_id,key) do update set
  label=excluded.label,value_numeric=excluded.value_numeric,value_text=excluded.value_text,unit=excluded.unit,verified=excluded.verified,source=excluded.source,show_on_card=excluded.show_on_card,updated_at=now();

update public.cc7_projects
set source_status='filing_only_hidden | '||coalesce(source_status,''), attention=false, updated_at=now()
where id in ('kdp-workbooks','kdp-standalones') and source_status not like 'filing_only_hidden%';

commit;
