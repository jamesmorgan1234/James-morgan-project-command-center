/**
 * Type contracts.
 *
 * Strict compiler and lint settings, no unjustified any escape hatches on
 * critical contracts, schema-driven validation, generated types, database and
 * client type synchronization, contract-drift CI failure, versioned foundation
 * rules and explicit architecture review for foundation changes.
 */
export type FieldType = "string" | "number" | "boolean" | "object" | "array";
export interface SchemaField {
    readonly name: string;
    readonly type: FieldType;
    readonly required: boolean;
}
export interface Schema {
    readonly name: string;
    readonly fields: readonly SchemaField[];
}
export declare function assertStrictSettings(settings: {
    readonly strict: boolean;
    readonly noImplicitAny: boolean;
    readonly lintErrors: boolean;
}): void;
export declare function assertNoAnyEscape(use: {
    readonly any: boolean;
    readonly justification?: string;
}): void;
export declare function validateSchema(schema: Schema): Schema;
export declare function generateSchemaType(schema: Schema): string;
export declare function assertTypeSync(generated: string, database: string): void;
export declare function assertNoContractDrift(previous: string, current: string): void;
export declare function assertFoundationRulesVersioned(rules: {
    readonly version: string;
    readonly effectiveAt: string;
}): void;
export declare function requireArchitectureReview(change: {
    readonly touchesFoundation: boolean;
    readonly reviews: readonly string[];
}): void;
