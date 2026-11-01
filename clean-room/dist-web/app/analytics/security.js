export function validateSecuritySignal(signal) {
    if (!signal.subjectRef.trim() || !signal.observedAt.includes("T") || signal.evidenceRefs.length === 0)
        throw new Error("security analytics signal requires provenance");
    if (signal.payloadIncluded)
        throw new Error("security analytics must minimize sensitive payloads");
    return Object.freeze({ ...signal, evidenceRefs: Object.freeze([...signal.evidenceRefs]) });
}
export function signalGrantsAuthorization(_signal) {
    return false;
}
import { authorizeAnalytics, analyticsEvidence, immutable, invariant, timestamp, equalScope } from './contracts.js';
import { assessIndependentConsensus } from './intelligence-governance.js';
export function securityTrustAnalytics(access, scope, signals, consensus) { authorizeAnalytics(access, 'read', scope, 'security-trust'); const byKind = {}; for (const row of signals) {
    invariant(equalScope(row.scope, scope), 'security_analytics_scope_mismatch');
    validateSecuritySignal(row.signal);
    analyticsEvidence(access, scope, row.signal.evidenceRefs);
    invariant(timestamp(row.signal.observedAt) <= timestamp(access.now()), 'future_security_signal');
    byKind[row.signal.kind] = (byKind[row.signal.kind] ?? 0) + 1;
} for (const o of consensus)
    analyticsEvidence(access, scope, o.sourceRefs); return immutable({ scope, signals: signals.length, byKind, independence: assessIndependentConsensus(consensus), authorizationGranted: false, automaticResponse: false }); }
//# sourceMappingURL=security.js.map