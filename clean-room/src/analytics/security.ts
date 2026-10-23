export interface SecurityAnalyticsSignal {
  readonly kind: "auth_event" | "cross_boundary_attempt" | "provider_behavior" | "permission_change" | "mass_export" | "unexpected_deployment" | "unexpected_publish" | "incident_outcome";
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
