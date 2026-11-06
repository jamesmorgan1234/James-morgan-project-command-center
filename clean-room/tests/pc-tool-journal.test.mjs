import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,readFile,writeFile,readdir,symlink,link,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {createBrainToolRuntime} from '../dist/brain/tool-runtime.js';
import {createPcToolJournal} from '../src/worker/pc-tool-journal.mjs';
import {createPcProjectArtifactHandlers} from '../src/worker/pc-project-file-tool.mjs';
import {createPcToolExecutionLane} from '../dist/worker/pc-tool-execution-lane.mjs';
const sha256=async s=>createHash('sha256').update(s).digest('hex');

async function fixture(t){
 const base=await mkdtemp(join(tmpdir(),'cc-journal-'));t.after(()=>rm(base,{recursive:true,force:true}));
 const artifacts=join(base,'artifacts'),journalRoot=join(base,'journal');await mkdir(artifacts);await mkdir(journalRoot);
 const now=()=>new Date().toISOString(),binding={root:artifacts,ownerId:'owner',projectId:'project:001',companyId:'company:001',accountRef:'workspace:001',toolKey:'artifacts',versionRef:'artifact-v1'};
 const handlers=await createPcProjectArtifactHandlers(binding);
 const tool={key:'artifacts',ownerId:'owner',provider:'local',versionRef:'artifact-v1',actionKeys:['artifact.write','artifact.read'],actionEffects:{'artifact.write':'local_write','artifact.read':'private_read'},environment:'local',available:true,cost:'free',authenticationRequired:true,authenticated:true,projectIds:['project:001'],companyIds:['company:001'],accountRefs:['workspace:001'],evidenceRef:'isolated-real-filesystem',verifiedAt:now()};
 const action={ownerId:'owner',projectId:'project:001',companyId:'company:001',toolKey:'artifacts',actionKey:'artifact.write',effect:'local_write',accountRef:'workspace:001',resourceProjectId:'project:001',resourceCompanyId:'company:001',now:now(),maximumHealthAgeMs:180000,authority:{issuer:'command_center',ownerId:'owner',projectId:'project:001',companyId:'company:001',actionKeys:tool.actionKeys,accountRefs:tool.accountRefs,reference:'isolated-owner-authority',expiresAt:new Date(Date.now()+60000).toISOString(),protectedActionAuthorized:false}};
 const saved={invocationId:'one',taskId:'task',workerId:'worker',inputText:JSON.stringify({name:'proof.txt',content:'real artifact'}),action};
 const lease={invocationId:'one',taskId:'task',workerId:'worker',ownerId:'owner',projectId:'project:001',companyId:'company:001',generation:1,fencingToken:1,expiresAt:new Date(Date.now()+30000).toISOString()};
 let stopped=false;
 const assertCurrent=async()=>{if(stopped)throw Error('canonical_stop')};
 const fresh=async()=>{
  const journal=await createPcToolJournal({root:journalRoot,createLease:async()=>lease,assertCurrent});
  const runtime=createBrainToolRuntime({resolve:async()=>saved,catalog:async()=>[tool],now,sha256,assertCurrent,...journal},handlers);
  return{runtime,journal};
 };
 return{base,artifacts,journalRoot,binding,handlers,saved,lease,action,tool,fresh,stop(){stopped=true}};
}
test('real journal and artifact handler survive runtime recreation without overwriting the file',async t=>{
 const f=await fixture(t);const first=await (await f.fresh()).runtime.execute('one');assert.equal(await readFile(join(f.artifacts,'proof.txt'),'utf8'),'real artifact');
 const second=await (await f.fresh()).runtime.execute('one');assert.deepEqual(second,first);
 assert.equal((await readdir(f.journalRoot)).length,2);assert.equal(JSON.parse(first.outputText).sha256,await sha256('real artifact'));
});
test('crash after durable start requires reconciliation instead of repeating a write',async t=>{
 const f=await fixture(t);const {journal}=await f.fresh();assert.equal((await journal.begin(f.saved,await sha256(f.saved.inputText))).state,'fresh');
 await assert.rejects((await f.fresh()).runtime.execute('one'),/requires_reconciliation/);assert.deepEqual(await readdir(f.artifacts),[]);
});
test('changing saved input under an old invocation ID cannot reuse or overwrite its proof',async t=>{
 const f=await fixture(t);await (await f.fresh()).runtime.execute('one');f.saved.inputText=JSON.stringify({name:'other.txt',content:'changed'});
 await assert.rejects((await f.fresh()).runtime.execute('one'),/saved_command_mismatch/);assert.deepEqual(await readdir(f.artifacts),['proof.txt']);
});
test('journal detects output corruption on disk after process restart',async t=>{
 const f=await fixture(t);await (await f.fresh()).runtime.execute('one');const name=(await readdir(f.journalRoot)).find(s=>s.endsWith('.result.json'));
 const path=join(f.journalRoot,name),r=JSON.parse(await readFile(path,'utf8'));r.outputText='tampered';await writeFile(path,JSON.stringify(r));
 await assert.rejects((await f.fresh()).runtime.execute('one'),/readback_mismatch/);
});
test('Stop before claim creates neither artifact nor journal records',async t=>{
 const f=await fixture(t);f.stop();await assert.rejects((await f.fresh()).runtime.execute('one'),/canonical_stop/);assert.deepEqual(await readdir(f.artifacts),[]);assert.deepEqual(await readdir(f.journalRoot),[]);
});
test('handler cannot overwrite an existing approved artifact',async t=>{
 const f=await fixture(t);await writeFile(join(f.artifacts,'proof.txt'),'protected existing file');await assert.rejects((await f.fresh()).runtime.execute('one'),/EEXIST/);assert.equal(await readFile(join(f.artifacts,'proof.txt'),'utf8'),'protected existing file');
});
for(const name of ['../outside','/tmp/outside','nested/file.txt','NUL','con.txt','file.','file:stream','..'])test('rejects artifact escape or unsafe filename '+name,async t=>{
 const f=await fixture(t);f.saved.inputText=JSON.stringify({name,content:'unauthorized'});await assert.rejects((await f.fresh()).runtime.execute('one'),/artifact_name_invalid/);assert.deepEqual(await readdir(f.artifacts),[]);
});
test('real read handler rejects a symlink into another project',async t=>{
 const f=await fixture(t);const target=join(f.base,'private.txt');await writeFile(target,'another project');await symlink(target,join(f.artifacts,'link.txt'));
 Object.assign(f.action,{actionKey:'artifact.read',effect:'private_read'});f.saved.inputText=JSON.stringify({name:'link.txt'});await assert.rejects((await f.fresh()).runtime.execute('one'),/artifact_file_invalid/);
});
test('real read handler rejects a hard link into another project',async t=>{
 const f=await fixture(t);const target=join(f.base,'private.txt');await writeFile(target,'another project');await link(target,join(f.artifacts,'link.txt'));
 Object.assign(f.action,{actionKey:'artifact.read',effect:'private_read'});f.saved.inputText=JSON.stringify({name:'link.txt'});await assert.rejects((await f.fresh()).runtime.execute('one'),/artifact_file_invalid/);
});
test('real read handler returns the actual scoped artifact bytes',async t=>{
 const f=await fixture(t);await writeFile(join(f.artifacts,'read.txt'),'actual persisted bytes');Object.assign(f.action,{actionKey:'artifact.read',effect:'private_read'});f.saved.inputText=JSON.stringify({name:'read.txt'});const result=await(await f.fresh()).runtime.execute('one');assert.equal(result.outputText,'actual persisted bytes');
});
test('handler independently checks scope even if invoked without the runtime',async t=>{
 const f=await fixture(t);await assert.rejects(f.handlers[0].invoke({inputText:f.saved.inputText,action:{...f.action,companyId:'company:002'},signal:new AbortController().signal}),/artifact_exact_scope_required/);assert.deepEqual(await readdir(f.artifacts),[]);
});
test('execution lane cannot start without an authenticated canonical job transport',async()=>{
 await assert.rejects(createPcToolExecutionLane({}),/canonical_job_transport_not_connected/);
});
test('lane retries a lost canonical commit using its saved file result without repeating the write',async t=>{
 const f=await fixture(t);let receipt,commits=0;
 const lane=await createPcToolExecutionLane({workspace:f.binding,journalRoot:f.journalRoot,resolve:async()=>f.saved,catalog:async()=>[f.tool],createLease:async()=>f.lease,assertCurrent:async()=>{},
  commitCanonical:async r=>{commits++;receipt={...r.lease,toolKey:r.toolKey,actionKey:r.actionKey,toolVersion:r.toolVersion,inputHash:r.inputHash,outputHash:r.outputHash,canonicalCommitVerified:true,commitId:'00000000-0000-4000-8000-000000000001',resultRef:'isolated:artifact:proof'};if(commits===1)throw Error('lost_canonical_response')},readCanonical:async()=>receipt});
 await assert.rejects(lane.execute('one'),/lost_canonical_response/);
 assert.equal((await lane.execute('one')).canonicalCommitVerified,true);assert.equal(commits,2);assert.deepEqual(await readdir(f.artifacts),['proof.txt']);
});
test('lane cannot report canonical success using another project or fence receipt',async t=>{
 const f=await fixture(t);let receipt;
 const lane=await createPcToolExecutionLane({workspace:f.binding,journalRoot:f.journalRoot,resolve:async()=>f.saved,catalog:async()=>[f.tool],createLease:async()=>f.lease,assertCurrent:async()=>{},
  commitCanonical:async r=>{receipt={...r.lease,toolKey:r.toolKey,actionKey:r.actionKey,toolVersion:r.toolVersion,inputHash:r.inputHash,outputHash:r.outputHash,canonicalCommitVerified:true,projectId:'project:002',commitId:'00000000-0000-4000-8000-000000000001',resultRef:'isolated:artifact:proof'}},readCanonical:async()=>receipt});
 await assert.rejects(lane.execute('one'),/canonical_tool_result_not_verified/);
});
