import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const baseline = JSON.parse(await readFile(new URL('scope-progress-baselines-v1.json', root), 'utf8'));
const hub = await readFile(new URL('project-hub.js', root), 'utf8');
const sw = await readFile(new URL('service-worker.js', root), 'utf8');
const migration = await readFile(new URL('supabase/migrations/20261019_verified_scope_progress.sql', root), 'utf8');

assert.equal(baseline.contract_version, 1);
assert.equal(Object.keys(baseline.projects).length, 18, 'baseline must cover all 18 tracked projects');

for (const [projectId, project] of Object.entries(baseline.projects)) {
  assert.ok(Array.isArray(project.items) && project.items.length > 0, `${projectId}: scope items required`);
  const ids = new Set();
  let total = 0;
  let complete = 0;
  for (const item of project.items) {
    assert.ok(item.id && item.label, `${projectId}: every item needs id + label`);
    assert.ok(!ids.has(item.id), `${projectId}: duplicate item id ${item.id}`);
    ids.add(item.id);
    assert.ok(Number(item.weight) > 0, `${projectId}/${item.id}: positive weight required`);
    assert.ok(['pending','in_progress','blocked','complete','excluded'].includes(item.status), `${projectId}/${item.id}: invalid status`);
    const active = item.active !== false && item.status !== 'excluded';
    if (active) {
      total += Number(item.weight);
      if (item.status === 'complete' && item.verified === true) complete += Number(item.weight);
    }
  }
  assert.equal(total, project.total_weight, `${projectId}: total weight mismatch`);
  assert.equal(complete, project.completed_weight, `${projectId}: completed weight mismatch`);
  assert.equal(Math.round(complete * 100 / total), project.percent, `${projectId}: percent mismatch`);
}

assert.ok(hub.includes("m.key === 'current_scope_progress_percent'"));
assert.ok(hub.includes("label: available ? `${progress.pct}%` : 'N/A'"));
assert.ok(!hub.includes('let pct = 45'), 'status-word fallback must be removed');
assert.ok(!hub.includes('Estimated from the current verified status'), 'heuristic progress wording must be removed');
assert.ok(sw.includes("const CACHE='james-command-center-v36'"));
assert.ok(sw.includes("url.pathname.endsWith('/project-hub.js')"), 'project hub must refresh network-first');
assert.ok(migration.includes('command_center_scope_progress_from_checkpoint'));
assert.ok(migration.includes('command_center_guard_project_scope_freshness'));
assert.ok(migration.includes('command_center_enforce_scope_freshness_on_refresh'));
assert.ok(migration.includes("'current_scope_progress_percent'"));

console.log('scope-progress QA passed for 18 projects');
