import fs from 'node:fs';
import assert from 'node:assert/strict';

const html=fs.readFileSync('index.html','utf8');
const css=fs.readFileSync('command-center-v7.css','utf8');
const js=fs.readFileSync('command-center-v7.js','utf8');
const cfg=fs.readFileSync('app-config.js','utf8');
const sw=fs.readFileSync('service-worker.js','utf8');
const manifest=JSON.parse(fs.readFileSync('manifest.webmanifest','utf8'));

assert.equal((css.match(/\{/g)||[]).length,(css.match(/\}/g)||[]).length,'V7 CSS braces must balance');

// Header: the emblem stays isolated in the hero and sync text is structurally below Refresh.
const headerEnd=html.indexOf('</header>');
const refreshIndex=html.indexOf('id="refreshStrip"');
const syncDockIndex=html.indexOf('class="cc7-sync-dock"');
const mainIndex=html.indexOf('<main>');
assert.ok(headerEnd>0 && refreshIndex>headerEnd && syncDockIndex>refreshIndex && mainIndex>syncDockIndex,'sync dock must be below Refresh and outside the emblem/header');
assert.doesNotMatch(html.slice(0,headerEnd),/id="syncText"/,'sync text must not crop/overlap the header emblem');
assert.match(css,/\.brand-icon\{[^}]*object-fit:contain!important/,'approved emblem must stay fully visible');

// User-requested no-blue rule must cover legacy nested bubbles, not just top-level cards.
for(const selector of ['.list-item','.metric-chip','.book-metric-cell','.perf-primary','.ccv4-pub-formats>span']){
  assert.ok(css.includes(selector),`V7 no-blue rules must include ${selector}`);
}
assert.match(css,/\.list-item[\s\S]*background:#050505!important/,'legacy integration/list bubbles must be black');
assert.match(css,/border-color:#ff6507!important/,'replacement bubble outline must be orange');

// Project Earnings is intentionally a dominant double-height card with one centered amount.
assert.match(css,/stat-button\[data-view="earning"\][\s\S]*min-height:220px!important/);
assert.match(js,/label\.textContent = 'Project Earnings'/);
assert.match(js,/style:'currency',currency:'USD'/);

// Missing Hour: canonical numbering/order, Books first, no misleading fake cover art, no duplicate snapshot block.
for(const [title,num] of [['the unlived hour',1],['the dead between minutes',2],['the house outside time',3],['what the town forgot',4],['the hour that remains',5]]){
  assert.ok(js.includes(`['${title}',${num}]`),`${title} must be mapped to Book ${num}`);
}
assert.match(css,/#bookRevenuePanel>\.cc6-books-heading\{order:0!important/);
assert.match(css,/#bookRevenuePanel>\.book-revenue-list\{order:1!important/);
assert.match(css,/#bookRevenuePanel>\.section-head\{order:2!important/);
assert.match(css,/#bookRevenuePanel>\.book-revenue-primary\{order:3!important/);
assert.match(css,/#kdpSnapshotPanel\{display:none!important\}/);
assert.match(css,/\.cc6-book-cover:not\(\.has-approved-cover\)\{background:#050505!important\}/,'generic scenery must not masquerade as approved cover art');
assert.match(js,/awaiting-approved-asset/,'missing exact cover files must be marked as awaiting approved art rather than fabricated');

// Personal projects: remove only the business boxes James explicitly rejected.
assert.match(js,/name === 'edge finder' \|\| name === 'command center'/);
assert.match(js,/block\.dataset\.cc7Hidden = name === 'edge finder' \? 'true' : 'false'/,'Edge Finder Tracking Integrations must be hidden');

// Stability: one legacy duplicate controller is retired and V7 guards against V4 theme/icon reversion.
assert.doesNotMatch(cfg,/addJs\('commandCenterV62'/,'duplicate V6.2 JS observer must not load');
assert.match(cfg,/command-center-v7\.css\?v=1/);
assert.match(cfg,/command-center-v7\.js\?v=1/);
assert.match(js,/data-command-center-theme/);
assert.match(js,/attributeFilter:\['data-command-center-theme'\]/);
assert.match(js,/attributeFilter:\['src'\]/,'approved icon must be guarded against legacy icon reversion');
assert.match(css,/contain:style!important/,'stability containment must not create a new layout/scroll containing block');
assert.doesNotMatch(css,/contain:layout style!important/);

// Install identity remains stable while launcher metadata advances to a complete icon set.
assert.equal(manifest.id,'./');
assert.equal(manifest.start_url,'./');
assert.equal(manifest.scope,'./');
assert.equal(manifest.icons.length,4);
assert.deepEqual(manifest.icons.map(x=>x.purpose),['any','any','maskable','maskable']);
assert.match(html,/manifest\.webmanifest\?v=7/);
assert.match(sw,/james-command-center-v46/);
assert.match(sw,/command-center-v7\.css\?v=1/);
assert.match(sw,/command-center-v7\.js\?v=1/);

console.log('Command Center V7 user-requested polish QA passed.');
