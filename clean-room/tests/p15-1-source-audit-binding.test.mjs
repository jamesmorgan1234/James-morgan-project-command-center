import test from 'node:test';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';import {createHash} from 'node:crypto';import {fileURLToPath} from 'node:url';import {assertSourceAuditMatchesGit} from '../scripts/p15-1-source-audit-binding.mjs';
const root=fileURLToPath(new URL('../..',import.meta.url)),source=execFileSync('git',['rev-parse','HEAD'],{cwd:root}).toString().trim(),path='clean-room/src/kernel/ledger.ts',bytes=execFileSync('git',['show',source+':'+path],{cwd:root}),digest=createHash('sha256').update(bytes).digest('hex');
const paths=execFileSync('git',['ls-tree','-r','--name-only',source],{cwd:root}).toString().split('\n').filter(p=>/^clean-room\/(src|public|tests|scripts)\//.test(p)||p.startsWith('supabase/migrations/')||/^roadmap\/master-build-plan-owner-review\/(20_|22_|23_|24_|25_|Command_Center_Canonical_Owner_Additions_REV3\.json$)/.test(p));
const blobs=execFileSync('git',['cat-file','--batch'],{cwd:root,input:paths.map(p=>source+':'+p).join('\n')+'\n',maxBuffer:128*1024*1024});let offset=0;const files=paths.map(p=>{let end=blobs.indexOf(10,offset),size=Number(blobs.subarray(offset,end).toString().split(' ')[2]);offset=end+1;const value=blobs.subarray(offset,offset+size);offset+=size+1;return{path:p,sha256:createHash('sha256').update(value).digest('hex')};});
const fixture=()=>({headSha:source,files:structuredClone(files)});
test('P15.1 source qualification accepts immutable committed bytes independently of checkout line endings',()=>{assert.deepEqual(assertSourceAuditMatchesGit(fixture(),{repoRoot:root,sourceCommit:source}),{sourceCommit:source,checkedFileCount:files.length});});
test('P15.1 source qualification rejects a matching SHA header with altered CRLF source bytes',()=>{const f=fixture();f.files.find(f=>f.path===path).sha256=createHash('sha256').update(bytes.toString().replace(/\r?\n/g,'\r\n')).digest('hex');assert.notEqual(f.files.find(f=>f.path===path).sha256,digest);assert.throws(()=>assertSourceAuditMatchesGit(f,{repoRoot:root,sourceCommit:source}),/differ from committed CI source/);});
test('P15.1 source qualification rejects wrong source missing duplicate unsafe and fabricated audit inputs',()=>{for(const mutate of [f=>f.headSha='0'.repeat(40),f=>f.files=[],f=>f.files.pop(),f=>f.files.push({...f.files[0]}),f=>f.files[0].path='clean-room/src/../secret',f=>f.files[0].sha256='0'.repeat(64)]){const f=fixture();mutate(f);assert.throws(()=>assertSourceAuditMatchesGit(f,{repoRoot:root,sourceCommit:source}));}});
test('P15.1 source audit includes immutable REV3 authority and the current phase manifest',()=>{for(const path of ['roadmap/master-build-plan-owner-review/Command_Center_Canonical_Owner_Additions_REV3.json','roadmap/master-build-plan-owner-review/23_CURRENT_199_PHASE_MACHINE_MANIFEST.json']){assert.ok(paths.includes(path));const bad=fixture();bad.files.find(f=>f.path===path).sha256='0'.repeat(64);assert.throws(()=>assertSourceAuditMatchesGit(bad,{repoRoot:root,sourceCommit:source}),/committed CI source/);}});

test('P15.1 native CLI preserves the last checkpoint when repository proof is invalid',async()=>{
 const fs=await import('node:fs'),os=await import('node:os'),path=await import('node:path');
 const temporary=fs.mkdtempSync(path.join(os.tmpdir(),'cc-p151-writer-'));
 try{
  for(const directory of ['clean-room/scripts','clean-room/evidence','roadmap']){const target=path.join(temporary,directory);fs.mkdirSync(path.dirname(target),{recursive:true});fs.cpSync(path.join(root,directory),target,{recursive:true});}
  const native=path.join(temporary,'clean-room/evidence/category15-requirement-traceability.json'),before=fs.readFileSync(native);
  const {spawnSync}=await import('node:child_process');
  const result=spawnSync(process.execPath,['scripts/p15-1-assemble-current-traceability.mjs','--write'],{cwd:path.join(temporary,'clean-room'),encoding:'utf8',maxBuffer:8*1024*1024});
  assert.notEqual(result.status,0);assert.match(result.stderr,/Refusing to overwrite native traceability with invalid repository proof/);
  assert.equal(fs.readFileSync(native).equals(before),true);
 }finally{
  const resolved=path.resolve(temporary),base=path.resolve(os.tmpdir());assert.ok(resolved.startsWith(base+path.sep)&&path.basename(resolved).startsWith('cc-p151-writer-'));
  fs.rmSync(resolved,{recursive:true,force:true});
 }
});