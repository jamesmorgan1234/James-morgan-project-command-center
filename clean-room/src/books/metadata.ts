import type { BookFormat } from "./registry.js";

export interface BookMetadataVersion {
  readonly bookId: string;
  readonly version: number;
  readonly description: string;
  readonly keywords: readonly string[];
  readonly categories: readonly string[];
  readonly trimRef: string;
  readonly bleed: boolean;
  readonly packageManifestHash: string;
  readonly sourceRefs: readonly string[];
}

export interface RolloutStep {
  readonly order: number;
  readonly format: BookFormat | "collection";
  readonly kdpSelect: boolean;
}

export function validateMetadata(metadata: BookMetadataVersion): BookMetadataVersion {
  if (!metadata.bookId.trim() || metadata.version < 1 || !metadata.description.trim() || !metadata.trimRef.trim() || !metadata.packageManifestHash.trim() || metadata.sourceRefs.length === 0) throw new Error("metadata package is incomplete");
  return Object.freeze({ ...metadata, keywords: Object.freeze([...metadata.keywords]), categories: Object.freeze([...metadata.categories]), sourceRefs: Object.freeze([...metadata.sourceRefs]) });
}

export function validateRollout(steps: readonly RolloutStep[]): readonly RolloutStep[] {
  const orders = steps.map((step) => step.order);
  if (new Set(orders).size !== orders.length || orders.some((order) => !Number.isInteger(order) || order < 1)) throw new Error("rollout order must be unique positive integers");
  return Object.freeze([...steps].sort((a, b) => a.order - b.order));
}
