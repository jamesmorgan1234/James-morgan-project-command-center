import { type FinancialProviderSnapshot } from "./recovery.js";
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
export declare function assessFinancialSyncBatch(current: FinancialProviderSnapshot | undefined, batch: FinancialSyncBatch, now: string, maxAgeMs: number): Readonly<{
    state: "blocked";
    reason: string;
    promoteCurrent: false;
    protectedActionAuthorized: false;
}> | Readonly<{
    state: import("./recovery.js").FinancialReconciliationDecision;
    reason: import("./recovery.js").FinancialReconciliationDecision;
    promoteCurrent: boolean;
    protectedActionAuthorized: false;
}>;
