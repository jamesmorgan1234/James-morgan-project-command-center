import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {portfolioProjects} from '../dist/runtime/portfolio-list.js';
import {filterRuntimeProjects,groupRuntimeProjects} from '../dist/runtime/project-screen.js';
import {auditCompanyBrainCatalog} from '../src/brain/pc-brain-readiness.mjs';
const snapshot=JSON.parse(readFileSync(new URL('../evidence/brain-activation/unified-portfolio.json',import.meta.url),'utf8'));
const known=value=>({state:'known',value});
const projects=snapshot.projects.map(p=>({id:p.project_id,name:p.name,companyId:known(p.company_id),typeKey:known(p.type_key),lifecycle:known(p.lifecycle),mission:known('')}));

test('one default portfolio contains all 156 canonical projects without duplicates or a 117-company cap',()=>{
 const all=portfolioProjects(projects);
 assert.equal(all.length,156);assert.equal(new Set(all.map(p=>p.id)).size,156);
 assert.equal(all.filter(p=>p.companyId.value!==null).length,135);
 assert.deepEqual(new Set(filterRuntimeProjects(all,{}).map(p=>p.id)),new Set(projects.map(p=>p.id)));
 const groups=groupRuntimeProjects(all);
 assert.equal(groups.length,1);assert.equal(groups[0].projects.length,156);
 for(const id of ['aro','crestven','morgancommerce','morgans-garage-doors','wealth','project:company:future:014','project:company:future:117','kdp','command-center'])assert.ok(all.some(p=>p.id===id),id);
});
test('book filter narrows the same portfolio without removing books from default membership',()=>{
 const books=portfolioProjects(projects,true);
 assert.equal(books.length,20);
 assert.ok(books.every(p=>p.typeKey.value==='project-type:book'));
 assert.equal(portfolioProjects(projects).length,156);
 assert.throws(()=>portfolioProjects([...projects,projects[0]]),/Duplicate canonical project identity/);
});
test('Brain list counts the complete specialist registry: 128, or 129 with central authority',()=>{
 const profiles=snapshot.projects;
 const specialists=profiles.filter(p=>p.brain_key).map(p=>({...p,enabled:false}));
 const result=auditCompanyBrainCatalog({profiles,specialists,providers:[]});
 assert.equal(result.total,128);assert.equal(result.readOnlyRoutesAvailable,0);
 assert.equal(result.results.filter(r=>r.reason==='specialist_not_live_verified').length,128);
 assert.equal(result.fullOperationalVerification,'not-assessed');
 const central=auditCompanyBrainCatalog({profiles,specialists,providers:[],includeCentral:true});
 assert.equal(central.total,129);assert.equal(central.results[0].brainKey,'command-center');
 assert.equal(central.results[0].projectId,null);
});
test('new registered companies and Brains appear automatically with no maximum company number',()=>{
 const profiles=[...snapshot.projects,{project_id:'project:company:future:1000',company_id:'company:future:1000'}];
 const specialists=[...snapshot.projects.filter(p=>p.brain_key),{project_id:'project:company:future:1000',brain_key:'brain:company:future:1000:v1',enabled:false}];
 const result=auditCompanyBrainCatalog({profiles,specialists,providers:[]});
 assert.equal(result.total,129);
 assert.equal(result.results.find(r=>r.projectId==='project:company:future:1000').reason,'specialist_not_live_verified');
 assert.equal(auditCompanyBrainCatalog({profiles,specialists,providers:[],includeCentral:true}).total,130);
 assert.throws(()=>auditCompanyBrainCatalog({profiles,specialists:[...specialists,specialists[0]],providers:[]}),/duplicate_specialist_project_identity/);
 const orphan=auditCompanyBrainCatalog({profiles:[],specialists:[{project_id:'bad:path',brain_key:'orphan'}],providers:[]});
 assert.equal(orphan.results[0].reason,'invalid_registered_project_identity');
});
