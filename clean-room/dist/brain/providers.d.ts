export type AiCostClass = "free" | "paid" | "unknown";
export type AiPrivacyClass = "local" | "private_remote" | "remote";
export type AiHealth = "available" | "degraded" | "unavailable";
export type AiExecutionMode = "local" | "self_hosted" | "remote" | "hybrid";
export interface AiModelRoute {
    readonly key: string;
    readonly providerKey: string;
    readonly modelId: string;
    readonly versionRef: string;
    readonly executionMode: AiExecutionMode;
    readonly enabled: boolean;
    readonly capabilities: readonly string[];
    readonly cost: AiCostClass;
    readonly privacy: AiPrivacyClass;
    readonly health: AiHealth;
    readonly qualityRank: number;
    readonly latencyRank: number;
    readonly quotaAvailable: boolean | "unknown";
    readonly contextWindowTokens?: number | "unknown";
    readonly brainKeys?: readonly string[];
    readonly methodIds?: readonly string[];
    readonly toolKeys?: readonly string[];
    readonly policyRefs?: readonly string[];
    readonly evidenceRefs?: readonly string[];
    readonly calibrationScore?: number;
    readonly fallbackRouteKeys?: readonly string[];
}
export interface AiRoutingRequest {
    readonly capability: string;
    readonly allowPaid: boolean;
    readonly maxPrivacy: AiPrivacyClass;
    readonly preferQuality: boolean;
    readonly minimumContextTokens?: number;
    readonly brainKey?: string;
    readonly methodId?: string;
    readonly toolKey?: string;
    readonly requiredPolicyRefs?: readonly string[];
    readonly requireEvidence?: boolean;
    readonly minimumCalibration?: number;
}
export declare class AiRouteRegistry {
    #private;
    register(route: AiModelRoute): void;
    remove(key: string): AiModelRoute;
    route(request: AiRoutingRequest): AiModelRoute | undefined;
    fallbackFor(routeKey: string, request: AiRoutingRequest): AiModelRoute | undefined;
    list(): readonly AiModelRoute[];
}
