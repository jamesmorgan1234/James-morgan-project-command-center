const NEXT = {
    idle: ["checking"],
    checking: ["idle", "available", "failed"],
    available: ["downloading", "idle"],
    downloading: ["verified", "failed"],
    verified: ["activating", "idle"],
    activating: ["active", "rolled_back", "failed"],
    active: ["checking", "rolled_back"],
    rolled_back: ["checking"],
    failed: ["checking", "rolled_back"]
};
export const COMMAND_CENTER_PWA_SHELL = Object.freeze({
    manifestPath: "/manifest.webmanifest",
    serviceWorkerPath: "/sw.js",
    serviceWorkerScope: "/",
    offlineFallbackRoute: "/offline",
    staticShellCached: true,
    approvedIconRequired: true,
    updateStateExplicit: true,
    staleWorkerRecoverable: true,
    versionVisible: true,
    cachedShellNeverImpliesFreshBusinessData: true,
    incompatibleSchemaActivationBlocked: true
});
export class PwaUpdateCoordinator {
    #state = "idle";
    #candidate;
    #knownGood;
    get state() { return this.#state; }
    get candidate() { return this.#candidate; }
    get knownGood() { return this.#knownGood; }
    transition(to) {
        if (!NEXT[this.#state].includes(to))
            throw new Error(`Invalid update transition: ${this.#state} -> ${to}`);
        this.#state = to;
    }
    setCandidate(candidate) {
        if (this.#state !== "available" && this.#state !== "downloading")
            throw new Error("Update candidate can only be set after discovery");
        if (!candidate.releaseId.trim() || !candidate.buildHash.trim() || !candidate.assetManifestHash.trim() || !candidate.schemaCompatibility.trim())
            throw new Error("Immutable release identity fields are required");
        this.#candidate = Object.freeze({ ...candidate });
    }
    candidateIsSchemaCompatible(currentSchemaCompatibility) {
        if (!currentSchemaCompatibility.trim() || !this.#candidate)
            return false;
        return this.#candidate.schemaCompatibility === currentSchemaCompatibility;
    }
    markActive() {
        if (this.#state !== "active" || !this.#candidate)
            throw new Error("Cannot mark known-good until candidate is active");
        this.#knownGood = this.#candidate;
        this.#candidate = undefined;
    }
    rollback() {
        if (!this.#knownGood)
            throw new Error("No known-good release is available for rollback");
        if (this.#state !== "rolled_back")
            throw new Error("Coordinator must enter rolled_back before restoring known-good release");
        this.#candidate = undefined;
        return this.#knownGood;
    }
}
export const COMMAND_CENTER_OFFLINE_POLICY = Object.freeze({ shellAvailableOffline: true, queueWritesWhileOffline: false, showStaleness: true, protectedActionsOffline: false });
//# sourceMappingURL=pwa.js.map