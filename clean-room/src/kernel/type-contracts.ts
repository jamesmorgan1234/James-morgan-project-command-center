/**
 * Type contracts.
 *
 * Strict compiler and lint settings, no unjustified any escape hatches on
 * critical contracts, schema-driven validation, generated types, database and
 * client type synchronization, contract-drift CI failure, versioned foundation
 * rules and explicit architecture review for foundation changes.
 */

export type FieldType = "string" | "number" | "boolean" | "object" | "array";
const FIELD_TYPES: readonly FieldType[] = Object.freeze(["string", "number", "boolean", "object", "array"]);

export interface SchemaField {
  readonly name: string;
  readonly type: FieldType;
  readonly required: boolean;
}

export interface Schema {
  readonly name: string;
  readonly fields: readonly SchemaField[];
}

export function assertStrictSettings(settings: { readonly strict: boolean; readonly noImplicitAny: boolean; readonly lintErrors: boolean }): void {
  if (!settings.strict) throw new Error("Strict compiler settings are required");
  if (!settings.noImplicitAny) throw new Error("Implicit any must be disabled");
  if (!settings.lintErrors) throw new Error("Lint errors must fail the build");
}

export function assertNoAnyEscape(use: { readonly any: boolean; readonly justification?: string }): void {
  if (use.any && !use.justification?.trim()) throw new Error("An any escape hatch on a critical contract requires justification");
}

export function validateSchema(schema: Schema): Schema {
  if (!schema.name.trim() || schema.fields.length === 0) throw new Error("A schema requires a name and at least one field");
  const names = new Set<string>();
  for (const field of schema.fields) {
    if (!field.name.trim()) throw new Error("Schema fields require a name");
    if (names.has(field.name)) throw new Error(`Duplicate schema field: ${field.name}`);
    names.add(field.name);
    if (!FIELD_TYPES.includes(field.type)) throw new Error(`Unknown field type: ${field.type}`);
  }
  return Object.freeze({ name: schema.name, fields: Object.freeze(schema.fields.map((field) => Object.freeze({ ...field }))) });
}

export function generateSchemaType(schema: Schema): string {
  const validated = validateSchema(schema);
  const fields = validated.fields.map((field) => `  ${field.name}${field.required ? "" : "?"}: ${field.type};`).join("\n");
  return `export interface ${validated.name} {\n${fields}\n}`;
}

export function assertTypeSync(generated: string, database: string): void {
  if (generated.trim() !== database.trim()) throw new Error("Database and client types have drifted");
}

export function assertNoContractDrift(previous: string, current: string): void {
  if (previous !== current) throw new Error("Contract drift must fail CI");
}

export function assertFoundationRulesVersioned(rules: { readonly version: string; readonly effectiveAt: string }): void {
  if (!rules.version.trim()) throw new Error("Foundation rules require a version");
  if (Number.isNaN(Date.parse(rules.effectiveAt))) throw new Error("Foundation rules require a valid effective date");
}

export function requireArchitectureReview(change: { readonly touchesFoundation: boolean; readonly reviews: readonly string[] }): void {
  if (change.touchesFoundation && !change.reviews.includes("architecture")) throw new Error("Foundation changes require explicit architecture review");
}
