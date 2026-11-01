export type ObservationState = "current" | "superseded" | "corrected" | "retracted" | "tombstone";
export interface SourceObservation {
    readonly id: string;
    readonly sourceId: string;
    readonly sequence: number;
    readonly contentHash: string;
    readonly state: ObservationState;
    readonly observedAt: string;
    readonly effectiveAt: string;
    readonly ingestedAt: string;
    readonly supersedes?: string;
    readonly reason?: string;
    readonly providerRevisionId?: string;
}
export declare class ProvenanceLedger {
    #private;
    append(record: SourceObservation): SourceObservation;
    current(sourceId: string): SourceObservation | undefined;
    latest(sourceId: string): SourceObservation | undefined;
    history(sourceId: string): readonly SourceObservation[];
}
export interface ProvenanceRef {
    readonly observationId: string;
    readonly sourceId: string;
    readonly contentHash: string;
}
export declare function assertProvenanceRefs(refs: readonly ProvenanceRef[]): readonly ProvenanceRef[];
