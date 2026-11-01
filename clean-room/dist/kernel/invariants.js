export const LEGACY_IMPORT_MARKERS = [
    "../legacy",
    "/legacy/",
    "old-agent",
    "cc7_agent_",
    "AUTHORITATIVE_UI_RENDERER_FIX_NOTE"
];
export function assertNoLegacyRuntimeImports(importSpecifiers) {
    const violations = importSpecifiers.filter((specifier) => LEGACY_IMPORT_MARKERS.some((marker) => specifier.includes(marker)));
    if (violations.length > 0)
        throw new Error(`Legacy runtime import prohibited: ${violations.join(",")}`);
}
export function assertSingleOwners(owners) {
    for (const [responsibility, candidates] of Object.entries(owners)) {
        if (candidates.length !== 1)
            throw new Error(`Responsibility ${responsibility} must have exactly one owner; got ${candidates.length}`);
    }
}
//# sourceMappingURL=invariants.js.map