import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const root=fs.readFileSync('index.html','utf8');
const isolated=fs.readFileSync('authoritative-v7/index.html','utf8');
const repair=fs.readFileSync('authoritative-v7/agent-repair.js','utf8');
const projectAuto=fs.readFileSync('authoritative-v7/project-auto.js','utf8');
const data=fs.readFileSync('authoritative-v7/data.js','utf8');
const migration=fs.readFileSync('supabase/migrations/20261023_cc7_agent_project_auto_recheck.sql','utf8');

for(const html of [root,isolated]){
  test('Agent repair assets are loaded',()=>{
    assert.match(html,/agent-repair\.css\?v=1/);
    assert.match(html,/agent-repair\.js\?v=1/);
    assert.match(html,/project-auto\.js\?v=2/);
  });
}

test('Home Agent progress uses verified durable tasks',()=>{
  assert.match(repair,/tasks\.filter\(t=>t\.status==='verified'\)\.length/);
  assert.match(repair,/Math\.round\(\(verified\/total\)\*100\)/);
  assert.match(repair,/Plan not established yet/);
});

test('Queued is never described as working',()=>{
  assert.match(repair,/Waiting for the scheduled runner cycle/);
  assert.match(projectAuto,/Waiting for the scheduled runner cycle/);
  assert.doesNotMatch(projectAuto,/Starting selected project only…[\s\S]*Working now/);
});

test('Project Auto verifies access and stays project-scoped',()=>{
  assert.match(projectAuto,/agent_access_enabled/);
  assert.match(projectAuto,/Stay locked to this project/);
  assert.match(projectAuto,/Agent access is disabled for this project/);
});

test('Project Checkpoint requests same-run re-verification',()=>{
  assert.match(data,/cc7_agent_owner_request_project_auto_recheck/);
  assert.match(migration,/control_mode <> 'project_auto'/);
  assert.match(migration,/status not in \('needs_user','blocked'\)/);
  assert.match(migration,/status='queued'/);
  assert.match(migration,/owner_recheck_requested/);
  assert.match(migration,/project_auto_project_id is distinct from p_project_id/);
});

test('Agent UI filters revoked access and explains blocker recovery',()=>{
  assert.match(repair,/agent_access_enabled===false/);
  assert.match(repair,/press Project Checkpoint to request verification and resume this same Project Auto run/);
  assert.match(repair,/BLOCKED/);
});
