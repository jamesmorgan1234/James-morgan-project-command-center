import {readFileSync,existsSync,readdirSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..'),clean=resolve(root,'clean-room');
const matrix=JSON.parse(readFileSync(resolve(clean,'evidence/category12-acceptance-matrix.json'),'utf8'));
const phases=Array.from({length:8},(_,i)=>`P12.${i+1}`),areas=['cross-brain-learning','transferability','inheritance','dynamic-lifecycle','collaboration-composition','procedure-learning','compiler-interoperability'];
function assert(condition,message){if(!condition)throw new Error(message);}
assert(matrix.schemaVersion===1&&matrix.status==='PASS_ISOLATED_FOUNDATION','Category 12 matrix schema/status invalid');
assert(JSON.stringify(matrix.phases.map(p=>p.id))===JSON.stringify(phases),'All eight phases must be mapped');
assert(JSON.stringify(matrix.expanded.map(p=>p.id))===JSON.stringify(areas),'All seven expanded foundations must be mapped');
for(const row of [...matrix.phases,...matrix.expanded]){
 assert(row.status==='PASS'&&row.requirements.length>0&&row.authority.length>0&&row.implementation.length>0&&row.tests.length>0&&row.database.length>0,`Incomplete acceptance mapping: ${row.id}`);
 for(const path of [...row.authority.map(a=>a.split('#')[0]),...row.implementation,...row.tests,...row.database])assert(existsSync(resolve(root,path)),`Missing evidence location: ${path}`);
}
const tests=[...new Set([...matrix.phases,...matrix.expanded].flatMap(r=>r.tests).map(p=>p.replace('clean-room/','')))];
for(const file of ['specialists-foundation.test.mjs','pif3-specialist-model-registry.test.mjs','pif4-learning-promotion.test.mjs','pif8-negative-knowledge-transfer.test.mjs'])tests.push('tests/'+file);
assert(readdirSync(resolve(clean,'tests')).filter(f=>/^p12-\d+-.*\.test\.mjs$/.test(f)).every(f=>tests.includes('tests/'+f)),'Category 12 test omitted');
const result=spawnSync(process.execPath,['--test','--test-reporter=tap',...tests],{cwd:clean,encoding:'utf8',maxBuffer:12*1024*1024});
process.stdout.write(result.stdout??'');process.stderr.write(result.stderr??'');
assert(result.status===0&&!result.error,'Category 12 executable acceptance suite failed');
const count=name=>Number(result.stdout.match(new RegExp(`^# ${name} (\\d+)$`,'m'))?.[1]);
assert(count('tests')>0&&count('tests')===count('pass')&&count('fail')===0&&count('skipped')===0&&count('cancelled')===0,'Category 12 acceptance is incomplete/skipped');
console.log(JSON.stringify({category:12,status:'PASS_ISOLATED_FOUNDATION',phases:8,expandedAreas:7,tests:count('tests'),pass:count('pass'),fail:0,productionCertified:false}));
