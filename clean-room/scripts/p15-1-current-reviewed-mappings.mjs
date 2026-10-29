import {reviewedAuthorityKernelMappings} from './p15-1-reviewed-authority-kernel-mappings.mjs';
import {reviewedSection2AuthoritySourceMappings} from './p15-1-reviewed-section2-authority-source-mappings.mjs';
import {reviewedAuthShellMappings} from './p15-1-reviewed-auth-shell-mappings.mjs';
import {reviewedAuthSessionMappings} from './p15-1-reviewed-auth-session-mappings.mjs';
import {reviewedStartupRecoveryMappings} from './p15-1-reviewed-startup-recovery-mappings.mjs';
import {reviewedDataFoundationMappings} from './p15-1-reviewed-data-foundation-mappings.mjs';
import {reviewedEntityRelationshipMappings} from './p15-1-reviewed-entity-relationship-mappings.mjs';
import {reviewedAssetContractMappings} from './p15-1-reviewed-asset-contract-mappings.mjs';
import {reviewedDesignSystemMappings} from './p15-1-reviewed-design-system-mappings.mjs';
import {reviewedDeviceAdaptationMappings} from './p15-1-reviewed-device-adaptation-mappings.mjs';
import {reviewedPwaLifecycleMappings} from './p15-1-reviewed-pwa-lifecycle-mappings.mjs';
import {reviewedBrainContextMappings} from './p15-1-reviewed-brain-context-mappings.mjs';
import {reviewedRecommendationMappings} from './p15-1-reviewed-recommendation-mappings.mjs';
import {reviewedBrainMemoryRecommendationMappings} from './p15-1-reviewed-brain-memory-recommendation-mappings.mjs';
import {reviewedBrainTruthImpactMappings} from './p15-1-reviewed-brain-truth-impact-mappings.mjs';
import {reviewedBrainGapRecommendationMappings} from './p15-1-reviewed-brain-gap-recommendation-mappings.mjs';
import {reviewedBrainPlatformMapping} from './p15-1-reviewed-brain-platform-mapping.mjs';
import {reviewedBrainGovernanceMappings} from './p15-1-reviewed-brain-governance-mappings.mjs';
import {reviewedVoiceMappings} from './p15-1-reviewed-voice-mappings.mjs';
import {reviewedAgentExecutionMappings} from './p15-1-reviewed-agent-execution-mappings.mjs';
import {reviewedAgencyHardeningCoreMappings} from './p15-1-reviewed-agency-hardening-core-mappings.mjs';
import {reviewedAgencyLockClassificationMappings} from './p15-1-reviewed-agency-lock-classification-mappings.mjs';
import {reviewedAgencyTruthfulExecutionMappings} from './p15-1-reviewed-agency-truthful-execution-mappings.mjs';
import {reviewedAgencyRetryRecoveryMappings} from './p15-1-reviewed-agency-retry-recovery-mappings.mjs';
import {reviewedAgencyRunWorkLadderMappings} from './p15-1-reviewed-agency-run-work-ladder-mappings.mjs';
import {reviewedAgencyOwnerDeviceBlockerMappings} from './p15-1-reviewed-agency-owner-device-blocker-mappings.mjs';
import {reviewedAgencyControlProgressMappings} from './p15-1-reviewed-agency-control-progress-mappings.mjs';
import {reviewedWorkProjectContractMappings} from './p15-1-reviewed-work-project-contract-mappings.mjs';
import {reviewedProjectBooksFoundationMappings} from './p15-1-reviewed-project-books-foundation-mappings.mjs';
import {reviewedProviderContractMappings} from './p15-1-reviewed-provider-contract-mappings.mjs';
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
  ...reviewedAuthSessionMappings(),
  ...reviewedStartupRecoveryMappings(),
  ...reviewedDataFoundationMappings(),
  ...reviewedEntityRelationshipMappings(),
  ...reviewedAssetContractMappings(),
  ...reviewedDesignSystemMappings(),
  ...reviewedDeviceAdaptationMappings(),
  ...reviewedPwaLifecycleMappings(),
  ...reviewedBrainContextMappings(),
  ...reviewedRecommendationMappings(),
  ...reviewedBrainMemoryRecommendationMappings(),
  ...reviewedBrainTruthImpactMappings(),
  ...reviewedBrainGapRecommendationMappings(),
  ...reviewedBrainPlatformMapping(),
  ...reviewedBrainGovernanceMappings(),
  ...reviewedVoiceMappings(),
  ...reviewedAgentExecutionMappings(),
  ...reviewedAgencyHardeningCoreMappings(),
  ...reviewedAgencyLockClassificationMappings(),
  ...reviewedAgencyTruthfulExecutionMappings(),
  ...reviewedAgencyRetryRecoveryMappings(),
  ...reviewedAgencyRunWorkLadderMappings(),
  ...reviewedAgencyOwnerDeviceBlockerMappings(),
  ...reviewedAgencyControlProgressMappings(),
  ...reviewedWorkProjectContractMappings(),
  ...reviewedProjectBooksFoundationMappings(),
  ...reviewedProviderContractMappings()
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
