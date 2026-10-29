import type { AssetSensitivity } from "./assets.js";
import { immutableJson } from "./canonical.js";

export interface PortableRecord {
  readonly id: string;
  readonly entityType: string;
  readonly version: number;
  readonly contentHash: string;
  readonly sensitivity: AssetSensitivity;
  readonly provenanceRefs: readonly string[];
  readonly data: Readonly<Record<string, unknown>>;
}

export type ImportDisposition = "create" | "update" | "duplicate" | "conflict";

export interface ImportItemResult {
  readonly id: string;
  readonly disposition: ImportDisposition;
  readonly reason: string;
}

export interface ImportDryRun {
  readonly batchId: string;
  readonly results: readonly ImportItemResult[];
  readonly canApplyWithoutOverwrite: boolean;
}

export interface ExportManifest {
  readonly recordCount: number;
  readonly redactedCount: number;
  readonly records: readonly PortableRecord[];
}

export interface ExportScope {
  readonly ownerId: string;
  readonly projectId?: string;
}

export type RestrictedExportSensitivity = Exclude<AssetSensitivity, "internal">;

export interface RestrictedExportAuthorization {
  readonly authorized: true;
  readonly ownerDecisionRef: string;
  readonly scope: ExportScope;
  readonly encrypted: true;
  readonly encryptionKeyRef: string;
  readonly allowedSensitivities: readonly RestrictedExportSensitivity[];
}

export interface ExportOptions {
  readonly scope: ExportScope;
  readonly authorization?: RestrictedExportAuthorization;
}

function sameExportScope(left: ExportScope, right: ExportScope): boolean {
  return left.ownerId === right.ownerId && (left.projectId ?? null) === (right.projectId ?? null);
}

export class PortabilityCenter {
  stageImport(batchId: string, incoming: readonly PortableRecord[], existing: readonly PortableRecord[]): ImportDryRun {
    if (!batchId.trim()) throw new Error("Import batch id is required");
    for (const record of existing) this.#validateRecord(record);
    if (new Set(existing.map((record) => record.id)).size !== existing.length) throw new Error("Existing portable identities must be unique");
    const existingById = new Map(existing.map((record) => [record.id, record]));
    const seenIncoming = new Set<string>();
    const results: ImportItemResult[] = [];
    for (const record of incoming) {
      this.#validateRecord(record);
      if (seenIncoming.has(record.id)) {
        results.push(Object.freeze({ id: record.id, disposition: "conflict", reason: "duplicate_id_inside_import_batch" }));
        continue;
      }
      seenIncoming.add(record.id);
      const current = existingById.get(record.id);
      if (!current) results.push(Object.freeze({ id: record.id, disposition: "create", reason: "new_id" }));
      else if (current.version === record.version && current.contentHash === record.contentHash) results.push(Object.freeze({ id: record.id, disposition: "duplicate", reason: "same_version_same_hash" }));
      else if (record.version > current.version) results.push(Object.freeze({ id: record.id, disposition: "update", reason: "newer_version_requires_explicit_apply" }));
      else results.push(Object.freeze({ id: record.id, disposition: "conflict", reason: "would_overwrite_or_diverge_from_current" }));
    }
    return Object.freeze({ batchId, results: Object.freeze(results), canApplyWithoutOverwrite: !results.some((result) => result.disposition === "conflict") });
  }

  export(records: readonly PortableRecord[], options?: ExportOptions): ExportManifest {
    for (const record of records) this.#validateRecord(record);

    let allowedRestricted = new Set<RestrictedExportSensitivity>();
    if (options !== undefined) {
      this.#validateScope(options.scope);
      if (options.authorization !== undefined) {
        const authorization = options.authorization;
        this.#validateRestrictedAuthorization(authorization);
        if (!sameExportScope(options.scope, authorization.scope)) throw new Error("Restricted export authorization scope mismatch");
        allowedRestricted = new Set(authorization.allowedSensitivities);
      }
    }

    const allowed = records
      .filter((record) => record.sensitivity === "internal" || allowedRestricted.has(record.sensitivity))
      .map((record) => immutableJson(record) as PortableRecord);
    return Object.freeze({ recordCount: allowed.length, redactedCount: records.length - allowed.length, records: Object.freeze([...allowed]) });
  }

  #validateScope(scope: ExportScope): void {
    if (!scope.ownerId.trim()) throw new Error("Export owner scope is required");
    if (scope.projectId !== undefined && !scope.projectId.trim()) throw new Error("Export project scope must be nonblank");
  }

  #validateRestrictedAuthorization(authorization: RestrictedExportAuthorization): void {
    if (authorization.authorized !== true) throw new Error("Restricted export requires explicit authorization");
    if (!authorization.ownerDecisionRef.trim()) throw new Error("Restricted export requires owner decision evidence");
    this.#validateScope(authorization.scope);
    if (authorization.encrypted !== true || !authorization.encryptionKeyRef.trim()) throw new Error("Restricted export requires an explicit encryption policy");
    if (authorization.allowedSensitivities.length === 0 || new Set(authorization.allowedSensitivities).size !== authorization.allowedSensitivities.length) throw new Error("Restricted export authorization requires unique sensitivity classes");
    if (authorization.allowedSensitivities.some((sensitivity) => !["sensitive", "protected", "secret"].includes(sensitivity))) throw new Error("Unsupported restricted export sensitivity");
  }

  #validateRecord(record: PortableRecord): void {
    if (!record.id.trim() || !record.entityType.trim() || !record.contentHash.trim()) throw new Error("Portable record identity fields are required");
    if (!Number.isSafeInteger(record.version) || record.version < 1) throw new Error("Portable record version must be positive");
    if (record.provenanceRefs.length === 0 || record.provenanceRefs.some((ref) => !ref.trim()) || new Set(record.provenanceRefs).size !== record.provenanceRefs.length) throw new Error("Portable record requires unique nonblank provenance");
    if (!["internal", "sensitive", "protected", "secret"].includes(record.sensitivity)) throw new Error("Unsupported portable sensitivity");
    if (!record.data || typeof record.data !== "object" || Array.isArray(record.data)) throw new Error("Portable data must be an object");
    immutableJson(record);
  }
}
