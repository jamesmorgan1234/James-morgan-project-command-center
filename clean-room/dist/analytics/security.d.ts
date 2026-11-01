export interface SecurityAnalyticsSignal {
    readonly kind: "auth_event" | "cross_boundary_attempt" | "provider_behavior" | "permission_change" | "mass_export" | "unexpected_deployment" | "unexpected_publish" | "incident_outcome" | "protected_action_denial" | "authorization_failure" | "stale_authorization" | "privacy_violation" | "integrity_failure" | "evaluator_disagreement" | "compromised_dependency" | "unsafe_recommendation" | "suspicious_promotion" | "unusual_transfer" | "rollback_signal";
    readonly severity: "info" | "warning" | "critical";
    readonly subjectRef: string;
    readonly observedAt: string;
    readonly evidenceRefs: readonly string[];
    readonly payloadIncluded: boolean;
}
export declare function validateSecuritySignal(signal: SecurityAnalyticsSignal): SecurityAnalyticsSignal;
export declare function signalGrantsAuthorization(_signal: SecurityAnalyticsSignal): false;
import { type AnalyticsScope, type AnalyticsAccess } from './contracts.js';
import { type ConsensusObservation } from './intelligence-governance.js';
export interface ScopedSecuritySignal {
    readonly scope: AnalyticsScope;
    readonly signal: SecurityAnalyticsSignal;
    readonly dependencyVersionRefs: readonly string[];
}
export declare function securityTrustAnalytics(access: AnalyticsAccess, scope: AnalyticsScope, signals: readonly ScopedSecuritySignal[], consensus: readonly ConsensusObservation[]): {
    scope: AnalyticsScope;
    signals: number;
    byKind: Record<string, number>;
    independence: import("./intelligence-governance.js").IndependentConsensus;
    authorizationGranted: boolean;
    automaticResponse: boolean;
};
