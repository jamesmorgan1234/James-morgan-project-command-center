import {reviewedAuthorityKernelMappings} from './p15-1-reviewed-authority-kernel-mappings.mjs';
import {reviewedCategory12ReconciliationMappings} from './category12-c1-c2-ledger-reconciliation.mjs';
import {reviewedCategory3SemanticMappings} from './p15-1-reviewed-category3-semantic-mappings.mjs';
import {reviewedSection2AuthoritySourceMappings} from './p15-1-reviewed-section2-authority-source-mappings.mjs';
import {reviewedAuthShellMappings} from './p15-1-reviewed-auth-shell-mappings.mjs';
import {reviewedAuthSessionMappings} from './p15-1-reviewed-auth-session-mappings.mjs';
import {reviewedStartupRecoveryMappings} from './p15-1-reviewed-startup-recovery-mappings.mjs';
import {reviewedDataFoundationMappings} from './p15-1-reviewed-data-foundation-mappings.mjs';
import {reviewedEntityRelationshipMappings} from './p15-1-reviewed-entity-relationship-mappings.mjs';
import {reviewedAssetContractMappings} from './p15-1-reviewed-asset-contract-mappings.mjs';
import {reviewedDesignSystemMappings} from './p15-1-reviewed-design-system-mappings.mjs';
import {reviewedDesignPerfPwaMappings} from './p15-1-reviewed-design-perf-pwa-mappings.mjs';
import {reviewedShellPerfDataMappings} from './p15-1-reviewed-shell-perf-data-mappings.mjs';
import {reviewedBrainExecutorMappings} from './p15-1-reviewed-brain-executor-mappings.mjs';
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
import {reviewedAutomationSecurityMappings} from './p15-1-reviewed-automation-security-mappings.mjs';
import {reviewedSecurityDiagnosticsMappings} from './p15-1-reviewed-security-diagnostics-mappings.mjs';
import {reviewedRecoveryTestCoverageMappings} from './p15-1-reviewed-recovery-test-coverage-mappings.mjs';
import {reviewedFailureAcceptanceMappings} from './p15-1-reviewed-failure-acceptance-mappings.mjs';
import {reviewedReleaseProviderInvarianceMappings} from './p15-1-reviewed-release-provider-invariance-mappings.mjs';
import {reviewedWorkBatch1ExistingProofMappings} from './p15-1-reviewed-work-batch1-existing-proof-mappings.mjs';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {resolveA00Traceability} from './p15-1-a00-traceability-lib.mjs';
import {reviewedSecurityMappings} from './p15-1-reviewed-security-mappings.mjs';
import {reviewedSocialP10Mappings} from './p15-1-reviewed-social-p10-mappings.mjs';
import {reviewedSocialP11BooksMappings} from './p15-1-reviewed-social-p11-books-mappings.mjs';
import {reviewedSpecialistP12Mappings} from './p15-1-reviewed-specialist-p12-mappings.mjs';
import {reviewedRecoveryP14Mappings} from './p15-1-reviewed-recovery-p14-mappings.mjs';
import {reviewedAnalyticsP13Mappings} from './p15-1-reviewed-analytics-p13-mappings.mjs';
import {reviewedPresentationMappings} from './p15-1-reviewed-presentation-mappings.mjs';
import {reviewedKnowledgeObjectMappings} from './p15-1-reviewed-knowledge-object-mappings.mjs';
import {reviewedBrainTruthMappings} from './p15-1-reviewed-brain-truth-mappings.mjs';
import {reviewedComplianceRegistryMappings} from './p15-1-reviewed-compliance-registry-mappings.mjs';
import {reviewedRegistryDispatchMappings} from './p15-1-reviewed-registry-dispatch-mappings.mjs';
import {reviewedHomeDashboardMappings} from './p15-1-reviewed-home-dashboard-mappings.mjs';
import {reviewedRecommendationImpactMappings} from './p15-1-reviewed-recommendation-impact-mappings.mjs';
import {reviewedRunCoordinationMappings} from './p15-1-reviewed-run-coordination-mappings.mjs';
import {reviewedFailurePolicyMappings} from './p15-1-reviewed-failure-policy-mappings.mjs';
import {reviewedTaskContractMappings} from './p15-1-reviewed-task-contract-mappings.mjs';
import {reviewedBlockedStatusMappings} from './p15-1-reviewed-blocked-status-mappings.mjs';
import {reviewedCutoverMappings} from './p15-1-reviewed-cutover-mappings.mjs';
import {reviewedReleaseIdentityMappings} from './p15-1-reviewed-release-identity-mappings.mjs';
import {reviewedDataSensitivityMappings} from './p15-1-reviewed-data-sensitivity-mappings.mjs';
import {reviewedFinalAcceptanceMappings} from './p15-1-reviewed-final-acceptance-mappings.mjs';
import {reviewedDataRightsMappings} from './p15-1-reviewed-data-rights-mappings.mjs';
import {reviewedLeakPreventionMappings} from './p15-1-reviewed-leak-prevention-mappings.mjs';
import {reviewedModuleHygieneMappings} from './p15-1-reviewed-module-hygiene-mappings.mjs';
import {reviewedStandardsMappings} from './p15-1-reviewed-standards-mappings.mjs';
import {reviewedErrorTaxonomyMappings} from './p15-1-reviewed-error-taxonomy-mappings.mjs';
import {reviewedReuseBatchOneMappings} from './p15-1-reviewed-reuse-batch-one-mappings.mjs';
import {reviewedReuseBatchTwoMappings} from './p15-1-reviewed-reuse-batch-two-mappings.mjs';
import {reviewedReuseBatchThreeMappings} from './p15-1-reviewed-reuse-batch-three-mappings.mjs';
import {reviewedTypeContractMappings} from './p15-1-reviewed-type-contracts-mappings.mjs';
import {reviewedTaxonomyMappings} from './p15-1-reviewed-taxonomies-mappings.mjs';
import {reviewedStartupMappings} from './p15-1-reviewed-startup-mappings.mjs';
import {reviewedNavigationMappings} from './p15-1-reviewed-navigation-mappings.mjs';
import {reviewedDecisionMappings} from './p15-1-reviewed-decisions-mappings.mjs';
import {reviewedRelationshipMappings} from './p15-1-reviewed-relationships-mappings.mjs';
import {reviewedIntegrityMappings} from './p15-1-reviewed-integrity-mappings.mjs';
import {reviewedDesignTokenMappings} from './p15-1-reviewed-design-token-mappings.mjs';
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
  ...reviewedSocialP10Mappings(),
  ...reviewedSocialP11BooksMappings(),
  ...reviewedSpecialistP12Mappings(),
  ...reviewedRecoveryP14Mappings(),
  ...reviewedAnalyticsP13Mappings(),
  ...reviewedPresentationMappings(),
  ...reviewedKnowledgeObjectMappings(),
  ...reviewedBrainTruthMappings(),
  ...reviewedComplianceRegistryMappings(),
  ...reviewedRegistryDispatchMappings(),
  ...reviewedHomeDashboardMappings(),
  ...reviewedRecommendationImpactMappings(),
  ...reviewedRunCoordinationMappings(),
  ...reviewedFailurePolicyMappings(),
  ...reviewedTaskContractMappings(),
  ...reviewedBlockedStatusMappings(),
  ...reviewedCutoverMappings(),
  ...reviewedReleaseIdentityMappings(),
  ...reviewedDataSensitivityMappings(),
  ...reviewedFinalAcceptanceMappings(),
  ...reviewedDataRightsMappings(),
  ...reviewedLeakPreventionMappings(),
  ...reviewedModuleHygieneMappings(),
  ...reviewedStandardsMappings(),
  ...reviewedErrorTaxonomyMappings(),
  ...reviewedReuseBatchOneMappings(),
  ...reviewedReuseBatchTwoMappings(),
  ...reviewedReuseBatchThreeMappings(),
  ...reviewedTypeContractMappings(),
  ...reviewedTaxonomyMappings(),
  ...reviewedStartupMappings(),
  ...reviewedNavigationMappings(),
  ...reviewedDecisionMappings(),
  ...reviewedRelationshipMappings(),
  ...reviewedIntegrityMappings(),
  ...reviewedDesignTokenMappings(),
  ...reviewedCategory12ReconciliationMappings(),
  ...reviewedCategory3SemanticMappings(),
  ...reviewedSection2AuthoritySourceMappings(),
  ...reviewedAuthShellMappings(),
  ...reviewedAuthSessionMappings(),
  ...reviewedStartupRecoveryMappings(),
  ...reviewedDataFoundationMappings(),
  ...reviewedEntityRelationshipMappings(),
  ...reviewedAssetContractMappings(),
  ...reviewedDesignSystemMappings(),
  ...reviewedDesignPerfPwaMappings(),
  ...reviewedShellPerfDataMappings(),
  ...reviewedBrainExecutorMappings(),
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
  ...reviewedProviderContractMappings(),
  ...reviewedAutomationSecurityMappings(),
  ...reviewedSecurityDiagnosticsMappings(),
  ...reviewedRecoveryTestCoverageMappings(),
  ...reviewedFailureAcceptanceMappings(),
  ...reviewedReleaseProviderInvarianceMappings(),
  ...reviewedWorkBatch1ExistingProofMappings(),
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

// P15.1 integration trigger: preserve the transferred P1-P14 14/14 verified baseline and re-materialize existing reviewed evidence through the guarded canonical assembler; no phase rebuild or semantic reinterpretation.
