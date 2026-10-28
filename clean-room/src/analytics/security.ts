export interface SecurityAnalyticsSignal {
  readonly kind: "auth_event" | "cross_boundary_attempt" | "provider_behavior" | "permission_change" | "mass_export" | "unexpected_deployment" | "unexpected_publish" | "incident_outcome" | "protected_action_denial" | "authorization_failure" | "stale_authorization" | "privacy_violation" | "integrity_failure" | "evaluator_disagreement" | "compromised_dependency" | "unsafe_recommendation" | "suspicious_promotion" | "unusual_transfer" | "rollback_signal";
  readonly severity: "info" | "warning" | "critical";
  readonly subjectRef: string;
  readonly observedAt: string;
  readonly evidenceRefs: readonly string[];
  readonly payloadIncluded: boolean;
}

export function validateSecuritySignal(signal: SecurityAnalyticsSignal): SecurityAnalyticsSignal {
  if (!signal.subjectRef.trim() || !signal.observedAt.includes("T") || signal.evidenceRefs.length === 0) throw new Error("security analytics signal requires provenance");
  if (signal.payloadIncluded) throw new Error("security analytics must minimize sensitive payloads");
  return Object.freeze({ ...signal, evidenceRefs: Object.freeze([...signal.evidenceRefs]) });
}

export function signalGrantsAuthorization(_signal: SecurityAnalyticsSignal): false {
  return false;
}

import {authorizeAnalytics,analyticsEvidence,immutable,invariant,timestamp,equalScope,type AnalyticsScope,type AnalyticsAccess} from './contracts.js';
import {assessIndependentConsensus,type ConsensusObservation} from './intelligence-governance.js';
export interface ScopedSecuritySignal {readonly scope:AnalyticsScope;readonly signal:SecurityAnalyticsSignal;readonly dependencyVersionRefs:readonly string[]}
export function securityTrustAnalytics(access:AnalyticsAccess,scope:AnalyticsScope,signals:readonly ScopedSecuritySignal[],consensus:readonly ConsensusObservation[]){authorizeAnalytics(access,'read',scope,'security-trust');const byKind:Record<string,number>={};for(const row of signals){invariant(equalScope(row.scope,scope),'security_analytics_scope_mismatch');validateSecuritySignal(row.signal);analyticsEvidence(access,scope,row.signal.evidenceRefs);invariant(timestamp(row.signal.observedAt)<=timestamp(access.now()),'future_security_signal');byKind[row.signal.kind]=(byKind[row.signal.kind]??0)+1;}for(const o of consensus)analyticsEvidence(access,scope,o.sourceRefs);return immutable({scope,signals:signals.length,byKind,independence:assessIndependentConsensus(consensus),authorizationGranted:false,automaticResponse:false});}
