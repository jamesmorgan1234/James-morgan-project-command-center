export type ProjectInheritanceKind = "capability" | "control" | "evaluation" | "method";
export type ProjectInheritanceApplicability = "applicable" | "not_applicable" | "unknown";
export type ProjectInheritanceValidation = "validated" | "unvalidated" | "stale" | "conflicting";

export interface ProjectInheritanceCandidate {
  readonly kind: ProjectInheritanceKind;
  readonly canonicalRef: string;
  readonly versionRef: string;
  readonly inherit: boolean;
  readonly applicability: ProjectInheritanceApplicability;
  readonly validation: ProjectInheritanceValidation;
  readonly applicabilityEvidenceRefs: readonly string[];
  readonly validationEvidenceRefs: readonly string[];
}

export interface ProjectInheritancePlan {
  readonly projectId: string;
  readonly projectTypeKey: string;
  readonly companyId?: string;
  readonly defaultInheritance: false;
  readonly candidates: readonly ProjectInheritanceCandidate[];
}

function required(value: string | undefined, label: string): string {
  const normalized = String(value ?? "").trim();
  if (!normalized) throw new Error(`${label} is required`);
  return normalized;
}

function assertRefs(values: readonly string[], label: string, requiredValues: boolean): void {
  if (!Array.isArray(values)) throw new Error(`${label} must be an array`);
  if (requiredValues && values.length === 0) throw new Error(`${label} is required`);
  if (values.some((value) => !String(value ?? "").trim())) throw new Error(`${label} entries cannot be blank`);
  if (new Set(values).size !== values.length) throw new Error(`${label} entries must be unique`);
}

export function validateProjectInheritancePlan(plan: ProjectInheritancePlan): void {
  required(plan.projectId, "Project inheritance projectId");
  if (!required(plan.projectTypeKey, "Project inheritance projectTypeKey").startsWith("project-type:")) throw new Error("Project inheritance projectTypeKey must be a project type key");
  if (plan.companyId !== undefined) required(plan.companyId, "Project inheritance companyId");
  if (plan.defaultInheritance !== false) throw new Error("Project inheritance cannot use blind global defaults");
  if (!Array.isArray(plan.candidates)) throw new Error("Project inheritance candidates must be an array");

  const seen = new Set<string>();
  for (const candidate of plan.candidates) {
    required(candidate.canonicalRef, "Project inheritance canonicalRef");
    required(candidate.versionRef, "Project inheritance versionRef");
    const key = `${candidate.kind}:${candidate.canonicalRef}:${candidate.versionRef}`;
    if (seen.has(key)) throw new Error(`Duplicate project inheritance candidate: ${key}`);
    seen.add(key);

    assertRefs(candidate.applicabilityEvidenceRefs, "Project inheritance applicability evidence", candidate.inherit);
    assertRefs(candidate.validationEvidenceRefs, "Project inheritance validation evidence", candidate.inherit);

    if (candidate.inherit && candidate.applicability !== "applicable") {
      throw new Error(`Inherited ${candidate.kind} must be explicitly applicable: ${candidate.canonicalRef}`);
    }
    if (candidate.inherit && candidate.validation !== "validated") {
      throw new Error(`Inherited ${candidate.kind} must be validated: ${candidate.canonicalRef}`);
    }
  }
}

export function assertProjectInheritanceTarget(
  plan: ProjectInheritancePlan,
  target: { readonly id: string; readonly typeKey: string; readonly companyId?: string }
): void {
  validateProjectInheritancePlan(plan);
  if (plan.projectId !== target.id) throw new Error("Project inheritance project identity mismatch");
  if (plan.projectTypeKey !== target.typeKey) throw new Error("Project inheritance project type mismatch");
  if ((plan.companyId ?? null) !== (target.companyId ?? null)) throw new Error("Project inheritance company scope mismatch");
}

export function inheritedProjectIntelligence(plan: ProjectInheritancePlan): readonly ProjectInheritanceCandidate[] {
  validateProjectInheritancePlan(plan);
  return Object.freeze(plan.candidates
    .filter((candidate) => candidate.inherit)
    .map((candidate) => Object.freeze({
      ...candidate,
      applicabilityEvidenceRefs: Object.freeze([...candidate.applicabilityEvidenceRefs]),
      validationEvidenceRefs: Object.freeze([...candidate.validationEvidenceRefs])
    })));
}
