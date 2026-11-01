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

export function finalAudit(kind: AuditKind, findings: readonly string[]): AuditResult {
  return Object.freeze({ kind, passed: findings.length === 0, findings: Object.freeze([...findings]) });
}

export interface AcceptanceChecklist {
  readonly audits: readonly AuditResult[];
  readonly samsungInstalledPwaAccepted: boolean;
}

export interface AcceptanceVerdict {
  readonly accepted: boolean;
  readonly blocking: readonly string[];
}

export function productionAcceptance(checklist: AcceptanceChecklist): AcceptanceVerdict {
  const blocking: string[] = checklist.audits.filter((audit) => !audit.passed).map((audit) => audit.kind);
  if (!checklist.samsungInstalledPwaAccepted) blocking.push("samsung_installed_pwa");
  return Object.freeze({ accepted: blocking.length === 0, blocking: Object.freeze(blocking) });
}

export interface AcceptanceLock {
  readonly checkpointId: string;
  readonly lockedAt: string;
}

export function lockAcceptance(checkpointId: string, lockedAt: string): AcceptanceLock {
  if (!checkpointId.trim()) throw new Error("Acceptance lock requires a checkpoint id");
  if (Number.isNaN(Date.parse(lockedAt))) throw new Error("Acceptance lock requires a valid timestamp");
  return Object.freeze({ checkpointId, lockedAt });
}

export function assertAcceptanceLocked(lock: AcceptanceLock | null): void {
  if (lock === null) throw new Error("Acceptance checkpoint is not locked");
}

export function assertPostAcceptanceChangeStartsNewCycle(change: { readonly kind: string }, lock: AcceptanceLock | null): void {
  if (!change.kind.trim()) throw new Error("A change requires a kind");
  if (lock !== null) throw new Error("Post-acceptance change requires a new roadmap and release cycle");
}
