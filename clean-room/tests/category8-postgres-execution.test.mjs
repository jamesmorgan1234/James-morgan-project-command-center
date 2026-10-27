import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto';

const migrations = [
  '20261026080000_p8_1_personal_tasks.sql',
  '20261026081000_p8_2_calendar_reconciliation.sql',
  '20261026082000_p8_3_personal_operations.sql',
  '20261026083000_p8_4_contacts_followup.sql',
  '20261026084000_p8_5_needs_me.sql',
  '20261026085000_p8_6_onboarding_manifests.sql',
  '20261026090000_p8_7_universal_search.sql',
  '20261026091000_p8_8_notifications.sql',
  '20261026092000_p8_9_scheduled_automation.sql',
  '20261026093000_p8_10_condition_watches.sql',
  '20261026094000_p8_11_personal_privacy_recovery.sql'
];

const OWNER1 = '00000000-0000-0000-0000-000000000001';
const OWNER2 = '00000000-0000-0000-0000-000000000002';
const STEP = '00000000-0000-0000-0000-000000000100';

async function scalar(db, sql) {
  return Object.values((await db.query(sql)).rows[0])[0];
}

test('Category 8 executes durable personal-ops contracts in isolated PostgreSQL', async (t) => {
  const db = new PGlite({ extensions: { pgcrypto } });
  try {
    await db.exec(`
      create role anon;
      create role authenticated;
      create schema auth;
      grant usage on schema auth to authenticated;
      create schema extensions;
      create extension pgcrypto with schema extensions;
      create table auth.users(id uuid primary key);
      insert into auth.users values('${OWNER1}'),('${OWNER2}');
      create table public.projects(id text primary key, owner_id uuid not null references auth.users(id));
      insert into public.projects values('personal-core','${OWNER1}'),('other-project','${OWNER2}');
      create table public.agent_steps(id uuid primary key);
      insert into public.agent_steps values('${STEP}');
      create function auth.uid() returns uuid language sql as $$
        select coalesce(nullif(current_setting('fixture.owner',true),''),'${OWNER1}')::uuid
      $$;
      create function public.is_command_center_authorized() returns boolean language sql as $$
        select coalesce(current_setting('fixture.authorized',true),'true')='true'
      $$;
      set fixture.owner='${OWNER1}';
      set fixture.authorized='true';
    `);

    for (const name of migrations) {
      await db.exec(readFileSync(new URL(`../../supabase/migrations/${name}`, import.meta.url), 'utf8'));
    }

    await t.test('P8.1 persists one occurrence, completes atomically once, and keeps immutable history', async () => {
      await db.exec(`
        insert into command_center_personal_tasks(owner_id,task_id,project_id,title,priority,state,due_at,recurrence_key,source_refs)
        values('${OWNER1}','task','personal-core','Daily check','high','open','2026-10-27T12:00:00Z','daily:08:00:America/New_York',array['owner']);
        insert into command_center_personal_task_occurrences(owner_id,task_id,occurrence_key,project_id,scheduled_for,idempotency_key,agency_step_id,agency_execution_ref,pif_trace_ref,evidence_refs)
        values('${OWNER1}','task','2026-10-27T08:00:00-04:00','personal-core','2026-10-27T12:00:00Z','personal-task:fixture','${STEP}','agent-step:task','decision:task@1',array['scheduler:due']);
      `);
      await assert.rejects(db.query(`insert into command_center_personal_task_occurrences(owner_id,task_id,occurrence_key,scheduled_for,idempotency_key,evidence_refs) values('${OWNER1}','task','duplicate-key','2026-10-27T12:00:00Z','personal-task:fixture',array['duplicate'])`), /unique|duplicate/i);
      await db.query(`select command_center_complete_personal_task_occurrence('task','2026-10-27T08:00:00-04:00','2026-10-27T12:05:00Z','personal-task:fixture',array['completed'],'agent-step:task','decision:task@1')`);
      assert.equal(await scalar(db, `select state from command_center_personal_task_occurrences where owner_id='${OWNER1}' and task_id='task'`), 'completed');
      assert.equal(await scalar(db, `select count(*)::int from command_center_personal_task_completions where owner_id='${OWNER1}' and task_id='task'`), 1);
      await assert.rejects(db.query(`select command_center_complete_personal_task_occurrence('task','2026-10-27T08:00:00-04:00','2026-10-27T12:06:00Z','personal-task:fixture',array['duplicate'])`), /missing|already completed|cancelled|mismatched/i);
      await assert.rejects(db.query(`delete from command_center_personal_task_completions where owner_id='${OWNER1}' and task_id='task'`), /immutable/i);
    });

    await t.test('P8.2 preserves provider identity and immutable reconciliation evidence', async () => {
      await db.exec(`
        insert into command_center_calendar_events(owner_id,event_id,provider_key,external_id,project_id,title,starts_at,ends_at,time_zone,provider_version,source_ref)
        values('${OWNER1}','evt','calendar:test','external','personal-core','Meeting','2026-11-01T05:30:00Z','2026-11-01T06:30:00Z','America/New_York',1,'provider:v1');
        insert into command_center_calendar_reconciliations(owner_id,event_id,provider_key,external_id,local_version,remote_version,status,local_source_ref,remote_source_ref,evidence_refs)
        values('${OWNER1}','evt','calendar:test','external',1,2,'remote_applied','provider:v1','provider:v2',array['provider:v1','provider:v2']);
      `);
      await assert.rejects(db.query(`update command_center_calendar_reconciliations set status='unchanged' where owner_id='${OWNER1}' and event_id='evt'`), /immutable/i);
      await assert.rejects(db.query(`insert into command_center_calendar_events(owner_id,event_id,provider_key,external_id,title,starts_at,ends_at,time_zone,provider_version,source_ref) values('${OWNER1}','evt-duplicate','calendar:test','external','Duplicate','2026-11-01T05:30:00Z','2026-11-01T06:30:00Z','America/New_York',1,'provider:v1')`), /unique|duplicate/i);
    });

    await t.test('P8.3 keeps one canonical truth owner per owner/canonical reference', async () => {
      await db.exec(`insert into command_center_personal_operations(owner_id,operation_id,kind,title,truth_owner_key,canonical_ref,specialist_project_id,status,sensitivity_rank,source_refs) values('${OWNER1}','shopping','shopping','Weekly list','coupon-autopilot','shopping:list:weekly','coupon-autopilot','open',1,array['specialist'])`);
      assert.equal(await scalar(db, `select projection_only from command_center_personal_operations where owner_id='${OWNER1}' and operation_id='shopping'`), true);
      await assert.rejects(db.query(`insert into command_center_personal_operations(owner_id,operation_id,kind,title,truth_owner_key,canonical_ref,status,sensitivity_rank,source_refs) values('${OWNER1}','shadow','shopping','Shadow','personal-core','shopping:list:weekly','open',1,array['shadow'])`), /unique|duplicate/i);
      await assert.rejects(db.query(`insert into command_center_personal_operations(owner_id,operation_id,kind,title,truth_owner_key,canonical_ref,specialist_project_id,status,sensitivity_rank,source_refs) values('${OWNER1}','bad','household','Bad','personal-core','household:bad','specialist','open',1,array['owner'])`), /check/i);
    });

    await t.test('P8.4 contact/follow-up persistence cannot cross owner identity', async () => {
      await db.exec(`insert into command_center_personal_contacts(owner_id,contact_id,display_name,sensitivity,relationship_context_refs) values('${OWNER1}','contact','Contact','sensitive',array['private:context']);`);
      await assert.rejects(db.query(`insert into command_center_personal_followups(owner_id,followup_id,contact_id,reason,state,communication_boundary,source_refs) values('${OWNER2}','foreign-follow','contact','Cross owner','open','recommend_only',array['foreign'])`), /foreign key/i);
      await db.exec(`insert into command_center_personal_followups(owner_id,followup_id,contact_id,reason,state,communication_boundary,source_refs) values('${OWNER1}','follow','contact','Check in','open','send_requires_authorization',array['owner'])`);
      assert.equal(await scalar(db, `select communication_boundary from command_center_personal_followups where owner_id='${OWNER1}' and followup_id='follow'`), 'send_requires_authorization');
    });

    await t.test('P8.5 one durable need resolution is idempotent and retains every resume ref', async () => {
      await db.exec(`insert into command_center_owner_needs(owner_id,need_id,need_key,title,reason,urgency,required_environment,owner_action,unlock_refs,resume_refs,source_refs,state) values('${OWNER1}','need','connect:calendar','Connect calendar','Blocked','high','local_browser','Connect calendar',array['calendar:read','calendar:write'],array['run:sync','run:create'],array['blocked'],'open')`);
      const first = await db.query(`select * from command_center_resolve_owner_need('connect:calendar','2026-10-27T13:00:00Z',array['owner:connected'])`);
      const second = await db.query(`select * from command_center_resolve_owner_need('connect:calendar','2026-10-27T13:01:00Z',array['owner:connected-again'])`);
      assert.equal(first.rows.length, 1); assert.equal(second.rows.length, 1);
      assert.equal(await scalar(db, `select count(*)::int from command_center_need_resolutions where owner_id='${OWNER1}' and need_key='connect:calendar'`), 1);
      assert.equal(await scalar(db, `select state from command_center_owner_needs where owner_id='${OWNER1}' and need_key='connect:calendar'`), 'resolved');
      await assert.rejects(db.query(`delete from command_center_need_resolutions where owner_id='${OWNER1}' and need_key='connect:calendar'`), /immutable/i);
    });

    await t.test('P8.6 onboarding completion is pinned to exact project/spec requirement and immutable', async () => {
      await db.exec(`insert into command_center_onboarding_requirements(owner_id,project_id,spec_version,requirement_id,kind,title,dependency_ids,unlock_refs,required_environment,owner_only,known_at_spec_time) values('${OWNER1}','personal-core',1,'account','account','Create account','{}',array['provider:connect'],'local_browser',true,true)`);
      await assert.rejects(db.query(`insert into command_center_onboarding_completions(owner_id,project_id,spec_version,requirement_id,completed_at,evidence_refs) values('${OWNER1}','personal-core',2,'account',now(),array['wrong-spec'])`), /foreign key/i);
      await db.exec(`insert into command_center_onboarding_completions(owner_id,project_id,spec_version,requirement_id,completed_at,evidence_refs) values('${OWNER1}','personal-core',1,'account',now(),array['owner:done'])`);
      await assert.rejects(db.query(`update command_center_onboarding_completions set evidence_refs=array['changed'] where owner_id='${OWNER1}' and project_id='personal-core' and requirement_id='account'`), /immutable/i);
    });

    await t.test('P8.7 search projections enforce owner-scoped RLS and durable provenance', async () => {
      await db.exec(`insert into command_center_search_projections(owner_id,projection_id,domain,project_id,title,search_text,sensitivity_rank,permission_refs,provenance_refs,source_pointer,source_version) values('${OWNER1}','search-1','personal','personal-core','Daily check','daily task',1,array['task.read'],array['task:1'],'task:1',1)`);
      assert.equal(await scalar(db, `select provenance_refs[1] from command_center_search_projections where owner_id='${OWNER1}' and projection_id='search-1'`), 'task:1');
    });

    await t.test('P8.8 notification acknowledgement history is immutable', async () => {
      await db.exec(`insert into command_center_notification_intents(owner_id,intent_id,dedupe_key,severity,title,body,sensitivity_rank,source_refs) values('${OWNER1}','n1','task:1','high','Attention','Open Command Center',1,array['task:1']); insert into command_center_notification_acknowledgements(owner_id,intent_id,acknowledged_at,evidence_refs) values('${OWNER1}','n1',now(),array['owner:ack']);`);
      await assert.rejects(db.query(`delete from command_center_notification_acknowledgements where owner_id='${OWNER1}' and intent_id='n1'`), /immutable/i);
    });

    await t.test('P8.9 scheduled occurrences survive persistence and duplicate cadence identity is blocked', async () => {
      await db.exec(`insert into command_center_scheduled_automations(owner_id,automation_id,project_id,schedule_ref,enabled,action_policy,provider_health) values('${OWNER1}','auto','personal-core','daily:08:00',true,'notification_only','available'); insert into command_center_automation_occurrences(owner_id,automation_id,scheduled_for,started_at,state,agency_step_id,evidence_refs) values('${OWNER1}','auto','2026-10-27T12:00:00Z','2026-10-27T12:00:01Z','started','${STEP}','{}');`);
      await assert.rejects(db.query(`insert into command_center_automation_occurrences(owner_id,automation_id,scheduled_for,started_at,state,evidence_refs) values('${OWNER1}','auto','2026-10-27T12:00:00Z','2026-10-27T12:01:00Z','started','{}')`), /unique|duplicate/i);
      assert.equal(await scalar(db, `select state from command_center_automation_occurrences where owner_id='${OWNER1}' and automation_id='auto'`), 'started');
    });

    await t.test('P8.10 watch observations are unique and transition history cannot authorize protected effects', async () => {
      await db.exec(`insert into command_center_condition_watches(owner_id,watch_id,project_id,condition_key,cadence_ref,action_policy,prior_verified_state) values('${OWNER1}','watch','personal-core','reply-arrived','hourly','notification_only',false); insert into command_center_watch_observations(owner_id,watch_id,observation_id,observed_at,condition_met,verified,source_refs) values('${OWNER1}','watch','obs-1','2026-10-27T14:00:00Z',true,true,array['provider:verified']); insert into command_center_watch_transitions(owner_id,watch_id,observation_id,decision,reason,protected_action_authorized,evidence_refs) values('${OWNER1}','watch','obs-1','fire','verified_condition_transition',false,array['provider:verified']);`);
      await assert.rejects(db.query(`insert into command_center_watch_observations(owner_id,watch_id,observation_id,observed_at,condition_met,verified,source_refs) values('${OWNER1}','watch','obs-1','2026-10-27T14:01:00Z',true,true,array['duplicate'])`), /unique|duplicate/i);
      await assert.rejects(db.query(`insert into command_center_watch_transitions(owner_id,watch_id,observation_id,decision,reason,protected_action_authorized,evidence_refs) values('${OWNER1}','watch','obs-2','fire','bad',true,array['bad'])`), /check|foreign key/i);
      await assert.rejects(db.query(`delete from command_center_watch_transitions where owner_id='${OWNER1}' and watch_id='watch' and observation_id='obs-1'`), /immutable/i);
    });

    await t.test('P8.11 recovery apply is one-shot, immutable, and cannot persist protected authority', async () => {
      await db.exec(`insert into command_center_personal_recovery_snapshots(owner_id,snapshot_id,schema_version,project_id,domain,snapshot_created_at,sensitivity_rank,integrity_hash,provenance_refs) values('${OWNER1}','backup','cc-personal-recovery-v1','personal-core','personal-ops','2026-10-27T12:00:00Z',1,'sha256:trusted',array['backup:manifest']); insert into command_center_personal_recovery_records(owner_id,snapshot_id,record_id,project_id,domain,sensitivity_rank,record_kind,content_hash,provenance_refs) values('${OWNER1}','backup','task','personal-core','personal-ops',1,'data','sha256:record',array['task:1']); insert into command_center_personal_recovery_applies(owner_id,recovery_id,snapshot_id,integrity_hash,project_id,domain,mode,reason,evidence_refs,protected_action_authorized) values('${OWNER1}','recovery-1','backup','sha256:trusted','personal-core','personal-ops','applied','verified',array['restore:commit'],false)`);
      await assert.rejects(db.query(`insert into command_center_personal_recovery_applies(owner_id,recovery_id,snapshot_id,integrity_hash,project_id,domain,mode,reason,evidence_refs,protected_action_authorized) values('${OWNER1}','recovery-2','backup','sha256:trusted','personal-core','personal-ops','applied','duplicate',array['duplicate'],false)`), /unique|duplicate/i);
      await assert.rejects(db.query(`insert into command_center_personal_recovery_applies(owner_id,recovery_id,snapshot_id,integrity_hash,project_id,domain,mode,reason,evidence_refs,protected_action_authorized) values('${OWNER1}','recovery-3','backup','sha256:trusted','personal-core','personal-ops','dry_run','bad-authority',array['bad'],true)`), /check/i);
      await assert.rejects(db.query(`delete from command_center_personal_recovery_applies where owner_id='${OWNER1}' and recovery_id='recovery-1'`), /immutable/i);
    });

    await t.test('all Category 8 owner RLS reads isolate another authenticated owner and authorization revocation denies mutation', async () => {
      await db.exec(`set role authenticated; set fixture.owner='${OWNER1}';`);
      assert.equal(await scalar(db, `select count(*)::int from command_center_personal_tasks where task_id='task'`), 1);
      assert.equal(await scalar(db, `select count(*)::int from command_center_search_projections where projection_id='search-1'`), 1);
      await db.exec(`set fixture.owner='${OWNER2}';`);
      assert.equal(await scalar(db, `select count(*)::int from command_center_personal_tasks where task_id='task'`), 0);
      assert.equal(await scalar(db, `select count(*)::int from command_center_search_projections where projection_id='search-1'`), 0);
      await db.exec(`set fixture.owner='${OWNER1}'; set fixture.authorized='false';`);
      await assert.rejects(db.query(`insert into command_center_personal_tasks(owner_id,task_id,title,priority,state,source_refs) values('${OWNER1}','denied','Denied','normal','open',array['denied'])`), /row-level security|policy/i);
      await db.exec(`reset role; set fixture.authorized='true'; set fixture.owner='${OWNER1}';`);
    });
  } finally {
    await db.close();
  }
});
