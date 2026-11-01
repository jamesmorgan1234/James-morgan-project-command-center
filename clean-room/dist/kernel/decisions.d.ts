/**
 * Decisions and registries.
 *
 * Architecture decision records for significant choices, preserved decision
 * rationale, and typed registries for screens, home modules, project detail
 * sections and storage providers.
 */
export interface ArchitectureDecision {
    readonly id: string;
    readonly title: string;
    readonly context: string;
    readonly decision: string;
    readonly consequences: readonly string[];
    readonly rationale: string;
}
export declare function architectureDecisionRecord(input: ArchitectureDecision): ArchitectureDecision;
export declare function assertDecisionHistory(records: readonly ArchitectureDecision[]): void;
export interface TypedRegistryEntry {
    readonly key: string;
    readonly description: string;
}
export declare function defineRegistry(kind: string, entries: readonly TypedRegistryEntry[]): readonly TypedRegistryEntry[];
export declare function registerInto(kind: string, registry: readonly TypedRegistryEntry[], entry: TypedRegistryEntry): readonly TypedRegistryEntry[];
export declare function registryLookup(kind: string, registry: readonly TypedRegistryEntry[], key: string): TypedRegistryEntry;
