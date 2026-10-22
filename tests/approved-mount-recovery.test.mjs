import fs from 'node:fs';
import assert from 'node:assert/strict';

const loader=fs.readFileSync('startup-loader.js','utf8');
const guard=fs.readFileSync('command-center-approved-mount-guard.js','utf8');
const migration=fs.readFileSync('supabase/migrations/20261022_project_opportunities_owner_read_grant.sql','utf8');

assert.doesNotThrow(()=>new Function(guard),'approved mount guard must parse');
assert.match(loader,/command-center-approved-mount-guard\.js\?v=2/,'rebuilt mount guard must load in the core startup path with a fresh cache identity');
assert.match(migration,/grant select on public\.project_opportunities to authenticated/i,'authenticated owner-scoped opportunity reads must be granted');
assert.match(guard,/ensureRoot\(\)/,'guard must mount the approved root before waiting on optional data');
assert.match(guard,/Loading your verified projects/,'blank app must become an explicit loading state');
assert.match(guard,/Retry loading Command Center/,'a failed approved renderer must expose a retry action');
assert.match(guard,/COMMAND_CENTER_APPROVED_UI\?\.refresh/,'guard must retry the real approved renderer rather than substitute a fake dashboard');
assert.match(guard,/dashboard\.hidden/,'guard must only mount after the authenticated dashboard is actually visible');
assert.doesNotMatch(guard,/MutationObserver/,'mount recovery must not introduce another DOM observer loop');
assert.match(guard,/attempts >= 40/,'mount guard must stop bounded polling instead of running forever');
assert.match(guard,/command-center:approved-rendered/,'successful rebuilt rendering must stop the watchdog');
for(const selector of ['.cc-screen-home-grid','.cc-screen-project-list','.cc-screen-next-list','.cc-screen-active-list','.cc-screen-project-hero','.cc-approved-agent-home','.cc-screen-revenue-hero']){
  assert.ok(guard.includes(selector),`mount guard must recognize rebuilt screen ${selector}`);
}

console.log('Approved rebuilt UI mount recovery QA passed.');
