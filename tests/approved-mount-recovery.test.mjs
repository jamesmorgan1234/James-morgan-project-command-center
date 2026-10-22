import fs from 'node:fs';
import assert from 'node:assert/strict';

const loader=fs.readFileSync('startup-loader.js','utf8');
const guard=fs.readFileSync('command-center-approved-mount-guard.js','utf8');
const migration=fs.readFileSync('supabase/migrations/20261022_project_opportunities_owner_read_grant.sql','utf8');

assert.doesNotThrow(()=>new Function(guard),'approved mount guard must parse');
assert.match(loader,/command-center-approved-mount-guard\.js\?v=1/,'mount guard must load in the core startup path');
assert.match(migration,/grant select on public\.project_opportunities to authenticated/i,'authenticated owner-scoped opportunity reads must be granted');
assert.match(guard,/ensureRoot\(\)/,'guard must mount the approved root before waiting on optional data');
assert.match(guard,/Loading your verified projects/,'blank app must become an explicit loading state');
assert.match(guard,/Retry loading Command Center/,'a failed approved renderer must expose a retry action');
assert.match(guard,/COMMAND_CENTER_APPROVED_UI\?\.refresh/,'guard must retry the real approved renderer rather than substitute a fake dashboard');
assert.match(guard,/dashboard\.hidden/,'guard must only mount after the authenticated dashboard is actually visible');
assert.doesNotMatch(guard,/MutationObserver/,'mount recovery must not introduce another DOM observer loop');
assert.match(guard,/attempts >= 40/,'mount guard must stop bounded polling instead of running forever');

console.log('Approved UI blank-screen mount recovery QA passed.');
