import { assertIdentifierKind } from "../kernel/identifiers.js";

export type SpecialistLifecycleStatus = "active" | "dormant" | "archived" | "replaced";
export type SpecialistProviderHealth = "available" | "degraded" | "unavailable";

export interface SpecialistTypeRegistration {
  readonly typeKey: string;
  readonly truthOwner: string;
  readonly isolationClass: string;
  readonly requiredProviderCapabilities: readonly string[];
  readonly sourceRefs: readonly string[];
}

export interface SpecialistLifecycleProject {
  readonly id: string;
  readonly ownerId: string;
  readonly projectId: string;
  readonly typeKey: string;
  readonly displayName: string;
  readonly canonicalRef: string;
  readonly status: SpecialistLifecycleStatus;
  readonly providerCapabilities: readonly string[];
  readonly sourceRefs: readonly string[];
  readonly replacedByProjectId?: string | undefined;
}

export interface SpecialistLifecycleAuthorization {
  readonly authorizationRef: string;
  readonly ownerId: string;
  readonly projectId: string;
  readonly action: "rename" | "merge" | "activate" | "replace" | "archive";
  readonly targetProjectId?: string | undefined;
}

export interface SpecialistProviderAssessment {
  readonly projectId: string;
  readonly providerCapability: string;
  readonly health: SpecialistProviderHealth;
  readonly isolatedFailure: boolean;
  readonly sourceRefs: readonly string[];
}

function refs(values: readonly string[], label: string, required = true): readonly string[] {
  if (!Array.isArray(values) || (required && values.length === 0) || values.some((value) => typeof value !== "string" || !value.trim())) throw new Error(`${label} required`);
  const normalized = values.map((value) => value.trim());
  if (new Set(normalized).size !== normalized.length) throw new Error(`${label} cannot contain duplicates`);
  return Object.freeze(normalized);
}

export class SpecialistLifecycleRegistry {
  readonly #types = new Map<string, SpecialistTypeRegistration>();
  readonly #projects = new Map<string, SpecialistLifecycleProject>();
  readonly #canonicalOwners = new Map<string, string>();

  registerType(input: SpecialistTypeRegistration): SpecialistTypeRegistration {
    if (input.truthOwner !== `specialist:${input.typeKey}` || input.isolationClass !== `specialist:${input.typeKey}`) throw new Error("specialist registration cannot override canonical truth ownership or isolation class");
    if (!input.typeKey.trim() || !input.truthOwner.trim() || !input.isolationClass.trim()) throw new Error("specialist type identity/truth owner/isolation class required");
    const requiredProviderCapabilities = refs(input.requiredProviderCapabilities, "specialist required provider capabilities", false);
    const sourceRefs = refs(input.sourceRefs, "specialist type source refs");
    const prior = this.#types.get(input.typeKey);
    if (prior && (prior.truthOwner !== input.truthOwner || prior.isolationClass !== input.isolationClass)) throw new Error("specialist type authority cannot be silently substituted");
    const frozen = Object.freeze({ ...input, requiredProviderCapabilities, sourceRefs });
    this.#types.set(input.typeKey, frozen);
    return frozen;
  }

  registerProject(input: SpecialistLifecycleProject): SpecialistLifecycleProject {
    if (!input.id.trim() || !input.ownerId.trim() || !input.projectId.trim() || !input.typeKey.trim() || !input.displayName.trim() || !input.canonicalRef.trim()) throw new Error("specialist lifecycle project identity/type/display/canonical ref required");
    if (!["active", "dormant"].includes(input.status) || input.replacedByProjectId !== undefined) throw new Error("new specialist project must start active or dormant without forged replacement lineage");
    if (!this.#types.has(input.typeKey)) throw new Error("unregistered specialist type");
    const providerCapabilities = refs(input.providerCapabilities, "specialist provider capabilities", false);
    const sourceRefs = refs(input.sourceRefs, "specialist lifecycle source refs");
    const key = JSON.stringify([input.ownerId, input.projectId]);
    const prior = this.#projects.get(key);
    if (prior) throw new Error("specialist lifecycle project already exists");
    const canonicalKey = JSON.stringify([input.ownerId, input.canonicalRef]);
    const canonicalOwner = this.#canonicalOwners.get(canonicalKey);
    if (canonicalOwner && canonicalOwner !== input.projectId) throw new Error("specialist canonical truth is isolated to another project");
    const frozen = Object.freeze({ ...input, providerCapabilities, sourceRefs });
    this.#projects.set(key, frozen);
    this.#canonicalOwners.set(canonicalKey, input.projectId);
    return frozen;
  }

  get(ownerId: string, projectId: string): SpecialistLifecycleProject {
    const project = this.#projects.get(JSON.stringify([ownerId, projectId]));
    if (!project) throw new Error("unknown specialist lifecycle project");
    return project;
  }

  rename(ownerId: string, projectId: string, displayName: string, authorization: SpecialistLifecycleAuthorization): SpecialistLifecycleProject {
    const current = this.get(ownerId, projectId);
    this.assertAuthorization(authorization, current, "rename");
    if (current.status === "archived" || current.status === "replaced") throw new Error("inactive specialist cannot be renamed");
    if (!displayName.trim()) throw new Error("specialist display name required");
    return this.replace(current, Object.freeze({ ...current, displayName: displayName.trim() }));
  }

  setDormant(ownerId: string, projectId: string): SpecialistLifecycleProject {
    const current = this.get(ownerId, projectId);
    if (current.status === "archived" || current.status === "replaced") throw new Error("archived/replaced specialist cannot become dormant");
    return this.replace(current, Object.freeze({ ...current, status: "dormant" as const }));
  }

  activate(ownerId: string, projectId: string, availableProviderCapabilities: readonly string[], authorization: SpecialistLifecycleAuthorization): SpecialistLifecycleProject {
    const current = this.get(ownerId, projectId);
    this.assertAuthorization(authorization, current, "activate");
    if (current.status !== "dormant") throw new Error("only dormant specialist can be activated");
    const type = this.#types.get(current.typeKey)!;
    const available = new Set(availableProviderCapabilities);
    if (!type.requiredProviderCapabilities.every((capability) => available.has(capability))) throw new Error("specialist activation blocked by unavailable required provider capability");
    return this.replace(current, Object.freeze({ ...current, status: "active" as const, providerCapabilities: Object.freeze([...new Set(availableProviderCapabilities)]) }));
  }

  assessProvider(ownerId: string, projectId: string, providerCapability: string, health: SpecialistProviderHealth, sourceRefs: readonly string[]): SpecialistProviderAssessment {
    const current = this.get(ownerId, projectId);
    if (!providerCapability.trim() || !current.providerCapabilities.includes(providerCapability)) throw new Error("provider capability is not bound to specialist project");
    return Object.freeze({ projectId, providerCapability, health, isolatedFailure: health !== "available", sourceRefs: refs(sourceRefs, "specialist provider assessment source refs") });
  }

  merge(ownerId: string, sourceProjectId: string, targetProjectId: string, authorization: SpecialistLifecycleAuthorization): readonly [SpecialistLifecycleProject, SpecialistLifecycleProject] {
    const source = this.get(ownerId, sourceProjectId);
    const target = this.get(ownerId, targetProjectId);
    this.assertAuthorization(authorization, source, "merge", targetProjectId);
    if (sourceProjectId === targetProjectId || target.status === "archived" || target.status === "replaced") throw new Error("specialist merge requires distinct live target");
    if (source.typeKey !== target.typeKey) throw new Error("specialist merge cannot cross specialist types");
    if (source.status === "archived" || source.status === "replaced") throw new Error("inactive source specialist cannot be merged");
    const replaced = this.replace(source, Object.freeze({ ...source, status: "replaced" as const, replacedByProjectId: targetProjectId }));
    return Object.freeze([replaced, target]);
  }

  replaceProject(ownerId: string, projectId: string, replacement: SpecialistLifecycleProject, authorization: SpecialistLifecycleAuthorization): readonly [SpecialistLifecycleProject, SpecialistLifecycleProject] {
    const current = this.get(ownerId, projectId);
    this.assertAuthorization(authorization, current, "replace", replacement.projectId);
    if (current.status === "archived" || current.status === "replaced") throw new Error("inactive specialist cannot be replaced");
    if (replacement.ownerId !== ownerId || replacement.typeKey !== current.typeKey) throw new Error("specialist replacement must preserve owner and specialist type");
    const next = this.registerProject(replacement);
    const replaced = this.replace(current, Object.freeze({ ...current, status: "replaced" as const, replacedByProjectId: next.projectId }));
    return Object.freeze([replaced, next]);
  }

  archive(ownerId: string, projectId: string, authorization: SpecialistLifecycleAuthorization): SpecialistLifecycleProject {
    const current = this.get(ownerId, projectId);
    this.assertAuthorization(authorization, current, "archive");
    return this.replace(current, Object.freeze({ ...current, status: "archived" as const }));
  }

  list(ownerId?: string): readonly SpecialistLifecycleProject[] {
    const values = [...this.#projects.values()];
    return Object.freeze(ownerId === undefined ? values : values.filter((value) => value.ownerId === ownerId));
  }

  private assertAuthorization(authorization: SpecialistLifecycleAuthorization, project: SpecialistLifecycleProject, action: SpecialistLifecycleAuthorization["action"], targetProjectId?: string): void {
    try {
      assertIdentifierKind(authorization.authorizationRef, "evidence");
      if (authorization.authorizationRef !== authorization.authorizationRef.trim()) throw new Error("canonical evidence reference cannot contain surrounding whitespace");
    } catch {
      throw new Error("specialist lifecycle action requires exact owner/project/action authorization with canonical evidence reference");
    }
    if (authorization.ownerId !== project.ownerId || authorization.projectId !== project.projectId || authorization.action !== action || (targetProjectId !== undefined && authorization.targetProjectId !== targetProjectId)) throw new Error("specialist lifecycle action requires exact owner/project/action authorization");
  }

  private replace(current: SpecialistLifecycleProject, next: SpecialistLifecycleProject): SpecialistLifecycleProject {
    this.#projects.set(JSON.stringify([current.ownerId, current.projectId]), next);
    return next;
  }
}
