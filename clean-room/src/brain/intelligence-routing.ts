import { type CapabilityMethodContract, type CapabilityMethodPortfolio, type MethodRoutingRequest } from "../kernel/method-portfolio.js";
import { type AiModelRoute, type AiRouteRegistry, type AiRoutingRequest } from "./providers.js";
import { type SpecialistBrainRegistry, type SpecialistModelContract } from "./specialists.js";

export interface BrainIntelligenceRoutingRequest {
  readonly brainId: string;
  readonly capabilityKey: string;
  readonly aiCapability: string;
  readonly toolKey?: string;
  readonly requiredPolicyRefs: readonly string[];
  readonly minimumCalibration: number;
  readonly method: Omit<MethodRoutingRequest, "capabilityKey">;
  readonly ai: Omit<AiRoutingRequest, "capability" | "brainKey" | "methodId" | "toolKey" | "requiredPolicyRefs" | "requireEvidence" | "minimumCalibration">;
}

export interface BrainIntelligenceRouteDecision {
  readonly brain: SpecialistModelContract;
  readonly method: CapabilityMethodContract;
  readonly route: AiModelRoute;
  readonly fallbackRoute?: AiModelRoute;
  readonly toolKey?: string;
  readonly policyRefs: readonly string[];
  readonly evidenceRefs: readonly string[];
  readonly calibratedConfidence: number;
}

function uniqueNonblank(values: readonly string[], label: string, requireOne = false): readonly string[] {
  if (requireOne && values.length === 0) throw new Error(`${label} requires at least one value`);
  if (values.some((value) => !value.trim()) || new Set(values).size !== values.length) throw new Error(`${label} must be unique and nonblank`);
  return Object.freeze([...values]);
}

function routeRequest(request: BrainIntelligenceRoutingRequest, methodId: string): AiRoutingRequest {
  return {
    ...request.ai,
    capability: request.aiCapability,
    brainKey: request.brainId,
    methodId,
    ...(request.toolKey !== undefined ? { toolKey: request.toolKey } : {}),
    requiredPolicyRefs: request.requiredPolicyRefs,
    requireEvidence: true,
    minimumCalibration: request.minimumCalibration
  };
}

/**
 * P6.2 contextual intelligence router. It composes the canonical method portfolio,
 * specialist registry, and provider/model registry; it does not create a competing registry.
 * Every selected layer must independently satisfy applicability, policy, privacy, cost,
 * calibration, health, evidence, and fallback constraints.
 */
export function routeBrainIntelligence(
  request: BrainIntelligenceRoutingRequest,
  dependencies: {
    readonly methods: CapabilityMethodPortfolio;
    readonly specialists: SpecialistBrainRegistry;
    readonly routes: AiRouteRegistry;
  }
): BrainIntelligenceRouteDecision | undefined {
  if (!request.brainId.trim() || !request.capabilityKey.trim() || !request.aiCapability.trim()) throw new Error("Brain/capability/AI capability are required");
  const policyRefs = uniqueNonblank(request.requiredPolicyRefs, "Routing policy refs", true);
  if (!Number.isFinite(request.minimumCalibration) || request.minimumCalibration < 0 || request.minimumCalibration > 1) throw new Error("Routing minimum calibration must be 0..1");

  const brain = dependencies.specialists.getModel(request.brainId);
  if (!brain || !brain.enabled || brain.lifecycle !== "active" || brain.health === "unavailable") return undefined;
  if (!brain.capabilityKeys.includes(request.capabilityKey)) return undefined;
  if (request.toolKey !== undefined && !brain.toolKeys.includes(request.toolKey)) return undefined;
  if (brain.calibrationScore < request.minimumCalibration) return undefined;

  const method = dependencies.methods.route({ ...request.method, capabilityKey: request.capabilityKey });
  if (!method || !brain.methodIds.includes(method.key) || method.calibrationScore < request.minimumCalibration) return undefined;

  const aiRequest = routeRequest(request, method.key);
  const route = dependencies.routes.route(aiRequest);
  if (!route || !brain.providerKeys.includes(route.providerKey)) return undefined;

  const fallback = dependencies.routes.fallbackFor(route.key, aiRequest);
  const fallbackRoute = fallback && brain.providerKeys.includes(fallback.providerKey) ? fallback : undefined;
  const evidenceRefs = uniqueNonblank([
    ...method.benchmarkEvidenceIds,
    ...method.outcomeEvidenceIds,
    ...method.provenanceEvidenceIds,
    ...brain.evaluationEvidenceIds,
    ...brain.provenanceEvidenceIds,
    ...(route.evidenceRefs ?? [])
  ], "Routing evidence", true);
  const calibratedConfidence = Math.min(method.calibrationScore, brain.calibrationScore, route.calibrationScore ?? 0);

  return Object.freeze({
    brain,
    method,
    route,
    ...(fallbackRoute !== undefined ? { fallbackRoute } : {}),
    ...(request.toolKey !== undefined ? { toolKey: request.toolKey } : {}),
    policyRefs,
    evidenceRefs,
    calibratedConfidence
  });
}
