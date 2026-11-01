/**
 * Owner data rights and sharing boundaries.
 *
 * Owner correction, archive, export and deletion; deletion preview, dependency
 * blocking, confirmation, soft delete by default, elevated purge with an audit
 * event; anonymization and redaction with a trail; classification inheritance
 * and downgrade refusal; integration/agent scope enforcement; voice privacy;
 * diagnostics and public-endpoint exclusion; default-deny sharing and expiring,
 * isolated public links.
 */
const RANK = Object.freeze({ public: 0, private: 1, sensitive: 2, secret: 3 });
function highest(a, b) {
    return RANK[a] >= RANK[b] ? a : b;
}
export function assertOwnerAction(actor, action) {
    if (actor !== "owner")
        throw new Error(`Only the owner can ${action} canonical data`);
}
export function auditHistoryChannel(kind) {
    return kind === "audit" ? "protected" : "editable";
}
export function deletionPreview(plan) {
    if (!plan.entity.trim())
        throw new Error("Deletion preview requires an entity");
    return Object.freeze({
        entity: plan.entity,
        impact: Object.freeze([...plan.dependencies]),
        blocked: plan.dependencies.length > 0,
        requiresConfirmation: true
    });
}
export function assertDeletionConfirmed(preview, confirmed) {
    if (preview.blocked)
        throw new Error(`Deletion is blocked by dependencies: ${preview.impact.join(", ")}`);
    if (!confirmed)
        throw new Error("Destructive deletion requires explicit confirmation");
}
export function deletionMode(critical) {
    return critical ? "soft" : "purge";
}
export function assertPurgeElevated(actor, elevated) {
    if (actor !== "owner")
        throw new Error("Purge requires the owner");
    if (!elevated)
        throw new Error("Purge requires an elevated explicit action");
}
export function purgeAuditEvent(entity, actor, at) {
    if (!entity.trim() || !actor.trim())
        throw new Error("Purge audit event requires entity and actor");
    if (Number.isNaN(Date.parse(at)))
        throw new Error("Purge audit event requires a valid timestamp");
    return Object.freeze({ action: "purge", entity, actor, at });
}
export function anonymizeFields(fields) {
    return Object.freeze(fields.map((field) => ({
        key: field.key,
        value: field.classification === "sensitive" || field.classification === "secret" ? "[anonymized]" : "[kept]"
    })));
}
export function redactFields(fields, redactKeys) {
    if (redactKeys.length === 0)
        throw new Error("Redaction requires at least one target");
    return Object.freeze(fields.map((field) => ({ key: field.key, redacted: redactKeys.includes(field.key) })));
}
export function redactionTrail(entries) {
    if (entries.length === 0)
        throw new Error("A redaction audit trail requires entries");
    for (const entry of entries) {
        if (!entry.key.trim())
            throw new Error("Redaction trail entries require a key");
        if (Number.isNaN(Date.parse(entry.at)))
            throw new Error("Redaction trail entries require a valid timestamp");
    }
    return Object.freeze(entries.map((entry) => Object.freeze({ ...entry })));
}
export function inheritClassification(parent, derived) {
    return highest(parent, derived);
}
export function assertNoDowngrade(original, proposed) {
    if (RANK[proposed] < RANK[original])
        throw new Error("Sensitivity cannot be downgraded by a derived process");
}
export function assertScopedExport(allowedClasses, field) {
    if (!allowedClasses.includes(field.classification))
        throw new Error("Integration lacks scope permission for sensitive data");
}
export function assertProjectScope(projectScope, targetProject) {
    if (!projectScope.trim() || projectScope !== targetProject)
        throw new Error("Agent cannot use project data outside its scope");
}
export function voiceTranscriptSensitivity(content) {
    return content;
}
export function assertVoiceRecordingsNotRetained(retained) {
    if (retained)
        throw new Error("Command Center must not retain voice recordings unnecessarily");
}
export function assertProviderRetentionSurfaced(surfaced) {
    if (!surfaced)
        throw new Error("Provider retention policy must be surfaced before use");
}
export function providerPrivacyReview(previousPolicy, currentPolicy) {
    if (!previousPolicy.trim() || !currentPolicy.trim())
        throw new Error("Provider privacy policies must be nonblank");
    return previousPolicy === currentPolicy ? "none" : "review_recommended";
}
export function assertNoOwnerPiiInDiagnostics(fields) {
    const pii = fields.filter((field) => field.classification === "sensitive" || field.classification === "secret");
    if (pii.length > 0)
        throw new Error(`Owner-specific information must not appear in diagnostics: ${pii.map((field) => field.key).join(", ")}`);
}
export function assertNoPublicProjectEndpoint(endpoints) {
    if (endpoints.length > 0)
        throw new Error(`Public endpoints must not return owner project data: ${endpoints.join(", ")}`);
}
export function sharingDefault(allow) {
    if (allow)
        throw new Error("Sharing is default-deny");
    return "deny";
}
export function assertExplicitCollaborationRoles(roles) {
    if (roles.length === 0 || roles.some((role) => !role.trim()))
        throw new Error("Collaboration requires explicit per-role sharing");
}
export function assertPublicLinkIsolated(context) {
    if (!context.publicContext)
        throw new Error("Public links must be isolated from private application context");
}
export function assertShareLinkUnexpired(expiresAt, now) {
    const expiry = Date.parse(expiresAt);
    const current = Date.parse(now);
    if (Number.isNaN(expiry) || Number.isNaN(current))
        throw new Error("Share-link timestamps must be valid");
    if (current >= expiry)
        throw new Error("Share link has expired");
}
//# sourceMappingURL=data-rights.js.map