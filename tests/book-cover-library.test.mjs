import fs from 'node:fs';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import vm from 'node:vm';

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
  'The Empire Beneath the Glaze','The Shards Between Kingdoms','The Earth After Firing',
  'Repeat Button','Air Fryer Favorites','Air Fryer Favorites Made Easy','Comfort Food Favorites','Home Cooking Made Simple','Slow Cooker Comforts','Sweet Creations'
];

assert.equal(titles.length,41);
for(const title of titles) assert.ok(js.includes(title),`missing approved cover mapping: ${title}`);
assert.ok(js.includes("const SLOT_COUNT = 41"));
assert.ok(js.includes("book-cover-atlas-v2.webp?v=2"));
assert.ok(js.includes("cc7-approved-cover"));
assert.ok(css.includes('background-size:4100% 100%'));
assert.ok(css.includes('.cc7-approved-cover>b{display:none!important}'));
assert.ok(cfg.includes("command-center-book-covers.css?v=2"));
assert.ok(cfg.includes("command-center-book-covers.js?v=2"));
assert.ok(html.includes('app-config.js?v=8'));
assert.ok(sw.includes("james-command-center-v47"));
assert.ok(sw.includes("book-cover-atlas-v2.webp?v=2"));
assert.ok(sw.includes("command-center-book-covers.js?v=2"));
assert.ok(sw.includes("command-center-book-covers.css?v=2"));

const atlas=fs.readFileSync('book-cover-atlas-v2.webp');
assert.ok(atlas.length>100000,'cover atlas unexpectedly small');
assert.equal(atlas.subarray(0,4).toString('ascii'),'RIFF');
assert.equal(atlas.subarray(8,12).toString('ascii'),'WEBP');
assert.equal(atlas.length,3591686,'preserve the exact approved atlas bytes');
assert.equal(createHash('sha256').update(atlas).digest('hex'),'f133a3e6027e682f1f8e7149c5096ff42185095e6cc0488e32ded8cbe724199c');
assert.equal(atlas.subarray(12,16).toString('ascii'),'VP8 ');
assert.equal(atlas.readUInt16LE(26) & 0x3fff,41 * 384);
assert.equal(atlas.readUInt16LE(28) & 0x3fff,576);

const entries=vm.runInNewContext(js.match(/const entries = (\[[\s\S]*?\n  \]);/)[1]);
assert.deepEqual(Array.from(entries,entry=>entry[0]),titles,'each expected title occurs once in the approved order');
assert.deepEqual(Array.from(entries,entry=>entry[1]),Array.from({length:41},(_,index)=>index),'slots must be exactly 0-40');
assert.doesNotMatch(js,/findDirect|COMMAND_CENTER_EXTRA_COVERS|cc7-direct/);
assert.doesNotMatch(css,/cc7-direct/);

// Exercise the actual controller, including exact-match priority for the two
// Air Fryer titles, both apostrophes, aliases, unknown titles, and repeat renders.
const cases=[...titles.map((title,index)=>[title,index]),
  ['The Summer We Don\u2019t Leave',30],['THE SUMMER WE DON\u2018T LEAVE',30],
  ['Melted Cosmos: Strange Worlds',0],['Unmapped title',null]];
const rows=cases.map(([title])=>{
  const wrap={children:[],querySelector(){return this.children[0] || null;},prepend(child){this.children.unshift(child);}};
  return {wrap,parentElement:{children:[]},querySelector(selector){
    return selector==='.book-revenue-title' ? {textContent:title} : wrap;
  }};
});
for(const row of rows) row.parentElement.children=rows;
const context={document:{documentElement:{},querySelectorAll(){return rows;},
  createElement(){return {dataset:{},classList:{add(){}},style:{values:{},setProperty(key,value){this.values[key]=value;}},attrs:{},setAttribute(key,value){this.attrs[key]=value;}};},
  addEventListener(){}},window:{addEventListener(){}},MutationObserver:class{observe(){}},
  requestAnimationFrame(callback){callback();},setTimeout(){}};
vm.runInNewContext(js,context);
vm.runInNewContext(js,context);
rows.forEach((row,index)=>{
  const [title,slot]=cases[index];
  assert.equal(row.wrap.children.length,slot===null ? 0 : 1,`${title}: no missing or duplicate cover`);
  if(slot===null) return;
  const cover=row.wrap.children[0];
  assert.equal(cover.dataset.cc7CoverIndex,`atlas:${slot}`,title);
  assert.equal(cover.style.values['--cc7-x'],`${slot / 40 * 100}%`,title);
  assert.equal(cover.style.values['--cc7-atlas'],"url('./book-cover-atlas-v2.webp?v=2')");
  assert.equal(cover.attrs.role,'img');
  assert.equal(cover.attrs['aria-label'],`${title} approved cover`);
});

console.log('Approved book-cover library QA passed for all 41 supplied covers, including seven cookbook covers.');
