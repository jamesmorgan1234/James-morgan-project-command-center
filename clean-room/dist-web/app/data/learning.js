import { assertIdentifierKind } from "../kernel/identifiers.js";
const freezeStrings = (values) => Object.freeze([...values]);
function unique(values, label, requireOne = false) {
    if (requireOne && values.length === 0)
        throw new Error(`${label} requires at least one value`);
    const normalized = values.map((value) => value.trim());
    if (normalized.some((value) => !value))
        throw new Error(`${label} cannot contain blank values`);
    if (new Set(normalized).size !== normalized.length)
        throw new Error(`${label} cannot contain duplicates`);
}
function score(value, label) {
    if (!Number.isFinite(value) || value < 0 || value > 1)
        throw new Error(`${label} must be between 0 and 1`);
}
function timestamp(value, label) {
    const parsed = Date.parse(value);
    if (!Number.isFinite(parsed))
        throw new Error(`${label} must be a valid timestamp`);
    return parsed;
}
function evidence(values, label, requireOne = false) {
    unique(values, label, requireOne);
    for (const id of values)
        assertIdentifierKind(id, "evidence");
}
function validateApplicability(scope) {
    if (scope.scope === "global") {
        if (scope.ref !== undefined)
            throw new Error("Global learning scope cannot carry a scoped reference");
        return;
    }
    if (!scope.ref)
        throw new Error(`${scope.scope} learning scope requires a reference`);
    const kind = scope.scope === "domain" ? "domain" : scope.scope === "brain" ? "brain" : scope.scope === "company" ? "company" : scope.scope === "project" ? "project" : scope.scope === "task" ? "agencyTask" : "condition";
    assertIdentifierKind(scope.ref, kind);
}
export function validateLearningPacket(packet, now) {
    assertIdentifierKind(packet.id, "learning");
    assertIdentifierKind(packet.sourceBrainId, "brain");
    assertIdentifierKind(packet.sourceMethodId, "method");
    assertIdentifierKind(packet.domainId, "domain");
    if (packet.sourceCompanyId !== undefined)
        assertIdentifierKind(packet.sourceCompanyId, "company");
    if (packet.sourceProjectId !== undefined)
        assertIdentifierKind(packet.sourceProjectId, "project");
    if (packet.sourceRunId !== undefined)
        assertIdentifierKind(packet.sourceRunId, "agencyRun");
    if (packet.sourceTaskId !== undefined)
        assertIdentifierKind(packet.sourceTaskId, "agencyTask");
    for (const conditionId of packet.conditionIds)
        assertIdentifierKind(conditionId, "condition");
    if (!Number.isInteger(packet.version) || packet.version < 1 || !Number.isInteger(packet.sourceMethodVersion) || packet.sourceMethodVersion < 1)
        throw new Error("Learning packet versions must be positive integers");
    if (!packet.sourceSystemRef.trim() || !packet.sourceCapabilityKey.trim() || !packet.taskClass.trim() || !packet.discovery.trim() || !packet.action.trim() || !packet.outcome.trim() || !packet.transferabilityHypothesis.trim())
        throw new Error("Learning packet core context is incomplete");
    evidence(packet.evidenceIds, "Learning packet evidence", true);
    evidence(packet.provenanceEvidenceIds, "Learning packet provenance", true);
    evidence(packet.retractionEvidenceIds, "Learning packet retraction evidence", false);
    assertIdentifierKind(packet.rollbackEvidenceId, "evidence");
    unique(packet.sourceRefs, "Learning packet source references", true);
    unique(packet.successCriteria, "Learning success criteria", true);
    unique(packet.failureCriteria, "Learning failure criteria", true);
    unique(packet.prerequisites, "Learning prerequisites", false);
    unique(packet.requiredDataClasses, "Learning required data", false);
    if (!Number.isInteger(packet.sampleCount) || packet.sampleCount < 1)
        throw new Error("Learning packet sample count must be positive");
    if (packet.metrics.length === 0)
        throw new Error("Learning packet requires baseline/measured metrics");
    for (const metric of packet.metrics)
        if (!metric.key.trim() || !metric.unit.trim() || !Number.isFinite(metric.baseline) || !Number.isFinite(metric.measured))
            throw new Error("Learning metrics require finite baseline/measured values and units");
    score(packet.confidence, "Learning confidence");
    score(packet.calibration, "Learning calibration");
    score(packet.reproducibility, "Learning reproducibility");
    score(packet.causalConfidence, "Learning causal confidence");
    const observed = timestamp(packet.observedAt, "Learning observedAt");
    const freshUntil = timestamp(packet.freshUntil, "Learning freshUntil");
    const revalidate = timestamp(packet.revalidateAfter, "Learning revalidateAfter");
    const current = timestamp(now, "Learning validation time");
    if (freshUntil <= observed || revalidate <= observed)
        throw new Error("Learning freshness/revalidation must follow observation");
    if (packet.validationState === "validated" && current >= freshUntil)
        throw new Error("Stale learning cannot remain validated");
    validateApplicability(packet.proposedScope);
    if (packet.proposedScope.scope === "global" && packet.privacy.classification !== "ecosystem_shared")
        throw new Error("Private learning cannot request global promotion");
    if (packet.privacy.classification === "company_private" && packet.sourceCompanyId !== packet.privacy.scopeRef)
        throw new Error("Company-private learning cannot cross company scope");
    if (packet.privacy.classification === "project_private" && packet.sourceProjectId !== packet.privacy.scopeRef)
        throw new Error("Project-private learning cannot cross project scope");
    return packet;
}
function freezePacket(packet) {
    return Object.freeze({
        ...packet,
        conditionIds: freezeStrings(packet.conditionIds), constraints: freezeStrings(packet.constraints), evidenceIds: freezeStrings(packet.evidenceIds), sourceRefs: freezeStrings(packet.sourceRefs),
        metrics: Object.freeze(packet.metrics.map((metric) => Object.freeze({ ...metric }))), successCriteria: freezeStrings(packet.successCriteria), failureCriteria: freezeStrings(packet.failureCriteria),
        confounders: freezeStrings(packet.confounders), limitations: freezeStrings(packet.limitations), failureConditions: freezeStrings(packet.failureConditions), prerequisites: freezeStrings(packet.prerequisites),
        requiredTools: freezeStrings(packet.requiredTools), requiredDataClasses: freezeStrings(packet.requiredDataClasses), resourceImplications: freezeStrings(packet.resourceImplications), latencyImplications: freezeStrings(packet.latencyImplications),
        financialImplications: freezeStrings(packet.financialImplications), securityImplications: freezeStrings(packet.securityImplications), applicableSystems: freezeStrings(packet.applicableSystems), negativeKnowledge: freezeStrings(packet.negativeKnowledge),
        recoveryLesson: freezeStrings(packet.recoveryLesson), retractionEvidenceIds: freezeStrings(packet.retractionEvidenceIds), provenanceEvidenceIds: freezeStrings(packet.provenanceEvidenceIds)
    });
}
export class LearningPromotionGovernor {
    #packets = new Map();
    #decisions = new Map();
    submit(packet, now) {
        validateLearningPacket(packet, now);
        const history = this.#packets.get(packet.id) ?? [];
        const latest = history.at(-1);
        if (latest && packet.version <= latest.version)
            throw new Error("Learning packet version must advance");
        const frozen = freezePacket(packet);
        this.#packets.set(packet.id, [...history, frozen]);
        return frozen;
    }
    decide(packetId, promotionId, readiness, validatorRefs, now) {
        assertIdentifierKind(promotionId, "promotion");
        unique(validatorRefs, "Promotion validators", true);
        const packet = this.latest(packetId);
        if (!packet)
            throw new Error(`Unknown learning packet: ${packetId}`);
        const reasons = [];
        let classification = packet.proposedPromotionClass;
        let lifecycle = "classified";
        if (packet.validationState === "retracted") {
            classification = "DEPRECATED";
            lifecycle = "retracted";
            reasons.push("packet_retracted");
        }
        else if (packet.validationState === "contradicted") {
            classification = "QUARANTINED";
            lifecycle = "quarantined";
            reasons.push("contradicted");
        }
        else if (packet.validationState !== "validated") {
            classification = "REJECTED";
            lifecycle = "rejected";
            reasons.push("not_validated");
        }
        else if (Date.parse(now) >= Date.parse(packet.freshUntil)) {
            classification = "QUARANTINED";
            lifecycle = "quarantined";
            reasons.push("stale");
        }
        else if (packet.proposedScope.scope === "global" && packet.privacy.classification !== "ecosystem_shared") {
            classification = "REJECTED";
            lifecycle = "rejected";
            reasons.push("private_scope");
        }
        else if (classification === "GLOBAL" && !(readiness.epistemicsReady && readiness.evaluatorReady && readiness.negativeKnowledgeReady && readiness.traceReady && readiness.recoveryReady)) {
            classification = "QUARANTINED";
            lifecycle = "quarantined";
            reasons.push("global_dependencies_not_ready");
        }
        else if (classification === "REJECTED")
            lifecycle = "rejected";
        else if (classification === "QUARANTINED")
            lifecycle = "quarantined";
        else if (classification === "ALTERNATIVE")
            lifecycle = "alternative";
        else if (classification === "DEPRECATED")
            lifecycle = "deprecated";
        else
            lifecycle = "promoted";
        const history = this.#decisions.get(promotionId) ?? [];
        const decision = Object.freeze({
            id: promotionId, version: (history.at(-1)?.version ?? 0) + 1, packetId: packet.id, packetVersion: packet.version, classification, lifecycle,
            applicability: packet.proposedScope, evidenceIds: freezeStrings(packet.evidenceIds), validatorRefs: freezeStrings(validatorRefs), reasonCodes: freezeStrings(reasons.length ? reasons : ["scoped_promotion_validated"]),
            decidedAt: now, expiresAt: packet.revalidateAfter, rollbackEvidenceId: packet.rollbackEvidenceId, executablePolicy: false
        });
        this.#decisions.set(promotionId, [...history, decision]);
        return decision;
    }
    retract(promotionId, evidenceId, now) {
        assertIdentifierKind(evidenceId, "evidence");
        const current = this.#decisions.get(promotionId)?.at(-1);
        if (!current)
            throw new Error(`Unknown promotion: ${promotionId}`);
        const next = Object.freeze({ ...current, version: current.version + 1, lifecycle: "retracted", classification: "DEPRECATED", evidenceIds: Object.freeze([...current.evidenceIds, evidenceId]), reasonCodes: Object.freeze([...current.reasonCodes, "retracted"]), decidedAt: now, executablePolicy: false });
        this.#decisions.set(promotionId, [...this.#decisions.get(promotionId) ?? [], next]);
        return next;
    }
    latest(packetId) { return this.#packets.get(packetId)?.at(-1); }
    latestDecision(promotionId) { return this.#decisions.get(promotionId)?.at(-1); }
}
//# sourceMappingURL=learning.js.map