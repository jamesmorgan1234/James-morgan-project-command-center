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

export function assessModule(profile: ModuleProfile): ModuleAssessment {
  const reasons: string[] = [];
  if (profile.responsibilities > 1) reasons.push("multiple_responsibilities");
  if (profile.lines > 300) reasons.push("too_many_lines");
  if (profile.exports > 20) reasons.push("too_many_exports");
  return Object.freeze({ cohesive: reasons.length === 0, reasons: Object.freeze(reasons) });
}

export function assertNotGiantFile(lines: number): void {
  if (!Number.isSafeInteger(lines) || lines < 0) throw new Error("Line count must be a nonnegative integer");
  if (lines > 500) throw new Error("A single application file must not exceed 500 lines");
}

export function assertDomainBoundary(moduleDomain: string, importDomain: string): void {
  if (!moduleDomain.trim() || !importDomain.trim()) throw new Error("Domains must be nonblank");
  if (moduleDomain !== importDomain && importDomain !== "shared" && importDomain !== "kernel") {
    throw new Error(`Cross-domain import is not permitted: ${moduleDomain} -> ${importDomain}`);
  }
}

export function classifyFunction(fn: { readonly sideEffects: boolean }): "pure" | "effectful" {
  return fn.sideEffects ? "effectful" : "pure";
}

export function assertSideEffectsIsolated(location: "domain" | "adapter" | "entry", sideEffects: readonly string[]): void {
  if (location === "domain" && sideEffects.length > 0) throw new Error("Domain functions must not perform side effects");
}

export function assertNoHiddenSingleton(state: { readonly global: boolean; readonly deliberateService: boolean }): void {
  if (state.global && !state.deliberateService) throw new Error("Hidden singleton state is not permitted");
}

export function initializeApp(hooks: { readonly initialize?: () => void }): void {
  if (typeof hooks.initialize !== "function") throw new Error("Application initialization must be explicit");
  hooks.initialize();
}

export function teardownApp(hooks: { readonly destroy?: () => void }): void {
  if (typeof hooks.destroy !== "function") throw new Error("Application teardown must be explicit");
  hooks.destroy();
}

export function assertNoImportTimeDom(profile: { readonly touchesDomAtImport: boolean }): void {
  if (profile.touchesDomAtImport) throw new Error("A module must not require the DOM during import");
}

export function assertNoImportSideEffects(profile: { readonly designated: boolean; readonly sideEffects: readonly string[] }): void {
  if (profile.sideEffects.length > 0 && !profile.designated) throw new Error("Importing a module must not cause side effects");
}

export function detectCycles(graph: Readonly<Record<string, readonly string[]>>): readonly (readonly string[])[] {
  const cycles: string[][] = [];
  const color = new Map<string, number>();
  const stack: string[] = [];
  const visit = (node: string): void => {
    color.set(node, 1);
    stack.push(node);
    for (const next of graph[node] ?? []) {
      const state = color.get(next) ?? 0;
      if (state === 0) visit(next);
      else if (state === 1) {
        const index = stack.indexOf(next);
        cycles.push([...stack.slice(index), next]);
      }
    }
    stack.pop();
    color.set(node, 2);
  };
  for (const node of Object.keys(graph)) if ((color.get(node) ?? 0) === 0) visit(node);
  return Object.freeze(cycles.map((cycle) => Object.freeze(cycle)));
}

export function assertNoCycles(graph: Readonly<Record<string, readonly string[]>>): void {
  const cycles = detectCycles(graph);
  const first = cycles[0];
  if (first !== undefined) throw new Error(`Circular import detected: ${first.join(" -> ")}`);
}

export function detectDeadCode(symbols: readonly { readonly name: string; readonly referenced: boolean }[]): readonly string[] {
  return Object.freeze(symbols.filter((symbol) => !symbol.referenced).map((symbol) => symbol.name));
}

export function detectUnusedExports(exports: readonly string[], usages: readonly string[]): readonly string[] {
  return Object.freeze(exports.filter((name) => !usages.includes(name)));
}

export function detectDuplicateUtilities(fingerprints: readonly { readonly name: string; readonly fingerprint: string }[]): readonly (readonly string[])[] {
  const groups = new Map<string, string[]>();
  for (const entry of fingerprints) {
    const group = groups.get(entry.fingerprint) ?? [];
    group.push(entry.name);
    groups.set(entry.fingerprint, group);
  }
  return Object.freeze([...groups.values()].filter((group) => group.length > 1).map((group) => Object.freeze(group)));
}
