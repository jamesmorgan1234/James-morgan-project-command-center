import {readFileSync,writeFileSync,readdirSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {resolveA00Traceability} from './p15-1-a00-traceability-lib.mjs';
import {authoritativeTraceabilityRows,fileDigest,verifyReference,validateTraceabilityRepositoryEvidence} from './p15-1-repository-evidence.mjs';
import {currentReviewedMappings} from './p15-1-current-reviewed-mappings.mjs';
import {resolveCurrentRequirementClassification} from './current-requirement-classification.mjs';
import {validateRequirementTraceability} from './category15-requirement-traceability-validation.mjs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..'),clean=resolve(root,'clean-room');
export function assembleCurrentTraceability({baselineAuditPath,qualificationPath}={}){
 const source=authoritativeTraceabilityRows(root),rows=source.requirements,byId=new Map(rows.map(r=>[r.id,r]));
 const a00=resolveA00Traceability(),rev3=JSON.parse(readFileSync(resolve(clean,'evidence/P15_1_REV3_REQUIREMENT_TRACEABILITY.json'),'utf8'));
 const selected=currentReviewedMappings(root);
 const target=resolve(clean,'evidence/category15-requirement-traceability.json');
 const previous=baselineAuditPath?null:JSON.parse(readFileSync(target,'utf8')).verification;
 const audit=baselineAuditPath?JSON.parse(readFileSync(baselineAuditPath,'utf8')):null;
 const qualification=qualificationPath?JSON.parse(readFileSync(qualificationPath,'utf8')):null;
 if(audit&&(!qualification||audit.headSha!==qualification.sourceCommit))throw Error('Baseline audit and independently observed exact-head CI must match');
 const baselineBindings=audit?Object.fromEntries(audit.files.map(f=>[f.path,f.sha256])):previous.fileBindings;
 const proof=previous??{scope:'ISOLATED_REPOSITORY_REQUALIFICATION',sourceCommit:qualification.sourceCommit,ci:qualification.ci,fileBindings:{}};
 const initialPaths=Object.keys(baselineBindings).filter(p=>/^clean-room\/(src|public|tests)\//.test(p)||p.startsWith('supabase/migrations/')||/^roadmap\/master-build-plan-owner-review\/(20_|22_|24_|25_)/.test(p));
 if(!previous)for(const path of initialPaths)proof.fileBindings[path]=baselineBindings[path];
 const overlay=JSON.parse(readFileSync(resolve(root,'roadmap/master-build-plan-owner-review/25_CURRENT_REQUIREMENT_CLASSIFICATION_OVERRIDES.json'),'utf8'));
 for(const row of rows.slice(0,5825)){const c=resolveCurrentRequirementClassification(row,overlay);if(c.classificationSource==='current-authority-overlay')row.currentClassification=c;}
 const notes=[];
 for(const input of selected){const corrections=input.sourceReferenceCorrections;const row=byId.get(input.id);if(!row)throw Error('Noncanonical override '+input.id);if(input.requirement!==undefined&&input.requirement!==row.requirement)throw Error('Canonical requirement mismatch '+input.id);
  const applicability=input.applicableCompaniesOrCapabilities??[...(input.applicableCompanies??[]),...(input.applicableCapabilities??[])];
  const tests=Object.fromEntries(['positive','negative','failurePath'].map(k=>[k,{applicable:input.tests[k].applicable,references:input.tests[k].references,justification:input.tests[k].justification??null}]));
  const refs=[...input.implementationLocations,...Object.values(tests).flatMap(v=>v.references)];
  try{for(const reference of refs){const path=verifyReference(root,reference,{bindings:baselineBindings,test:reference.startsWith('clean-room/tests/')});proof.fileBindings[path]=baselineBindings[path];}}
  catch(e){row.blocker='Existing fragment requires repair before current qualification: '+e.message;notes.push({id:row.id,error:e.message});continue;}
  Object.assign(row,{applicableCompaniesOrCapabilities:applicability,owningPhases:input.owningPhases,dependencies:input.dependencies,dependenciesVerified:input.dependenciesVerified,implementationLocations:input.implementationLocations,tests,evidence:[`gha:${proof.ci.runId}/job:${proof.ci.jobId}/source:${proof.sourceCommit}`,...input.evidence],evidenceVersion:`git:${proof.sourceCommit}; ci:${proof.ci.runId}`,evidenceEnvironment:'Isolated branch build/spec-lock-v2-clean-room; exact source-bound CI core QA; current repository inputs must match fileBindings',truthState:'VERIFIED',blocker:null,justification:null,sourceReferenceCorrections:corrections,closureNotes:input.closureNotes??'Existing categorized requirement proof requalified against unchanged current runtime/test inputs; no production/owner/device claim.'});
 }
 const output={...source,status:'P15_1_REQUIREMENT_CLOSURE',warning:'Complete canonical inventory, partial truthful closure. UNVERIFIED requirements are not complete and block P15.1.',verification:proof,assembly:{reusedA00Fragments:a00.traceabilityFragments,reusedRev3:'clean-room/evidence/P15_1_REV3_REQUIREMENT_TRACEABILITY.json',qualificationErrors:notes},requirements:rows};
 output.closureSummary=validateRequirementTraceability(output);output.repositoryEvidence=validateTraceabilityRepositoryEvidence(output,{repoRoot:root,sourceDocument:source});return output;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){const baseline=process.argv.find(a=>a.startsWith('--baseline-audit='));const qualification=process.argv.find(a=>a.startsWith('--qualification='));const d=assembleCurrentTraceability({baselineAuditPath:baseline?.slice('--baseline-audit='.length),qualificationPath:qualification?.slice('--qualification='.length)});if(process.argv.includes('--write'))writeFileSync(resolve(clean,'evidence/category15-requirement-traceability.json'),JSON.stringify(d)+'\n');console.log(JSON.stringify({status:d.status,...d.closureSummary,repositoryEvidenceValid:d.repositoryEvidence.valid,repositoryEvidenceErrors:d.repositoryEvidence.errors,qualificationErrors:d.assembly.qualificationErrors}));if(!d.repositoryEvidence.valid)process.exitCode=1;}
