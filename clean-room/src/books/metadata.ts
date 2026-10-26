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

export type PublishingFormat = BookFormat | "collection_kindle" | "collection_paperback" | "collection_hardcover";
export type PricingConfidence = "confirmed" | "recommended";

export interface EvidenceBackedBookMetadataPackage {
  readonly id: string;
  readonly ownerId: string;
  readonly projectId: string;
  readonly bookId: string;
  readonly version: number;
  readonly description: string;
  readonly keywords: readonly string[];
  readonly categories: readonly string[];
  readonly trimRef: string;
  readonly bleed: boolean;
  readonly formats: readonly PublishingFormat[];
  readonly packageManifestHash: string;
  readonly packageManifestRef: string;
  readonly sourceRefs: readonly string[];
  readonly observedAt: string;
}

export interface BookPricingRecommendation {
  readonly id: string;
  readonly ownerId: string;
  readonly projectId: string;
  readonly bookId: string;
  readonly format: PublishingFormat;
  readonly amount: number;
  readonly currency: string;
  readonly confidence: PricingConfidence;
  readonly rationaleRefs: readonly string[];
  readonly sourceRefs: readonly string[];
  readonly observedAt: string;
}

export interface LockedRolloutStep {
  readonly id: string;
  readonly order: number;
  readonly phase: number;
  readonly bookId: string;
  readonly format: PublishingFormat;
  readonly kdpSelect: boolean;
}

export interface LockedBookRolloutPlan {
  readonly id: string;
  readonly ownerId: string;
  readonly projectId: string;
  readonly version: number;
  readonly ownerLockedOrderRef: string;
  readonly steps: readonly LockedRolloutStep[];
  readonly sourceRefs: readonly string[];
  readonly observedAt: string;
}

export interface BookPackageReadinessAssessment {
  readonly ownerId: string;
  readonly projectId: string;
  readonly bookId: string;
  readonly metadataVersion: number;
  readonly packageManifestHash: string;
  readonly rolloutPlanId: string;
  readonly ready: boolean;
  readonly blockers: readonly string[];
}

function metadataTimestamp(value: string, label: string): number {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) throw new Error(`${label} must be an ISO-compatible timestamp`);
  return parsed;
}

function metadataRefs(values: readonly string[], label: string, requireOne = true): readonly string[] {
  if (!Array.isArray(values) || (requireOne && values.length === 0) || values.some((value) => typeof value !== "string" || !value.trim())) throw new Error(`${label} must contain nonblank values`);
  const normalized = values.map((value) => value.trim());
  if (new Set(normalized).size !== normalized.length) throw new Error(`${label} cannot contain duplicates`);
  return Object.freeze(normalized);
}

export function validateEvidenceBackedBookMetadata(metadata: EvidenceBackedBookMetadataPackage): EvidenceBackedBookMetadataPackage {
  if (!metadata.id.trim() || !metadata.ownerId.trim() || !metadata.projectId.trim() || !metadata.bookId.trim() || !metadata.description.trim() || !metadata.trimRef.trim() || !metadata.packageManifestHash.trim() || !metadata.packageManifestRef.trim()) throw new Error("book metadata/package identity and required fields are incomplete");
  if (!Number.isSafeInteger(metadata.version) || metadata.version < 1) throw new Error("book metadata version must be positive");
  metadataTimestamp(metadata.observedAt, "book metadata observedAt");
  const keywords = metadataRefs(metadata.keywords, "book metadata keywords", false);
  const categories = metadataRefs(metadata.categories, "book metadata categories", false);
  const formats = metadataRefs(metadata.formats, "book metadata formats") as readonly PublishingFormat[];
  const sourceRefs = metadataRefs(metadata.sourceRefs, "book metadata source refs");
  return Object.freeze({ ...metadata, keywords, categories, formats, sourceRefs });
}

export function validatePricingRecommendation(recommendation: BookPricingRecommendation): BookPricingRecommendation {
  if (!recommendation.id.trim() || !recommendation.ownerId.trim() || !recommendation.projectId.trim() || !recommendation.bookId.trim() || !recommendation.currency.trim()) throw new Error("book pricing recommendation identity/scope/currency are required");
  if (!Number.isFinite(recommendation.amount) || recommendation.amount < 0) throw new Error("book pricing recommendation amount must be nonnegative");
  metadataTimestamp(recommendation.observedAt, "book pricing observedAt");
  const rationaleRefs = metadataRefs(recommendation.rationaleRefs, "book pricing rationale refs");
  const sourceRefs = metadataRefs(recommendation.sourceRefs, "book pricing source refs");
  return Object.freeze({ ...recommendation, rationaleRefs, sourceRefs });
}

export function validateLockedBookRollout(plan: LockedBookRolloutPlan): LockedBookRolloutPlan {
  if (!plan.id.trim() || !plan.ownerId.trim() || !plan.projectId.trim() || !plan.ownerLockedOrderRef.trim()) throw new Error("book rollout plan identity/scope/owner lock are required");
  if (!Number.isSafeInteger(plan.version) || plan.version < 1) throw new Error("book rollout version must be positive");
  metadataTimestamp(plan.observedAt, "book rollout observedAt");
  const sourceRefs = metadataRefs(plan.sourceRefs, "book rollout source refs");
  if (plan.steps.length === 0) throw new Error("book rollout plan requires at least one step");
  const ids = new Set<string>();
  const orders = new Set<number>();
  const steps = [...plan.steps].sort((left, right) => left.order - right.order).map((step, index) => {
    if (!step.id.trim() || !step.bookId.trim()) throw new Error("book rollout step identity/book are required");
    if (!Number.isSafeInteger(step.order) || step.order < 1 || !Number.isSafeInteger(step.phase) || step.phase < 1) throw new Error("book rollout step order/phase must be positive integers");
    if (ids.has(step.id) || orders.has(step.order)) throw new Error("book rollout step ids and orders must be unique");
    if (step.order !== index + 1) throw new Error("book rollout order must be contiguous and owner-locked");
    if (step.kdpSelect && step.format !== "kindle" && step.format !== "collection_kindle") throw new Error("KDP Select can only apply to Kindle rollout steps");
    ids.add(step.id); orders.add(step.order);
    return Object.freeze({ ...step });
  });
  return Object.freeze({ ...plan, steps: Object.freeze(steps), sourceRefs });
}

export function assertRolloutMatchesOwnerLockedOrder(candidate: LockedBookRolloutPlan, locked: LockedBookRolloutPlan): void {
  const validCandidate = validateLockedBookRollout(candidate);
  const validLocked = validateLockedBookRollout(locked);
  if (validCandidate.ownerId !== validLocked.ownerId || validCandidate.projectId !== validLocked.projectId || validCandidate.ownerLockedOrderRef !== validLocked.ownerLockedOrderRef) throw new Error("rollout candidate does not bind the exact owner-locked plan");
  const canonical = (plan: LockedBookRolloutPlan) => plan.steps.map((step) => `${step.order}:${step.phase}:${step.bookId}:${step.format}:${step.kdpSelect ? "select" : "plain"}`).join("|");
  if (canonical(validCandidate) !== canonical(validLocked)) throw new Error("rollout candidate violates owner-locked order");
}

export function assessBookPackageReadiness(metadata: EvidenceBackedBookMetadataPackage, rollout: LockedBookRolloutPlan, pricing: readonly BookPricingRecommendation[]): BookPackageReadinessAssessment {
  const validMetadata = validateEvidenceBackedBookMetadata(metadata);
  const validRollout = validateLockedBookRollout(rollout);
  if (validMetadata.ownerId !== validRollout.ownerId || validMetadata.projectId !== validRollout.projectId) throw new Error("book metadata and rollout cannot cross owner/project boundary");
  const blockers: string[] = [];
  const relevantSteps = validRollout.steps.filter((step) => step.bookId === validMetadata.bookId);
  if (relevantSteps.length === 0) blockers.push("book_missing_from_rollout");
  for (const step of relevantSteps) if (!validMetadata.formats.includes(step.format)) blockers.push(`metadata_missing_format:${step.format}`);
  const validPricing = pricing.map(validatePricingRecommendation).filter((item) => item.ownerId === validMetadata.ownerId && item.projectId === validMetadata.projectId && item.bookId === validMetadata.bookId);
  for (const step of relevantSteps) if (!validPricing.some((item) => item.format === step.format)) blockers.push(`pricing_missing:${step.format}`);
  return Object.freeze({ ownerId: validMetadata.ownerId, projectId: validMetadata.projectId, bookId: validMetadata.bookId, metadataVersion: validMetadata.version, packageManifestHash: validMetadata.packageManifestHash, rolloutPlanId: validRollout.id, ready: blockers.length === 0, blockers: Object.freeze(blockers) });
}
