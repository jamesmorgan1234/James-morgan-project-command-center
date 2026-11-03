import { readFile, readdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { plannedCompanyPreparation } from '../dist/projects/planned-company-roadmap.js';
const root=new URL('../../',import.meta.url), dir=new URL('roadmap/portfolio-future-architecture/companies/',root);
const plans=[];
// Preserve the original preparation import; later companies carry their own complete native DAGs.
for(const file of (await readdir(dir)).filter(f=>/^\d{3}_[A-Z0-9_]+\.md$/.test(f)&&Number(f.slice(0,3))<=107).sort()){
 const content=await readFile(new URL(file,dir),'utf8'); const match=content.match(/^# Company (\d{3}) — (.+)$/m);
 if(!match||match[1]!==file.slice(0,3))throw Error('Company source identity mismatch '+file);
 const sourceRef='roadmap/portfolio-future-architecture/companies/'+file;
 const hash=createHash('sha256').update(content).digest('hex');
 plans.push({...plannedCompanyPreparation('project:company:future:'+match[1],match[2].trim(),sourceRef,hash),sourceRef,sourceSha256:hash});
}
if(plans.length!==107||new Set(plans.map(p=>p.projectId)).size!==107)throw Error('Expected exact 107 current company plans');
const path=process.argv[2];if(!path)throw Error('Output path required');
await writeFile(path,JSON.stringify(plans,null,2)+'\n');console.log(JSON.stringify({companies:plans.length,workUnits:plans.reduce((sum,p)=>sum+p.workUnits.length,0),completeCompanyDenominatorTrusted:false,output:path}));
