import { known, unknown } from "../data/canonical.js";
const SURFACES = Object.freeze([
    { key: "home", label: "Home" },
    { key: "projects", label: "Projects" },
    { key: "brain", label: "Brain" },
    { key: "agency", label: "Agency" },
    { key: "needs-me", label: "Needs Me" },
    { key: "search", label: "Search" },
    { key: "automations", label: "Automations" },
    { key: "personal", label: "Personal" },
    { key: "finance", label: "Finance" },
    { key: "social", label: "Social & Communications" },
    { key: "books", label: "Books" },
    { key: "specialists", label: "Specialists" },
    { key: "analytics", label: "Analytics" },
    { key: "settings", label: "Settings" }
]);
function nowIso() { return new Date().toISOString(); }
export function createDisconnectedRuntimeSnapshot(providerId = "runtime:disconnected", generatedAt = nowIso()) {
    return Object.freeze({
        schemaVersion: "cc-runtime-snapshot-v1",
        generatedAt,
        connection: Object.freeze({
            state: "disconnected",
            providerId,
            message: "Canonical runtime data is not connected. Current values remain unavailable rather than being fabricated.",
            lastSuccessfulSyncAt: unknown()
        }),
        owner: Object.freeze({ displayName: unknown() }),
        projects: Object.freeze([]),
        surfaces: Object.freeze(SURFACES.map((surface) => Object.freeze({
            ...surface,
            availability: "disconnected",
            summary: unknown(),
            evidence: Object.freeze([])
        }))),
        release: Object.freeze({ releaseId: unknown(), knownGoodReleaseId: unknown() })
    });
}
export function createFixtureRuntimeSnapshot(overrides) {
    const base = createDisconnectedRuntimeSnapshot("runtime:test-fixture");
    return Object.freeze({
        ...base,
        ...overrides,
        connection: overrides?.connection ?? Object.freeze({
            state: "connected",
            providerId: "runtime:test-fixture",
            message: "Explicit test fixture",
            lastSuccessfulSyncAt: known(base.generatedAt)
        })
    });
}
//# sourceMappingURL=snapshot.js.map