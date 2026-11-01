/**
 * Canonical vocabulary and taxonomies.
 *
 * One glossary with one meaning per term, a shared state vocabulary across
 * database, frontend, Brain, Agent and tests, and canonical error, blocker,
 * authorization, risk and evidence taxonomies.
 */
export declare const CANONICAL_TERMS: Readonly<Record<string, string>>;
export declare function glossaryTerm(term: string): string;
export declare function assertSharedVocabulary(surfaces: readonly Readonly<Record<string, string>>[]): void;
export type TaxonomyKind = "error" | "blocker" | "authorization" | "risk" | "evidence";
export interface TaxonomyEntry {
    readonly code: string;
    readonly description: string;
}
export interface Taxonomy {
    readonly kind: TaxonomyKind;
    readonly entries: readonly TaxonomyEntry[];
}
export declare function defineTaxonomy(kind: TaxonomyKind, entries: readonly TaxonomyEntry[]): Taxonomy;
export declare function taxonomyLookup(taxonomy: Taxonomy, code: string): TaxonomyEntry;
export declare function assertTaxonomyComplete(taxonomy: Taxonomy, required: readonly string[]): void;
