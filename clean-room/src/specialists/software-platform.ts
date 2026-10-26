export type SoftwarePlatformDomain = "user" | "role" | "roadmap" | "repository" | "deployment" | "provider" | "analytics" | "support" | "monetization";

export interface SoftwarePlatformBinding {
  readonly id: string;
  readonly ownerId: string;
  readonly projectId: string;
  readonly companyId: string;
  readonly repositoryRef: string;
  readonly deploymentProviderRef: string;
  readonly analyticsProviderRefs: readonly string[];
  readonly supportProviderRefs: readonly string[];
  readonly sourceRefs: readonly string[];
}

export interface SoftwarePlatformState {
  readonly id: string;
  readonly ownerId: string;
  readonly projectId: string;
  readonly companyId: string;
  readonly domain: SoftwarePlatformDomain;
  readonly canonicalRef: string;
  readonly state: string;
  readonly providerRef?: string | undefined;
  readonly sourceRefs: readonly string[];
}

export interface SoftwareDeploymentEvidence {
  readonly id: string;
  readonly ownerId: string;
  readonly projectId: string;
  readonly companyId: string;
  readonly repositoryRef: string;
  readonly commitRef: string;
  readonly environmentRef: string;
  readonly deploymentProviderRef: string;
  readonly deploymentRef: string;
  readonly sourceRefs: readonly string[];
}

function refs(values: readonly string[], label: string, required = true): readonly string[] {
  if (!Array.isArray(values) || (required && values.length === 0) || values.some((value) => !value.trim())) throw new Error(`${label} required`);
  return Object.freeze([...new Set(values.map((value) => value.trim()))]);
}

export class SoftwarePlatformRegistry {
  readonly #bindings = new Map<string, SoftwarePlatformBinding>();
  readonly #repositories = new Map<string, string>();

  register(input: SoftwarePlatformBinding): SoftwarePlatformBinding {
    if (!input.id.trim() || !input.ownerId.trim() || !input.projectId.trim() || !input.companyId.trim() || !input.repositoryRef.trim() || !input.deploymentProviderRef.trim()) throw new Error("software-platform identity/company/repository/deployment provider required");
    const analyticsProviderRefs = refs(input.analyticsProviderRefs, "software-platform analytics providers", false);
    const supportProviderRefs = refs(input.supportProviderRefs, "software-platform support providers", false);
    const sourceRefs = refs(input.sourceRefs, "software-platform source refs");
    const key = `${input.ownerId}:${input.projectId}`;
    const prior = this.#bindings.get(key);
    if (prior && (prior.companyId !== input.companyId || prior.repositoryRef !== input.repositoryRef || prior.deploymentProviderRef !== input.deploymentProviderRef)) throw new Error("software-platform binding cannot be silently substituted");
    const repoOwner = this.#repositories.get(`${input.ownerId}:${input.repositoryRef}`);
    if (repoOwner && repoOwner !== input.projectId) throw new Error("software-platform repository is isolated to another project");
    const frozen = Object.freeze({ ...input, analyticsProviderRefs, supportProviderRefs, sourceRefs });
    this.#bindings.set(key, frozen);
    this.#repositories.set(`${input.ownerId}:${input.repositoryRef}`, input.projectId);
    return frozen;
  }

  require(ownerId: string, projectId: string): SoftwarePlatformBinding {
    const binding = this.#bindings.get(`${ownerId}:${projectId}`);
    if (!binding) throw new Error("unknown software-platform project");
    return binding;
  }
}

export function validateSoftwarePlatformState(input: SoftwarePlatformState, binding: SoftwarePlatformBinding): SoftwarePlatformState {
  if (input.ownerId !== binding.ownerId || input.projectId !== binding.projectId || input.companyId !== binding.companyId) throw new Error("software-platform state cannot cross company/project boundary");
  if (!input.id.trim() || !input.canonicalRef.trim() || !input.state.trim()) throw new Error("software-platform state identity/ref/state required");
  return Object.freeze({ ...input, sourceRefs: refs(input.sourceRefs, "software-platform state source refs") });
}

export function validateSoftwareDeploymentEvidence(input: SoftwareDeploymentEvidence, binding: SoftwarePlatformBinding): SoftwareDeploymentEvidence {
  if (input.ownerId !== binding.ownerId || input.projectId !== binding.projectId || input.companyId !== binding.companyId || input.repositoryRef !== binding.repositoryRef || input.deploymentProviderRef !== binding.deploymentProviderRef) throw new Error("software deployment evidence must bind the exact project repository and provider");
  if (!input.id.trim() || !input.commitRef.trim() || !input.environmentRef.trim() || !input.deploymentRef.trim()) throw new Error("software deployment evidence identity/commit/environment/deployment required");
  return Object.freeze({ ...input, sourceRefs: refs(input.sourceRefs, "software deployment source refs") });
}

export const SOFTWARE_PLATFORM_TRUTH_OWNER = "specialist:software_platform" as const;
