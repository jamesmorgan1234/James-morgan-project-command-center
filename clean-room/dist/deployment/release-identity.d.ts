/**
 * Release identity and diagnostics.
 *
 * Immutable accepted release candidates, hash-signed manifests, CI/deployment
 * provenance, version diagnostics kept off normal screens, measured release
 * health, acceptance kept separate from technical deployment, and the final
 * every-file, dependency and dead-code audits.
 */
export declare function compatibilityBridge(input: {
    fromVersion: number;
    toVersion: number;
    forwardOnly: boolean;
}): {
    readonly bridgeRequired: boolean;
    readonly direction: "expand_then_contract";
};
export interface ReleaseCandidate {
    readonly id: string;
    readonly codeSha: string;
    readonly configFingerprint: string;
    readonly acceptedAt: string | null;
    readonly manifestDigest: string | null;
}
export declare function createReleaseCandidate(input: {
    id: string;
    codeSha: string;
    configFingerprint: string;
}): ReleaseCandidate;
export declare function acceptReleaseCandidate(candidate: ReleaseCandidate, manifest: Readonly<Record<string, string>>, acceptedAt: string): ReleaseCandidate;
export declare function assertCandidateUnchanged(accepted: ReleaseCandidate, current: {
    codeSha: string;
    configFingerprint: string;
}): void;
export declare function manifestDigest(files: Readonly<Record<string, string>>): string;
export declare function verifyManifest(files: Readonly<Record<string, string>>, expectedDigest: string): void;
export interface ReleaseProvenance {
    readonly ciRunId: string;
    readonly ciJobId: string;
    readonly deploymentRunId: string;
    readonly sourceSha: string;
}
export declare function releaseProvenance(input: ReleaseProvenance): ReleaseProvenance;
export interface ReleaseDiagnostics {
    readonly productionSha: string;
    readonly schemaVersion: string;
    readonly pwaCacheVersion: string;
    readonly moduleVersions: Readonly<Record<string, string>>;
    readonly brainPolicyVersion: string;
    readonly agentPolicyVersion: string;
}
export declare function healthDiagnostics(diagnostics: ReleaseDiagnostics): Readonly<Record<string, string>>;
export type Surface = "normal" | "health";
export declare function diagnosticsVisible(surface: Surface): boolean;
export interface HealthCheck {
    readonly name: string;
    readonly passed: boolean;
}
export interface ReleaseHealth {
    readonly score: number;
    readonly basis: "measured_checks";
    readonly passed: number;
    readonly total: number;
}
export declare function releaseHealthScore(checks: readonly HealthCheck[]): ReleaseHealth;
export interface AcceptanceState {
    readonly technicalDeploymentComplete: boolean;
    readonly ownerVisualAccepted: boolean;
    readonly ownerBehavioralAccepted: boolean;
}
export declare function acceptanceState(state: AcceptanceState): AcceptanceState & {
    readonly complete: boolean;
};
export declare function assertNoTemporaryExceptions(exceptions: readonly {
    readonly id: string;
    readonly permanent: boolean;
}[]): void;
export declare function everyFileAudit(files: readonly {
    readonly path: string;
    readonly reviewed: boolean;
}[]): {
    readonly total: number;
    readonly reviewed: number;
    readonly complete: boolean;
};
export declare function dependencyAudit(dependencies: readonly {
    readonly name: string;
    readonly allowed: boolean;
}[]): {
    readonly unexpected: readonly string[];
    readonly complete: boolean;
};
export declare function deadCodeAudit(symbols: readonly {
    readonly name: string;
    readonly referenced: boolean;
}[]): {
    readonly dead: readonly string[];
    readonly complete: boolean;
};
