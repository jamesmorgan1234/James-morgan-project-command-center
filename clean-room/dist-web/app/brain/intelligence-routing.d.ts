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
/**
 * P6.2 contextual intelligence router. It composes the canonical method portfolio,
 * specialist registry, and provider/model registry; it does not create a competing registry.
 * Every selected layer must independently satisfy applicability, policy, privacy, cost,
 * calibration, health, evidence, and fallback constraints.
 */
export declare function routeBrainIntelligence(request: BrainIntelligenceRoutingRequest, dependencies: {
    readonly methods: CapabilityMethodPortfolio;
    readonly specialists: SpecialistBrainRegistry;
    readonly routes: AiRouteRegistry;
}): BrainIntelligenceRouteDecision | undefined;
