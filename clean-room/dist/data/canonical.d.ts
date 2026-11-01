export type TruthValue<T> = Readonly<{
    state: "known";
    value: T;
}> | Readonly<{
    state: "unknown";
}> | Readonly<{
    state: "not_applicable";
}>;
export declare function known<T>(value: T): TruthValue<T>;
export declare function unknown<T>(): TruthValue<T>;
export declare function notApplicable<T>(): TruthValue<T>;
/** Decode the existing truth union without guessing a value from absence or null. */
export declare function parseTruthValue<T>(input: unknown, parseValue: (value: unknown) => T): TruthValue<T>;
export interface CanonicalEntity<T> {
    readonly id: string;
    readonly entityType: string;
    readonly ownerId: string;
    readonly projectId?: string;
    readonly version: number;
    /** Absent means the original v1 wire contract; record version is independent. */
    readonly schemaVersion?: number;
    readonly createdAt: string;
    readonly updatedAt: string;
    readonly deletedAt?: string;
    readonly payload: Readonly<T>;
}
export declare function immutableJson(value: unknown, ancestors?: Set<object>): unknown;
export declare class CanonicalStore<T> {
    #private;
    create(entity: CanonicalEntity<T>): void;
    replace(entity: CanonicalEntity<T>, expectedVersion: number): void;
    tombstone(id: string, expectedVersion: number, deletedAt: string): CanonicalEntity<T>;
    get(id: string): CanonicalEntity<T> | undefined;
    list(includeDeleted?: boolean): readonly CanonicalEntity<T>[];
}
