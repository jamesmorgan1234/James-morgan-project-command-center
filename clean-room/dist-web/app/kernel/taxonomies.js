/**
 * Canonical vocabulary and taxonomies.
 *
 * One glossary with one meaning per term, a shared state vocabulary across
 * database, frontend, Brain, Agent and tests, and canonical error, blocker,
 * authorization, risk and evidence taxonomies.
 */
export const CANONICAL_TERMS = Object.freeze({
    Project: "A body of work with one owner and one roadmap.",
    Run: "One execution of an agent against a task.",
    Task: "A unit of work inside a run.",
    Checkpoint: "A durable, verified resume pointer.",
    Verified: "Backed by current source, test and evidence bindings.",
    Ready: "Preconditions satisfied and no blocking dependency."
});
export function glossaryTerm(term) {
    const value = CANONICAL_TERMS[term];
    if (value === undefined)
        throw new Error(`Unknown canonical term: ${term}`);
    return value;
}
export function assertSharedVocabulary(surfaces) {
    if (surfaces.length < 2)
        throw new Error("At least two surfaces are required");
    const first = JSON.stringify(surfaces[0]);
    for (const surface of surfaces)
        if (JSON.stringify(surface) !== first)
            throw new Error("Canonical state vocabulary must match across surfaces");
}
export function defineTaxonomy(kind, entries) {
    if (entries.length === 0)
        throw new Error(`A ${kind} taxonomy requires entries`);
    const seen = new Set();
    for (const entry of entries) {
        if (!/^[a-z][a-z0-9_]*$/.test(entry.code))
            throw new Error(`Invalid ${kind} code: ${entry.code}`);
        if (!entry.description.trim())
            throw new Error(`A ${kind} entry requires a description`);
        if (seen.has(entry.code))
            throw new Error(`Duplicate ${kind} code: ${entry.code}`);
        seen.add(entry.code);
    }
    return Object.freeze({ kind, entries: Object.freeze(entries.map((entry) => Object.freeze({ ...entry }))) });
}
export function taxonomyLookup(taxonomy, code) {
    const found = taxonomy.entries.find((entry) => entry.code === code);
    if (!found)
        throw new Error(`Unknown ${taxonomy.kind} code: ${code}`);
    return found;
}
export function assertTaxonomyComplete(taxonomy, required) {
    const missing = required.filter((code) => !taxonomy.entries.some((entry) => entry.code === code));
    if (missing.length > 0)
        throw new Error(`Missing ${taxonomy.kind} codes: ${missing.join(", ")}`);
}
//# sourceMappingURL=taxonomies.js.map