import fs from 'node:fs';
import assert from 'node:assert/strict';
import zlib from 'node:zlib';
import { createHash } from 'node:crypto';

function crc32(buf){
  let c=0xffffffff;
  for(const byte of buf){
    c^=byte;
    for(let k=0;k<8;k++) c=(c>>>1)^((c&1)?0xedb88320:0);
  }
  return (c^0xffffffff)>>>0;
}

function paeth(a,b,c){
  const p=a+b-c;
  const pa=Math.abs(p-a), pb=Math.abs(p-b), pc=Math.abs(p-c);
  return pa<=pb&&pa<=pc?a:pb<=pc?b:c;
}

function fullyDecodePng(path,expectedWidth,expectedHeight){
  const png=fs.readFileSync(path);
  assert.equal(png.subarray(0,8).toString('hex'),'89504e470d0a1a0a',`${path} must be PNG`);
  let offset=8, ihdr=null, sawIEND=false;
  const idat=[];
  while(offset<png.length){
    assert.ok(offset+12<=png.length,`${path} has a truncated PNG chunk`);
    const length=png.readUInt32BE(offset); offset+=4;
    const typeBuf=png.subarray(offset,offset+4); const type=typeBuf.toString('ascii'); offset+=4;
    assert.ok(offset+length+4<=png.length,`${path} has a truncated ${type} chunk`);
    const data=png.subarray(offset,offset+length); offset+=length;
    const expectedCrc=png.readUInt32BE(offset); offset+=4;
    assert.equal(crc32(Buffer.concat([typeBuf,data])),expectedCrc,`${path} ${type} CRC must be valid`);
    if(type==='IHDR') ihdr=data;
    if(type==='IDAT') idat.push(data);
    if(type==='IEND'){sawIEND=true; break;}
  }
  assert.ok(ihdr,`${path} must contain IHDR`);
  assert.ok(sawIEND,`${path} must contain IEND`);
  assert.ok(idat.length,`${path} must contain IDAT`);
  const width=ihdr.readUInt32BE(0), height=ihdr.readUInt32BE(4);
  assert.equal(width,expectedWidth); assert.equal(height,expectedHeight);
  assert.equal(ihdr[8],8,`${path} must use 8-bit channels`);
  assert.equal(ihdr[9],2,`${path} must be truecolor RGB`);
  assert.equal(ihdr[10],0); assert.equal(ihdr[11],0); assert.equal(ihdr[12],0,`${path} must be non-interlaced`);
  const raw=zlib.inflateSync(Buffer.concat(idat));
  const bpp=3, stride=width*bpp;
  assert.equal(raw.length,(stride+1)*height,`${path} decompressed pixel payload length must match dimensions`);
  const decoded=Buffer.alloc(stride*height);
  let pos=0;
  for(let y=0;y<height;y++){
    const filter=raw[pos++];
    assert.ok(filter>=0&&filter<=4,`${path} row ${y} has invalid PNG filter`);
    const src=raw.subarray(pos,pos+stride); pos+=stride;
    const out=decoded.subarray(y*stride,(y+1)*stride);
    const prev=y===0?null:decoded.subarray((y-1)*stride,y*stride);
    for(let x=0;x<stride;x++){
      const left=x>=bpp?out[x-bpp]:0, up=prev?prev[x]:0, upLeft=prev&&x>=bpp?prev[x-bpp]:0;
      let predictor=0;
      if(filter===1) predictor=left;
      else if(filter===2) predictor=up;
      else if(filter===3) predictor=Math.floor((left+up)/2);
      else if(filter===4) predictor=paeth(left,up,upLeft);
      out[x]=(src[x]+predictor)&255;
    }
  }
  assert.equal(pos,raw.length,`${path} must decode every pixel byte`);
}

const manifest=JSON.parse(fs.readFileSync('manifest.webmanifest','utf8'));
const html=fs.readFileSync('index.html','utf8');
const sw=fs.readFileSync('service-worker.js','utf8');
const standard=fs.readFileSync('PWA_UPDATE_STANDARD.md','utf8');
assert.equal(manifest.id,'./'); assert.equal(manifest.start_url,'./'); assert.equal(manifest.scope,'./'); assert.equal(manifest.display,'standalone');
assert.equal(manifest.theme_color,'#000000'); assert.equal(manifest.background_color,'#000000');
const anyIcons=manifest.icons.filter(icon=>icon.type==='image/png'&&icon.purpose==='any');
const maskableIcons=manifest.icons.filter(icon=>icon.type==='image/png'&&icon.purpose==='maskable');
assert.ok(anyIcons.some(icon=>icon.sizes==='192x192'&&icon.src==='command-center-approved-icon-192.png?icon=9-approved-any'));
assert.ok(anyIcons.some(icon=>icon.sizes==='512x512'&&icon.src==='command-center-approved-icon-512.png?icon=9-approved-any'));
assert.ok(maskableIcons.some(icon=>icon.sizes==='512x512'&&icon.src==='command-center-approved-icon-512.png?icon=9-approved-maskable'));
assert.equal(manifest.icons.some(icon=>icon.type==='image/svg+xml'),false,'launcher manifest must not fall back to the old SVG pipeline');
fullyDecodePng('command-center-approved-icon-192.png',192,192);
fullyDecodePng('command-center-approved-icon-256.png',256,256);
fullyDecodePng('command-center-approved-icon-512.png',512,512);
assert.equal(createHash('sha256').update(fs.readFileSync('command-center-approved-icon-256.png')).digest('hex'),'ebca3a41a48f417abb5ec037710a99cd82f128b0c320d0820e1e82e3612d80ea');
assert.equal(createHash('sha256').update(fs.readFileSync('command-center-approved-icon-512.png')).digest('hex'),'fa48e34b6240ca37ad74492dec150cfebaed60aed404707f79b68b9b3157b7aa');
assert.match(html,/rel="manifest" href="\.\/manifest\.webmanifest\?v=9"/);
assert.match(html,/command-center-approved-icon-512\.png\?icon=7-browser/);
assert.match(html,/meta name="theme-color" content="#000000"/);
assert.match(html,/rel="preconnect" href="https:\/\/cdn\.jsdelivr\.net" crossorigin/,'Supabase CDN connection should start before script execution');
assert.match(html,/rel="preconnect" href="https:\/\/gmlsucpwliegwlxymjvp\.supabase\.co" crossorigin/,'Supabase API connection should be warmed early');
for(const src of [
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2',
  './app-config.js?v=12','./app.js?v=10','./project-hub.js?v=3','./mobile-accordion-polish.js?v=1'
]){
  const escaped=src.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  assert.match(html,new RegExp(`<script defer src="${escaped}"><\\/script>`),`${src} must not block first paint`);
}
assert.match(sw,/james-command-center-v52/);
assert.ok(sw.includes("'./command-center-approved-icon-192.png?icon=9-approved-any'"));
assert.ok(sw.includes("'./command-center-approved-icon-512.png?icon=9-approved-any'"));
assert.ok(sw.includes("'./command-center-approved-icon-512.png?icon=9-approved-maskable'"));
assert.match(sw,/pathname\.endsWith\('\/manifest\.webmanifest'\)/);
assert.match(sw,/pathname\.endsWith\('\/command-center-approved-icon-192\.png'\)/);
assert.match(sw,/pathname\.endsWith\('\/command-center-approved-icon-512\.png'\)/);
assert.match(sw,/fetch\(e\.request,\{cache:'no-store'\}\)/);
const navPos=sw.indexOf("if(e.request.mode==='navigate')");
const freshPos=sw.indexOf('const freshAsset=');
assert.ok(navPos>=0&&freshPos>navPos,'navigation fast path must run before network-first asset handling');
assert.match(sw,/caches\.match\('\.\/index\.html'\)/,'installed PWA launch must use the cached shell immediately when available');
assert.match(sw,/e\.waitUntil\(refresh\.then\(\(\)=>\{\}\)\)/,'cached launch must still refresh the shell in the background');
assert.doesNotMatch(sw,/const freshAsset=[^;]*e\.request\.mode==='navigate'/,'navigation must not fall back into the network-first asset path');
assert.match(standard,/Update Status: Not updatable/); assert.match(standard,/Preserve the exact user-approved launcher artwork/); assert.match(standard,/command-center-approved-icon-512\.png/);
console.log('PWA approved orange icon + fast-start QA passed.');
