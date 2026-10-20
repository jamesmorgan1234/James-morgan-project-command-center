import fs from 'node:fs';
import assert from 'node:assert/strict';

const js=fs.readFileSync('command-center-book-covers.js','utf8');
const css=fs.readFileSync('command-center-book-covers.css','utf8');
const cfg=fs.readFileSync('app-config.js','utf8');
const sw=fs.readFileSync('service-worker.js','utf8');
const html=fs.readFileSync('index.html','utf8');

const titles=[
  'Strange Worlds','Dreambeast Atlas','Rooms Beyond Geometry','Fungal Realms','Neon Dreadscapes','Electric Eden','Cities That Dream','Cathedral of Impossible Things','Celestial Oddities','Mechanical Dreams',
  'Daily Progress Planner','A Stronger You','Simple Budgeting Workbook','Take Control of Your Money','Garage Door Business Blueprint',
  'Pieces I Never Got Back','A Calmer Mind','Broken But Still Here','Moving Forward Anyway','The Alpha Mindset',
  'The Map Beneath the Tide','The Kingdom Under Black Water','The Crown of the Drowned',
  'The Unlived Hour','The Dead Between Minutes','The House Outside Time','What the Town Forgot','The Hour That Remains',
  'The Ferris Wheel Between Us','Kiss Me in the Haunted House',"The Summer We Don't Leave",
  'The Empire Beneath the Glaze','The Shards Between Kingdoms','The Earth After Firing'
];

assert.equal(titles.length,34);
for(const title of titles) assert.ok(js.includes(title),`missing approved cover mapping: ${title}`);
assert.ok(js.includes("const SLOT_COUNT = 34"));
assert.ok(js.includes("book-cover-atlas-v1.webp?v=1"));
assert.ok(js.includes("cc7-approved-cover"));
assert.ok(css.includes('background-size:3400% 100%'));
assert.ok(css.includes('.cc7-approved-cover>b{display:none!important}'));
assert.ok(cfg.includes("command-center-book-covers.css?v=1"));
assert.ok(cfg.includes("command-center-book-covers.js?v=1"));
assert.ok(html.includes('app-config.js?v=7'));
assert.ok(sw.includes("james-command-center-v46"));
assert.ok(sw.includes("book-cover-atlas-v1.webp?v=1"));
assert.ok(sw.includes("command-center-book-covers.js"));
assert.ok(sw.includes("command-center-book-covers.css"));
assert.ok(!js.toLowerCase().includes('cookbook'), 'cookbook cover must remain pending until approved source arrives');

const atlas=fs.readFileSync('book-cover-atlas-v1.webp');
assert.ok(atlas.length>100000,'cover atlas unexpectedly small');
assert.equal(atlas.subarray(0,4).toString('ascii'),'RIFF');
assert.equal(atlas.subarray(8,12).toString('ascii'),'WEBP');

console.log('Approved book-cover library QA passed for 34 supplied covers; cookbook remains intentionally pending.');
