export declare const CORE_AUTHORITY_SOURCE_TYPES: readonly ["OWNER_INSTRUCTION", "VERIFIED_LIVE_PROVIDER_STATE", "VERIFIED_REPOSITORY_STATE", "VERIFIED_DATABASE_STATE"];
export type AuthoritySourceType = typeof CORE_AUTHORITY_SOURCE_TYPES[number];
export interface AuthoritySourceTypeDefinition {
    readonly type: AuthoritySourceType;
    readonly description: string;
    readonly authorityClass: "OWNER_INTENT" | "VERIFIED_LIVE_STATE";
}
export interface AuthoritySourceRecord {
    readonly id: string;
    readonly type: AuthoritySourceType;
    readonly version: number;
    readonly active: boolean;
    readonly locator: string;
    readonly observedAt?: string;
}
export interface AuthorityFact<T = unknown> {
    readonly id: string;
    readonly sourceId: string;
    readonly value: T;
}
export interface GovernedTruthState<T = unknown> {
    readonly desired?: T;
    readonly actual?: T;
    readonly planned?: T;
    readonly implemented?: T;
    readonly verified?: T;
    readonly ownerAccepted?: T;
}
export type GovernedTruthDimension = keyof GovernedTruthState;
export interface RequirementLineageRecord {
    readonly id: string;
    readonly sourceId: string;
    readonly originalOwnerStatement: string;
    readonly normalizedWording: string;
    readonly parentRequirementIds: readonly string[];
    readonly state: "active" | "removed" | "superseded";
    readonly supersededBy?: string;
}
export declare class AuthoritySourceRegistry {
    #private;
    constructor();
    registerType(definition: AuthoritySourceTypeDefinition): void;
    registeredTypes(): readonly Readonly<AuthoritySourceTypeDefinition>[];
    registerSource(record: AuthoritySourceRecord): Readonly<AuthoritySourceRecord>;
    reviseSource(id: string, next: Omit<AuthoritySourceRecord, "id" | "type">): Readonly<AuthoritySourceRecord>;
    requireSource(id: string): Readonly<AuthoritySourceRecord>;
    sourceHistory(id: string): readonly Readonly<AuthoritySourceRecord>[];
    recordFact<T>(fact: AuthorityFact<T>): Readonly<AuthorityFact<T>>;
    fact<T = unknown>(id: string): Readonly<AuthorityFact<T>> | undefined;
}
export declare class GovernedTruthStore<T = unknown> {
    #private;
    create(id: string, initial?: GovernedTruthState<T>): Readonly<GovernedTruthState<T>>;
    update(id: string, dimension: GovernedTruthDimension, value: T): Readonly<GovernedTruthState<T>>;
    get(id: string): Readonly<GovernedTruthState<T>> | undefined;
}
export declare class RequirementLineageRegistry {
    #private;
    constructor(sources: AuthoritySourceRegistry);
    registerOwnerRequirement(input: {
        id: string;
        sourceId: string;
        statement: string;
        normalizedWording?: string;
    }): Readonly<RequirementLineageRecord>;
    deriveRequirement(input: {
        id: string;
        sourceId: string;
        statement: string;
        parentRequirementIds: readonly string[];
        normalizedWording?: string;
    }): Readonly<RequirementLineageRecord>;
    normalize(id: string, normalizedWording: string, originalOwnerStatement: string): Readonly<RequirementLineageRecord>;
    remove(id: string): Readonly<RequirementLineageRecord>;
    supersede(id: string, replacementId: string): Readonly<RequirementLineageRecord>;
    require(id: string): Readonly<RequirementLineageRecord>;
    active(): readonly Readonly<RequirementLineageRecord>[];
    history(id: string): readonly Readonly<RequirementLineageRecord>[];
}
