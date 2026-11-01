import type { SpecialistProjectProfile } from "./contracts.js";
export declare const ARO_PROFILE: SpecialistProjectProfile;
export declare const ARO_GOVERNING_INVARIANTS: Readonly<{
    privateSingleOwner: true;
    publicSaasFeaturesAllowed: false;
    freeFirst: true;
    aiAssistanceRequiredForPrimaryModel: true;
    finalRevenueState: "BANKED";
    northStarMetric: "ACTUAL_NET_DOLLARS_BANKED_PER_TOTAL_SYSTEM_RESOURCE_HOUR";
    currentSoftwareBuildState: "PHASES_0_THROUGH_34_COMPLETE";
    currentRegressionEvidence: "333/333";
    realProductionProofState: "FIRST_REAL_BANKED_DOLLAR_NOT_YET_VERIFIED";
}>;
export declare function assertAroOpportunityEligible(input: {
    real: boolean;
    open: boolean;
    aiAllowed: boolean;
    economicallyWorthwhile: boolean;
    executable: boolean;
    payable: boolean;
}): void;
