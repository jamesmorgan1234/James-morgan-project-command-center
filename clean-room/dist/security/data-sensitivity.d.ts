/**
 * Data sensitivity and minimization.
 *
 * Four classes (public, private, sensitive, secret), per-surface projection that
 * minimizes sensitive values, explicit export and clipboard controls, refusal to
 * store credentials as notes or memory, no service-role keys in the client,
 * per-role privacy boundaries and final owner control.
 */
export type SensitivityClass = "public" | "private" | "sensitive" | "secret";
export declare const SENSITIVITY_CLASSES: readonly SensitivityClass[];
export interface DataField {
    readonly key: string;
    readonly classification: SensitivityClass;
    readonly exportable?: boolean;
}
export declare function classifyDataField(key: string, classification: SensitivityClass): DataField;
export type Surface = "brain_context" | "logs" | "notifications" | "export" | "clipboard";
export interface ProjectedField {
    readonly key: string;
    readonly classification: SensitivityClass;
    readonly redacted: boolean;
}
export declare function projectForSurface(fields: readonly DataField[], surface: Surface, options?: {
    explicitExport?: boolean;
}): readonly ProjectedField[];
export declare function clipboardProjection(field: DataField, confirmed: boolean): ProjectedField;
export type CredentialKind = "mfa_secret" | "api_token" | "service_role_key" | "password";
export declare function assertNotStoredAsNote(field: {
    kind: CredentialKind;
    classification: SensitivityClass;
}): void;
export declare function assertNotBrainMemory(field: {
    kind: CredentialKind;
    classification: SensitivityClass;
}): void;
export declare function assertNoServiceRoleKeyInClient(text: string): void;
export interface RoleBoundary {
    readonly role: string;
    readonly allowedClasses: readonly SensitivityClass[];
}
export declare function assertWithinBoundary(boundary: RoleBoundary, field: DataField): void;
export declare function assertOwnerControl(actor: string): void;
