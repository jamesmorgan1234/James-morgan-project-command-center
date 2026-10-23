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

export function validateOnboardingManifest(manifest: OnboardingManifest): void {
  const ids = new Set(manifest.requirements.map((requirement) => requirement.id));
  if (ids.size !== manifest.requirements.length) throw new Error("Setup requirement IDs must be unique");
  for (const requirement of manifest.requirements) {
    if (!requirement.id.trim() || !requirement.title.trim() || requirement.unlockRefs.length === 0) throw new Error(`Setup requirement identity/title/unlock are required: ${requirement.id}`);
    for (const dependency of requirement.dependencyIds) if (!ids.has(dependency)) throw new Error(`Unknown setup dependency ${dependency}`);
  }
}

export function groupSetupByUnlockImpact(manifest: OnboardingManifest): readonly Readonly<{ unlockRef: string; requirementIds: readonly string[] }>[] {
  validateOnboardingManifest(manifest);
  const groups = new Map<string, string[]>();
  for (const requirement of manifest.requirements) for (const unlockRef of requirement.unlockRefs) groups.set(unlockRef, [...(groups.get(unlockRef) ?? []), requirement.id]);
  return Object.freeze([...groups.entries()].sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0])).map(([unlockRef, requirementIds]) => Object.freeze({ unlockRef, requirementIds: Object.freeze(requirementIds) })));
}
