import { parseTimestamp } from "../security/types.js";
import { assertSecretChannelSafe } from "../security/secret-channels.js";
import { reconcileFinancialSnapshot, type FinancialProviderSnapshot } from "./recovery.js";

export interface FinancialSyncBatch {
 readonly snapshot: FinancialProviderSnapshot;
 readonly expectedPageIds: readonly string[];
 readonly receivedPageIds: readonly string[];
 readonly complete: boolean;
 readonly integrityVerified: boolean;
 readonly provenanceVerified: boolean;
 readonly providerHealth: "available" | "degraded" | "unavailable" | "compromised";
 readonly connectionState: "connected" | "disconnected" | "expired" | "revoked";
 readonly consentGranted: boolean;
 readonly credentialUsable: boolean;
 readonly capabilityPresent: boolean;
 readonly permissionPresent: boolean;
 readonly expectedAccountIds: readonly string[];
 readonly evidenceRefs: readonly string[];
}
/** Validation gate only. Retains last known truth; never writes partial pages or provider credentials. */
export function assessFinancialSyncBatch(current: FinancialProviderSnapshot | undefined, batch: FinancialSyncBatch, now: string, maxAgeMs: number) {
 const blocked = (reason: string) => Object.freeze({state: "blocked" as const, reason, promoteCurrent: false, protectedActionAuthorized: false});
 assertSecretChannelSafe("log", batch);
 if (!Number.isSafeInteger(maxAgeMs) || maxAgeMs < 0) throw new Error("Invalid finance freshness policy");
 const at = parseTimestamp(now,"now"), captured = parseTimestamp(batch.snapshot.capturedAt,"snapshot.capturedAt");
 if (captured > at || at-captured>maxAgeMs) return blocked("stale_or_future_financial_data");
 if (batch.integrityVerified !== true || batch.provenanceVerified !== true || !Array.isArray(batch.evidenceRefs) || !batch.evidenceRefs.length || batch.evidenceRefs.some(r=>typeof r!=="string" || !r.trim())) return blocked("unverified_financial_evidence");
 if (batch.providerHealth !== "available" || batch.connectionState !== "connected" || batch.consentGranted !== true || batch.credentialUsable !== true || batch.capabilityPresent !== true || batch.permissionPresent !== true) return blocked("provider_or_authority_unavailable");
 const exactSet = (expected: readonly string[], received: readonly string[]) => Array.isArray(expected) && Array.isArray(received) && expected.every(x=>typeof x==="string" && !!x.trim()) && received.every(x=>typeof x==="string" && !!x.trim()) && new Set(expected).size===expected.length && new Set(received).size===received.length && expected.length===received.length && expected.every(x=>received.includes(x));
 if (batch.complete !== true || !batch.expectedPageIds.length || !exactSet(batch.expectedPageIds,batch.receivedPageIds)) return blocked("partial_or_duplicate_pages");
 if (!exactSet(batch.expectedAccountIds,batch.snapshot.accountIds)) return blocked("missing_or_changed_account_identity");
 const decision = reconcileFinancialSnapshot(current,batch.snapshot);
 return Object.freeze({state: decision, reason: decision, promoteCurrent: decision==="accept_newer", protectedActionAuthorized: false});
}
