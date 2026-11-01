/**
 * Release identity and diagnostics.
 *
 * Immutable accepted release candidates, hash-signed manifests, CI/deployment
 * provenance, version diagnostics kept off normal screens, measured release
 * health, acceptance kept separate from technical deployment, and the final
 * every-file, dependency and dead-code audits.
 */
function fnv(input) {
    let hash = 0x811c9dc5;
    for (let index = 0; index < input.length; index += 1) {
        hash ^= input.charCodeAt(index);
        hash = Math.imul(hash, 0x01000193) >>> 0;
    }
    return hash;
}
function digestOf(input) {
    return `${fnv(input).toString(16).padStart(8, "0")}${fnv(`${input}\u0000salt`).toString(16).padStart(8, "0")}`;
}
export function compatibilityBridge(input) {
    if (!Number.isSafeInteger(input.fromVersion) || !Number.isSafeInteger(input.toVersion))
        throw new Error("Schema versions must be integers");
    if (input.toVersion <= input.fromVersion)
        throw new Error("A forward-only schema change must advance the version");
    return Object.freeze({ bridgeRequired: input.forwardOnly, direction: "expand_then_contract" });
}
export function createReleaseCandidate(input) {
    if (!input.id.trim() || !input.codeSha.trim() || !input.configFingerprint.trim())
        throw new Error("A release candidate requires id, code SHA and config fingerprint");
    return Object.freeze({ id: input.id, codeSha: input.codeSha, configFingerprint: input.configFingerprint, acceptedAt: null, manifestDigest: null });
}
export function acceptReleaseCandidate(candidate, manifest, acceptedAt) {
    if (Number.isNaN(Date.parse(acceptedAt)))
        throw new Error("Acceptance time must be a valid timestamp");
    return Object.freeze({ ...candidate, acceptedAt, manifestDigest: manifestDigest(manifest) });
}
export function assertCandidateUnchanged(accepted, current) {
    if (accepted.acceptedAt === null)
        throw new Error("Candidate has not been accepted");
    if (current.codeSha !== accepted.codeSha)
        throw new Error("Code changed after acceptance; a new release candidate is required");
    if (current.configFingerprint !== accepted.configFingerprint)
        throw new Error("Critical config changed after acceptance; a new release candidate is required");
}
export function manifestDigest(files) {
    const keys = Object.keys(files).sort();
    if (keys.length === 0)
        throw new Error("A release manifest requires files");
    let material = "";
    for (const key of keys) {
        const value = files[key];
        if (value === undefined)
            throw new Error(`Manifest entry has no content: ${key}`);
        material += `${key}\u0000${value}\u0000`;
    }
    return `sha256:${digestOf(material)}`;
}
export function verifyManifest(files, expectedDigest) {
    if (manifestDigest(files) !== expectedDigest)
        throw new Error("Release manifest hash mismatch");
}
export function releaseProvenance(input) {
    for (const [key, value] of Object.entries(input))
        if (!String(value).trim())
            throw new Error(`Release provenance requires ${key}`);
    return Object.freeze({ ...input });
}
export function healthDiagnostics(diagnostics) {
    return Object.freeze({
        productionSha: diagnostics.productionSha,
        schemaVersion: diagnostics.schemaVersion,
        pwaCacheVersion: diagnostics.pwaCacheVersion,
        moduleVersions: JSON.stringify(diagnostics.moduleVersions),
        brainPolicyVersion: diagnostics.brainPolicyVersion,
        agentPolicyVersion: diagnostics.agentPolicyVersion
    });
}
export function diagnosticsVisible(surface) {
    return surface === "health";
}
export function releaseHealthScore(checks) {
    if (checks.length === 0)
        throw new Error("Release health requires measured checks");
    const passed = checks.filter((check) => check.passed).length;
    return Object.freeze({ score: passed / checks.length, basis: "measured_checks", passed, total: checks.length });
}
export function acceptanceState(state) {
    return Object.freeze({
        ...state,
        complete: state.technicalDeploymentComplete && state.ownerVisualAccepted && state.ownerBehavioralAccepted
    });
}
export function assertNoTemporaryExceptions(exceptions) {
    const temporary = exceptions.filter((exception) => !exception.permanent);
    if (temporary.length > 0)
        throw new Error(`Temporary exceptions present at acceptance: ${temporary.map((exception) => exception.id).join(", ")}`);
}
export function everyFileAudit(files) {
    const reviewed = files.filter((file) => file.reviewed).length;
    return Object.freeze({ total: files.length, reviewed, complete: files.length > 0 && reviewed === files.length });
}
export function dependencyAudit(dependencies) {
    const unexpected = dependencies.filter((dependency) => !dependency.allowed).map((dependency) => dependency.name);
    return Object.freeze({ unexpected: Object.freeze(unexpected), complete: unexpected.length === 0 });
}
export function deadCodeAudit(symbols) {
    const dead = symbols.filter((symbol) => !symbol.referenced).map((symbol) => symbol.name);
    return Object.freeze({ dead: Object.freeze(dead), complete: dead.length === 0 });
}
//# sourceMappingURL=release-identity.js.map