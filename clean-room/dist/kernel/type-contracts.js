/**
 * Type contracts.
 *
 * Strict compiler and lint settings, no unjustified any escape hatches on
 * critical contracts, schema-driven validation, generated types, database and
 * client type synchronization, contract-drift CI failure, versioned foundation
 * rules and explicit architecture review for foundation changes.
 */
const FIELD_TYPES = Object.freeze(["string", "number", "boolean", "object", "array"]);
export function assertStrictSettings(settings) {
    if (!settings.strict)
        throw new Error("Strict compiler settings are required");
    if (!settings.noImplicitAny)
        throw new Error("Implicit any must be disabled");
    if (!settings.lintErrors)
        throw new Error("Lint errors must fail the build");
}
export function assertNoAnyEscape(use) {
    if (use.any && !use.justification?.trim())
        throw new Error("An any escape hatch on a critical contract requires justification");
}
export function validateSchema(schema) {
    if (!schema.name.trim() || schema.fields.length === 0)
        throw new Error("A schema requires a name and at least one field");
    const names = new Set();
    for (const field of schema.fields) {
        if (!field.name.trim())
            throw new Error("Schema fields require a name");
        if (names.has(field.name))
            throw new Error(`Duplicate schema field: ${field.name}`);
        names.add(field.name);
        if (!FIELD_TYPES.includes(field.type))
            throw new Error(`Unknown field type: ${field.type}`);
    }
    return Object.freeze({ name: schema.name, fields: Object.freeze(schema.fields.map((field) => Object.freeze({ ...field }))) });
}
export function generateSchemaType(schema) {
    const validated = validateSchema(schema);
    const fields = validated.fields.map((field) => `  ${field.name}${field.required ? "" : "?"}: ${field.type};`).join("\n");
    return `export interface ${validated.name} {\n${fields}\n}`;
}
export function assertTypeSync(generated, database) {
    if (generated.trim() !== database.trim())
        throw new Error("Database and client types have drifted");
}
export function assertNoContractDrift(previous, current) {
    if (previous !== current)
        throw new Error("Contract drift must fail CI");
}
export function assertFoundationRulesVersioned(rules) {
    if (!rules.version.trim())
        throw new Error("Foundation rules require a version");
    if (Number.isNaN(Date.parse(rules.effectiveAt)))
        throw new Error("Foundation rules require a valid effective date");
}
export function requireArchitectureReview(change) {
    if (change.touchesFoundation && !change.reviews.includes("architecture"))
        throw new Error("Foundation changes require explicit architecture review");
}
//# sourceMappingURL=type-contracts.js.map