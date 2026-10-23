import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const app=fs.readFileSync('authoritative-v7/app.js','utf8');
const root=fs.readFileSync('index.html','utf8');
const isolated=fs.readFileSync('authoritative-v7/index.html','utf8');
const api=fs.readFileSync('authoritative-v7/agent-api.js','utf8');

for(const html of [root,isolated]){
  test('entrypoint uses native Agent path only',()=>{
    assert.match(html,/app\.js\?v=5/);
    assert.match(html,/agent-native\.css\?v=1/);
    assert.doesNotMatch(html,/project-auto\.js/);
    assert.doesNotMatch(html,/agent-repair\.js/);
  });
}

test('Agent and Project Auto are native-rendered, not observer overlays',()=>{
  assert.doesNotMatch(app,/MutationObserver/);
  assert.match(app,/data-agent-create="\$\{esc\(mode\)\}"/);
  assert.match(app,/agentControl\('project_auto'/);
  assert.match(app,/function agentScreen\(/);
  assert.match(app,/function homeScreen\(/);
});

test('Project Auto is exact-project scoped and full Work ladder authorized',()=>{
  assert.match(app,/Project Auto requires one selected project/);
  assert.match(app,/Stay locked to this project and never switch to another project/);
  assert.match(app,/Luna High first, then Sol Light/);
  assert.match(app,/then Sol Medium/);
  assert.match(app,/controlMode:'project_auto'/);
  assert.match(app,/allowWork:true/);
});

test('Project Auto does not bypass non-Work safety gates',()=>{
  assert.match(app,/does not authorize spending, paid credits, publishing, legal acceptance, communications, security changes, scope expansion/);
});

test('Project Auto checkpoint rechecks and resumes same run',()=>{
  assert.match(app,/requestProjectAutoRecheck\(projectId\)/);
  assert.match(api,/cc7_agent_owner_request_project_auto_recheck/);
});

test('Agent progress is durable-task based and truthful',()=>{
  assert.match(app,/tasks\.filter\(t=>t\.status==='verified'\)\.length/);
  assert.match(app,/Math\.round\(\(verified\/total\)\*100\)/);
  assert.match(app,/Plan not established yet/);
  assert.match(app,/Waiting for the scheduled runner cycle/);
});

test('revoked projects and portfolio Books selection are filtered',()=>{
  assert.match(app,/project\?\.agent_access_enabled!==false/);
  assert.match(app,/filter\(p=>agentAllowed\(p\)&&\(!isBook\(p\)\|\|p\.id===selectedProject\)\)/);
});
