import { parseTimestamp } from "../security/types.js";
import type { DerivedPayloadState } from "./privacy.js";
import type { DerivedRecord, DerivedState } from "./derived.js";
import type { ProvenanceRef } from "./provenance.js";
import type { SourceSensitivity } from "./sources.js";

export const DERIVED_ARTIFACT_KINDS = Object.freeze([
  "summary",
  "memory",
  "index",
  "vector",
  "export",
  "metric",
  "recommendation"
] as const);

export type DerivedArtifactKind = (typeof DERIVED_ARTIFACT_KINDS)[number];
export type DerivedArtifactState = DerivedState;

const SENSITIVITY_RANK: Readonly<Record<SourceSensitivity, number>> = Object.freeze({
  internal: 0,
  sensitive: 1,
  protected: 2,
  secret: 3
});

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

function isDerivedArtifactKind(value: string): value is DerivedArtifactKind {
  return (DERIVED_ARTIFACT_KINDS as readonly string[]).includes(value);
}

function isSourceSensitivity(value: string): value is SourceSensitivity {
  return ["internal", "sensitive", "protected", "secret"].includes(value);
}

function strictestSensitivity(values: readonly SourceSensitivity[] | undefined): SourceSensitivity {
  // Legacy callers that predate source classification fail closed at the strictest class.
  // New callers that supply the field must provide at least one explicit classification.
  if (values === undefined) return "secret";
  if (values.length === 0) throw new Error("Derived artifact requires source sensitivity classifications");
  if (values.some((value) => !isSourceSensitivity(value))) throw new Error("Unsupported derived source sensitivity");
  return values.reduce((strictest, current) => SENSITIVITY_RANK[current] > SENSITIVITY_RANK[strictest] ? current : strictest);
}

function resolveSensitivity(input: DerivedArtifactRegistration): Readonly<{ sourceSensitivity: SourceSensitivity; sensitivity: SourceSensitivity; sensitivityDecisionRef?: string }> {
  const sourceSensitivity = strictestSensitivity(input.sourceSensitivities);
  const sensitivity = input.requestedSensitivity ?? sourceSensitivity;
  if (!isSourceSensitivity(sensitivity)) throw new Error("Unsupported derived artifact sensitivity");

  const isDowngrade = SENSITIVITY_RANK[sensitivity] < SENSITIVITY_RANK[sourceSensitivity];
  if (!isDowngrade) {
    if (input.downgradeAuthorization !== undefined) throw new Error("Downgrade authorization is only valid for a sensitivity downgrade");
    return Object.freeze({ sourceSensitivity, sensitivity });
  }

  const authorization = input.downgradeAuthorization;
  if (!authorization || authorization.authorized !== true) throw new Error("Derived sensitivity downgrade requires explicit owner authorization");
  if (authorization.requestedBy !== "owner") throw new Error("Model/system-requested sensitivity downgrade is forbidden");
  if (!authorization.ownerDecisionRef.trim() || !authorization.policyRef.trim() || !authorization.receiptRef.trim()) throw new Error("Derived sensitivity downgrade requires decision, policy, and receipt evidence");
  if (authorization.fromSensitivity !== sourceSensitivity || authorization.toSensitivity !== sensitivity) throw new Error("Derived sensitivity downgrade authorization does not match the requested transition");
  return Object.freeze({ sourceSensitivity, sensitivity, sensitivityDecisionRef: authorization.receiptRef.trim() });
}

function frozenProvenance(provenance: readonly ProvenanceRef[]): readonly ProvenanceRef[] {
  if (provenance.length === 0) throw new Error("Derived artifact requires canonical provenance");
  return Object.freeze(provenance.map((ref) => Object.freeze({ ...ref })));
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
export class DerivedArtifactRegistry {
  readonly #records = new Map<string, DerivedArtifactRecord>();

  register(input: DerivedArtifactRegistration, canonical: DerivedRecord): DerivedArtifactRecord {
    if (!input.artifactId.startsWith("artifact:") || !input.ownerId.trim() || !input.derivedId.startsWith("derived:")) {
      throw new Error("Derived artifact identity/owner/derivedId are required");
    }
    if (!isDerivedArtifactKind(input.kind)) throw new Error(`Unsupported derived artifact kind: ${String(input.kind)}`);
    if (input.derivedId !== canonical.id || input.ownerId !== canonical.ownerId) throw new Error("Derived artifact must bind its canonical owner and derived record");
    if (canonical.state !== "active") throw new Error("Derived artifact can only be registered from an active canonical derived record");
    const createdAt = parseTimestamp(input.createdAt, "derivedArtifact.createdAt");
    const updatedAt = parseTimestamp(input.updatedAt, "derivedArtifact.updatedAt");
    if (updatedAt < createdAt) throw new Error("Derived artifact updatedAt cannot predate createdAt");
    if (this.#records.has(input.artifactId)) throw new Error(`Derived artifact already exists: ${input.artifactId}`);
    const resolvedSensitivity = resolveSensitivity(input);

    const record: DerivedArtifactRecord = Object.freeze({
      artifactId: input.artifactId,
      ownerId: input.ownerId,
      derivedId: input.derivedId,
      kind: input.kind,
      state: "active",
      provenance: frozenProvenance(canonical.provenance),
      ...resolvedSensitivity,
      createdAt: input.createdAt,
      updatedAt: input.updatedAt
    });
    this.#records.set(input.artifactId, record);
    return record;
  }

  syncCanonical(canonical: DerivedRecord, at: string, reason: string): readonly DerivedArtifactRecord[] {
    parseTimestamp(at, "derivedArtifact.syncAt");
    const normalizedReason = reason.trim();
    if (!normalizedReason) throw new Error("Derived artifact canonical sync reason is required");
    const changed: DerivedArtifactRecord[] = [];
    for (const [artifactId, artifact] of this.#records) {
      if (artifact.derivedId !== canonical.id || artifact.ownerId !== canonical.ownerId) continue;
      if (canonical.state === "active") {
        if (artifact.state !== "active") continue;
        continue;
      }
      if (artifact.state === "deleted") continue;
      const nextState: DerivedArtifactState = canonical.state === "deleted" ? "deleted" : "restricted";
      if (artifact.state === nextState) continue;
      const next: DerivedArtifactRecord = Object.freeze({
        ...artifact,
        state: nextState,
        updatedAt: at,
        restrictionReason: normalizedReason
      });
      this.#records.set(artifactId, next);
      changed.push(next);
    }
    return Object.freeze(changed);
  }

  assertUsable(artifactId: string, canonical: DerivedRecord, payloadState: DerivedPayloadState = "present"): DerivedArtifactRecord {
    const artifact = this.#required(artifactId);
    if (artifact.ownerId !== canonical.ownerId || artifact.derivedId !== canonical.id) throw new Error("Derived artifact/canonical identity mismatch");
    if (artifact.state !== "active") throw new Error(`Derived artifact is not active: ${artifact.state}`);
    if (canonical.state !== "active") throw new Error(`Canonical derived record is not active: ${canonical.state}`);
    if (payloadState !== "present") throw new Error(`Derived payload is not usable: ${payloadState}`);
    if (canonical.provenance.length === 0 || artifact.provenance.length === 0) throw new Error("Derived artifact provenance is missing");
    const canonicalKeys = new Set(canonical.provenance.map((ref) => `${ref.observationId}|${ref.sourceId}|${ref.contentHash}`));
    const artifactKeys = artifact.provenance.map((ref) => `${ref.observationId}|${ref.sourceId}|${ref.contentHash}`);
    if (artifactKeys.some((key) => !canonicalKeys.has(key)) || artifactKeys.length !== canonicalKeys.size) {
      throw new Error("Derived artifact provenance no longer matches canonical provenance");
    }
    return artifact;
  }

  get(artifactId: string): DerivedArtifactRecord | undefined {
    return this.#records.get(artifactId);
  }

  listByDerived(derivedId: string): readonly DerivedArtifactRecord[] {
    return Object.freeze([...this.#records.values()].filter((record) => record.derivedId === derivedId));
  }

  #required(artifactId: string): DerivedArtifactRecord {
    const record = this.#records.get(artifactId);
    if (!record) throw new Error(`Unknown derived artifact: ${artifactId}`);
    return record;
  }
}
