export const ASSURANCE_LEVELS = ["anonymous", "authenticated", "passkey_uv", "fresh_passkey_uv"];
const ASSURANCE_RANK = Object.freeze({
    anonymous: 0,
    authenticated: 1,
    passkey_uv: 2,
    fresh_passkey_uv: 3
});
export function assuranceAtLeast(actual, required) {
    return ASSURANCE_RANK[actual] >= ASSURANCE_RANK[required];
}
export function parseTimestamp(value, label) {
    const parsed = Date.parse(value);
    if (!Number.isFinite(parsed))
        throw new Error(`${label} must be an ISO-compatible timestamp`);
    return parsed;
}
//# sourceMappingURL=types.js.map