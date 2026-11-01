export type LedgerEntryState = "current" | "superseded" | "revoked" | "unresolved_conflict";
export interface LedgerEntry<T> {
    readonly id: string;
    readonly version: number;
    readonly scope: string;
    readonly state: LedgerEntryState;
    readonly sourceRef: string;
    readonly effectiveAt: string;
    readonly precedence?: number;
    readonly supersedes?: string;
    readonly conflictsWith?: readonly string[];
    readonly resolutionReason?: string;
    readonly value: T;
}
export type LedgerRecord<T> = Omit<LedgerEntry<T>, "precedence" | "conflictsWith"> & {
    readonly precedence: number;
    readonly conflictsWith: readonly string[];
    readonly resolvedBy?: string;
    readonly revokedBy?: string;
};
export declare class VersionedLedger<T> {
    #private;
    append(entry: LedgerEntry<T>): LedgerRecord<T>;
    recordConflict(entry: Omit<LedgerEntry<T>, "state"> & {
        readonly conflictsWith: readonly string[];
    }): LedgerRecord<T>;
    resolveConflict(conflictId: string, resolution: LedgerEntry<T> & {
        readonly state: "current";
    }): LedgerRecord<T>;
    revokeCurrent(entry: Omit<LedgerEntry<T>, "state"> & {
        readonly resolutionReason: string;
    }): LedgerRecord<T>;
    current(scope: string): LedgerRecord<T> | undefined;
    governing(scope: string): LedgerRecord<T> | undefined;
    unresolvedConflicts(scope?: string): readonly LedgerRecord<T>[];
    history(scope: string): readonly LedgerRecord<T>[];
}
