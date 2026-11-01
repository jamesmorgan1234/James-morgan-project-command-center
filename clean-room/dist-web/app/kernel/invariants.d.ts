export declare const LEGACY_IMPORT_MARKERS: readonly ["../legacy", "/legacy/", "old-agent", "cc7_agent_", "AUTHORITATIVE_UI_RENDERER_FIX_NOTE"];
export declare function assertNoLegacyRuntimeImports(importSpecifiers: readonly string[]): void;
export declare function assertSingleOwners(owners: Readonly<Record<string, readonly string[]>>): void;
