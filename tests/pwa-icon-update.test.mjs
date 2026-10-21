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
  const p=a+b-c, pa=Math.abs(p-a), pb=Math.abs(p-b), pc=Math.abs(p-c);
  return pa<=pb&&pa<=pc?a:pb<=pc?b:c;
}
function fullyDecodePng(path,expectedWidth,expectedHeight){
  const png=fs.readFileSync(path);
  assert.equal(png.subarray(0,8).toString('hex'),'89504e470d0a1a0a',`${path} must be PNG`);
  let offset=8, ihdr=null, sawIEND=false; const idat=[];
  while(offset<png.length){
    assert.ok(offset+12<=png.length,`${path} has a truncated PNG chunk`);
    const length=png.readUInt32BE(offset); offset+=4;
    const typeBuf=png.subarray(offset,offset+4); const type=typeBuf.toString('ascii'); offset+=4;
    assert.ok(offset+length+4<=png.length,`${path} has a truncated ${type} chunk`);
    const data=png.subarray(offset,offset+length); offset+=length;
    const expectedCrc=png.readUInt32BE(offset); offset+=4;
    assert.equal(crc32(Buffer.concat([typeBuf,data])),expectedCrc,`${path} ${type} CRC must be valid`);
    if(type==='IHDR') ihdr=data; if(type==='IDAT') idat.push(data); if(type==='IEND'){sawIEND=true;break;}
  }
  assert.ok(ihdr&&sawIEND&&idat.length,`${path} must contain complete PNG structure`);
  const width=ihdr.readUInt32BE(0), height=ihdr.readUInt32BE(4);
  assert.equal(width,expectedWidth); assert.equal(height,expectedHeight);
  assert.equal(ihdr[8],8); assert.equal(ihdr[9],2); assert.equal(ihdr[10],0); assert.equal(ihdr[11],0); assert.equal(ihdr[12],0);
  const raw=zlib.inflateSync(Buffer.concat(idat)), bpp=3, stride=width*bpp;
  assert.equal(raw.length,(stride+1)*height,`${path} decompressed payload must match dimensions`);
  const decoded=Buffer.alloc(stride*height); let pos=0;
  for(let y=0;y<height;y++){
    const filter=raw[pos++]; assert.ok(filter>=0&&filter<=4);
    const src=raw.subarray(pos,pos+stride); pos+=stride;
    const out=decoded.subarray(y*stride,(y+1)*stride), prev=y===0?null:decoded.subarray((y-1)*stride,y*stride);
    for(let x=0;x<stride;x++){
      const left=x>=bpp?out[x-bpp]:0, up=prev?prev[x]:0, upLeft=prev&&x>=bpp?prev[x-bpp]:0;
      let predictor=0; if(filter===1) predictor=left; else if(filter===2) predictor=up; else if(filter===3) predictor=Math.floor((left+up)/2); else if(filter===4) predictor=paeth(left,up,upLeft);
      out[x]=(src[x]+predictor)&255;
    }
  }
  assert.equal(pos,raw.length);
}

const manifest=JSON.parse(fs.readFileSync('manifest.webmanifest','utf8'));
const html=fs.readFileSync('index.html','utf8');
const sw=fs.readFileSync('service-worker.js','utf8');
const loader=fs.readFileSync('startup-loader.js','utf8');
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
assert.match(html,/rel="preconnect" href="https:\/\/cdn\.jsdelivr\.net" crossorigin/);
assert.match(html,/rel="preconnect" href="https:\/\/unpkg\.com" crossorigin/);
assert.match(html,/rel="preconnect" href="https:\/\/gmlsucpwliegwlxymjvp\.supabase\.co" crossorigin/);
assert.match(html,/<script defer src="\.\/app-config\.js\?v=13"><\/script>/);
assert.match(html,/<script defer src="\.\/startup-loader\.js\?v=1"><\/script>/);
assert.doesNotMatch(html,/<script[^>]+src="https:\/\//i,'first paint must not wait on an external script');
assert.doesNotMatch(html,/<script[^>]+src="\.\/app\.js/i,'core app must be loaded by startup-loader');
assert.match(loader,/cdn\.jsdelivr\.net\/npm\/@supabase\/supabase-js@2\.118\.0/);
assert.match(loader,/unpkg\.com\/@supabase\/supabase-js@2\.118\.0\/dist\/umd\/supabase\.js/);
assert.match(loader,/Retry secure startup/);

assert.match(sw,/james-command-center-v56/);
assert.ok(sw.includes("'./startup-loader.js?v=1'"));
assert.match(sw,/SUPABASE_CDNS=\[/);
assert.match(sw,/caches\.match\(url\.href\)/,'installed app should reuse a successfully cached secure runtime');
assert.ok(sw.includes("'./command-center-approved-icon-192.png?icon=9-approved-any'"));
assert.ok(sw.includes("'./command-center-approved-icon-512.png?icon=9-approved-any'"));
assert.ok(sw.includes("'./command-center-approved-icon-512.png?icon=9-approved-maskable'"));
assert.match(sw,/pathname\.endsWith\('\/manifest\.webmanifest'\)/);
assert.match(sw,/pathname\.endsWith\('\/command-center-approved-icon-192\.png'\)/);
assert.match(sw,/pathname\.endsWith\('\/command-center-approved-icon-512\.png'\)/);
const navPos=sw.indexOf("if(e.request.mode==='navigate')"), originGuardPos=sw.indexOf('if(url.origin!==self.location.origin)return;'), freshPos=sw.indexOf('const freshAsset=');
assert.ok(navPos>=0&&originGuardPos>navPos&&freshPos>originGuardPos,'navigation shell may be cached, but Supabase API and unrelated cross-origin requests must bypass the asset handler');
assert.match(sw,/caches\.match\('\.\/index\.html'\)/,'installed PWA launch must use the cached shell immediately when available');
assert.match(sw,/e\.waitUntil\(refresh\.then\(\(\)=>\{\}\)\)/,'cached launch must still refresh the shell in the background');
assert.doesNotMatch(sw,/url\.hostname\.includes\('supabase\.co'\)/,'Supabase API traffic must not be classified as a cacheable static asset');
const installBlock=sw.slice(sw.indexOf("self.addEventListener('install'"),sw.indexOf("self.addEventListener('activate'"));
assert.doesNotMatch(installBlock,/fetch\s*\(/,'service-worker install must never wait on a remote runtime');
const assetHandler=sw.slice(sw.indexOf('if(freshAsset){'),sw.indexOf("e.respondWith(caches.match(e.request)",sw.indexOf('if(freshAsset){')));
assert.doesNotMatch(assetHandler,/index\.html/,'static asset failure must never substitute the HTML app shell');
assert.match(standard,/Update Status: Not updatable/); assert.match(standard,/Preserve the exact user-approved launcher artwork/); assert.match(standard,/command-center-approved-icon-512\.png/);

console.log('PWA approved icon + resilient first-launch + API isolation QA passed.');
