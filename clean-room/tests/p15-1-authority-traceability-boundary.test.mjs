import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as authority from '../scripts/p15-1-current-architecture-authority.mjs';
const assertCurrentArchitectureAuthority=(...args)=>authority.assertCurrentArchitectureAuthority(...args);
const read=name=>JSON.parse(readFileSync(new URL('../../roadmap/master-build-plan-owner-review/'+name,import.meta.url),'utf8'));
const manifest=read('23_CURRENT_199_PHASE_MACHINE_MANIFEST.json');
const overlay=read('25_CURRENT_REQUIREMENT_CLASSIFICATION_OVERRIDES.json');
test('P15.1 single architecture authority accepts the current integrated roadmap and preserves historical classification',()=>{
 assert.equal(assertCurrentArchitectureAuthority(manifest,overlay),manifest.sourceRoadmap);
 assert.equal(overlay.overrides[0].historicalArchitectureBranch,'A06');
 assert.equal(overlay.overrides[0].effectiveArchitectureBranch,'A00');
});
test('P15.1 competing historical missing or owner-mismatched architecture authorities fail closed',()=>{
 for(const mutate of [m=>m.sourceRoadmap=m.historicalBaseline,m=>delete m.sourceRoadmap,m=>m.owner='ARO',m=>m.status='HISTORICAL_EVIDENCE_ONLY']){
  const copy=structuredClone(manifest);mutate(copy);assert.throws(()=>assertCurrentArchitectureAuthority(copy,overlay),/architecture authority/i);
 }
 for(const mutate of [o=>o.currentAuthority.roadmap=manifest.historicalBaseline,o=>o.currentAuthority.manifest='other.json',o=>o.rules.historicalSourceIsImmutable=false]){
  const copy=structuredClone(overlay);mutate(copy);assert.throws(()=>assertCurrentArchitectureAuthority(manifest,copy),/architecture authority/i);
 }
});

test('P15.1 live authority audit rejects an intact current roadmap with a competing source declaration',async()=>{
 const {mkdtempSync,mkdirSync,copyFileSync,writeFileSync,rmSync}=await import('node:fs');
 const {fileURLToPath}=await import('node:url');const {resolve,dirname}=await import('node:path');
 const {spawnSync}=await import('node:child_process');
 const root=fileURLToPath(new URL('../..',import.meta.url));
 const temporary=mkdtempSync(resolve(root,'.p15-authority-test-'));
 const paths=[
  'roadmap/master-build-plan-owner-review/23_CURRENT_199_PHASE_MACHINE_MANIFEST.json',
  'roadmap/master-build-plan-owner-review/24_AMENDMENT20_REQUIREMENT_OWNERSHIP.json',
  'roadmap/master-build-plan-owner-review/25_CURRENT_REQUIREMENT_CLASSIFICATION_OVERRIDES.json',
  'clean-room/evidence/P15_1_RECOVERED_ORIGINAL_LEDGER_AUTHORITY.json',
  'roadmap/master-build-plan-owner-review/22_COMPLETE_199_PHASE_CURRENT_MASTER_ROADMAP_AUDIT_CANDIDATE.md',
  'roadmap/master-build-plan-owner-review/14_COMPLETE_188_PHASE_MASTER_BUILD_PLAN.md',
  'roadmap/master-build-plan-owner-review/20_ECOSYSTEM_INTELLIGENCE_CONTINUOUS_LEARNING_ARCHITECTURE_AMENDMENT.md',
  'roadmap/portfolio-future-architecture/124_CURRENT_AUTHORITY_AND_RESUME_POINTER.md',
  'roadmap/portfolio-future-architecture/126_34_FAMILY_POST_AUDIT_COVERAGE_CROSSWALK.md'];
 try{
  for(const path of paths){mkdirSync(dirname(resolve(temporary,path)),{recursive:true});copyFileSync(resolve(root,path),resolve(temporary,path));}
  const copy=structuredClone(manifest);copy.sourceRoadmap=manifest.historicalBaseline;
  writeFileSync(resolve(temporary,paths[0]),JSON.stringify(copy));
  const result=spawnSync(process.execPath,[resolve(root,'clean-room/scripts/current-authority-audit.mjs')],{cwd:resolve(temporary,'clean-room'),encoding:'utf8'});
  assert.equal(result.status,1,result.stdout+result.stderr);
  assert.equal(JSON.parse(result.stdout).ok,false);
 }finally{rmSync(temporary,{recursive:true,force:true});}
});

test('P15.1 requirement roadmap implementation test acceptance chain rejects each missing closure link',async()=>{
 const {validateRequirementClosure}=await import('../dist/kernel/index.js');
 const row={requirementId:'CCR-00003',authoritativeSource:'owner:F-0003',capabilityKey:'requirements',owningPhase:'P15.1',dependencyIds:['C0'],implementationRefs:['kernel:evidence'],positiveTestRefs:['test:positive'],negativeTestRefs:['test:negative'],failureTestRefs:['test:failure'],evidenceIds:['evd_chain-proof'],truthState:'verified'};
 assert.equal(validateRequirementClosure(row).requirementId,'CCR-00003');
 for(const field of ['authoritativeSource','owningPhase'])assert.throws(()=>validateRequirementClosure({...row,[field]:''}),/required/);
 for(const field of ['implementationRefs','positiveTestRefs','negativeTestRefs','failureTestRefs','evidenceIds'])assert.throws(()=>validateRequirementClosure({...row,[field]:[]}),/Verified requirement requires/);
 assert.equal(validateRequirementClosure({...row,truthState:'implemented_unverified',evidenceIds:[]}).truthState,'implemented_unverified');
});
