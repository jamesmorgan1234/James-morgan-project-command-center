import fs from 'node:fs';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

const ui=fs.readFileSync('command-center-deployment.js','utf8');
const completion=fs.readFileSync('command-center-deployment-completion.js','utf8');
const css=fs.readFileSync('command-center-deployment.css','utf8');
const standard=fs.readFileSync('DEPLOYMENT_STANDARD.md','utf8');
const manifest=JSON.parse(fs.readFileSync('deployment-release-manifest.json','utf8'));
const migration=fs.readFileSync('supabase/migrations/20261021_deployment_complete.sql','utf8');
const rollback=fs.readFileSync('.github/workflows/prepare-rollback-pr.yml','utf8');
const cfg=fs.readFileSync('app-config.js','utf8');
const sw=fs.readFileSync('service-worker.js','utf8');
const html=fs.readFileSync('index.html','utf8');

assert.doesNotThrow(()=>new Function(ui),'Deployment UI must parse');
assert.doesNotThrow(()=>new Function(completion),'Deployment completion patch must parse');
assert.equal((css.match(/\{/g)||[]).length,(css.match(/\}/g)||[]).length,'Deployment CSS braces must balance');

for(const table of ['deployment_releases','deployment_validations','deployment_health_checks','deployment_rollbacks']){
  assert.match(migration,new RegExp(`create table if not exists public\\.${table}`,'i'),`missing ${table}`);
  assert.match(migration,new RegExp(`alter table public\\.${table} enable row level security`,'i'),`${table} must use RLS`);
}
assert.match(migration,/grant select on public\.deployment_releases to authenticated/);
assert.doesNotMatch(migration,/grant insert on public\.deployment_releases to authenticated/i,'browser must not write release truth directly');
assert.match(migration,/command_center_deployment_status/);
assert.match(migration,/known_good boolean not null default false/);

assert.equal(manifest.production_branch,'main');
assert.equal(manifest.hosting_provider,'github_pages');
assert.equal(manifest.release_identity.app_config_version,26);
assert.equal(manifest.release_identity.pwa_cache_version,70);
assert.equal(manifest.release_identity.startup_repair_marker,'cc-startup-repair-attempted-v63');
assert.equal(manifest.required_qa.length,14,'Agent Mode release must require all inherited suites plus Agent Mode QA');
for(const suite of ['Approved Book Cover Library QA','PWA icon update QA','Automation complete QA','Integrations complete QA','Analytics complete QA','Security complete QA','Deployment complete QA','Agent Mode QA'])assert.ok(manifest.required_qa.includes(suite),`manifest missing ${suite}`);
assert.equal(manifest.rollback.direct_main_push,false);
assert.equal(manifest.rollback.automatic_merge,false);
assert.equal(manifest.rollback.target_must_be_main_ancestor,true);
assert.equal(manifest.protected_assets.approved_icon_512_sha256,'fa48e34b6240ca37ad74492dec150cfebaed60aed404707f79b68b9b3157b7aa');
assert.equal(manifest.protected_assets.book_cover_atlas_sha256,'f133a3e6027e682f1f8e7149c5096ff42185095e6cc0488e32ded8cbe724199c');

for(const phrase of ['humanization/natural authorial voice','title + subtitle + approved cover + series identity + interior promise alignment','Coloring books','Cookbooks','locked approved artifact'])assert.ok(standard.toLowerCase().includes(phrase.toLowerCase()),`Deployment standard missing book gate: ${phrase}`);
assert.match(standard,/If the prose still reads mechanical, repetitive, templated, padded, emotionally implausible, or visibly machine-generated, \*\*humanization has not passed\*\*/);
assert.match(standard,/all applicable project-specific acceptance gates must already be verified/);
assert.match(standard,/never pushes directly to `main`/);
assert.match(standard,/never merges the PR automatically/);

assert.match(rollback,/workflow_dispatch/);
assert.match(rollback,/git merge-base --is-ancestor/,'rollback target must be an ancestor of main');
assert.match(rollback,/git checkout -b "\$BRANCH" origin\/main/,'rollback must use a new branch');
assert.match(rollback,/gh pr create/,'rollback must open a PR');
assert.doesNotMatch(rollback,/gh pr merge|git push origin main|git push origin HEAD:main/,'rollback workflow must never merge or directly update main');

assert.match(ui,/Release Manifest/);
assert.match(ui,/Pre-Deploy Validation/);
assert.match(ui,/Deployment Pipeline/);
assert.match(ui,/Post-Deploy Health Check/);
assert.match(ui,/Version History/);
assert.match(ui,/Rollback/);
assert.match(ui,/PWA Update Control/);
assert.match(ui,/Books must pass their verified humanization/);
assert.match(completion,/7 of 7 phases complete/);
assert.match(completion,/ccDeploymentMount/);

for(const asset of ['command-center-deployment.css?v=1','command-center-deployment.js?v=1','command-center-deployment-completion.js?v=1'])assert.ok(cfg.includes(asset),`app config missing ${asset}`);
assert.match(html,/app-config\.js\?v=26/);
assert.match(html,/minimum-scale=1,maximum-scale=1,user-scalable=no/);
assert.match(html,/cc-startup-repair-attempted-v63/);
assert.match(sw,/james-command-center-v70/);
for(const asset of ['./command-center-deployment.css?v=1','./command-center-deployment.js?v=1','./command-center-deployment-completion.js?v=1','./deployment-release-manifest.json?v=1','./app-config.js?v=26'])assert.ok(sw.includes(`'${asset}'`),`PWA cache missing ${asset}`);
for(const path of ['command-center-deployment.css','command-center-deployment.js','command-center-deployment-completion.js','deployment-release-manifest.json'])assert.ok(sw.includes(`pathname.endsWith('/${path}')`),`fresh asset path missing ${path}`);

assert.equal(createHash('sha256').update(fs.readFileSync('command-center-approved-icon-256.png')).digest('hex'),manifest.protected_assets.approved_icon_256_sha256);
assert.equal(createHash('sha256').update(fs.readFileSync('command-center-approved-icon-512.png')).digest('hex'),manifest.protected_assets.approved_icon_512_sha256);
assert.equal(createHash('sha256').update(fs.readFileSync('book-cover-atlas-v2.webp')).digest('hex'),manifest.protected_assets.book_cover_atlas_sha256);

console.log('Deployment complete QA passed, including book release gates, rollback safety, Agent release identity, and protected assets.');