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

  export(records: readonly PortableRecord[], includeSecret = false): ExportManifest {
    for (const record of records) this.#validateRecord(record);
    const allowed = records.filter((record) => includeSecret || record.sensitivity !== "secret").map((record) => immutableJson(record) as PortableRecord);
    return Object.freeze({ recordCount: allowed.length, redactedCount: records.length - allowed.length, records: Object.freeze([...allowed]) });
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
