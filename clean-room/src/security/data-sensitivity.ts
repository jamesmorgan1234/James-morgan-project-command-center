/**
 * Data sensitivity and minimization.
 *
 * Four classes (public, private, sensitive, secret), per-surface projection that
 * minimizes sensitive values, explicit export and clipboard controls, refusal to
 * store credentials as notes or memory, no service-role keys in the client,
 * per-role privacy boundaries and final owner control.
 */

export type SensitivityClass = "public" | "private" | "sensitive" | "secret";
export const SENSITIVITY_CLASSES: readonly SensitivityClass[] = Object.freeze(["public", "private", "sensitive", "secret"]);

export interface DataField {
  readonly key: string;
  readonly classification: SensitivityClass;
  readonly exportable?: boolean;
}

export function classifyDataField(key: string, classification: SensitivityClass): DataField {
  if (!key.trim()) throw new Error("A data field requires a key");
  if (!SENSITIVITY_CLASSES.includes(classification)) throw new Error(`Unknown sensitivity class: ${classification}`);
  return Object.freeze({ key, classification, exportable: classification === "sensitive" });
}

export type Surface = "brain_context" | "logs" | "notifications" | "export" | "clipboard";

export interface ProjectedField {
  readonly key: string;
  readonly classification: SensitivityClass;
  readonly redacted: boolean;
}

export function projectForSurface(fields: readonly DataField[], surface: Surface, options: { explicitExport?: boolean } = {}): readonly ProjectedField[] {
  return Object.freeze(fields.map((field) => {
    const explicit = options.explicitExport === true && surface === "export" && field.classification === "sensitive" && field.exportable !== false;
    let redacted = false;
    if (field.classification === "secret") redacted = true;
    else if (field.classification === "sensitive") redacted = !explicit;
    else if (field.classification === "private") redacted = surface === "notifications";
    return Object.freeze({ key: field.key, classification: field.classification, redacted });
  }));
}

export function clipboardProjection(field: DataField, confirmed: boolean): ProjectedField {
  if (field.classification === "secret") throw new Error("Secret values cannot be copied to the clipboard");
  const redacted = field.classification === "sensitive" && !confirmed;
  return Object.freeze({ key: field.key, classification: field.classification, redacted });
}

export type CredentialKind = "mfa_secret" | "api_token" | "service_role_key" | "password";

export function assertNotStoredAsNote(field: { kind: CredentialKind; classification: SensitivityClass }): void {
  if (field.classification === "secret" || field.kind === "mfa_secret") throw new Error("Secret credentials cannot be stored as normal project notes");
}

export function assertNotBrainMemory(field: { kind: CredentialKind; classification: SensitivityClass }): void {
  if (field.classification === "secret" || field.kind === "api_token") throw new Error("Credentials cannot be stored in Brain memory");
}

export function assertNoServiceRoleKeyInClient(text: string): void {
  if (/\bservice_role\b|SUPABASE_SERVICE_ROLE_KEY/.test(text)) throw new Error("Service-role keys must never appear in client code");
}

export interface RoleBoundary {
  readonly role: string;
  readonly allowedClasses: readonly SensitivityClass[];
}

export function assertWithinBoundary(boundary: RoleBoundary, field: DataField): void {
  if (!boundary.allowedClasses.includes(field.classification)) throw new Error(`Role ${boundary.role} cannot access ${field.classification} data`);
}

export function assertOwnerControl(actor: string): void {
  if (actor !== "owner") throw new Error("Owner retains final control of all canonical data");
}
