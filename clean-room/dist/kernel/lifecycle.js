export const LIFECYCLE_VOCABULARY_VERSION = 1;
export const REQUIREMENT_STATES = ["draft", "owner_review", "locked", "implemented_unverified", "verified_complete", "superseded", "excluded"];
export const PROJECT_STATES = ["candidate", "active", "paused", "blocked", "completed", "closed", "superseded", "merged", "abandoned", "unknown"];
export const MODULE_STATES = ["registered", "enabled", "degraded", "disabled", "retired"];
export const CAPABILITY_STATES = ["absent", "dormant", "configured", "connected", "authorized", "enabled", "degraded", "disabled", "retired"];
export const COMMAND_STATES = ["created", "accepted", "rejected", "executing", "succeeded", "failed", "cancelled"];
export const EVENT_STATES = ["recorded", "published", "consumed", "superseded"];
export const WORKFLOW_STATES = ["draft", "ready", "running", "paused", "blocked", "completed", "failed", "cancelled"];
export const AGENCY_RUN_STATES = ["planned", "queued", "working", "needs_owner", "blocked", "paused", "stopped", "failed", "completed"];
export const AGENCY_JOB_STATES = ["planned", "queued", "claimed", "working", "verification_pending", "verified", "blocked", "failed", "cancelled"];
export const AGENCY_TASK_STATES = ["planned", "queued", "claimed", "working", "verification_pending", "verified", "blocked", "needs_owner", "paused", "stopped", "failed", "completed"];
export const EVIDENCE_STATES = ["self_report_only", "recorded", "verified", "rejected", "stale", "superseded"];
export const ASSET_STATES = ["referenced", "available", "missing", "protected", "superseded", "reconstructed", "retired"];
export const PROVIDER_STATES = ["unknown", "available", "degraded", "unavailable", "retired"];
export const RELEASE_STATES = ["draft", "candidate", "staged", "authorized", "deployed_unverified", "live_verified", "rolled_back", "retired"];
export const DECISION_STATES = ["proposed", "current", "superseded", "revoked"];
export const RULE_STATES = ["draft", "current", "superseded", "revoked"];
export const LINEAGE_STATES = ["recorded", "verified", "superseded", "invalidated"];
export const CHECKPOINT_STATES = ["recorded", "verified", "superseded", "invalidated"];
export const CONVERSATION_STATES = ["active", "archived", "superseded", "merged"];
export const P1_1_REQUIRED_LIFECYCLE_VOCABULARIES = Object.freeze({
    requirement: REQUIREMENT_STATES,
    project: PROJECT_STATES,
    module: MODULE_STATES,
    capability: CAPABILITY_STATES,
    command: COMMAND_STATES,
    event: EVENT_STATES,
    workflow: WORKFLOW_STATES,
    agencyRun: AGENCY_RUN_STATES,
    agencyJob: AGENCY_JOB_STATES,
    evidence: EVIDENCE_STATES,
    asset: ASSET_STATES,
    provider: PROVIDER_STATES,
    release: RELEASE_STATES,
    decision: DECISION_STATES,
    rule: RULE_STATES,
    lineage: LINEAGE_STATES
});
export function isState(value, vocabulary) {
    return vocabulary.includes(value);
}
export function assertState(value, vocabulary, label) {
    if (!isState(value, vocabulary))
        throw new Error(`Invalid ${label} state: ${value}`);
    return value;
}
export function validateLifecycleVocabularySchema() {
    const vocabularyVersion = LIFECYCLE_VOCABULARY_VERSION;
    if (!Number.isSafeInteger(vocabularyVersion) || vocabularyVersion < 1)
        throw new Error("Lifecycle vocabulary version must be a positive safe integer");
    for (const [label, vocabulary] of Object.entries(P1_1_REQUIRED_LIFECYCLE_VOCABULARIES)) {
        const states = vocabulary;
        if (states.length === 0)
            throw new Error(`P1.1 lifecycle vocabulary is empty: ${label}`);
        if (new Set(states).size !== states.length)
            throw new Error(`P1.1 lifecycle vocabulary contains duplicates: ${label}`);
        if (states.some((state) => !state.trim()))
            throw new Error(`P1.1 lifecycle vocabulary contains a blank state: ${label}`);
    }
    return true;
}
validateLifecycleVocabularySchema();
//# sourceMappingURL=lifecycle.js.map