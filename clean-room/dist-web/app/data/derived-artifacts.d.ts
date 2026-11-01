import type { DerivedPayloadState } from "./privacy.js";
import type { DerivedRecord, DerivedState } from "./derived.js";
import type { ProvenanceRef } from "./provenance.js";
import type { SourceSensitivity } from "./sources.js";
export declare const DERIVED_ARTIFACT_KINDS: readonly ["summary", "memory", "index", "vector", "export", "metric", "recommendation"];
export type DerivedArtifactKind = (typeof DERIVED_ARTIFACT_KINDS)[number];
export type DerivedArtifactState = DerivedState;
export interface DerivedSensitivityDowngradeAuthorization {
    readonly authorized: true;
    readonly requestedBy: "owner";
    readonly ownerDecisionRef: string;
    readonly policyRef: string;
    readonly receiptRef: string;
    readonly fromSensitivity: SourceSensitivity;
    readonly toSensitivity: SourceSensitivity;
}
export interface DerivedArtifactRecord {
    readonly artifactId: string;
    readonly ownerId: string;
    readonly derivedId: string;
    readonly kind: DerivedArtifactKind;
    readonly state: DerivedArtifactState;
    readonly provenance: readonly ProvenanceRef[];
    readonly sourceSensitivity: SourceSensitivity;
    readonly sensitivity: SourceSensitivity;
    readonly sensitivityDecisionRef?: string;
    readonly createdAt: string;
    readonly updatedAt: string;
    readonly restrictionReason?: string;
}
export interface DerivedArtifactRegistration {
    readonly artifactId: string;
    readonly ownerId: string;
    readonly derivedId: string;
    readonly kind: DerivedArtifactKind;
    readonly sourceSensitivities?: readonly SourceSensitivity[];
    readonly requestedSensitivity?: SourceSensitivity;
    readonly downgradeAuthorization?: DerivedSensitivityDowngradeAuthorization;
    readonly createdAt: string;
    readonly updatedAt: string;
}
/**
 * Canonical contract for every derived artifact class covered by A08.3/A08.7.
 * Artifacts never own independent authority: registration and use bind to the canonical
 * DerivedRecord, provenance is snapshotted from that record, and canonical restriction/
 * deletion can only move artifact state toward more restrictive states. Source sensitivity
 * propagates to each output by default. Any downgrade is an immutable registration-time
 * exception that requires explicit owner decision, policy and receipt evidence; model/system
 * requests cannot authorize it. There is no artifact reactivation API. Legacy registrations
 * without source classifications fail closed to secret until callers are upgraded.
 */
export declare class DerivedArtifactRegistry {
    #private;
    register(input: DerivedArtifactRegistration, canonical: DerivedRecord): DerivedArtifactRecord;
    syncCanonical(canonical: DerivedRecord, at: string, reason: string): readonly DerivedArtifactRecord[];
    assertUsable(artifactId: string, canonical: DerivedRecord, payloadState?: DerivedPayloadState): DerivedArtifactRecord;
    get(artifactId: string): DerivedArtifactRecord | undefined;
    listByDerived(derivedId: string): readonly DerivedArtifactRecord[];
}
