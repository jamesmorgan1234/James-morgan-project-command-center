import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const workflow=readFileSync(new URL('../../.github/workflows/spec-lock-v2-clean-room-qa.yml',import.meta.url),'utf8');
const match=workflow.match(/QUALIFICATION_RUN="\$qualification_run" node --input-type=module <<'NODE'\n([\s\S]*?)\n          NODE/);
assert.ok(match,'the exact-source evidence import must exist');
const body=match[1].split('\n').map(line=>line.replace(/^          /,'')).filter(line=>!line.startsWith('import ')).join('\n');
const execute=new Function('execFileSync','writeFileSync','validateReceiptBinding','process','console',body);
const source='a'.repeat(40),run=123;
const paths=['clean-room/evidence/category15-requirement-traceability.json','clean-room/evidence/P15_2_SEMANTIC_EVERY_FILE_REVIEW.json','clean-room/evidence/P15_13_RELEASE_ARTIFACT_AUDIT.json','clean-room/evidence/P15_14_NONPRODUCTION_ACCEPTANCE.json','clean-room/evidence/phase-receipts/P15_13.json','clean-room/evidence/phase-receipts/P15_14.json'];
function fixture(){return{head:source,changed:[...paths],binding:true,files:[{verification:{sourceCommit:source,ci:{status:'completed',conclusion:'success',coreQaConclusion:'success',runId:run,testPass:2578,testFail:0,testSkipped:0}},repositoryEvidence:{valid:true}},{},{headSha:source,verified:true,failedCheckCount:0},{headSha:source,verified:true,failedCheckCount:0,browser:{lifecycleVerified:true},contractResults:{pass:5,fail:0}},{gitSha:source},{gitSha:source}]};}
function replay(f){const writes=[];execute((cmd,args,options)=>{assert.equal(cmd,'git');if(args[0]==='rev-parse')return f.head;if(args[0]==='merge-base')return '';if(args[0]==='diff')return f.changed.join('\n');if(args[0]==='show'){const path=args[1].slice(args[1].indexOf(':')+1);assert.ok(paths.includes(path));const content=JSON.stringify(f.files[paths.indexOf(path)]);if(Buffer.byteLength(content)>(options.maxBuffer??1024*1024))throw Error('ENOBUFS: qualified ledger exceeds subprocess buffer');return content}throw Error('Unexpected git command')},(path,content)=>writes.push({path,content}),()=>f.binding,{env:{GITHUB_SHA:source,QUALIFICATION_RUN:String(run)}},{log(){}});return writes;}
test('isolated workflow replay imports evidence only; never replaces source HEAD or runtime files',()=>{const writes=replay(fixture());assert.equal(writes.length,6);assert.ok(writes.every(w=>paths.includes(w.path.slice(3))))});
for(const[label,change]of[
 ['different HEAD',f=>f.head='b'.repeat(40)],
 ['unrelated runtime change',f=>f.changed.push('clean-room/src/runtime/browser.ts')],
 ['other qualified source',f=>f.files[0].verification.sourceCommit='b'.repeat(40)],
 ['other workflow run',f=>f.files[0].verification.ci.runId++],
 ['failed tests',f=>f.files[0].verification.ci.testFail=1],
 ['missing test count',f=>delete f.files[0].verification.ci.testPass],
 ['failed audit',f=>f.files[2].verified=false],
 ['no real browser lifecycle',f=>f.files[3].browser.lifecycleVerified=false],
 ['no contract assertions',f=>f.files[3].contractResults.pass=0],
 ['wrong phase source',f=>f.files[5].gitSha='b'.repeat(40)],
 ['invalid canonical receipt binding',f=>f.binding=false]
])test(label+' cannot qualify release evidence in isolated source-contract replay',()=>{const f=fixture();change(f);assert.throws(()=>replay(f))});

test('the complete ledger can exceed the default subprocess buffer without truncating evidence',()=>{const f=fixture();f.files[0].padding='x'.repeat(2*1024*1024);assert.equal(replay(f).length,6)});
