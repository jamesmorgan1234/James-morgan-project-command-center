// Central read-only compiler for the existing 117-company source portfolio.
// No network calls, provider enablement, profile mutation, financial or worker action.
import {readFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {validateRoadmap} from '../dist/projects/roadmap.js';

const root=new URL('../../',import.meta.url);
const companyDir=new URL('roadmap/portfolio-future-architecture/companies/',root);
const digest=x=>createHash('sha256').update(x).digest('hex');
const quote=x=>String(x).replace(/\s+/g,' ').trim();
const requireState=(good,message)=>{if(!good)throw new Error(message);};
const category=title=>{
 const s=title.toLowerCase();
 if(/^\s*(?:brain|velobrain)\b/.test(s))return 'brain';
 if(/\bagents?\b|specialist|orchestrat/.test(s))return 'agent';
 if(/brain|reasoning|intelligence/.test(s))return 'brain';
 if(/product|feature/.test(s))return 'product';
 if(/service|worker/.test(s))return 'service';
 if(/workflow|pipeline|input|output|integration|api|data/.test(s))return 'integration';
 if(/security|privacy|compliance|legal|abuse|risk|edge|failure/.test(s))return 'security';
 if(/money|monet|pricing|commercial|distribution|market|customer|revenue|acquisition/.test(s))return 'commercial';
 if(/28.*pass|a.?bz|conformance|saturation|classification|24.part|qa|test|verif/.test(s))return 'verification';
 return 'operations';
};
export function sourceSections(markdown){
 const output=[];let section=null,insideFence=false;
 for(const [index,line] of markdown.split(/\r?\n/).entries()){
  if(/^\s*(```|~~~)/.test(line))insideFence=!insideFence;
  const match=!insideFence&&line.match(/^(#{1,3})\s+(.+?)\s*$/);
  if(match){
   if(section){section.body=section.lines.join('\n').trim();delete section.lines;output.push(section);}
   section={heading:match[2],level:match[1].length,line:index+1,lines:[]};
  }else if(section)section.lines.push(line);
 }
 if(section){section.body=section.lines.join('\n').trim();delete section.lines;output.push(section);}
 return output;
}
function atoms(body){
 const lines=body.split(/\r?\n/),bullet=[];
 for(const line of lines){
  const m=line.match(/^\s*(?:[-*]\s+|\d+[.)]\s+)(.+)$/);
  if(m&&quote(m[1]).length>3)bullet.push(quote(m[1]));
 }
 if(bullet.length>=2)return [...new Set(bullet)];
 const chunks=body.replace(/\r?\n/g,' ').split(';').map(quote).filter(x=>x.length>3&&x.length<800);
 return chunks.length>=2?chunks:[];
}
function sectionsIdentity(n,source){
 const title=source.match(/^# Company (\d{3}) — (.+)$/m);
 const id=String(n).padStart(3,'0');
 requireState(title&&title[1]===id,'Company document title mismatch '+id);
 requireState(source.includes('company:future:'+id)&&source.includes('project:company:future:'+id),'Company identity missing '+id);
 return {name:quote(title[2]),id,projectId:'project:company:future:'+id,companyId:'company:future:'+id};
}
export function compileCompanySource(n,filename,source,conformance='',conformancePath=''){
 const identity=sectionsIdentity(n,source),id=identity.id;
 const base='roadmap/portfolio-future-architecture/companies/';
 const sourcePath=base+filename,ref=sourcePath+'#sha256='+digest(source);
 const supplementalRef=conformance&&conformancePath?conformancePath+'#sha256='+digest(conformance):undefined;
 const sourceParts=sourceSections(source);
 requireState(sourceParts.length>=12,'Incomplete section coverage '+id);
 const included=sourceParts.filter(x=>x.level!==1||x.heading!=='Company '+id+' — '+identity.name);
 requireState(included.some(x=>/brain/i.test(x.heading))&&included.some(x=>/agent/i.test(x.heading)),'Missing company Brain/Agent section '+id);
 const units=[],seen=new Set(),prefix=identity.projectId+':recovery:';
 const make=(suffix,title,phase,cat,body,deps=[],gates=[])=>{
  const unitId=prefix+suffix;
  requireState(!seen.has(unitId),'Duplicate unit id '+unitId);seen.add(unitId);
  const evidence=[ref,...(supplementalRef?[supplementalRef]:[])];
  const criteria=[body,'Independently verify real project-scoped artifacts, failure paths, source rights, owner boundaries and $0 compliance. Planning, simulated work, and registry rows are never evidence of an operational executor.'];
  units.push({id:unitId,categoryId:cat,phaseId:phase,title:quote(title).slice(0,230),status:suffix==='source-integrity'?'ready':'planned',applicable:true,dependencyIds:deps.map(x=>prefix+x),gateIds:gates.map(x=>prefix+'gate-'+x),acceptanceCriteria:criteria,evidenceRefs:evidence});
 };
 make('source-integrity','Verify canonical source digest and project identity','source','authority',ref);
 make('full-reconciliation','Verify full original scope and recover all existing work','source','authority','Reconcile this original document, supplements, implementation artifacts, prior task claims and protected assets without replacing verified work.',['source-integrity']);
 const auditItems=[];
 for(const [j,s] of included.entries()){
  const cat=category(s.heading);
  const key='section-'+String(j+1).padStart(3,'0')+'-'+digest(s.heading).slice(0,8);
  make(key,'Reconcile and implement '+s.heading,'build',cat,'Original section '+s.heading+' (source line '+s.line+'):\n'+s.body,['full-reconciliation']);
  auditItems.push({heading:s.heading,line:s.line,sectionUnit:prefix+key,bodyHash:digest(s.body)});
  if(['brain','agent','product','service','integration','security'].includes(cat)){
   const parts=atoms(s.body);
   requireState(parts.length<=400,'Excessive unbounded source items in '+id+': '+s.heading);
   for(const [i,v] of parts.entries())make(key+'-item-'+String(i+1).padStart(3,'0'),'Implement: '+v,'build',cat,'Verbatim source item under '+s.heading+': '+v,[key]);
  }
 }
 const conformanceParts=conformance?sourceSections(conformance).filter(x=>x.level!==1):[];
 for(const [i,s] of conformanceParts.entries()){
  const key='conformance-'+String(i+1).padStart(3,'0');
  make(key,'Verify supplementary '+s.heading,'verification','verification','Original conformance source section '+s.heading+':\n'+s.body,['full-reconciliation']);
 }
 const gates=['external','financial','publication','regulated'];
 const gateRecords=gates.map(name=>({id:prefix+'gate-'+name,satisfied:false,evidenceRefs:[]}));
 for(const name of gates)make('protected-'+name,'Protected owner decision: '+name,'protected','protected','Explicit owner authorization and operational evidence required. Never infer authorization from Active Build status.',['full-reconciliation'],[name]);
 requireState(units.length>30,'Insufficient executable coverage '+id);
 const roadmap={projectId:identity.projectId,version:2,workUnits:units,gates:gateRecords};
 validateRoadmap(roadmap);
 const brain=sourceParts.find(x=>/brain/i.test(x.heading));
 const agent=sourceParts.find(x=>/agent/i.test(x.heading));
 const capabilities=[...new Set([...atoms(brain.body),...atoms(agent.body)])].slice(0,100);
 return {identity,projectId:identity.projectId,companyId:identity.companyId,sourcePath,sourceSha256:digest(source),sourceRef:ref,conformanceRef:supplementalRef??null,
  graph:roadmap,brain:{specialistId:'brn_company-future-'+id,brainKey:'brain:company:future:'+id+':v1',
   sourceSection:brain.heading,sourceText:brain.body,agentSection:agent.heading,agentText:agent.body,
   capabilities,enabled:false,health:'unavailable',verificationState:'experimental'},
  coverage:{sourceSectionCount:included.length,supplementalSections:conformanceParts.length,
   atomicRequirementCount:units.length,sections:auditItems,denominatorTrusted:false},status:'SOURCE_COMPILED_NOT_RUNTIME_VERIFIED'};
}
export async function compilePortfolio(){
 const filenames=(await readdir(companyDir)).filter(x=>/^\d{3}_[A-Z0-9_]+\.md$/.test(x)).sort();
 requireState(filenames.length===117,'Exactly 117 canonical company documents required');
 const companies=[];
 for(const filename of filenames){
  const n=Number(filename.slice(0,3)),id=filename.slice(0,3),src=await readFile(new URL(filename,companyDir),'utf8');
  requireState(n===companies.length+1,'Missing or duplicate canonical company: '+id);
  if(n>=108){
   sectionsIdentity(n,src);
   const folder=(n<=112?'five-company-import-2026-11-03/':'additional-five-company-import-2026-11-03/')+'companies/'+filename.replace(/\.md$/,'').toLowerCase()+'/SPECIALIZED_BRAIN.md';
   const brainDoc=await readFile(new URL('roadmap/portfolio-future-architecture/'+folder,root),'utf8');
   requireState(brainDoc.length>500&&/brain/i.test(brainDoc),'Missing native specialized Brain '+id);
   companies.push({projectId:'project:company:future:'+id,companyId:'company:future:'+id,
     sourcePath:'roadmap/portfolio-future-architecture/companies/'+filename,sourceSha256:digest(src),
     specialistSource:'roadmap/portfolio-future-architecture/'+folder,mode:'PRESERVE_NATIVE_DAG'});
   continue;
  }
  const supp=n<=100?'roadmap/portfolio-future-architecture/companies/conformance/'+filename.replace(/\.md$/,'_CURRENT_STANDARD.md'):'';
  const body=supp?await readFile(new URL(supp,root),'utf8'):'';
  companies.push({...compileCompanySource(n,filename,src,body,supp),mode:'SOURCE_COMPILE_ONLY'});
 }
 requireState(companies.length===117&&new Set(companies.map(x=>x.projectId)).size===117,'Portfolio identity collision');
 return {schemaVersion:1,scope:'COMMAND_CENTER_117_COMPANY_INTEGRATION',sourceCount:117,
  compiled:companies.filter(x=>x.mode==='SOURCE_COMPILE_ONLY').length,
  preservedNative:companies.filter(x=>x.mode==='PRESERVE_NATIVE_DAG').length,
  operationalVerified:false,denominatorCertified:false,companies};
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
 const result=await compilePortfolio();
 const summary={sourceCount:result.sourceCount,compiled:result.compiled,preservedNative:result.preservedNative,
  workUnits:result.companies.reduce((sum,c)=>sum+(c.graph?.workUnits.length??0),0),
  operationalVerified:false,denominatorCertified:false};
 console.log(JSON.stringify(summary));
}
