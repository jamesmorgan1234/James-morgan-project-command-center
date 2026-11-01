/**
 * Engineering standards.
 *
 * Shared utilities limited to primitives, no domain logic in generic utilities,
 * naming and folder stability, private internal imports refused, scoped CSS,
 * centralized design tokens, controlled dynamic styles, and no duplicated
 * z-index, spacing, color, breakpoint, status-color, transition or state labels.
 */

export function assertSharedUtility(entry: { readonly name: string; readonly kind: "primitive" | "domain" }): void {
  if (entry.kind === "domain") throw new Error(`Domain logic must not live in the shared utility library: ${entry.name}`);
}

export function assertNaming(name: string, convention: "camelCase" | "PascalCase" | "kebab-case"): void {
  const pattern = convention === "camelCase" ? /^[a-z][A-Za-z0-9]*$/ : convention === "PascalCase" ? /^[A-Z][A-Za-z0-9]*$/ : /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;
  if (!pattern.test(name)) throw new Error(`Name does not follow ${convention}: ${name}`);
}

export function assertStableFolders(actual: readonly string[], expected: readonly string[]): void {
  const left = [...actual].sort().join(",");
  const right = [...expected].sort().join(",");
  if (left !== right) throw new Error("Folder structure diverged from the approved layout");
}

export function assertNoPrivateImport(target: string): void {
  if (/(?:^|\/)internal(?:\/|$)/.test(target)) throw new Error(`Private internals cannot be imported cross-module: ${target}`);
}

export function assertNoCrossModuleSelector(selector: string, scope: string): void {
  const modules = [...selector.matchAll(/\[data-module="([a-z0-9-]+)"\]/g)].map((match) => match[1]).filter((value): value is string => value !== undefined);
  const foreign = modules.filter((module) => module !== scope);
  if (foreign.length > 0) throw new Error(`Selector reaches into another module: ${foreign.join(", ")}`);
}

export function assertScopedCss(selector: string): void {
  if (!/^\[data-module="[a-z0-9-]+"\]/.test(selector)) throw new Error("CSS must be scoped to a module");
}

export function assertTokenSource(source: "token" | "inline"): void {
  if (source !== "token") throw new Error("Design values must come from centralized tokens");
}

export function assertInlineStyle(style: { readonly dynamic: boolean }): void {
  if (!style.dynamic) throw new Error("Inline styles are only permitted for deliberate dynamic values");
}

export function assertControlledStyleApi(style: { readonly viaApi: boolean }): void {
  if (!style.viaApi) throw new Error("Dynamic styles must pass through a controlled component API");
}

export function assertTokenValue(kind: string, value: number, tokens: readonly number[]): void {
  if (!tokens.includes(value)) throw new Error(`${kind} value must come from tokens: ${value}`);
}

export function assertNoDuplicates(kind: string, values: readonly string[]): void {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) duplicates.add(value);
    seen.add(value);
  }
  if (duplicates.size > 0) throw new Error(`Duplicated ${kind}: ${[...duplicates].join(", ")}`);
}

export function assertNoDuplicateStatusColors(statuses: readonly { readonly status: string; readonly color: string }[]): void {
  assertNoDuplicates("status color", statuses.map((entry) => entry.color));
}

export function assertNoDuplicateLabels(domain: string, labels: readonly { readonly key: string; readonly value: string }[]): void {
  assertNoDuplicates(`${domain} state label`, labels.map((entry) => entry.value));
}
