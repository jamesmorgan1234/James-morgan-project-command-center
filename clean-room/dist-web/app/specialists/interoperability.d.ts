import { type EvidenceRecord } from "../kernel/evidence.js";
import type { CapabilityRegistry } from "../kernel/capabilities.js";
import type { CapabilityMethodPortfolio } from "../kernel/method-portfolio.js";
import { type SpecialistBrainRegistry } from "../brain/specialists.js";
import { type LearningPromotionGovernor } from "../data/learning.js";
import { type NegativeKnowledgeRecord } from "../analytics/transferability.js";
import { type ScheduledTask } from "../agency/dag.js";
export interface SpecialistScope {
    readonly ownerId: string;
    readonly companyId: string;
    readonly projectId: string;
}
/** Trusted recipient configuration, not caller assertions about permission or compatibility. */
export interface RecipientContext {
    readonly brainId: string;
    readonly companyType: string;
    readonly domainId: string;
    readonly taskClass: string;
    readonly environment: string;
    readonly providerModelVersion: string;
    readonly dataClasses: readonly string[];
    readonly policyKeys: readonly string[];
    readonly conditions: readonly string[];
    readonly operatingConstraints: readonly string[];
    readonly prerequisites: readonly string[];
    readonly sensitivity: number;
    readonly resourceBudgetUnits: number;
}
/** Scoped independent review of an exact PIF.4 packet/method version. Stored by the control plane. */
export interface SpecialistTransferReview {
    readonly packetId: string;
    readonly packetVersion: number;
    readonly methodId: string;
    readonly methodVersion: number;
    readonly ontologyId: string;
    readonly ontologyVersion: number;
    readonly domains: readonly string[];
    readonly companyTypes: readonly string[];
    readonly taskClasses: readonly string[];
    readonly environments: readonly string[];
    readonly providerModelVersions: readonly string[];
    readonly dataClasses: readonly string[];
    readonly requiredPolicyKeys: readonly string[];
    readonly contraindications: readonly string[];
    readonly operatingConstraints: readonly string[];
    readonly prerequisites: readonly string[];
    readonly dependencyVersionRefs: readonly string[];
    readonly maxSensitivity: number;
    readonly resourceUnits: number;
    readonly evidenceIds: readonly string[];
    readonly evaluationEvidenceIds: readonly string[];
    readonly acceptanceCriteria: readonly string[];
    readonly risk: "low" | "high";
    readonly shadowEvidenceIds: readonly string[];
    readonly rollbackEvidenceId: string;
    readonly monitoringRef: string;
    readonly revalidateAfter: string;
}
export interface ProcedureStep {
    readonly id: string;
    readonly methodId: string;
    readonly methodVersion: number;
    readonly dependsOn: readonly string[];
    readonly decisionPoints: readonly string[];
    readonly failureHandling: readonly string[];
    readonly allowedVariation: readonly string[];
    readonly verificationCriteria: readonly string[];
    readonly permissionKeys: readonly string[];
}
export interface LearnedProcedure {
    readonly id: string;
    readonly version: number;
    readonly packetId: string;
    readonly promotionId: string;
    readonly sourceRunIds: readonly string[];
    readonly prerequisites: readonly string[];
    readonly steps: readonly ProcedureStep[];
    readonly rollbackEvidenceId: string;
}
export interface SpecialistSkillRequest {
    readonly packetId: string;
    readonly packetVersion: number;
    readonly promotionId: string;
    readonly promotionVersion: number;
    readonly sourceBrainId: string;
    readonly sourceBrainVersion: number;
    readonly recipientBrainVersion: number;
    readonly methodVersion: number;
    readonly capabilityVersion: number;
    readonly recipientBrainId: string;
    readonly sourceScope: SpecialistScope;
}
export type SpecialistOperation = "transfer" | "inherit" | "procedure" | "compose" | "compile";
export interface SpecialistInteroperabilityRequest {
    readonly id: string;
    readonly version: number;
    readonly operation: SpecialistOperation;
    readonly scope: SpecialistScope;
    readonly authorizationEvidenceId: string;
    readonly skills: readonly SpecialistSkillRequest[];
    readonly procedure?: LearnedProcedure;
    readonly steps?: readonly (ProcedureStep & {
        readonly recipientBrainId: string;
    })[];
}
export interface SpecialistArtifact {
    readonly schemaVersion: 1;
    readonly scope: SpecialistScope;
    readonly operation: SpecialistOperation;
    readonly controlPlane: "command_center";
    readonly executable: false;
    readonly sourceVersionRefs: readonly string[];
    readonly evidenceIds: readonly string[];
    readonly acceptanceCriteria: readonly string[];
    readonly rollbackEvidenceIds: readonly string[];
    readonly monitoringRefs: readonly string[];
    readonly expiresAt: string;
    readonly methods: readonly {
        readonly brainId: string;
        readonly methodId: string;
        readonly version: number;
        readonly capabilityKey: string;
    }[];
    readonly procedure?: LearnedProcedure;
    readonly tasks?: readonly ScheduledTask[];
    readonly steps?: readonly ProcedureStep[];
    readonly dataShared?: readonly string[];
    readonly arbitration?: "command_center";
    readonly cancellation?: "cancel_remaining_and_revalidate";
}
export interface SpecialistDecision {
    readonly id: string;
    readonly version: number;
    readonly scope: SpecialistScope;
    readonly operation: SpecialistOperation;
    readonly requestDigest: string;
    readonly accepted: boolean;
    readonly reason: string;
    readonly recordedAt: string;
    readonly authorizationEvidenceId: string;
    readonly artifact?: SpecialistArtifact;
}
/** Atomic durable compare/append: same id/version+digest returns original; conflict rejects.
 * Reads must return immutable snapshots. Never restore authorization from this data-only history. */
export interface SpecialistDecisionStore {
    append(decision: SpecialistDecision): Promise<SpecialistDecision>;
}
export interface SpecialistInteroperabilityDependencies {
    readonly brains: SpecialistBrainRegistry;
    readonly methods: CapabilityMethodPortfolio;
    readonly capabilities: CapabilityRegistry;
    readonly promotions: LearningPromotionGovernor;
    readonly context: (scope: SpecialistScope, brainId: string) => RecipientContext | undefined;
    readonly review: (ownerId: string, packetId: string, version: number) => SpecialistTransferReview | undefined;
    readonly evidence: (id: string) => {
        readonly record: EvidenceRecord;
        readonly scope: SpecialistScope;
        readonly expiresAt: string;
        readonly shareable?: boolean;
    } | undefined;
    readonly run: (id: string) => {
        readonly scope: SpecialistScope;
        readonly verified: boolean;
        readonly packetId: string;
        readonly evidenceId: string;
    } | undefined;
    readonly negativeKnowledge: () => readonly NegativeKnowledgeRecord[];
    /** Bind to the current C2 session/policy/protected authorization boundary on the trusted server.
     * Must check this exact digest, scope, operation and evidence; a nonblank reference is insufficient. */
    readonly authorize: (request: SpecialistInteroperabilityRequest, digest: string, now: string) => boolean;
    readonly store: SpecialistDecisionStore;
    readonly now: () => string;
}
export declare function specialistRequestDigest(request: SpecialistInteroperabilityRequest): Promise<string>;
/** Metadata-only integration of existing PIF registries. Never executes a learned policy,
 * copies source payloads, expands a specialist grant, or installs a method automatically. */
export declare class SpecialistInteroperability {
    private readonly deps;
    constructor(deps: SpecialistInteroperabilityDependencies);
    private proof;
    private skill;
    decide(input: SpecialistInteroperabilityRequest): Promise<SpecialistDecision>;
    private tasks;
}
/** Free/local PostgreSQL adapter; uses a trusted server connection, never a browser service key. */
export declare class PostgresSpecialistDecisionStore implements SpecialistDecisionStore {
    private readonly query;
    constructor(query: (sql: string, params: unknown[]) => Promise<{
        rows: {
            decision: SpecialistDecision;
        }[];
    }>);
    append(decision: SpecialistDecision): Promise<SpecialistDecision>;
}
import { ProtectedActionGate } from "../security/protected-gate.js";
import { ProtectedAuthorizationRegistry } from "../security/protected-authorizations.js";
import type { EnvironmentName } from "../kernel/config.js";
export declare function specialistInteroperabilityIntent(request: SpecialistInteroperabilityRequest, digest: string, environment: EnvironmentName): {
    action: string;
    ownerId: string;
    scope: {
        environment: EnvironmentName;
        ownerId: string;
        companyId: string;
        projectId: string;
    };
    targetResourceId: string;
    parameters: {
        requestDigest: string;
        version: number;
    };
    maximumCostCents: number;
};
/** Reuse C2; no new issuer, inferred consent or grants. Outputs remain proposals, so grants
 * are checked but not consumed as if an execution happened. Actual effects require fresh C2 admission. */
export declare function specialistC2Authorization(gate: ProtectedActionGate, grants: ProtectedAuthorizationRegistry, sessionId: string, environment: EnvironmentName): SpecialistInteroperabilityDependencies["authorize"];
/** Discovery is a deterministic suggestion, never delegation or a grant. No private context is returned. */
export declare function discoverSpecialistCollaboration(brains: SpecialistBrainRegistry, target: SpecialistScope, capabilities: readonly string[], taskClass: string, domain: string, now: string): {
    controlPlane: "command_center";
    executable: false;
    scope: SpecialistScope;
    candidates: {
        capabilityKey: string;
        candidates: {
            brainId: string;
            version: number;
        }[];
    }[];
};
