import { SpecialistBrainRegistry, type SpecialistModelContract, type SpecialistControlAuthority } from "../brain/specialists.js";
export interface SpecialistEvolutionReview {
    readonly unmetCapabilityKeys: readonly string[];
    readonly ontologyId: string;
    readonly ontologyVersion: number;
    readonly scopeCompanyIds: readonly string[];
    readonly scopeProjectIds: readonly string[];
    readonly permissionKeys: readonly string[];
    readonly resourceBudget: "low" | "medium" | "high";
    readonly evaluationEvidenceIds: readonly string[];
    readonly fallbackPlanRef: string;
    readonly retirementPlanRef: string;
    readonly authorizationEvidenceIds: readonly string[];
}
export interface SpecialistEvolution {
    readonly operation: "create" | "evolve" | "split" | "merge" | "suspend" | "retire";
    readonly sources: readonly {
        readonly id: string;
        readonly version: number;
    }[];
    readonly targets: readonly SpecialistModelContract[];
}
/** Trusted synchronous control-plane transaction. Review and C2 authorization callbacks must
 * resolve current canonical evidence, never caller booleans. Existing PIF.3 remains model owner. */
export declare function applySpecialistEvolution(registry: SpecialistBrainRegistry, plan: SpecialistEvolution, authority: SpecialistControlAuthority, review: SpecialistEvolutionReview, authorize: (plan: SpecialistEvolution, review: SpecialistEvolutionReview) => boolean): readonly SpecialistModelContract[];
/** Maps canonical PIF.3 models to the existing SQL owner, without creating a second model store. */
export declare function specialistModelDatabaseRow(model: SpecialistModelContract): Readonly<Record<string, unknown>>;
/** Trusted server persistence adapter. The caller must apply current C2 policy before opening
 * this transaction. SQL rechecks expected versions atomically and appends immutable PIF.3 history. */
export declare class PostgresSpecialistEvolutionStore {
    private readonly query;
    constructor(query: (sql: string, params: unknown[]) => Promise<{
        rows: {
            models: unknown;
        }[];
    }>);
    apply(ownerId: string, changes: readonly {
        model: SpecialistModelContract;
        expectedVersion: number | null;
    }[], authorityEvidenceIds: readonly string[]): Promise<unknown>;
}
import { ProtectedActionGate } from "../security/protected-gate.js";
import { ProtectedAuthorizationRegistry } from "../security/protected-authorizations.js";
import type { EnvironmentName } from "../kernel/config.js";
import type { SpecialistScope, SpecialistInteroperabilityDependencies } from "./interoperability.js";
export declare function specialistEvolutionIntent(scope: SpecialistScope, plan: SpecialistEvolution, review: SpecialistEvolutionReview, environment: EnvironmentName): {
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
        plan: SpecialistEvolution;
        review: SpecialistEvolutionReview;
    };
    maximumCostCents: number;
};
export declare function specialistEvolutionC2Authorization(gate: ProtectedActionGate, grants: ProtectedAuthorizationRegistry, registry: SpecialistBrainRegistry, sessionId: string, scope: SpecialistScope, environment: EnvironmentName, now: () => string, evidence: SpecialistInteroperabilityDependencies["evidence"]): (plan: SpecialistEvolution, review: SpecialistEvolutionReview) => boolean;
/** Persist an independently verified batch before updating the canonical in-process cache.
 * A storage failure leaves the cache unchanged; a concurrent cache conflict requires reload,
 * never blind replay or an attempt to undo newer database work. */
export declare function commitSpecialistEvolution(ownerId: string, registry: SpecialistBrainRegistry, store: PostgresSpecialistEvolutionStore, plan: SpecialistEvolution, authority: SpecialistControlAuthority, review: SpecialistEvolutionReview, authorize: (plan: SpecialistEvolution, review: SpecialistEvolutionReview) => boolean): Promise<readonly SpecialistModelContract[]>;
