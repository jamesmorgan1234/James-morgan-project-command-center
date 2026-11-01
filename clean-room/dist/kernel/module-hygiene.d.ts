/**
 * Module hygiene.
 *
 * Small cohesive modules, no giant application file, clear domain boundaries,
 * pure domain functions, isolated side effects, no hidden singletons, explicit
 * initialization and teardown, no import-time DOM or side effects, no circular
 * imports, and detection of dead code, unused exports and duplicate utilities.
 */
export interface ModuleProfile {
    readonly path: string;
    readonly lines: number;
    readonly exports: number;
    readonly responsibilities: number;
    readonly domain: string;
}
export interface ModuleAssessment {
    readonly cohesive: boolean;
    readonly reasons: readonly string[];
}
export declare function assessModule(profile: ModuleProfile): ModuleAssessment;
export declare function assertNotGiantFile(lines: number): void;
export declare function assertDomainBoundary(moduleDomain: string, importDomain: string): void;
export declare function classifyFunction(fn: {
    readonly sideEffects: boolean;
}): "pure" | "effectful";
export declare function assertSideEffectsIsolated(location: "domain" | "adapter" | "entry", sideEffects: readonly string[]): void;
export declare function assertNoHiddenSingleton(state: {
    readonly global: boolean;
    readonly deliberateService: boolean;
}): void;
export declare function initializeApp(hooks: {
    readonly initialize?: () => void;
}): void;
export declare function teardownApp(hooks: {
    readonly destroy?: () => void;
}): void;
export declare function assertNoImportTimeDom(profile: {
    readonly touchesDomAtImport: boolean;
}): void;
export declare function assertNoImportSideEffects(profile: {
    readonly designated: boolean;
    readonly sideEffects: readonly string[];
}): void;
export declare function detectCycles(graph: Readonly<Record<string, readonly string[]>>): readonly (readonly string[])[];
export declare function assertNoCycles(graph: Readonly<Record<string, readonly string[]>>): void;
export declare function detectDeadCode(symbols: readonly {
    readonly name: string;
    readonly referenced: boolean;
}[]): readonly string[];
export declare function detectUnusedExports(exports: readonly string[], usages: readonly string[]): readonly string[];
export declare function detectDuplicateUtilities(fingerprints: readonly {
    readonly name: string;
    readonly fingerprint: string;
}[]): readonly (readonly string[])[];
