import {reviewedAuthorityKernelMappings} from './p15-1-reviewed-authority-kernel-mappings.mjs';
import {reviewedSection2AuthoritySourceMappings} from './p15-1-reviewed-section2-authority-source-mappings.mjs';
import {reviewedAuthShellMappings} from './p15-1-reviewed-auth-shell-mappings.mjs';
import {reviewedAuthSessionMappings} from './p15-1-reviewed-auth-session-mappings.mjs';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {resolveA00Traceability} from './p15-1-a00-traceability-lib.mjs';
import {reviewedSecurityMappings} from './p15-1-reviewed-security-mappings.mjs';
import {reviewedRecoveryMappings} from './p15-1-reviewed-recovery-mappings.mjs';

/** Reuses existing reviewed owners. No keyword/file-similarity promotion is allowed. */
export function currentReviewedMappings(root){
 const a00=resolveA00Traceability(),rev3=JSON.parse(readFileSync(resolve(root,'clean-room/evidence/P15_1_REV3_REQUIREMENT_TRACEABILITY.json'),'utf8'));
 const selected=[
  ...Object.entries(a00.effectiveRowModel.rowOverrides).map(([id,r])=>({id,...r})),
  ...rev3.requirements,
  ...reviewedRecoveryMappings(),
  ...reviewedSecurityMappings(),
  ...reviewedAuthorityKernelMappings(),
  ...reviewedSection2AuthoritySourceMappings(),
  ...reviewedAuthShellMappings(),
  ...reviewedAuthSessionMappings()
 ];
 const seen=new Set();
 return selected.map(original=>{
  if(seen.has(original.id))throw Error('Reviewed mapping collision '+original.id);
  seen.add(original.id);
  const input=structuredClone(original),corrections=[];
  if(input.id==='CCR-05119'){
   input.implementationLocations=input.implementationLocations.map(r=>r.replace('#CompensatingTransaction.add','#CompensatingTransaction.constructor'));
   corrections.push('The current transaction defines its immutable step list in the constructor, not a nonexistent add method.');
  }
  if(input.id==='CCR-05124'){
   input.implementationLocations=input.implementationLocations.map(r=>r.replace('#evaluateCompatibility','#validateRuntimeConfig'));
   input.implementationLocations=[...new Set(input.implementationLocations)];
   corrections.push('Compatibility windows are enforced by validateRuntimeConfig; evaluateCompatibility is not an exported current implementation.');
  }
  if(input.id==='CCR-05240'){
   input.tests.failurePath.references=input.tests.failurePath.references.map(r=>r.startsWith('clean-room/tests/category15-adversarial-acceptance.test.mjs')?'clean-room/tests/category1-governance-policy-broadening.test.mjs :: P1 protected policy cannot broaden silently through missing or mismatched authorization':r);
   corrections.push('Replaced a nonexistent historical test path with the current exact authorization-mismatch rejection test.');
  }
  return {...input,sourceReferenceCorrections:corrections};
 });
}
