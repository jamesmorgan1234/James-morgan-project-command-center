import {readFileSync,existsSync} from 'node:fs';
import {resolve,relative} from 'node:path';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {resolveCurrentRequirementClassification} from './current-requirement-classification.mjs';
import {currentReviewedMappings} from './p15-1-current-reviewed-mappings.mjs';
import {expandPhaseManifest} from './current-authority-lib.mjs';
export const fileDigest=bytes=>createHash('sha256').update(bytes).digest('hex');
export function traceabilityReference(ref){
 if(typeof ref!=='string')throw Error('Traceability reference must be text');
 const [location,testName]=ref.split(' :: '),[path,anchor]=location.split('#');
 if(!path||path.startsWith('/')||path.includes('\\')||path.split('/').some(p=>p==='..'||p==='.')||!/^clean-room\/|^supabase\/|^roadmap\//.test(path))throw Error('Unsafe traceability repository path');
 return {path,anchor:anchor?.split(/[\s(]/)[0]??null,testName:testName??null};
}
export function verifyReference(root,reference,{bindings,test=false}={}){
 const r=traceabilityReference(reference),path=resolve(root,r.path);
 if(relative(root,path).startsWith('..')||!existsSync(path))throw Error('Missing repository reference: '+r.path);
 const bytes=readFileSync(path),text=bytes.toString('utf8');
 if(bindings&&bindings[r.path]!==fileDigest(bytes))throw Error('Changed/unqualified evidence input: '+r.path);
 if(test&&(!/^clean-room\/tests\/[^/]+\.test\.mjs$/.test(r.path)||!/\btest\s*\(/.test(text)))throw Error('Test reference is not an executable suite in the mandatory full-test glob');
 if(r.testName&&!text.includes(r.testName))throw Error('Missing named test: '+reference);
 if(r.anchor){const tokens=r.anchor.split('.');if(!tokens.every(t=>text.includes(t)))throw Error('Missing implementation/test anchor: '+reference);}
 return r.path;
}
export function authoritativeTraceabilityRows(root){
 const clean=resolve(root,'clean-room');
 const p=spawnSync(process.execPath,['scripts/category15-build-requirement-traceability.mjs','--emit-document'],{cwd:clean,encoding:'utf8',maxBuffer:32*1024*1024});
 if(p.status!==0)throw Error('Authoritative source decode failed: '+p.stderr);return JSON.parse(p.stdout);
}
export function validateTraceabilityRepositoryEvidence(document,{repoRoot,sourceDocument}={}){
 const errors=[],rowErrors=[];const fail=(id,message)=>{errors.push({id,message});rowErrors.push(id);};
 let source=sourceDocument;try{source??=authoritativeTraceabilityRows(repoRoot);}catch(e){return {valid:false,errors:[{id:'SOURCE',message:e.message}],invalidRowIds:[]};}
 const proof=document?.verification,bindings=proof?.fileBindings;
 const proofValid=proof?.scope==='ISOLATED_REPOSITORY_REQUALIFICATION'&&proof?.ci?.status==='completed'&&['success','failure'].includes(proof.ci.conclusion)&&proof.ci.coreQaConclusion==='success'&&/^[a-f0-9]{40}$/.test(proof?.sourceCommit??'')&&Number.isSafeInteger(proof?.ci?.runId)&&Number.isSafeInteger(proof?.ci?.jobId)&&Number.isSafeInteger(proof?.ci?.testPass)&&proof.ci.testPass>0&&proof?.ci?.testFail===0&&proof?.ci?.testSkipped===0&&bindings&&Object.keys(bindings).length>0;
 if(!proofValid)errors.push({id:'PROOF',message:'Source-bound current repository requalification proof required; overall CI failure must not be presented as global success'});
 if(proofValid)for(const [path,digest]of Object.entries(bindings)){try{verifyReference(repoRoot,path,{bindings});if(!/^[a-f0-9]{64}$/.test(digest))throw Error('Invalid digest');}catch(e){errors.push({id:'PROOF',message:e.message});}}
 const overlay=JSON.parse(readFileSync(resolve(repoRoot,'roadmap/master-build-plan-owner-review/25_CURRENT_REQUIREMENT_CLASSIFICATION_OVERRIDES.json'),'utf8'));
 const reviewed=new Map(currentReviewedMappings(repoRoot).map(r=>[r.id,r]));
 const phases=new Set(expandPhaseManifest(JSON.parse(readFileSync(resolve(repoRoot,'roadmap/master-build-plan-owner-review/23_CURRENT_199_PHASE_MACHINE_MANIFEST.json'),'utf8'))).phaseIds);
 for(const [index,row]of (document.requirements??[]).entries()){
  const expected=source.requirements[index];if(!expected||row.id!==expected.id||row.requirement!==expected.requirement||row.sourceVersion!==expected.sourceVersion||row.authoritativeSource!==expected.authoritativeSource){fail(row?.id??'UNKNOWN','Canonical requirement/source identity mismatch');continue;}
  if(index<5825){const current=resolveCurrentRequirementClassification(expected,overlay);const expectedClassification=current.classificationSource==='current-authority-overlay'?current:undefined;if(JSON.stringify(row.currentClassification)!==JSON.stringify(expectedClassification))fail(row.id,'Current authoritative classification mismatch');}
  for(const field of ['sourceIds','sourceFiles','sourceKinds','architectureBranch','architectureOwner','classification','activationPrerequisites'])if(JSON.stringify(row[field])!==JSON.stringify(expected[field]))fail(row.id,'Canonical source metadata mismatch: '+field);
  if(row.truthState==='UNVERIFIED')continue;
  if(!proofValid){fail(row.id,'Verified/N/A row has no valid requalification proof');continue;}
  const mapping=reviewed.get(row.id);
  if(!mapping){fail(row.id,'No individually reviewed semantic mapping; arbitrary proof copying is forbidden');continue;}
  for(const key of ['owningPhases','dependencies','implementationLocations'])if(JSON.stringify(row[key])!==JSON.stringify(mapping[key]))fail(row.id,'Reviewed semantic mapping mismatch: '+key);
  for(const dimension of ['positive','negative','failurePath'])if(JSON.stringify(row.tests?.[dimension]?.references)!==JSON.stringify(mapping.tests?.[dimension]?.references))fail(row.id,'Reviewed test dimension mismatch: '+dimension);

  if(row.owningPhases.some(p=>!phases.has(p)))fail(row.id,'Unknown owning phase');
  for(const ref of row.implementationLocations??[])try{verifyReference(repoRoot,ref,{bindings});}catch(e){fail(row.id,e.message);}
  for(const dimension of ['positive','negative','failurePath'])for(const ref of row.tests?.[dimension]?.references??[])try{verifyReference(repoRoot,ref,{bindings,test:true});}catch(e){fail(row.id,e.message);}
  if(!row.evidence?.some(e=>e===`gha:${proof.ci.runId}/job:${proof.ci.jobId}/source:${proof.sourceCommit}`))fail(row.id,'Row is not bound to actual requalification run');
  if(row.evidenceVersion!==`git:${proof.sourceCommit}; ci:${proof.ci.runId}`)fail(row.id,'Row evidence version is not requalified');
  if(row.truthState==='NOT_APPLICABLE'&&!row.nonApplicabilityAuthority)fail(row.id,'N/A needs explicit authoritative exclusion, not generic prose');
 }
 return {valid:errors.length===0,errors,invalidRowIds:[...new Set(rowErrors)]};
}
