export interface SpecialistBrainDefinition {
  readonly key: string;
  readonly version: number;
  readonly scope: "meta" | "project" | "business" | "books" | "finance" | "personal" | "custom";
  readonly capabilities: readonly string[];
  readonly allowedMemoryKinds: readonly string[];
}

export interface SharedPattern {
  readonly id: string;
  readonly version: number;
  readonly provenanceRefs: readonly string[];
  readonly applicableScopes: readonly string[];
  readonly deprecated: boolean;
}

export class SpecialistBrainRegistry {
  readonly #brains = new Map<string, SpecialistBrainDefinition>();
  readonly #patterns = new Map<string, SharedPattern>();

  registerBrain(brain: SpecialistBrainDefinition): void {
    if (!brain.key.startsWith("brain:")) throw new Error(`Brain key must start with brain:: ${brain.key}`);
    if (this.#brains.has(brain.key)) throw new Error(`Brain already exists: ${brain.key}`);
    this.#brains.set(brain.key, Object.freeze({ ...brain, capabilities: Object.freeze([...brain.capabilities]), allowedMemoryKinds: Object.freeze([...brain.allowedMemoryKinds]) }));
  }

  removeBrain(key: string): SpecialistBrainDefinition {
    const brain = this.#brains.get(key);
    if (!brain) throw new Error(`Unknown Brain: ${key}`);
    this.#brains.delete(key);
    return brain;
  }

  registerPattern(pattern: SharedPattern): void {
    if (pattern.provenanceRefs.length === 0 || pattern.applicableScopes.length === 0) throw new Error("Shared pattern requires provenance and applicability");
    if (this.#patterns.has(pattern.id)) throw new Error(`Pattern already exists: ${pattern.id}`);
    this.#patterns.set(pattern.id, Object.freeze({ ...pattern, provenanceRefs: Object.freeze([...pattern.provenanceRefs]), applicableScopes: Object.freeze([...pattern.applicableScopes]) }));
  }

  usablePatterns(scope: string): readonly SharedPattern[] { return Object.freeze([...this.#patterns.values()].filter((pattern) => !pattern.deprecated && pattern.applicableScopes.includes(scope))); }
}
