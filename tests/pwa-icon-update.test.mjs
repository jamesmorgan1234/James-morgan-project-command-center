import fs from 'node:fs';
import assert from 'node:assert/strict';
import zlib from 'node:zlib';

const manifest=JSON.parse(fs.readFileSync('manifest.webmanifest','utf8'));
const html=fs.readFileSync('index.html','utf8');
const sw=fs.readFileSync('service-worker.js','utf8');
const standard=fs.readFileSync('PWA_UPDATE_STANDARD.md','utf8');

assert.equal(manifest.id,'./');
assert.equal(manifest.start_url,'./');
assert.equal(manifest.scope,'./');
assert.equal(manifest.display,'standalone');
assert.equal(manifest.theme_color,'#000000');
assert.equal(manifest.background_color,'#000000');

const expectedIcons=[
  ['command-center-approved-icon-192.png?icon=7-any-192','192x192','any'],
  ['command-center-approved-icon-512.png?icon=7-any-512','512x512','any'],
  ['command-center-approved-icon-maskable-192.png?icon=7-maskable-192','192x192','maskable'],
  ['command-center-approved-icon-maskable-512.png?icon=7-maskable-512','512x512','maskable']
];
assert.equal(manifest.icons.length,4,'manifest must expose a complete any + maskable 192/512 icon set');
expectedIcons.forEach(([src,sizes,purpose],i)=>{
  assert.equal(manifest.icons[i]?.src,src);
  assert.equal(manifest.icons[i]?.sizes,sizes);
  assert.equal(manifest.icons[i]?.type,'image/png');
  assert.equal(manifest.icons[i]?.purpose,purpose);
});

function validatePng(path,width,height){
  assert.ok(fs.existsSync(path),`${path} must exist`);
  const png=fs.readFileSync(path);
  assert.ok(png.length>10000,`${path} must contain real raster data`);
  assert.equal(png.subarray(0,8).toString('hex'),'89504e470d0a1a0a',`${path} signature`);
  assert.equal(png.readUInt32BE(16),width,`${path} width`);
  assert.equal(png.readUInt32BE(20),height,`${path} height`);
  let pos=8, sawIend=false;
  const idat=[];
  while(pos+12<=png.length){
    const len=png.readUInt32BE(pos);
    const type=png.subarray(pos+4,pos+8).toString('ascii');
    const dataStart=pos+8, dataEnd=dataStart+len;
    assert.ok(dataEnd+4<=png.length,`${path} has a truncated ${type} chunk`);
    if(type==='IDAT') idat.push(png.subarray(dataStart,dataEnd));
    if(type==='IEND'){sawIend=true;break;}
    pos=dataEnd+4;
  }
  assert.ok(idat.length,`${path} must contain IDAT data`);
  assert.ok(sawIend,`${path} must contain a complete IEND chunk`);
  assert.doesNotThrow(()=>zlib.inflateSync(Buffer.concat(idat)),`${path} compressed pixel stream must decode completely`);
}
validatePng('command-center-approved-icon-192.png',192,192);
validatePng('command-center-approved-icon-512.png',512,512);
validatePng('command-center-approved-icon-maskable-192.png',192,192);
validatePng('command-center-approved-icon-maskable-512.png',512,512);

assert.match(html,/rel="manifest" href="\.\/manifest\.webmanifest\?v=7"/);
assert.match(html,/command-center-approved-icon-192\.png\?icon=7-browser-192/);
assert.match(html,/command-center-approved-icon-512\.png\?icon=7-browser-512/);
assert.match(html,/meta name="theme-color" content="#000000"/);
assert.match(sw,/james-command-center-v46/);
for(const [src] of expectedIcons) assert.ok(sw.includes(`'./${src}'`),`service worker must cache ${src}`);
assert.match(sw,/launcherIcon=\/\\\/command-center-approved-icon/);
assert.match(sw,/fetch\(e\.request,\{cache:'no-store'\}\)/);
assert.match(standard,/Update Status: Not updatable/);
assert.match(standard,/standards-clean PNG assets/);
assert.match(standard,/192×192 and 512×512 `purpose: any`/);
assert.match(standard,/192×192 and 512×512 `purpose: maskable`/);
console.log('PWA V7 complete launcher icon pipeline QA passed.');
