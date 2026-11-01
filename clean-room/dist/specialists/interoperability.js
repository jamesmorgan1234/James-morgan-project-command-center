import { assertIdentifierKind } from "../kernel/identifiers.js";
import { evidenceMeets } from "../kernel/evidence.js";
import { validateSpecialistProjection } from "../brain/specialists.js";
import { validateLearningPacket } from "../data/learning.js";
import { SHARED_INTELLIGENCE_ONTOLOGY_ID, SHARED_INTELLIGENCE_ONTOLOGY_VERSION } from "../data/intelligence-contracts.js";
import { assessTransfer, validateNegativeKnowledge } from "../analytics/transferability.js";
import { validateDependencyGraph } from "../agency/dag.js";
function fail(reason) { throw new Error(reason); }
function requireTrue(value, reason) { if (!value)
    fail(reason); }
function time(value) { const result = Date.parse(value); requireTrue(Number.isFinite(result), "invalid_time"); return result; }
function strings(values, required = false) { requireTrue(Array.isArray(values) && (!required || values.length > 0) && values.every(v => typeof v === "string" && v.length > 0 && v === v.trim()) && new Set(values).size === values.length, "invalid_list"); }
function scope(scope) { requireTrue(typeof scope.ownerId === "string" && scope.ownerId.trim() === scope.ownerId && scope.ownerId.length > 0, "invalid_owner"); assertIdentifierKind(scope.companyId, "company"); assertIdentifierKind(scope.projectId, "project"); }
function same(a, b) { return a.ownerId === b.ownerId && a.companyId === b.companyId && a.projectId === b.projectId; }
function subset(a, b, reason) { strings(a); requireTrue(a.every(v => b.includes(v)), reason); }
function keys(value, allowed) { requireTrue(Object.keys(value).every(k => allowed.includes(k)), "unsupported_construct"); }
function stable(value) {
    if (Array.isArray(value))
        return `[${value.map(stable).join(",")}]`;
    if (value !== null && typeof value === "object")
        return `{${Object.entries(value).filter(([, v]) => v !== undefined).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `${JSON.stringify(k)}:${stable(v)}`).join(",")}}`;
    return JSON.stringify(value);
}
export async function specialistRequestDigest(request) {
    const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(stable(request)));
    return Array.from(new Uint8Array(bytes), b => b.toString(16).padStart(2, "0")).join("");
}
function snapshot(value) { const copy = structuredClone(value); const freeze = (v) => { if (v && typeof v === "object") {
    Object.values(v).forEach(freeze);
    Object.freeze(v);
} }; freeze(copy); return copy; }
/** Metadata-only integration of existing PIF registries. Never executes a learned policy,
 * copies source payloads, expands a specialist grant, or installs a method automatically. */
export class SpecialistInteroperability {
    deps;
    constructor(deps) {
        this.deps = deps;
    }
    proof(id, scopeValue, now, shared = false) {
        assertIdentifierKind(id, "evidence");
        requireTrue(id === id.trim(), "invalid_evidence");
        const proof = this.deps.evidence(id);
        requireTrue(proof && proof.record.id === id && proof.scope.ownerId === scopeValue.ownerId && (same(proof.scope, scopeValue) || (shared && proof.shareable === true)) && evidenceMeets(proof.record, "canonical_record") && time(proof.record.recordedAt) <= time(now) && time(proof.expiresAt) > time(now), "evidence_not_verified_current_or_scoped");
    }
    skill(skill, target, now) {
        scope(skill.sourceScope);
        requireTrue(skill.sourceScope.ownerId === target.ownerId, "cross_owner_transfer");
        for (const [id, kind] of [[skill.packetId, "learning"], [skill.promotionId, "promotion"], [skill.sourceBrainId, "brain"], [skill.recipientBrainId, "brain"]]) {
            assertIdentifierKind(id, kind);
            requireTrue(id === id.trim(), "noncanonical_identity");
        }
        const packet = this.deps.promotions.latest(skill.packetId), decision = this.deps.promotions.latestDecision(skill.promotionId);
        requireTrue(packet && decision && packet.version === skill.packetVersion && decision.version === skill.promotionVersion, "missing_or_changed_pif_learning");
        validateLearningPacket(packet, now);
        requireTrue(packet.validationState === "validated" && packet.sourceBrainId === skill.sourceBrainId && packet.privacy.ownerId === target.ownerId && packet.sourceCompanyId === skill.sourceScope.companyId && packet.sourceProjectId === skill.sourceScope.projectId, "source_packet_binding");
        requireTrue(decision.packetId === packet.id && decision.packetVersion === packet.version && decision.lifecycle === "promoted" && decision.executablePolicy === false && time(decision.decidedAt) <= time(now) && time(decision.expiresAt) > time(now) && time(packet.revalidateAfter) > time(now), "promotion_not_current");
        const source = this.deps.brains.getModel(skill.sourceBrainId), recipient = this.deps.brains.getModel(skill.recipientBrainId);
        const context = this.deps.context(target, skill.recipientBrainId), review = this.deps.review(target.ownerId, packet.id, packet.version);
        requireTrue(source && recipient && context && review && source.version === skill.sourceBrainVersion && recipient.version === skill.recipientBrainVersion && context.brainId === recipient.key, "missing_canonical_compatibility");
        for (const [model, s] of [[source, skill.sourceScope], [recipient, target]]) {
            requireTrue(model.controlPlane === "command_center" && model.verificationState === "verified" && model.health === "healthy" && model.learningEligibility !== "none" && model.costClass === "free" && time(model.revalidatedAt) <= time(now) && time(model.revalidateAfter) > time(now), "specialist_not_ready");
            validateSpecialistProjection(model, { specialistId: model.key, specialistVersion: model.version, companyId: s.companyId, projectId: s.projectId, workClasses: [packet.taskClass], dataClasses: packet.requiredDataClasses, capabilityKeys: [packet.sourceCapabilityKey], permissionKeys: [] });
        }
        const method = this.deps.methods.get(packet.sourceMethodId), capability = this.deps.capabilities.get(packet.sourceCapabilityKey);
        requireTrue(method && capability && method.version === skill.methodVersion && capability.version === skill.capabilityVersion && method.enabled && capability.enabled && method.lifecycle === "active" && method.costClass === "free" && method.privacyClass === "local" && method.version === packet.sourceMethodVersion && method.capabilityKey === capability.key && time(method.revalidatedAt) <= time(now) && time(method.revalidateAfter) > time(now), "method_not_current_compatible_free_local");
        requireTrue(source.methodIds.includes(method.key) && recipient.methodIds.includes(method.key), "method_not_in_specialist_ceiling");
        requireTrue(review.packetId === packet.id && review.packetVersion === packet.version && review.methodId === method.key && review.methodVersion === method.version && review.ontologyId === SHARED_INTELLIGENCE_ONTOLOGY_ID && review.ontologyVersion === SHARED_INTELLIGENCE_ONTOLOGY_VERSION && time(review.revalidateAfter) > time(now), "review_version_ontology_mismatch");
        requireTrue(review.domains.includes(context.domainId) && review.companyTypes.includes(context.companyType) && review.taskClasses.includes(context.taskClass) && context.taskClass === packet.taskClass && review.environments.includes(context.environment) && review.providerModelVersions.includes(context.providerModelVersion), "recipient_context_incompatible");
        requireTrue(Number.isFinite(context.sensitivity) && context.sensitivity >= 0 && Number.isFinite(review.maxSensitivity) && context.sensitivity <= review.maxSensitivity && Number.isSafeInteger(review.resourceUnits) && review.resourceUnits >= 0 && Number.isSafeInteger(context.resourceBudgetUnits) && review.resourceUnits <= context.resourceBudgetUnits, "recipient_budget_sensitivity");
        subset([...new Set([...packet.constraints, ...review.operatingConstraints])], context.operatingConstraints, "recipient_operating_constraint_missing");
        requireTrue(({ low: 0, medium: 1, high: 2 }[method.resourceClass]) <= ({ low: 0, medium: 1, high: 2 }[recipient.resourceClass]), "method_resource_incompatible");
        requireTrue(({ internal: 0, sensitive: 1, protected: 2, secret: 3 }[method.maxDataSensitivity]) >= context.sensitivity, "method_sensitivity_incompatible");
        subset(packet.requiredDataClasses, context.dataClasses, "recipient_data_missing");
        subset(packet.requiredDataClasses, review.dataClasses, "review_data_missing");
        subset(review.requiredPolicyKeys, context.policyKeys, "recipient_policy_missing");
        subset([...new Set([...packet.prerequisites, ...method.prerequisites, ...review.prerequisites])], context.prerequisites, "recipient_prerequisite_missing");
        requireTrue(![...method.contraindications, ...review.contraindications].some(c => context.conditions.includes(c)), "recipient_contraindication");
        subset(packet.requiredTools, recipient.toolKeys, "recipient_tool_missing");
        subset(review.dependencyVersionRefs, source.dependencyVersionRefs, "source_dependency_mismatch");
        subset(review.dependencyVersionRefs, recipient.dependencyVersionRefs, "recipient_dependency_mismatch");
        requireTrue(method.applicabilityScopeKeys.some(s => ["global", `domain:${context.domainId}`, `company:${target.companyId}`, `project:${target.projectId}`, `brain:${recipient.key}`].includes(s)), "method_scope_mismatch");
        const privacy = packet.privacy.classification;
        const shared = privacy === "ecosystem_shared" || privacy === "domain_shared";
        requireTrue(shared || (privacy === "company_private" && packet.privacy.scopeRef === target.companyId && target.companyId === skill.sourceScope.companyId) || (privacy === "project_private" && packet.privacy.scopeRef === target.projectId && same(skill.sourceScope, target)), "private_transfer_boundary");
        requireTrue(privacy !== "domain_shared" || packet.domainId === context.domainId, "domain_privacy_boundary");
        const app = decision.applicability;
        requireTrue((app.scope === "global" && privacy === "ecosystem_shared") || (app.scope === "domain" && app.ref === context.domainId) || (app.scope === "brain" && app.ref === recipient.key) || (app.scope === "company" && app.ref === target.companyId) || (app.scope === "project" && app.ref === target.projectId), "promotion_scope_mismatch");
        strings(review.acceptanceCriteria, true);
        strings(review.evidenceIds, true);
        strings(review.evaluationEvidenceIds, true);
        strings(review.shadowEvidenceIds);
        requireTrue(["low", "high"].includes(review.risk) && !!review.monitoringRef.trim(), "review_controls_missing");
        requireTrue(review.risk !== "high" || review.shadowEvidenceIds.length > 0, "shadow_evaluation_required");
        const evidence = [...new Set([...packet.evidenceIds, ...packet.provenanceEvidenceIds, ...decision.evidenceIds, ...review.evidenceIds, ...review.evaluationEvidenceIds, ...review.shadowEvidenceIds, packet.rollbackEvidenceId, review.rollbackEvidenceId])];
        for (const id of evidence)
            this.proof(id, target, now, shared);
        const negative = this.deps.negativeKnowledge();
        for (const n of negative) {
            validateNegativeKnowledge(n);
            requireTrue(!n.active || time(n.revalidateAfter) > time(now), "negative_knowledge_stale");
        }
        requireTrue(packet.negativeKnowledge.every(id => negative.some(n => n.id === id)), "negative_knowledge_unresolved");
        const assessment = assessTransfer({ id: `${packet.id}:${recipient.key}`, version: packet.version, sourceRef: method.key, sourceRegime: { companyId: skill.sourceScope.companyId }, targetRegime: { companyId: target.companyId, domain: context.domainId, taskClass: context.taskClass, environment: context.environment, provider: context.providerModelVersion, dataClass: context.dataClasses.join(","), resourceClass: recipient.resourceClass }, similarityEvidenceRefs: [], applicabilityEvidenceRefs: review.evidenceIds, evaluatorEvidenceRefs: review.evaluationEvidenceIds, negativeKnowledgeRefs: negative.map(n => n.id), alternativeRefs: [], evidenceRefs: evidence, decidedAt: now, expiresAt: review.revalidateAfter }, negative, now);
        requireTrue(assessment.decision === "eligible", "transfer_rejected_by_negative_knowledge");
        return { packet, decision, source, recipient, context, review, method, capability, evidence };
    }
    async decide(input) {
        // Snapshot before awaits: caller cannot race authorization by mutating the request.
        const request = snapshot(input);
        scope(request.scope);
        assertIdentifierKind(request.id, "decision");
        requireTrue(Number.isSafeInteger(request.version) && request.version > 0, "invalid_version");
        requireTrue(["transfer", "inherit", "procedure", "compose", "compile"].includes(request.operation), "unsupported_operation");
        const digest = await specialistRequestDigest(request), now = this.deps.now();
        time(now);
        let artifact, reason = "accepted";
        try {
            keys(request, ["id", "version", "operation", "scope", "authorizationEvidenceId", "skills", "procedure", "steps"]);
            keys(request.scope, ["ownerId", "companyId", "projectId"]);
            for (const s of request.skills) {
                keys(s, ["packetId", "packetVersion", "promotionId", "promotionVersion", "sourceBrainId", "sourceBrainVersion", "recipientBrainVersion", "methodVersion", "capabilityVersion", "recipientBrainId", "sourceScope"]);
                keys(s.sourceScope, ["ownerId", "companyId", "projectId"]);
            }
            this.proof(request.authorizationEvidenceId, request.scope, now);
            requireTrue(this.deps.authorize(request, digest, now), "current_authorization_denied");
            requireTrue(request.skills.length > 0 && new Set(request.skills.map(s => `${s.packetId}:${s.recipientBrainId}`)).size === request.skills.length, "skills_missing_or_duplicate");
            const skills = request.skills.map(s => this.skill(s, request.scope, now));
            if (request.operation === "transfer" || request.operation === "inherit")
                requireTrue(skills.length === 1 && !request.steps && !request.procedure, "invalid_transfer_shape");
            const evidence = [...new Set([request.authorizationEvidenceId, ...skills.flatMap(s => s.evidence)])].sort();
            const expiresAt = new Date(Math.min(...skills.flatMap(s => [s.review.revalidateAfter, s.packet.revalidateAfter, s.packet.freshUntil, s.decision.expiresAt, s.method.revalidateAfter, s.recipient.revalidateAfter, s.source.revalidateAfter].map(time)))).toISOString();
            let procedure;
            if (request.operation === "procedure") {
                requireTrue(skills.length === 1 && request.procedure && !request.steps, "procedure_required");
                const p = request.procedure, s = skills[0];
                keys(p, ["id", "version", "packetId", "promotionId", "sourceRunIds", "prerequisites", "steps", "rollbackEvidenceId"]);
                assertIdentifierKind(p.id, "method");
                requireTrue(p.id === s.method.key && p.version === s.method.version && p.packetId === s.packet.id && p.promotionId === s.decision.id, "procedure_version_binding");
                strings(p.sourceRunIds, true);
                requireTrue(p.sourceRunIds.length >= 2 && p.sourceRunIds.length <= s.packet.sampleCount, "repeatability_required");
                for (const id of p.sourceRunIds) {
                    assertIdentifierKind(id, "agencyRun");
                    const run = this.deps.run(id);
                    requireTrue(run?.verified && run.packetId === p.packetId && same(run.scope, request.skills[0].sourceScope), "procedure_run_not_verified_scoped");
                    this.proof(run.evidenceId, run.scope, now);
                    evidence.push(run.evidenceId);
                }
                subset(p.prerequisites, s.context.prerequisites, "procedure_prerequisite_missing");
                this.proof(p.rollbackEvidenceId, request.skills[0].sourceScope, now);
                evidence.push(p.rollbackEvidenceId);
                this.tasks(p.steps.map(step => ({ ...step, recipientBrainId: s.recipient.key })), skills, request.scope, request.id);
                procedure = p;
            }
            else
                requireTrue(!request.procedure, "unexpected_procedure");
            const tasks = request.operation === "compose" || request.operation === "compile" ? this.tasks(request.steps ?? [], skills, request.scope, request.id) : undefined;
            requireTrue(!request.steps || tasks, "unexpected_steps");
            artifact = snapshot({ schemaVersion: 1, scope: request.scope, operation: request.operation, controlPlane: "command_center", executable: false, sourceVersionRefs: skills.flatMap(s => [`${s.packet.id}@${s.packet.version}`, `${s.decision.id}@${s.decision.version}`, `${s.source.key}@${s.source.version}`, `${s.recipient.key}@${s.recipient.version}`, `${s.method.key}@${s.method.version}`, `${s.capability.key}@${s.capability.version}`]).sort(), evidenceIds: [...new Set(evidence)].sort(), acceptanceCriteria: [...new Set(skills.flatMap(s => s.review.acceptanceCriteria))].sort(), rollbackEvidenceIds: [...new Set(skills.map(s => s.review.rollbackEvidenceId))].sort(), monitoringRefs: [...new Set(skills.map(s => s.review.monitoringRef))].sort(), expiresAt, methods: skills.map(s => ({ brainId: s.recipient.key, methodId: s.method.key, version: s.method.version, capabilityKey: s.capability.key })).sort((a, b) => a.brainId.localeCompare(b.brainId)), ...(procedure ? { procedure } : {}), ...(tasks ? { tasks, steps: request.steps, dataShared: [], arbitration: "command_center", cancellation: "cancel_remaining_and_revalidate" } : {}) });
            const after = this.deps.now();
            requireTrue(time(after) < time(expiresAt) && this.deps.authorize(request, digest, after), "authorization_expired_during_validation");
            request.skills.forEach(s => this.skill(s, request.scope, after));
        }
        catch (error) {
            artifact = undefined;
            reason = error instanceof Error && /^[a-z_]+$/.test(error.message) ? error.message : "validation_rejected";
        }
        const decision = snapshot({ id: request.id, version: request.version, scope: request.scope, operation: request.operation, requestDigest: digest, accepted: !!artifact, reason, recordedAt: this.deps.now(), authorizationEvidenceId: request.authorizationEvidenceId, ...(artifact ? { artifact } : {}) });
        // Failure to persist is failure: never return an unaudited acceptance. Stored results are data only.
        const stored = await this.deps.store.append(decision);
        requireTrue(this.deps.authorize(request, digest, this.deps.now()) || !stored.accepted, "authorization_changed_during_persistence");
        if (stored.accepted)
            request.skills.forEach(s => this.skill(s, request.scope, this.deps.now()));
        requireTrue(stored.requestDigest === digest && same(stored.scope, request.scope) && stored.id === request.id && stored.version === request.version, "store_identity_conflict");
        requireTrue(!stored.accepted || (decision.accepted && stable(stored.artifact) === stable(decision.artifact) && time(stored.artifact.expiresAt) > time(this.deps.now())), "recovery_requires_current_authority_and_versions");
        return snapshot(stored);
    }
    tasks(steps, skills, target, id) {
        requireTrue(steps.length > 0, "composition_steps_required");
        const tasks = steps.map((step, index) => {
            keys(step, ["id", "methodId", "methodVersion", "dependsOn", "decisionPoints", "failureHandling", "allowedVariation", "verificationCriteria", "permissionKeys", "recipientBrainId"]);
            const skill = skills.find(s => s.recipient.key === step.recipientBrainId && s.method.key === step.methodId && s.method.version === step.methodVersion);
            requireTrue(skill, "composition_method_incompatible");
            strings(step.dependsOn);
            strings(step.decisionPoints, true);
            strings(step.failureHandling, true);
            strings(step.allowedVariation);
            strings(step.verificationCriteria, true);
            subset(step.permissionKeys, skill.recipient.permissionKeys, "composition_permission_escalation");
            subset(step.permissionKeys, skill.context.policyKeys, "composition_policy_denied");
            assertIdentifierKind(step.id, "agencyTask");
            return { id: step.id, runId: id, projectId: target.projectId, title: step.methodId, state: "blocked", blocker: "requires_current_agency_admission", dependencyIds: [...step.dependsOn], capability: skill.capability.key, risk: "low", preferredEnvironment: "deterministic", evidenceRefs: [...skill.evidence], idempotencyKey: JSON.stringify([id, step.id]), priority: index, createdSequence: index, affinityKeys: [step.recipientBrainId], antiAffinityKeys: [] };
        });
        validateDependencyGraph(tasks);
        for (const step of steps)
            for (const dep of step.dependsOn) {
                const source = steps.find(s => s.id === dep);
                const a = skills.find(s => s.method.key === source.methodId), b = skills.find(s => s.method.key === step.methodId);
                requireTrue(b.capability.compatibleInputVersions.includes(a.capability.outputVersion), "composition_schema_incompatible");
            }
        return snapshot(tasks);
    }
}
/** Free/local PostgreSQL adapter; uses a trusted server connection, never a browser service key. */
export class PostgresSpecialistDecisionStore {
    query;
    constructor(query) {
        this.query = query;
    }
    async append(decision) { const result = await this.query("select command_center_private.append_specialist_decision($1::jsonb) as decision", [JSON.stringify(decision)]); requireTrue(result.rows[0], "decision_not_persisted"); return result.rows[0].decision; }
}
import { createIntentBinding } from "../security/intent.js";
export function specialistInteroperabilityIntent(request, digest, environment) {
    return { action: `specialists.${request.operation}`, ownerId: request.scope.ownerId, scope: { ...request.scope, environment }, targetResourceId: request.id, parameters: { requestDigest: digest, version: request.version }, maximumCostCents: 0 };
}
/** Reuse C2; no new issuer, inferred consent or grants. Outputs remain proposals, so grants
 * are checked but not consumed as if an execution happened. Actual effects require fresh C2 admission. */
export function specialistC2Authorization(gate, grants, sessionId, environment) {
    return (request, digest, now) => {
        try {
            const intent = specialistInteroperabilityIntent(request, digest, environment), binding = createIntentBinding(intent);
            const grant = grants.assertUsable(request.authorizationEvidenceId, { ownerId: request.scope.ownerId, sessionId, action: intent.action, authorizationIntentBinding: binding }, now);
            if (grant.authoritySource !== "owner_verified")
                return false;
            return gate.authorize({ sessionId, action: intent.action, resourceOwnerId: request.scope.ownerId, resourceProjectId: request.scope.projectId, resourceCompanyId: request.scope.companyId, resourceEnvironment: environment, now, intent, authorizationIntentBinding: binding }).allowed;
        }
        catch {
            return false;
        }
    };
}
/** Discovery is a deterministic suggestion, never delegation or a grant. No private context is returned. */
export function discoverSpecialistCollaboration(brains, target, capabilities, taskClass, domain, now) {
    scope(target);
    strings(capabilities, true);
    time(now);
    const candidates = capabilities.map(capabilityKey => {
        const compatible = brains.listModels().filter(m => m.controlPlane === "command_center" && m.domain === domain && m.enabled && m.lifecycle === "active" && m.health === "healthy" && m.verificationState === "verified" && m.costClass === "free" && time(m.revalidatedAt) <= time(now) && time(m.revalidateAfter) > time(now) && m.supportedCompanyIds.includes(target.companyId) && m.supportedProjectIds.includes(target.projectId) && m.supportedWorkClasses.includes(taskClass) && m.capabilityKeys.includes(capabilityKey)).sort((a, b) => a.key.localeCompare(b.key));
        requireTrue(compatible.length > 0, "no_compatible_scoped_specialist");
        return { capabilityKey, candidates: compatible.map(m => ({ brainId: m.key, version: m.version })) };
    });
    return snapshot({ controlPlane: "command_center", executable: false, scope: target, candidates });
}
//# sourceMappingURL=interoperability.js.map