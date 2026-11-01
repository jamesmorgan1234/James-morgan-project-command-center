import { assertIdentifierKind, ID_PREFIXES, parseIdentifier, validateIdentifierSchema } from "./identifiers.js";
import { assertState, CHECKPOINT_STATES } from "./lifecycle.js";
/** Additive Roadmap-22 P1.1 contract; existing identifier and component versions retain their meanings. */
export const P1_1_INTELLIGENCE_IDENTITY_VERSION = 1;
// Reuse the actual existing owners: specialists are Brains, learned procedures are methods,
// ontology versions retain their module identity, and state artifacts retain asset/checkpoint identity.
// Evaluators retain their established evaluator: namespace; this contract never renames stored IDs.
export const P1_1_INTELLIGENCE_IDENTITY_SCHEMAS = Object.freeze({
    specialist: Object.freeze({ format: "canonical", identifierKind: "brain" }),
    method: Object.freeze({ format: "canonical", identifierKind: "method" }),
    learningPacket: Object.freeze({ format: "canonical", identifierKind: "learning" }),
    promotion: Object.freeze({ format: "canonical", identifierKind: "promotion" }),
    evaluator: Object.freeze({ format: "namespaced", namespace: "evaluator:" }),
    ontologyVersion: Object.freeze({ format: "canonical", identifierKind: "module" }),
    procedure: Object.freeze({ format: "canonical", identifierKind: "method" }),
    intelligenceState: Object.freeze({ format: "canonical", identifierKind: "asset", compatibleIdentifierKinds: Object.freeze(["checkpoint"]) })
});
// These are vocabulary contracts, not grants, transition engines, or permission to activate anything.
// Procedure status follows its canonical method owner; evaluator state reflects its existing active flag.
export const P1_1_INTELLIGENCE_STATE_VOCABULARIES = Object.freeze({
    specialist: Object.freeze(["active", "suspended", "retired"]),
    method: Object.freeze(["experimental", "active", "deprecated", "retired"]),
    learningPacket: Object.freeze(["submitted", "validated", "contradicted", "stale", "invalid", "retracted"]),
    promotion: Object.freeze(["classified", "promoted", "quarantined", "rejected", "alternative", "deprecated", "retracted"]),
    evaluator: Object.freeze(["active", "inactive"]),
    ontologyVersion: Object.freeze(["current", "historical", "stale", "superseded"]),
    procedure: Object.freeze(["experimental", "active", "deprecated", "retired"]),
    intelligenceState: Object.freeze([...CHECKPOINT_STATES])
});
export function validateIntelligenceIdentitySchema() {
    validateIdentifierSchema();
    const domains = Object.keys(P1_1_INTELLIGENCE_IDENTITY_SCHEMAS);
    if (domains.length !== 8 || domains.join("|") !== Object.keys(P1_1_INTELLIGENCE_STATE_VOCABULARIES).join("|")) {
        throw new Error("P1.1 intelligence identity/state schema domains disagree");
    }
    for (const kind of domains) {
        const schema = P1_1_INTELLIGENCE_IDENTITY_SCHEMAS[kind];
        if (schema.format === "canonical" && !Object.hasOwn(ID_PREFIXES, schema.identifierKind))
            throw new Error("Unknown intelligence identifier kind");
        const states = P1_1_INTELLIGENCE_STATE_VOCABULARIES[kind];
        if (!states.length || new Set(states).size !== states.length || states.some((state) => !state.trim())) {
            throw new Error(`Invalid intelligence state vocabulary: ${kind}`);
        }
    }
    return true;
}
/** Validate and snapshot a versioned reference without coercing IDs, versions, or state. */
export function validateIntelligenceIdentity(input) {
    if (!input || typeof input !== "object" || Array.isArray(input))
        throw new Error("Intelligence identity object required");
    const record = input;
    if (Object.keys(record).some((key) => !["schemaVersion", "kind", "id", "version", "state"].includes(key))) {
        throw new Error("Unknown intelligence identity field");
    }
    if (record.schemaVersion !== P1_1_INTELLIGENCE_IDENTITY_VERSION)
        throw new Error("Unsupported intelligence identity schema");
    if (typeof record.kind !== "string" || !Object.hasOwn(P1_1_INTELLIGENCE_IDENTITY_SCHEMAS, record.kind))
        throw new Error("Unknown intelligence identity kind");
    const kind = record.kind;
    if (typeof record.id !== "string" || !record.id.length || record.id !== record.id.trim())
        throw new Error("Invalid intelligence identity");
    const schema = P1_1_INTELLIGENCE_IDENTITY_SCHEMAS[kind];
    if (schema.format === "canonical") {
        if ("compatibleIdentifierKinds" in schema) {
            const parsed = parseIdentifier(record.id);
            if (parsed.kind !== schema.identifierKind && !schema.compatibleIdentifierKinds.includes(parsed.kind)) {
                throw new Error("Intelligence artifact identity expected asset or checkpoint");
            }
        }
        else
            assertIdentifierKind(record.id, schema.identifierKind);
    }
    else if (!/^evaluator:[A-Za-z0-9][A-Za-z0-9._:-]*$/.test(record.id))
        throw new Error("Invalid evaluator identity");
    if (typeof record.version !== "number" || !Number.isSafeInteger(record.version) || record.version < 1)
        throw new Error("Invalid intelligence identity version");
    if (typeof record.state !== "string")
        throw new Error("Explicit intelligence state required");
    const state = assertState(record.state, P1_1_INTELLIGENCE_STATE_VOCABULARIES[kind], `intelligence ${kind}`);
    return Object.freeze({ schemaVersion: P1_1_INTELLIGENCE_IDENTITY_VERSION, kind, id: record.id, version: record.version, state });
}
export function intelligenceIdentityKey(input) {
    const identity = validateIntelligenceIdentity(input);
    return JSON.stringify([identity.kind, identity.id, identity.version]);
}
validateIntelligenceIdentitySchema();
//# sourceMappingURL=intelligence-identity.js.map