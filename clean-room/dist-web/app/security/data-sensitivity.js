/**
 * Data sensitivity and minimization.
 *
 * Four classes (public, private, sensitive, secret), per-surface projection that
 * minimizes sensitive values, explicit export and clipboard controls, refusal to
 * store credentials as notes or memory, no service-role keys in the client,
 * per-role privacy boundaries and final owner control.
 */
export const SENSITIVITY_CLASSES = Object.freeze(["public", "private", "sensitive", "secret"]);
export function classifyDataField(key, classification) {
    if (!key.trim())
        throw new Error("A data field requires a key");
    if (!SENSITIVITY_CLASSES.includes(classification))
        throw new Error(`Unknown sensitivity class: ${classification}`);
    return Object.freeze({ key, classification, exportable: classification === "sensitive" });
}
export function projectForSurface(fields, surface, options = {}) {
    return Object.freeze(fields.map((field) => {
        const explicit = options.explicitExport === true && surface === "export" && field.classification === "sensitive" && field.exportable !== false;
        let redacted = false;
        if (field.classification === "secret")
            redacted = true;
        else if (field.classification === "sensitive")
            redacted = !explicit;
        else if (field.classification === "private")
            redacted = surface === "notifications";
        return Object.freeze({ key: field.key, classification: field.classification, redacted });
    }));
}
export function clipboardProjection(field, confirmed) {
    if (field.classification === "secret")
        throw new Error("Secret values cannot be copied to the clipboard");
    const redacted = field.classification === "sensitive" && !confirmed;
    return Object.freeze({ key: field.key, classification: field.classification, redacted });
}
export function assertNotStoredAsNote(field) {
    if (field.classification === "secret" || field.kind === "mfa_secret")
        throw new Error("Secret credentials cannot be stored as normal project notes");
}
export function assertNotBrainMemory(field) {
    if (field.classification === "secret" || field.kind === "api_token")
        throw new Error("Credentials cannot be stored in Brain memory");
}
export function assertNoServiceRoleKeyInClient(text) {
    if (/\bservice_role\b|SUPABASE_SERVICE_ROLE_KEY/.test(text))
        throw new Error("Service-role keys must never appear in client code");
}
export function assertWithinBoundary(boundary, field) {
    if (!boundary.allowedClasses.includes(field.classification))
        throw new Error(`Role ${boundary.role} cannot access ${field.classification} data`);
}
export function assertOwnerControl(actor) {
    if (actor !== "owner")
        throw new Error("Owner retains final control of all canonical data");
}
//# sourceMappingURL=data-sensitivity.js.map