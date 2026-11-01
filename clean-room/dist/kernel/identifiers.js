export const IDENTIFIER_SCHEMA_VERSION = 1;
export const ID_PREFIXES = {
    requirement: "req",
    project: "prj",
    company: "cmp",
    brain: "brn",
    domain: "dom",
    condition: "cnd",
    method: "mth",
    module: "mod",
    capability: "cap",
    command: "cmd",
    event: "evt",
    workflow: "wfl",
    agencyRun: "run",
    agencyJob: "job",
    agencyTask: "tsk",
    evidence: "evd",
    asset: "ast",
    provider: "pvd",
    release: "rel",
    decision: "dec",
    rule: "rul",
    lineage: "lin",
    checkpoint: "chk",
    conversation: "cnv",
    contextPacket: "ctx",
    learning: "lrn",
    promotion: "prm"
};
export const P1_1_REQUIRED_IDENTIFIER_KINDS = [
    "requirement",
    "project",
    "module",
    "capability",
    "command",
    "event",
    "workflow",
    "agencyRun",
    "agencyJob",
    "evidence",
    "asset",
    "provider",
    "release",
    "decision",
    "rule",
    "lineage"
];
const KIND_BY_PREFIX = Object.freeze(Object.fromEntries(Object.entries(ID_PREFIXES).map(([kind, prefix]) => [prefix, kind])));
const TOKEN_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const CANONICAL_ID_PATTERN = /^([a-z]{3})_([a-z0-9]+(?:-[a-z0-9]+)*)$/;
export function validateIdentifierSchema() {
    if (!Number.isSafeInteger(IDENTIFIER_SCHEMA_VERSION) || IDENTIFIER_SCHEMA_VERSION < 1)
        throw new Error("Identifier schema version must be a positive safe integer");
    const prefixes = Object.values(ID_PREFIXES);
    if (new Set(prefixes).size !== prefixes.length)
        throw new Error("Identifier prefixes must be unique");
    for (const [kind, prefix] of Object.entries(ID_PREFIXES)) {
        if (!/^[a-z]{3}$/.test(prefix))
            throw new Error(`Invalid identifier prefix for ${kind}: ${prefix}`);
    }
    for (const kind of P1_1_REQUIRED_IDENTIFIER_KINDS) {
        if (!ID_PREFIXES[kind])
            throw new Error(`P1.1 required identifier kind is missing: ${kind}`);
    }
    return true;
}
export function createIdentifier(kind, token) {
    const prefix = ID_PREFIXES[kind];
    if (!prefix)
        throw new Error(`Unknown identifier kind: ${String(kind)}`);
    const normalized = token.trim().toLowerCase();
    if (!TOKEN_PATTERN.test(normalized))
        throw new Error(`Invalid identifier token: ${token}`);
    return `${prefix}_${normalized}`;
}
export function parseIdentifier(value) {
    const match = CANONICAL_ID_PATTERN.exec(value);
    if (!match)
        throw new Error(`Invalid canonical identifier: ${value}`);
    const prefix = match[1];
    const token = match[2];
    const kind = KIND_BY_PREFIX[prefix];
    if (!kind)
        throw new Error(`Unknown identifier prefix: ${prefix}`);
    return Object.freeze({ kind, prefix, token, value });
}
export function assertIdentifierKind(value, expected) {
    const parsed = parseIdentifier(value);
    if (parsed.kind !== expected)
        throw new Error(`Identifier ${value} is ${parsed.kind}, expected ${expected}`);
    return value;
}
validateIdentifierSchema();
//# sourceMappingURL=identifiers.js.map