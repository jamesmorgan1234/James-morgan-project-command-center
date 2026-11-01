import type { DataField, SensitivityClass } from "./data-sensitivity.js";
export type OwnerAction = "correct" | "archive" | "export" | "delete";
export declare function assertOwnerAction(actor: string, action: OwnerAction): void;
export declare function auditHistoryChannel(kind: "audit" | "note"): "protected" | "editable";
export interface DeletionPlan {
    readonly entity: string;
    readonly dependencies: readonly string[];
    readonly critical: boolean;
}
export interface DeletionPreview {
    readonly entity: string;
    readonly impact: readonly string[];
    readonly blocked: boolean;
    readonly requiresConfirmation: boolean;
}
export declare function deletionPreview(plan: DeletionPlan): DeletionPreview;
export declare function assertDeletionConfirmed(preview: DeletionPreview, confirmed: boolean): void;
export declare function deletionMode(critical: boolean): "soft" | "purge";
export declare function assertPurgeElevated(actor: string, elevated: boolean): void;
export interface PurgeAuditEvent {
    readonly action: "purge";
    readonly entity: string;
    readonly actor: string;
    readonly at: string;
}
export declare function purgeAuditEvent(entity: string, actor: string, at: string): PurgeAuditEvent;
export declare function anonymizeFields(fields: readonly DataField[]): readonly {
    readonly key: string;
    readonly value: string;
}[];
export declare function redactFields(fields: readonly DataField[], redactKeys: readonly string[]): readonly {
    readonly key: string;
    readonly redacted: boolean;
}[];
export declare function redactionTrail(entries: readonly {
    readonly key: string;
    readonly at: string;
}[]): readonly {
    readonly key: string;
    readonly at: string;
}[];
export declare function inheritClassification(parent: SensitivityClass, derived: SensitivityClass): SensitivityClass;
export declare function assertNoDowngrade(original: SensitivityClass, proposed: SensitivityClass): void;
export declare function assertScopedExport(allowedClasses: readonly SensitivityClass[], field: DataField): void;
export declare function assertProjectScope(projectScope: string, targetProject: string): void;
export declare function voiceTranscriptSensitivity(content: SensitivityClass): SensitivityClass;
export declare function assertVoiceRecordingsNotRetained(retained: boolean): void;
export declare function assertProviderRetentionSurfaced(surfaced: boolean): void;
export declare function providerPrivacyReview(previousPolicy: string, currentPolicy: string): "review_recommended" | "none";
export declare function assertNoOwnerPiiInDiagnostics(fields: readonly DataField[]): void;
export declare function assertNoPublicProjectEndpoint(endpoints: readonly string[]): void;
export declare function sharingDefault(allow: boolean): "deny" | "allow";
export declare function assertExplicitCollaborationRoles(roles: readonly string[]): void;
export declare function assertPublicLinkIsolated(context: {
    readonly publicContext: boolean;
}): void;
export declare function assertShareLinkUnexpired(expiresAt: string, now: string): void;
