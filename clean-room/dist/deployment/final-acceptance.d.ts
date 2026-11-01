/**
 * Final acceptance.
 *
 * Seven final audits, Samsung installed-PWA acceptance, production declared
 * accepted only when every check passes, a locked acceptance checkpoint, and a
 * new roadmap/release cycle for anything that changes after acceptance.
 */
export type AuditKind = "legacy_reference" | "security" | "architecture" | "visual" | "agent_e2e" | "brain" | "portability";
export interface AuditResult {
    readonly kind: AuditKind;
    readonly passed: boolean;
    readonly findings: readonly string[];
}
export declare function finalAudit(kind: AuditKind, findings: readonly string[]): AuditResult;
export interface AcceptanceChecklist {
    readonly audits: readonly AuditResult[];
    readonly samsungInstalledPwaAccepted: boolean;
}
export interface AcceptanceVerdict {
    readonly accepted: boolean;
    readonly blocking: readonly string[];
}
export declare function productionAcceptance(checklist: AcceptanceChecklist): AcceptanceVerdict;
export interface AcceptanceLock {
    readonly checkpointId: string;
    readonly lockedAt: string;
}
export declare function lockAcceptance(checkpointId: string, lockedAt: string): AcceptanceLock;
export declare function assertAcceptanceLocked(lock: AcceptanceLock | null): void;
export declare function assertPostAcceptanceChangeStartsNewCycle(change: {
    readonly kind: string;
}, lock: AcceptanceLock | null): void;
