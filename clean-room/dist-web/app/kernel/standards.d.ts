/**
 * Engineering standards.
 *
 * Shared utilities limited to primitives, no domain logic in generic utilities,
 * naming and folder stability, private internal imports refused, scoped CSS,
 * centralized design tokens, controlled dynamic styles, and no duplicated
 * z-index, spacing, color, breakpoint, status-color, transition or state labels.
 */
export declare function assertSharedUtility(entry: {
    readonly name: string;
    readonly kind: "primitive" | "domain";
}): void;
export declare function assertNaming(name: string, convention: "camelCase" | "PascalCase" | "kebab-case"): void;
export declare function assertStableFolders(actual: readonly string[], expected: readonly string[]): void;
export declare function assertNoPrivateImport(target: string): void;
export declare function assertNoCrossModuleSelector(selector: string, scope: string): void;
export declare function assertScopedCss(selector: string): void;
export declare function assertTokenSource(source: "token" | "inline"): void;
export declare function assertInlineStyle(style: {
    readonly dynamic: boolean;
}): void;
export declare function assertControlledStyleApi(style: {
    readonly viaApi: boolean;
}): void;
export declare function assertTokenValue(kind: string, value: number, tokens: readonly number[]): void;
export declare function assertNoDuplicates(kind: string, values: readonly string[]): void;
export declare function assertNoDuplicateStatusColors(statuses: readonly {
    readonly status: string;
    readonly color: string;
}[]): void;
export declare function assertNoDuplicateLabels(domain: string, labels: readonly {
    readonly key: string;
    readonly value: string;
}[]): void;
