import fs from 'node:fs';
import assert from 'node:assert/strict';
import zlib from 'node:zlib';

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
const primary=manifest.icons[0];
assert.equal(primary?.src,'command-center-approved-icon-512.png?icon=6-approved');
assert.equal(primary?.sizes,'512x512'); assert.equal(primary?.type,'image/png'); assert.equal(primary?.purpose,'any');
fullyDecodePng('command-center-approved-icon-512.png',512,512);
fullyDecodePng('command-center-approved-icon-256.png',256,256);
assert.match(html,/rel="manifest" href="\.\/manifest\.webmanifest\?v=6"/);
assert.match(html,/command-center-approved-icon-512\.png\?icon=6-browser/);
assert.match(html,/meta name="theme-color" content="#000000"/);
assert.match(sw,/james-command-center-v47/);
assert.ok(sw.includes("'./command-center-approved-icon-512.png?icon=6-approved'"));
assert.match(sw,/pathname\.endsWith\('\/manifest\.webmanifest'\)/); assert.match(sw,/pathname\.endsWith\('\/command-center-approved-icon-512\.png'\)/); assert.match(sw,/fetch\(e\.request,\{cache:'no-store'\}\)/);
assert.match(standard,/Update Status: Not updatable/); assert.match(standard,/Preserve the exact user-approved launcher artwork/); assert.match(standard,/command-center-approved-icon-512\.png/);
console.log('PWA exact approved icon pipeline QA passed with full PNG decoding.');
