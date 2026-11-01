/**
 * Cutover discipline.
 *
 * A full replacement built off production, cut over all at once, from a staging
 * environment that matches production, with locked release order, a checklist,
 * a dry run, a smoke test, a change freeze and a protected production branch.
 */

export interface CutoverOrder {
  readonly frontend: number;
  readonly serviceWorker: number;
  readonly featureFlags: number;
  readonly validation: number;
}

export interface CutoverPlan {
  readonly fullReplacement: boolean;
  readonly partialCutover: boolean;
  readonly stagingMatchesProduction: boolean;
  readonly productionDataReadOnlyInStaging: boolean;
  readonly syntheticFixtures: boolean;
  readonly checklist: readonly string[];
  readonly dryRunCompleted: boolean;
  readonly expectedDurationMinutes: number;
  readonly order: CutoverOrder;
  readonly smokeTest: readonly string[];
  readonly featureExpansionAllowed: boolean;
  readonly changeFreeze: boolean;
  readonly productionBranchProtected: boolean;
}

export function validateCutoverPlan(plan: CutoverPlan): CutoverPlan {
  if (!plan.fullReplacement) throw new Error("Cutover must ship a full replacement developed off production");
  if (plan.partialCutover) throw new Error("Partial cutover is not permitted");
  if (!plan.stagingMatchesProduction) throw new Error("Staging must match the production architecture");
  if (!plan.productionDataReadOnlyInStaging) throw new Error("Production data in staging must be read-only unless isolated and tested");
  if (!plan.syntheticFixtures) throw new Error("Staging requires synthetic test fixtures");
  if (plan.checklist.length === 0) throw new Error("Cutover requires a checklist");
  if (!plan.dryRunCompleted) throw new Error("Cutover requires a completed dry run");
  if (!Number.isSafeInteger(plan.expectedDurationMinutes) || plan.expectedDurationMinutes < 1) throw new Error("Cutover duration expectation must be documented");
  if (!(plan.order.frontend < plan.order.serviceWorker)) throw new Error("Frontend release must precede the service-worker release");
  if (!(plan.order.serviceWorker < plan.order.featureFlags)) throw new Error("Service-worker release must precede feature-flag activation");
  if (!(plan.order.featureFlags < plan.order.validation)) throw new Error("Feature-flag activation must precede post-cutover validation");
  if (plan.smokeTest.length === 0) throw new Error("Cutover requires a critical-path smoke test");
  if (plan.featureExpansionAllowed) throw new Error("Feature expansion is not permitted during the cutover window");
  if (!plan.changeFreeze) throw new Error("Unrelated changes must be frozen during the cutover window");
  if (!plan.productionBranchProtected) throw new Error("The production branch must be protected");
  return Object.freeze({
    ...plan,
    checklist: Object.freeze([...plan.checklist]),
    smokeTest: Object.freeze([...plan.smokeTest]),
    order: Object.freeze({ ...plan.order })
  });
}

export function assertDependenciesFresh(verifiedAt: string, cutoverAt: string, maximumAgeMinutes = 60): void {
  const verified = Date.parse(verifiedAt);
  const cutover = Date.parse(cutoverAt);
  if (Number.isNaN(verified) || Number.isNaN(cutover)) throw new Error("Cutover dependency timestamps must be valid");
  const ageMinutes = (cutover - verified) / 60000;
  if (ageMinutes < 0) throw new Error("Cutover dependencies cannot be verified after cutover");
  if (ageMinutes > maximumAgeMinutes) throw new Error("Cutover dependencies were not verified immediately beforehand");
}
