export interface ReplaceableDependency {
    readonly key: string;
    readonly kind: "ai" | "storage" | "hosting" | "integration" | "model" | "provider";
    readonly health: "available" | "degraded" | "unavailable" | "retired" | "compromised";
    readonly adapterKey: string;
    readonly coreRewriteRequired: boolean;
    readonly capabilities: readonly string[];
}
export declare function replacementDisposition(dependency: ReplaceableDependency): "keep" | "degrade_locally" | "replace";
import { ProviderRegistry, type ProviderContract } from '../data/providers.js';
import type { IntelligenceTraceFabric } from '../data/intelligence-trace.js';
import { type RecoveryAccess, type RecoveryScope } from './contracts.js';
export interface ScopedReplacementPlan {
    readonly id: string;
    readonly scope: RecoveryScope;
    readonly dependencyId: string;
    readonly kind: 'ai' | 'provider' | 'storage' | 'hosting' | 'integration' | 'model' | 'method' | 'specialist' | 'evaluator' | 'ontology' | 'dependency';
    readonly oldVersion: number;
    readonly newVersion: number;
    readonly oldAdapterRef: string;
    readonly newAdapterRef: string;
    readonly rollbackRef: string;
    readonly cost: 'free' | 'paid' | 'unknown';
    readonly health: 'available' | 'degraded' | 'unavailable' | 'retired' | 'compromised';
    readonly compatible: boolean;
    readonly requiredCapabilities: readonly string[];
    readonly evidenceIds: readonly string[];
}
export declare function assessScopedReplacement(a: RecoveryAccess, p: ScopedReplacementPlan, fabric: IntelligenceTraceFabric): {
    plan: ScopedReplacementPlan;
    eligible: boolean;
    reasons: string[];
    affectedDependents: readonly string[];
    canonicalOwnerRevalidationRequired: true;
    authorizationGranted: false;
};
/** Applies only to an explicitly supplied isolated canonical provider registry; no live connectors. */
export declare function replaceIsolatedProvider(a: RecoveryAccess, p: ScopedReplacementPlan, fabric: IntelligenceTraceFabric, registry: ProviderRegistry, next: ProviderContract): {
    oldProvider: ProviderContract;
    newProvider: ProviderContract | undefined;
    rollbackRef: string;
    plan: ScopedReplacementPlan;
    eligible: boolean;
    reasons: string[];
    affectedDependents: readonly string[];
    canonicalOwnerRevalidationRequired: true;
    authorizationGranted: false;
};
