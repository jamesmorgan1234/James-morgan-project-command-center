export type SetupKind = "account" | "provider" | "credential" | "domain" | "device" | "permission" | "legal";

export interface SetupRequirement {
  readonly id: string;
  readonly kind: SetupKind;
  readonly title: string;
  readonly dependencyIds: readonly string[];
  readonly unlockRefs: readonly string[];
  readonly requiredEnvironment: "pc" | "phone" | "local_browser" | "any_device";
  readonly ownerOnly: boolean;
  readonly knownAtSpecTime: boolean;
}

export interface OnboardingManifest {
  readonly projectId: string;
  readonly specVersion: number;
  readonly requirements: readonly SetupRequirement[];
}

export interface SetupBlockerView {
  readonly requirementId: string;
  readonly title: string;
  readonly kind: SetupKind;
  readonly requiredEnvironment: SetupRequirement["requiredEnvironment"];
  readonly ownerOnly: boolean;
  readonly unmetDependencyIds: readonly string[];
  readonly unlockRefs: readonly string[];
  readonly readyForOwnerAction: boolean;
}

function unique(values: readonly string[], label: string, requireOne = false): readonly string[] {
  if (requireOne && values.length === 0) throw new Error(`${label} requires at least one value`);
  const normalized = values.map((value) => value.trim());
  if (normalized.some((value) => !value) || new Set(normalized).size !== normalized.length) throw new Error(`${label} must be unique and nonblank`);
  return normalized;
}

export function validateOnboardingManifest(manifest: OnboardingManifest): void {
  if (!manifest.projectId.trim() || !Number.isSafeInteger(manifest.specVersion) || manifest.specVersion < 1) throw new Error("Onboarding project/spec version are required");
  const ids = new Set(manifest.requirements.map((requirement) => requirement.id));
  if (ids.size !== manifest.requirements.length) throw new Error("Setup requirement IDs must be unique");
  const byId = new Map(manifest.requirements.map((requirement) => [requirement.id, requirement] as const));
  for (const requirement of manifest.requirements) {
    if (!requirement.id.trim() || !requirement.title.trim()) throw new Error(`Setup requirement identity/title are required: ${requirement.id}`);
    unique(requirement.unlockRefs, "Setup unlock refs", true);
    unique(requirement.dependencyIds, "Setup dependency ids");
    for (const dependency of requirement.dependencyIds) if (!ids.has(dependency)) throw new Error(`Unknown setup dependency ${dependency}`);
    if (requirement.dependencyIds.includes(requirement.id)) throw new Error(`Setup requirement cannot depend on itself: ${requirement.id}`);
  }
  const visiting = new Set<string>(), visited = new Set<string>();
  const visit = (id: string): void => {
    if (visited.has(id)) return;
    if (visiting.has(id)) throw new Error(`Setup dependency cycle detected at ${id}`);
    visiting.add(id);
    for (const dependency of byId.get(id)?.dependencyIds ?? []) visit(dependency);
    visiting.delete(id); visited.add(id);
  };
  for (const id of ids) visit(id);
}

export function groupSetupByUnlockImpact(manifest: OnboardingManifest): readonly Readonly<{ unlockRef: string; requirementIds: readonly string[] }>[] {
  validateOnboardingManifest(manifest);
  const groups = new Map<string, string[]>();
  for (const requirement of manifest.requirements) for (const unlockRef of requirement.unlockRefs) groups.set(unlockRef, [...(groups.get(unlockRef) ?? []), requirement.id]);
  return Object.freeze([...groups.entries()].sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0])).map(([unlockRef, requirementIds]) => Object.freeze({ unlockRef, requirementIds: Object.freeze(requirementIds) })));
}

/** Returns every spec-time-known unmet prerequisite, including ones blocked behind other prerequisites. */
export function knownSetupBlockers(manifest: OnboardingManifest, completedRequirementIds: readonly string[]): readonly SetupBlockerView[] {
  validateOnboardingManifest(manifest);
  const completed = new Set(unique(completedRequirementIds, "Completed setup requirement ids"));
  const ids = new Set(manifest.requirements.map((requirement) => requirement.id));
  for (const id of completed) if (!ids.has(id)) throw new Error(`Completed setup requirement is not in manifest: ${id}`);
  return Object.freeze(manifest.requirements.filter((requirement) => requirement.knownAtSpecTime && !completed.has(requirement.id)).map((requirement) => {
    const unmet = requirement.dependencyIds.filter((dependency) => !completed.has(dependency));
    return Object.freeze({ requirementId: requirement.id, title: requirement.title, kind: requirement.kind, requiredEnvironment: requirement.requiredEnvironment, ownerOnly: requirement.ownerOnly, unmetDependencyIds: Object.freeze(unmet), unlockRefs: Object.freeze([...requirement.unlockRefs]), readyForOwnerAction: unmet.length === 0 });
  }).sort((a, b) => Number(b.readyForOwnerAction) - Number(a.readyForOwnerAction) || b.unlockRefs.length - a.unlockRefs.length || a.requirementId.localeCompare(b.requirementId)));
}
