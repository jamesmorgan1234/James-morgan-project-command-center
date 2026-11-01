/**
 * Final acceptance.
 *
 * Seven final audits, Samsung installed-PWA acceptance, production declared
 * accepted only when every check passes, a locked acceptance checkpoint, and a
 * new roadmap/release cycle for anything that changes after acceptance.
 */
export function finalAudit(kind, findings) {
    return Object.freeze({ kind, passed: findings.length === 0, findings: Object.freeze([...findings]) });
}
export function productionAcceptance(checklist) {
    const blocking = checklist.audits.filter((audit) => !audit.passed).map((audit) => audit.kind);
    if (!checklist.samsungInstalledPwaAccepted)
        blocking.push("samsung_installed_pwa");
    return Object.freeze({ accepted: blocking.length === 0, blocking: Object.freeze(blocking) });
}
export function lockAcceptance(checkpointId, lockedAt) {
    if (!checkpointId.trim())
        throw new Error("Acceptance lock requires a checkpoint id");
    if (Number.isNaN(Date.parse(lockedAt)))
        throw new Error("Acceptance lock requires a valid timestamp");
    return Object.freeze({ checkpointId, lockedAt });
}
export function assertAcceptanceLocked(lock) {
    if (lock === null)
        throw new Error("Acceptance checkpoint is not locked");
}
export function assertPostAcceptanceChangeStartsNewCycle(change, lock) {
    if (!change.kind.trim())
        throw new Error("A change requires a kind");
    if (lock !== null)
        throw new Error("Post-acceptance change requires a new roadmap and release cycle");
}
//# sourceMappingURL=final-acceptance.js.map