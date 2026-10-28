import {readFileSync,existsSync,readdirSync} from 'node:fs';import {resolve,dirname} from 'node:path';import {fileURLToPath} from 'node:url';import {spawnSync} from 'node:child_process';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..'),clean=resolve(root,'clean-room');const args=process.argv.slice(2),index=args.indexOf('--matrix'),path=index<0?resolve(clean,'evidence/category13-acceptance-matrix.json'):args[index+1];
function assert(value,message){if(!value)throw new Error(message);}
const matrix=JSON.parse(readFileSync(path,'utf8'));assert(matrix.schemaVersion===1&&matrix.status==='PASS_ISOLATED_ANALYTICS','Invalid Category 13 matrix status');
assert(JSON.stringify(matrix.phases.map(p=>p.id))===JSON.stringify(Array.from({length:10},(_,i)=>'P13.'+(i+1))),'All ten Category 13 phases are mandatory');
for(const row of matrix.phases){assert(row.status==='PASS'&&row.requirements.length>=3&&row.implementation.length>0&&row.tests.length>0&&row.database.length>0&&row.gate==='npm run gate:category13','Incomplete Category 13 acceptance row: '+row.id);for(const citation of row.authority){const text=readFileSync(resolve(root,citation.path),'utf8').split(/\r?\n/)[citation.line-1];assert(text===citation.text,'Authority citation drift: '+row.id);}
 for(const file of [...row.implementation,...row.tests,...row.database])assert(existsSync(resolve(root,file)),'Missing implementation/test/schema evidence: '+file);
 assert(row.tests.some(t=>t.startsWith('clean-room/tests/p13-'+row.id.split('.')[1]+'-')),'Phase-specific executable tests required: '+row.id);
}
if(args.includes('--validate-only')){console.log(JSON.stringify({status:'STRUCTURE_ONLY_NOT_CERTIFICATION',testsExecuted:false}));process.exit(0);}
const files=readdirSync(resolve(clean,'tests')).filter(f=>/^p13-.*\.test\.mjs$|^category13-.*\.test\.mjs$/.test(f));const tests=[...new Set([...files,'analytics-foundation.test.mjs','pif7-evaluator-outcomes.test.mjs','pif8-negative-knowledge-transfer.test.mjs','pif9-trace-dependency.test.mjs'])].map(f=>'tests/'+f);
assert(matrix.phases.every(row=>row.tests.every(t=>tests.includes(t.replace('clean-room/','')))),'Acceptance test omitted from execution');
const result=spawnSync(process.execPath,['--test','--test-reporter=tap',...tests],{cwd:clean,encoding:'utf8',maxBuffer:16*1024*1024});process.stdout.write(result.stdout??'');process.stderr.write(result.stderr??'');assert(result.status===0&&!result.error,'Category 13 executable acceptance failed');
const count=n=>Number(result.stdout.match(new RegExp('^# '+n+' (\\d+)$','m'))?.[1]);assert(count('tests')>0&&count('tests')===count('pass')&&count('fail')===0&&count('skipped')===0&&count('cancelled')===0,'Mandatory analytics tests were missing/failed/skipped/cancelled');
console.log(JSON.stringify({category:13,status:'PASS_ISOLATED_ANALYTICS',phases:10,tests:count('tests'),pass:count('pass'),fail:0,productionCertified:false}));
