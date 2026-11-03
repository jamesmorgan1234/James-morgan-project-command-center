import assert from 'node:assert/strict';
import test from 'node:test';
import {readFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {plannedCompanyPreparation} from '../dist/projects/planned-company-roadmap.js';
import {validateRoadmap,workReadiness} from '../dist/projects/roadmap.js';
test('all 107 actual company plans compile to scoped, evidence-bound preparatory work without marking any work complete',async()=>{
 const dir=new URL('../../roadmap/portfolio-future-architecture/companies/',import.meta.url);const files=(await readdir(dir)).filter(f=>/^\d{3}_[A-Z0-9_]+\.md$/.test(f)&&Number(f.slice(0,3))<=107);assert.equal(files.length,107);
 for(const file of files){const source=await readFile(new URL(file,dir),'utf8');const [,number,name]=source.match(/^# Company (\d{3}) — (.+)$/m);const hash=createHash('sha256').update(source).digest('hex');const plan=plannedCompanyPreparation('project:company:future:'+number,name,'roadmap/portfolio-future-architecture/companies/'+file,hash);validateRoadmap(plan);
 assert.equal(plan.workUnits.length,2);assert.ok(plan.workUnits.every(u=>u.status==='planned'&&u.id.startsWith(plan.projectId)&&u.evidenceRefs.some(ref=>ref.includes(hash))));assert.equal(workReadiness(plan,plan.workUnits[0].id).ready,true);assert.equal(workReadiness(plan,plan.workUnits[1].id).ready,false);
 }
});
test('preparation rejects wrong project namespaces, non-authoritative source paths and absent digests',()=>{
 for(const [id,ref,hash] of [['aro','roadmap/portfolio-future-architecture/companies/014_WEBSITE_CHANGE_INTELLIGENCE.md','a'.repeat(64)],['project:company:future:014','https://other.example','a'.repeat(64)],['project:company:future:014','roadmap/portfolio-future-architecture/companies/014_WEBSITE_CHANGE_INTELLIGENCE.md','']])assert.throws(()=>plannedCompanyPreparation(id,'Website Change Intelligence',ref,hash));
});
