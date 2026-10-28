import { parseTimestamp } from "../security/types.js";

export type AssetSensitivity = "internal" | "sensitive" | "protected" | "secret";
export type AssetOriginalState = "available" | "missing" | "reconstruction";
export type AssetApprovalState = "unreviewed" | "approved" | "locked";

export interface AssetRecord {
  readonly id: string;
  readonly ownerId: string;
  readonly projectId?: string;
  readonly name: string;
  readonly sha256?: string;
  readonly version: number;
  readonly sensitivity: AssetSensitivity;
  readonly originalState: AssetOriginalState;
  readonly approvalState: AssetApprovalState;
  readonly sourceRef: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface ProtectedAssetReplacementAuthorization {
  readonly ownerDecisionRef: string;
  readonly authorized: true;
}

function assertHash(hash: string): void {
  if (!/^[a-f0-9]{64}$/i.test(hash)) throw new Error("Asset sha256 must contain exactly 64 hexadecimal characters");
}

function validateAsset(record: AssetRecord): void {
  if (!record.id.trim() || !record.ownerId.trim() || !record.name.trim() || !record.sourceRef.trim()) throw new Error("Asset identity/provenance fields are required");
  if (!["internal", "sensitive", "protected", "secret"].includes(record.sensitivity) || !["available", "missing", "reconstruction"].includes(record.originalState) || !["unreviewed", "approved", "locked"].includes(record.approvalState)) throw new Error("Unsupported asset state");
  if (record.sha256 !== undefined) assertHash(record.sha256);
  if (record.originalState === "available" && !record.sha256) throw new Error("Available asset requires sha256 identity");
  if (record.projectId !== undefined && !record.projectId.trim()) throw new Error("Asset project scope must be nonblank");
  if (parseTimestamp(record.updatedAt, "updatedAt") < parseTimestamp(record.createdAt, "createdAt")) throw new Error("Asset update cannot predate creation");
}

export class AssetRegistry {
  readonly #assets = new Map<string, AssetRecord>();

  register(record: AssetRecord): void {
    validateAsset(record);
    if (!record.id.trim() || !record.ownerId.trim() || !record.name.trim() || !record.sourceRef.trim()) throw new Error("Asset identity/provenance fields are required");
    if (record.sha256) assertHash(record.sha256);
    if (record.originalState === "available" && !record.sha256) throw new Error("Available asset requires sha256 identity");
    if (!Number.isSafeInteger(record.version) || record.version !== 1) throw new Error("New asset must start at version 1");
    parseTimestamp(record.createdAt, "createdAt");
    parseTimestamp(record.updatedAt, "updatedAt");
    if (this.#assets.has(record.id)) throw new Error(`Asset already exists: ${record.id}`);
    this.#assets.set(record.id, Object.freeze({ ...record }));
  }

  replace(record: AssetRecord, expectedVersion: number, authorization?: ProtectedAssetReplacementAuthorization): void {
    validateAsset(record);
    const current = this.#required(record.id);
    if (parseTimestamp(record.updatedAt, "updatedAt") < parseTimestamp(current.updatedAt, "updatedAt")) throw new Error("Asset update time cannot move backwards");
    if (current.version !== expectedVersion || record.version !== current.version + 1) throw new Error(`Asset version conflict for ${record.id}`);
    if (current.ownerId !== record.ownerId || current.createdAt !== record.createdAt) throw new Error("Asset owner/creation identity cannot be rewritten");
    if ((current.projectId ?? null) !== (record.projectId ?? null)) throw new Error("Asset project ownership cannot be silently rewritten");
    if (record.sha256) assertHash(record.sha256);
    if (current.approvalState === "locked" && (authorization?.authorized !== true || typeof authorization?.ownerDecisionRef !== "string" || !authorization.ownerDecisionRef.trim())) throw new Error(`Locked asset replacement requires explicit owner decision: ${record.id}`);
    this.#assets.set(record.id, Object.freeze({ ...record }));
  }

  get(id: string): AssetRecord | undefined { return this.#assets.get(id); }
  listProject(projectId: string): readonly AssetRecord[] { return Object.freeze([...this.#assets.values()].filter((asset) => asset.projectId === projectId)); }

  #required(id: string): AssetRecord {
    const record = this.#assets.get(id);
    if (!record) throw new Error(`Unknown asset: ${id}`);
    return record;
  }
}
