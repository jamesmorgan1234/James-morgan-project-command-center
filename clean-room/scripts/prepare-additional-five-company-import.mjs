// Pure local adapter. The original owner package is preserved byte for byte.
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {ProjectTypeRegistry,ProjectRegistry} from '../dist/projects/registry.js';
import {validateRoadmap} from '../dist/projects/roadmap.js';
import {validateSpecialistModel} from '../dist/brain/specialists.js';
import {generateFiveCompanyImportSql} from './prepare-five-company-import.mjs';

export const ADDITIONAL_PACKAGE='roadmap/portfolio-future-architecture/additional-five-company-import-2026-11-03/';
const ROOT=new URL('../../',import.meta.url);
const read=p=>readFile(new URL(p,ROOT),'utf8');
const json=async p=>JSON.parse(await read(ADDITIONAL_PACKAGE+'data/'+p+'.json'));
const hash=x=>createHash('sha256').update(x).digest('hex');
const need=(ok,message)=>{if(!ok)throw Error(message);};
const flat=s=>s.replace(/\s+/g,' ').trim();

export async function prepareAdditionalFiveCompanyImport({existingProjects=[],existingBrains=[]}={}){
 const companies=(await json('PROPOSED_COMPANY_REGISTRY')).companies;
 const brains=(await json('SPECIALIST_BRAIN_CATALOG')).brains;
 const tasks=(await json('AGENCY_EXECUTABLE_TASK_PROPOSALS')).tasks;
 const checks=(await json('CONFORMANCE_106_X_5_DRAFT')).checks;
 const phases=(await json('ROADMAP_PHASE_GATES')).phases;
 for(const f of (await json('FILE_MANIFEST_SHA256')).files){
  need(!f.file.startsWith('/')&&!f.file.split('/').includes('..'),'Unsafe source path');
  need(hash(await readFile(new URL(ADDITIONAL_PACKAGE+f.file,ROOT)))===f.sha256,'Changed source: '+f.file);
 }
 need(companies.length===5&&brains.length===5&&tasks.length===520&&checks.length===530&&phases.length===40,'Incomplete additional company package');
 const template=JSON.parse(await read('clean-room/evidence/FIVE_COMPANY_NATIVE_IMPORT.json')).items[0].brain;
 const types=new ProjectTypeRegistry();types.register({key:'project-type:company-build',version:1,label:'Company build project',capabilities:[],requiredDetailSections:[],domainPlaybookKey:'portfolio-company-build'});
 const registry=new ProjectRegistry(types),items=[];
 for(const [i,c] of companies.entries()){
  const n=String(113+i),pid='project:company:future:'+n,cid='company:future:'+n;
  need(c.ordinal_proposed===113+i&&c.primary_project_id_proposed===pid&&c.company_id_proposed===cid,'Company identity mismatch');
  need(c.outgoing_money_limit_usd===0&&c.default_owner_only_protected_actions===true,'Financial boundary mismatch');
  need(!existingProjects.some(p=>p.id===pid||p.companyId===cid||p.name===c.name),'Existing company collision: '+pid);
  const source='roadmap/portfolio-future-architecture/companies/'+n+'_'+c.slug.toUpperCase()+'.md';
  const content=await read(source);need(hash(content)===c.source_sha256,'Canonical roadmap hash mismatch: '+pid);
  const sourceRef=source+'#sha256='+c.source_sha256;
  const configurationRef=ADDITIONAL_PACKAGE+c.source_preparation_file.replace('EXHAUSTIVE_COMPANY_ROADMAP.md','SPECIALIZED_BRAIN.md');
  const b=brains.find(b=>b.project_id===pid);
  need(b&&b.company_id===cid&&b.brain_id_proposed===c.brain_id_proposed&&b.max_autonomous_outgoing_spend_usd===0&&b.required_source_evidence===true,'Brain identity or authority mismatch');
  const project={id:pid,typeKey:'project-type:company-build',ownerId:'owner-resolved-only-at-authorized-import',companyId:cid,name:c.name,mission:b.purpose,lifecycle:'candidate',status:'Planned — not built or launched',verification:'unknown',priority:'normal',version:1,createdAt:'2026-11-03T00:00:00Z',updatedAt:'2026-11-03T00:00:00Z',agentAccessEnabled:false,portfolioAutoEnabled:false,protected:false};
  registry.create(project);
  const key='brn_company-future-'+n;
  need(!existingBrains.some(b=>b.key===key||b.brainKey===c.brain_id_proposed||b.projectId===pid),'Existing Brain collision: '+pid);
  // Reuse the canonical registry contract, never another company's implementation.
  const brain={...template,key,domain:c.slug,supportedCompanyIds:[cid],supportedProjectIds:[pid],strengths:b.capability_tree,capabilityKeys:b.capability_tree.map((_,i)=>'cap_company-'+n+'-'+String(i+1).padStart(3,'0')),protectedActionBoundaries:[...template.protectedActionBoundaries,b.protected_boundary],dependencyVersionRefs:[sourceRef,configurationRef],evaluationEvidenceIds:['evd_company-'+n+'-source-contract-review'],rollbackEvidenceId:'evd_company-'+n+'-import-rollback',provenanceEvidenceIds:['evd_company-'+n+'-source-package']};
  validateSpecialistModel(brain);
  const localTasks=tasks.filter(t=>t.project_id===pid),ids=new Set(localTasks.map(t=>t.id));
  need(localTasks.length===104&&ids.size===104,'Task inventory mismatch: '+pid);
  const roadmap={projectId:pid,version:1,gates:phases.filter(p=>p.project_id===pid).map(p=>({id:pid+':'+p.phase.toLowerCase()+':approval',satisfied:false,evidenceRefs:[]})),workUnits:localTasks.map(t=>{
   need(t.status==='prepared_not_executed'&&t.expected_outgoing_spend_usd===0&&t.authorized_financial_action===false&&t.execution_authorized_in_this_chat===false&&t.dependency_ids.every(d=>ids.has(d)),'Task authority or dependency mismatch: '+t.id);
   return {id:t.id,categoryId:'company-build',phaseId:t.phase,title:t.title,status:'planned',applicable:true,dependencyIds:t.dependency_ids,gateIds:t.id.endsWith(':gate')?[pid+':'+t.phase.toLowerCase()+':approval']:[],acceptanceCriteria:[...new Set(t.acceptance_criteria)],evidenceRefs:[sourceRef,ADDITIONAL_PACKAGE+'data/AGENCY_EXECUTABLE_TASK_PROPOSALS.json#'+t.id]};
  })};validateRoadmap(roadmap);need(roadmap.gates.length===8,'Phase inventory mismatch');
  const mapped=checks.filter(x=>x.project_id===pid);
  need(mapped.length===106&&mapped.filter(x=>x.kind==='28_PASS').length===28&&mapped.filter(x=>x.kind==='A_BZ').length===78,'Conformance inventory mismatch');
  const conformance=mapped.map(x=>{need(x.actual_pass===false&&x.result==='PREPARED_NOT_INDEPENDENTLY_VERIFIED'&&flat(content).includes(flat(x.specific_evidence)),'Untraceable or falsely completed conformance: '+x.id);return {...x,canonicalSource:sourceRef,importAudit:'Source mapping preserved; substantive implementation and independent domain verification pending'};});
  items.push({project,brainKey:c.brain_id_proposed,brain,configurationRef,sourceRef,sourceSha256:c.source_sha256,roadmap,conformance,route:'/project/'+encodeURIComponent(pid)});
 }
 return {schemaVersion:1,state:'PREPARED_NOT_IMPORTED',productionApplied:false,companyCount:5,expectedPlannedCompanyCountAfterImport:117,existingCompanyCount:112,expectedProjectCountAfterImport:156,bookCountPreserved:43,expectedHomeCountAfterImport:199,automaticSpendLimitUsd:0,items};
}

export function generateAdditionalCompanyNameSql(bundle){
 const values=bundle.items.map(c=>"'"+c.project.name.replaceAll("'","''")+"'").join(',');
 return `-- Add only these five approved names; preserve existing enum labels and records.\ndo $names$\ndeclare v_name text;\nbegin\n if exists(select 1 from pg_type t join pg_namespace n on n.oid=t.typnamespace where n.nspname='public' and t.typname='command_center_activation_name' and t.typtype='e') then\n  foreach v_name in array array[${values}] loop\n   execute format('alter type public.command_center_activation_name add value if not exists %L',v_name);\n  end loop;\n end if;\nend $names$;\n`;
}

if(process.argv[1]===fileURLToPath(import.meta.url)){
 const bundle=await prepareAdditionalFiveCompanyImport();
 if(process.argv.includes('--write')){
  await writeFile(new URL('clean-room/evidence/ADDITIONAL_FIVE_COMPANY_NATIVE_IMPORT.json',ROOT),JSON.stringify(bundle,null,2)+'\n');
  await writeFile(new URL('supabase/seeds/additional_five_company_import.sql',ROOT),generateFiveCompanyImportSql(bundle));
  await writeFile(new URL('supabase/seeds/additional_five_company_name_prerequisite.sql',ROOT),generateAdditionalCompanyNameSql(bundle));
 }
 console.log(JSON.stringify({state:bundle.state,companies:bundle.items.length,workUnits:bundle.items.reduce((n,c)=>n+c.roadmap.workUnits.length,0),conformance:530,productionApplied:false}));
}
