import type { SpecialistModelContract } from "./specialists.js";
import type { AiModelRoute } from "./providers.js";

/** Read-only readiness assessment. This never enables a Brain or grants authority. */
export interface SpecialistActivationEvidence {
  readonly brainKey: string;
  readonly brainVersion: number;
  readonly projectId: string;
  readonly companyId: string;
  readonly routeKey: string;
  readonly modelId: string;
  readonly providerKey: string;
  readonly requestId: string;
  readonly outputRef: string;
  readonly outputHash: string;
  readonly recomputedHash: string;
  readonly observedAt: string;
  readonly mode: "live" | "isolated";
  readonly checks: Readonly<Record<"identity" | "context" | "permissions" | "tools" | "isolation" | "stop" | "pause" | "checkpoint" | "recovery" | "authorization" | "inference" | "persistence" | "health", boolean>>;
}

export interface SpecialistActivationRequest {
  readonly brain: SpecialistModelContract;
  readonly projectId: string;
  readonly companyId: string;
  readonly routes: readonly AiModelRoute[];
  readonly permittedToolKeys: readonly string[];
  readonly allowedMemoryKinds: readonly string[];
  readonly evidence: readonly SpecialistActivationEvidence[];
  readonly now: string;
  readonly maximumEvidenceAgeMs: number;
}

export interface SpecialistActivationResult {
  readonly brainKey: string;
  readonly projectId: string;
  readonly operational: boolean;
  readonly blockers: readonly string[];
  readonly verifiedToolKeys: readonly string[];
  readonly verifiedProviderKeys: readonly string[];
}

const CHECKS = ["identity", "context", "permissions", "tools", "isolation", "stop", "pause", "checkpoint", "recovery", "authorization", "inference", "persistence", "health"] as const;

export function assessSpecialistActivation(request: SpecialistActivationRequest): SpecialistActivationResult {
  const { brain, projectId, companyId } = request;
  const now = Date.parse(request.now);
  if (!Number.isFinite(now) || !Number.isSafeInteger(request.maximumEvidenceAgeMs) || request.maximumEvidenceAgeMs < 1) throw new Error("Activation requires a valid clock and evidence freshness limit");
  const blockers: string[] = [];
  if (brain.controlPlane !== "command_center") blockers.push("command_center_authority_missing");
  if (!brain.supportedProjectIds.includes(projectId) || !brain.supportedCompanyIds.includes(companyId)) blockers.push("identity_mapping_mismatch");
  if (!brain.enabled || brain.lifecycle !== "active") blockers.push("specialist_not_enabled");
  if (brain.health !== "healthy" || brain.verificationState !== "verified") blockers.push("specialist_not_verified_healthy");
  if (!Number.isFinite(Date.parse(brain.revalidatedAt)) || !Number.isFinite(Date.parse(brain.revalidateAfter)) || Date.parse(brain.revalidatedAt) > now || Date.parse(brain.revalidateAfter) <= now) blockers.push("specialist_revalidation_stale_or_invalid");
  if (!brain.evaluationEvidenceIds.length || !brain.provenanceEvidenceIds.length || !brain.rollbackEvidenceId) blockers.push("specialist_evaluation_provenance_or_rollback_missing");
  if (brain.costClass !== "free") blockers.push("specialist_cost_not_free");
  if (!brain.capabilityKeys.includes("brain.respond.read_only")) blockers.push("read_only_inference_capability_missing");
  const requiredPermissions = [`project:${projectId}:context.read`, `project:${projectId}:inference.read_only`];
  if (!requiredPermissions.every(key => brain.permissionKeys.includes(key))) blockers.push("project_scoped_permissions_missing");
  if (brain.permissionKeys.some(key => !requiredPermissions.includes(key))) blockers.push("permission_scope_requires_review");
  if (!brain.toolKeys.length || brain.toolKeys.some(key => !request.permittedToolKeys.includes(key))) blockers.push("tools_missing_or_not_permitted");
  const boundaries = ["no-spend", "no-live-external-action", "no-publication", "no-cross-company-data"];
  if (!boundaries.every(key => brain.protectedActionBoundaries.includes(key))) blockers.push("protected_action_boundaries_missing");
  if (!request.allowedMemoryKinds.length || request.allowedMemoryKinds.some(kind => !["source", "evidence", "decision", "checkpoint"].includes(kind))) blockers.push("memory_scope_requires_review");
  const eligible = request.routes.filter(route => route.enabled && route.cost === "free" && route.health === "available" && route.quotaAvailable === true && route.privacy === "local" && route.executionMode === "local" && route.capabilities.includes("brain.respond.read_only") && route.brainKeys?.includes(brain.key) && brain.providerKeys.includes(route.providerKey) && brain.modelAssignments.some(model => model.providerKey === route.providerKey && model.modelId === route.modelId && model.versionRef === route.versionRef && model.routeKey === route.key));
  if (!eligible.length) blockers.push("no_verified_free_local_model_route");
  const usableEvidence = request.evidence.filter(evidence => {
    const age = now - Date.parse(evidence.observedAt);
    return evidence.mode === "live" && Number.isFinite(age) && age >= 0 && age <= request.maximumEvidenceAgeMs && evidence.brainKey === brain.key && evidence.brainVersion === brain.version && evidence.projectId === projectId && evidence.companyId === companyId && evidence.requestId.trim() && evidence.outputRef.trim() && /^[a-f0-9]{64}$/.test(evidence.outputHash) && evidence.outputHash === evidence.recomputedHash && CHECKS.every(check => evidence.checks[check] === true) && eligible.some(route => route.key === evidence.routeKey && route.providerKey === evidence.providerKey && route.modelId === evidence.modelId);
  });
  if (!usableEvidence.length) blockers.push("complete_fresh_live_verification_missing");
  const operational = blockers.length === 0;
  return Object.freeze({ brainKey: brain.key, projectId, operational, blockers: Object.freeze(blockers), verifiedToolKeys: Object.freeze(operational ? [...brain.toolKeys] : []), verifiedProviderKeys: Object.freeze(operational ? [...new Set(usableEvidence.map(evidence => evidence.providerKey))] : []) });
}
