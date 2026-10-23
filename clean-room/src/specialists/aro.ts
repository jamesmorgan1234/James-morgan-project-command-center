import type { SpecialistProjectProfile } from "./contracts.js";
import { SPECIALIST_ARCHETYPES } from "./archetypes.js";

export const ARO_PROFILE: SpecialistProjectProfile = Object.freeze({
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
  finalRevenueState: "BANKED" as const,
  northStarMetric: "ACTUAL_NET_DOLLARS_BANKED_PER_TOTAL_SYSTEM_RESOURCE_HOUR" as const,
  currentSoftwareBuildState: "PHASES_0_THROUGH_34_COMPLETE" as const,
  currentRegressionEvidence: "333/333" as const,
  realProductionProofState: "FIRST_REAL_BANKED_DOLLAR_NOT_YET_VERIFIED" as const
});

export function assertAroOpportunityEligible(input: { real: boolean; open: boolean; aiAllowed: boolean; economicallyWorthwhile: boolean; executable: boolean; payable: boolean }): void {
  if (!input.real || !input.open || !input.aiAllowed || !input.economicallyWorthwhile || !input.executable || !input.payable) throw new Error("ARO opportunity is not fully eligible");
}
