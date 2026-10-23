export interface BookQaRequirement {
  readonly key: string;
  readonly required: boolean;
}

export interface BookQaEvidence {
  readonly requirementKey: string;
  readonly passed: boolean;
  readonly evidenceRefs: readonly string[];
}

export interface BookSubtypeProfile {
  readonly key: string;
  readonly requirements: readonly BookQaRequirement[];
}

export function evaluateBookQa(profile: BookSubtypeProfile, evidence: readonly BookQaEvidence[]): Readonly<{ pass: boolean; missing: readonly string[]; failed: readonly string[] }> {
  const byKey = new Map(evidence.map((item) => [item.requirementKey, item]));
  const missing: string[] = [];
  const failed: string[] = [];
  for (const requirement of profile.requirements) {
    if (!requirement.required) continue;
    const item = byKey.get(requirement.key);
    if (!item || item.evidenceRefs.length === 0) missing.push(requirement.key);
    else if (!item.passed) failed.push(requirement.key);
  }
  return Object.freeze({ pass: missing.length === 0 && failed.length === 0, missing: Object.freeze(missing), failed: Object.freeze(failed) });
}
