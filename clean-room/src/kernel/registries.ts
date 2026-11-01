/**
 * Extensible registries and registration templates.
 *
 * One versioned registry shape owns discovery for tools, security actions,
 * deployment targets and voice providers. Each registry enforces its own contract
 * before an entry can be discovered, and the template factories define what a new
 * project type or agent capability must declare.
 */

export interface RegistryEntry {
  readonly key: string;
  readonly version: number;
  readonly enabled: boolean;
}

export class TypedRegistry<T extends RegistryEntry> {
  readonly #items = new Map<string, T>();
  readonly #validate: (item: T) => void;

  constructor(validate: (item: T) => void) {
    this.#validate = validate;
  }

  register(item: T): T {
    this.#validate(item);
    if (!Number.isSafeInteger(item.version) || item.version < 1) throw new Error(`Registry version must be a positive safe integer for ${item.key}`);
    if (this.#items.has(item.key)) throw new Error(`Registry key already exists: ${item.key}`);
    const stored = Object.freeze({ ...item });
    this.#items.set(item.key, stored);
    return stored;
  }

  get(key: string): T | undefined { return this.#items.get(key); }
  list(): readonly T[] { return Object.freeze([...this.#items.values()]); }
  get size(): number { return this.#items.size; }
}

export type ToolRisk = "low" | "medium" | "high" | "protected";

export interface ToolContract extends RegistryEntry {
  readonly key: string;
  readonly version: number;
  readonly enabled: boolean;
  readonly capabilityKeys: readonly string[];
  readonly risk: ToolRisk;
}

export class ToolRegistry extends TypedRegistry<ToolContract> {
  constructor() {
    super((tool) => {
      if (tool.capabilityKeys.length === 0 || tool.capabilityKeys.some((key) => !key.trim())) throw new Error("Tool requires a declared capability");
      if (!["low", "medium", "high", "protected"].includes(tool.risk)) throw new Error("Tool requires a supported risk class");
    });
  }
}

export interface SecurityActionContract extends RegistryEntry {
  readonly key: string;
  readonly version: number;
  readonly enabled: boolean;
  readonly protectedAction: boolean;
  readonly requiresApproval: boolean;
}

export class SecurityActionRegistry extends TypedRegistry<SecurityActionContract> {
  constructor() {
    super((action) => {
      if (action.protectedAction && !action.requiresApproval) throw new Error("Protected security actions require approval");
    });
  }
}

export type DeploymentEnvironment = "development" | "preview" | "production";

export interface DeploymentTargetContract extends RegistryEntry {
  readonly key: string;
  readonly version: number;
  readonly enabled: boolean;
  readonly environment: DeploymentEnvironment;
  readonly productionAuthorizationRequired: boolean;
}

export class DeploymentTargetRegistry extends TypedRegistry<DeploymentTargetContract> {
  constructor() {
    super((target) => {
      if (!["development", "preview", "production"].includes(target.environment)) throw new Error("Deployment target requires a supported environment");
      if (target.environment === "production" && !target.productionAuthorizationRequired) throw new Error("Production targets require explicit authorization");
    });
  }
}

export interface VoiceProviderContract extends RegistryEntry {
  readonly key: string;
  readonly version: number;
  readonly enabled: boolean;
  readonly available: boolean;
  readonly permission: "granted" | "denied" | "prompt";
}

export class VoiceProviderRegistry extends TypedRegistry<VoiceProviderContract> {
  constructor() {
    super((provider) => {
      if (!["granted", "denied", "prompt"].includes(provider.permission)) throw new Error("Voice provider requires a supported permission state");
    });
  }
}

export interface ProjectTypeTemplate {
  readonly key: string;
  readonly version: 1;
  readonly requiredSections: readonly string[];
  readonly capabilityKeys: readonly string[];
}

export function projectTypeTemplate(input: { key: string; requiredSections: readonly string[]; capabilityKeys: readonly string[] }): Readonly<ProjectTypeTemplate> {
  if (!input.key.trim()) throw new Error("Project type template requires a key");
  if (input.requiredSections.length === 0 || input.requiredSections.some((section) => !section.trim())) throw new Error("Project type template requires declared sections");
  if (input.capabilityKeys.length === 0 || input.capabilityKeys.some((key) => !key.trim())) throw new Error("Project type template requires declared capabilities");
  return Object.freeze({
    key: input.key,
    version: 1 as const,
    requiredSections: Object.freeze([...input.requiredSections]),
    capabilityKeys: Object.freeze([...input.capabilityKeys])
  });
}

export interface AgentCapabilityTemplate {
  readonly key: string;
  readonly version: 1;
  readonly capabilityKeys: readonly string[];
  readonly risk: ToolRisk;
}

export function agentCapabilityTemplate(input: { key: string; capabilityKeys: readonly string[]; risk: ToolRisk }): Readonly<AgentCapabilityTemplate> {
  if (!input.key.trim()) throw new Error("Agent capability template requires a key");
  if (input.capabilityKeys.length === 0 || input.capabilityKeys.some((key) => !key.trim())) throw new Error("Agent capability template requires declared capabilities");
  if (!["low", "medium", "high", "protected"].includes(input.risk)) throw new Error("Agent capability template requires a supported risk class");
  return Object.freeze({
    key: input.key,
    version: 1 as const,
    capabilityKeys: Object.freeze([...input.capabilityKeys]),
    risk: input.risk
  });
}
