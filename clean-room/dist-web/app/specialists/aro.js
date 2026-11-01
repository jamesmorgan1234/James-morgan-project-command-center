import { SPECIALIST_ARCHETYPES } from "./archetypes.js";
export const ARO_PROFILE = Object.freeze({
    projectId: "aro",
    typeKey: "revenue_operation",
    displayName: "ARO — Autonomous Revenue Organization",
    contract: SPECIALIST_ARCHETYPES.revenue_operation,
    sourceRefs: Object.freeze(["library:Pasted text(2).txt", "owner:new-project-2026-10-23"]),
    active: true
});
export const ARO_GOVERNING_INVARIANTS = Object.freeze({
    privateSingleOwner: true,
    publicSaasFeaturesAllowed: false,
    freeFirst: true,
    aiAssistanceRequiredForPrimaryModel: true,
    finalRevenueState: "BANKED",
    northStarMetric: "ACTUAL_NET_DOLLARS_BANKED_PER_TOTAL_SYSTEM_RESOURCE_HOUR",
    currentSoftwareBuildState: "PHASES_0_THROUGH_34_COMPLETE",
    currentRegressionEvidence: "333/333",
    realProductionProofState: "FIRST_REAL_BANKED_DOLLAR_NOT_YET_VERIFIED"
});
export function assertAroOpportunityEligible(input) {
    if (!input.real || !input.open || !input.aiAllowed || !input.economicallyWorthwhile || !input.executable || !input.payable)
        throw new Error("ARO opportunity is not fully eligible");
}
//# sourceMappingURL=aro.js.map