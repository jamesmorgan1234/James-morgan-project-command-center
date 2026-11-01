/** Additive Roadmap-22 P1.1 contract; existing identifier and component versions retain their meanings. */
export declare const P1_1_INTELLIGENCE_IDENTITY_VERSION: 1;
export declare const P1_1_INTELLIGENCE_IDENTITY_SCHEMAS: Readonly<{
    specialist: Readonly<{
        readonly format: "canonical";
        readonly identifierKind: "brain";
    }>;
    method: Readonly<{
        readonly format: "canonical";
        readonly identifierKind: "method";
    }>;
    learningPacket: Readonly<{
        readonly format: "canonical";
        readonly identifierKind: "learning";
    }>;
    promotion: Readonly<{
        readonly format: "canonical";
        readonly identifierKind: "promotion";
    }>;
    evaluator: Readonly<{
        readonly format: "namespaced";
        readonly namespace: "evaluator:";
    }>;
    ontologyVersion: Readonly<{
        readonly format: "canonical";
        readonly identifierKind: "module";
    }>;
    procedure: Readonly<{
        readonly format: "canonical";
        readonly identifierKind: "method";
    }>;
    intelligenceState: Readonly<{
        readonly format: "canonical";
        readonly identifierKind: "asset";
        readonly compatibleIdentifierKinds: readonly ["checkpoint"];
    }>;
}>;
export declare const P1_1_INTELLIGENCE_STATE_VOCABULARIES: Readonly<{
    specialist: readonly ["active", "suspended", "retired"];
    method: readonly ["experimental", "active", "deprecated", "retired"];
    learningPacket: readonly ["submitted", "validated", "contradicted", "stale", "invalid", "retracted"];
    promotion: readonly ["classified", "promoted", "quarantined", "rejected", "alternative", "deprecated", "retracted"];
    evaluator: readonly ["active", "inactive"];
    ontologyVersion: readonly ["current", "historical", "stale", "superseded"];
    procedure: readonly ["experimental", "active", "deprecated", "retired"];
    intelligenceState: readonly ("verified" | "recorded" | "superseded" | "invalidated")[];
}>;
export type IntelligenceIdentityKind = keyof typeof P1_1_INTELLIGENCE_IDENTITY_SCHEMAS;
export interface IntelligenceIdentity {
    readonly schemaVersion: typeof P1_1_INTELLIGENCE_IDENTITY_VERSION;
    readonly kind: IntelligenceIdentityKind;
    readonly id: string;
    readonly version: number;
    readonly state: string;
}
export declare function validateIntelligenceIdentitySchema(): true;
/** Validate and snapshot a versioned reference without coercing IDs, versions, or state. */
export declare function validateIntelligenceIdentity(input: unknown): IntelligenceIdentity;
export declare function intelligenceIdentityKey(input: unknown): string;
