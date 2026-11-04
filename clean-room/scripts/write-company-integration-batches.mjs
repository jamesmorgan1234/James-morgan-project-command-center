// Deterministic, source-hash-verifiable Company 001–117 reconciliation payloads.
// GitHub Actions generates readable artifacts only. No service credentials, DB writes or workers.
import {readFile,mkdir,writeFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {compilePortfolio} from './compile-company-integration.mjs';
const ROOT=new URL('../../',import.meta.url);
const OUTPUT=new URL('.github/compiled-company-sources/',ROOT);
const sha=x=>createHash('sha256').update(x).digest('hex');
const required=(ok,message)=>{if(!ok)throw Error(message)};
export async function generateReconciliationBatches(){
 const compiled=await compilePortfolio();
 const native=compiled.companies.filter(x=>x.mode==='PRESERVE_NATIVE_DAG');
 const originals=compiled.companies.filter(x=>x.mode==='SOURCE_COMPILE_ONLY');
 required(originals.length===107&&native.length===10,'Incomplete portfolio source coverage');
 const batches=[];
 for(let i=0;i<originals.length;i+=4){
  const group=originals.slice(i,i+4),payloads=[];
  for(const c of group){
   const sourceText=await readFile(new URL(c.sourcePath,ROOT),'utf8');
   required(sha(sourceText)===c.sourceSha256,'Source changed '+c.projectId);
   const conformancePath=c.conformanceRef?.split('#sha256=')[0]??'';
   const conformanceText=conformancePath?await readFile(new URL(conformancePath,ROOT),'utf8'):'';
   if(conformancePath)required(conformancePath+'#sha256='+sha(conformanceText)===c.conformanceRef,'Complement changed '+c.projectId);
   const caps=[...new Set([c.brain.sourceSection,c.brain.agentSection,...c.brain.capabilities].map(s=>String(s).trim()).filter(Boolean))].slice(0,100);
   required(caps.length>=2,'Specialist source not recovered '+c.projectId);
   payloads.push({
    projectId:c.projectId,companyId:c.companyId,sourcePath:c.sourcePath,sourceSha256:c.sourceSha256,sourceText,
    conformancePath,conformanceText,
    workUnits:c.graph.workUnits,gates:c.graph.gates,
    brain:{specialistId:c.brain.specialistId,brainKey:c.brain.brainKey,enabled:false,capabilities:caps},
    status:'SOURCE_GRAPH_COMPLETE_RUNTIME_NOT_VERIFIED',
    explicitlyDoNotActivateAutomatically:c.projectId==='project:company:future:014'
   });
  }
  const id=group[0].identity.id+'-'+group.at(-1).identity.id;
  const content=JSON.stringify({schemaVersion:1,sourceAuthority:'build/spec-lock-v2-clean-room',
     sourceCount:payloads.length,payloads},null,2)+'\n';
  batches.push({filename:id+'.json',content,sha256:sha(content),companies:payloads.map(x=>x.projectId)});
 }
 return {batches,native:native.map(x=>({projectId:x.projectId,sourcePath:x.sourcePath,
   sourceSha256:x.sourceSha256,specialistSource:x.specialistSource})),total:compiled.sourceCount};
}
export async function writeReconciliationBatches(){
 const r=await generateReconciliationBatches();
 await mkdir(OUTPUT,{recursive:true});
 const expected=new Set(r.batches.map(x=>x.filename).concat('index.json'));
 for(const filename of await readdir(OUTPUT))if(!expected.has(filename)&&/^\d{3}-\d{3}[.]json$/.test(filename))
  throw Error('Unexpected stale source batch requires explicit reconciliation: '+filename);
 for(const b of r.batches)await writeFile(new URL(b.filename,OUTPUT),b.content,'utf8');
 const index={schemaVersion:1,portfolioSourceCount:117,sourceCompiled:107,nativeGraphPreserved:10,
   productionApplied:false,operationalBrainVerified:false,denominatorCertified:false,
   individualOwnerAuthorizationStillRequiredForProtectedActions:true,
   batches:r.batches.map(({filename,sha256,companies})=>({filename,sha256,companies})),
   native:r.native};
 await writeFile(new URL('index.json',OUTPUT),JSON.stringify(index,null,2)+'\n','utf8');
 return {batchCount:r.batches.length,compiled:107,preserved:10,sourceCount:117};
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
 const result=process.argv.includes('--write')?await writeReconciliationBatches():await generateReconciliationBatches();
 console.log(JSON.stringify(process.argv.includes('--write')?result:{batchCount:result.batches.length,compiled:107,preserved:10,sourceCount:117}));
}
