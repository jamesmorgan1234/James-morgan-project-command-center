export type UpdateState = "idle" | "checking" | "available" | "downloading" | "verified" | "activating" | "active" | "rolled_back" | "failed";

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
} as const satisfies Readonly<Record<UpdateState, readonly UpdateState[]>>;

export interface ReleaseIdentity {
  readonly releaseId: string;
  readonly buildHash: string;
  readonly assetManifestHash: string;
  readonly schemaCompatibility: string;
}

export interface PwaShellContract {
  readonly manifestPath: "/manifest.webmanifest";
  readonly serviceWorkerPath: "/sw.js";
  readonly serviceWorkerScope: "/";
  readonly offlineFallbackRoute: "/offline";
  readonly staticShellCached: true;
  readonly approvedIconRequired: true;
  readonly updateStateExplicit: true;
  readonly staleWorkerRecoverable: true;
  readonly versionVisible: true;
  readonly cachedShellNeverImpliesFreshBusinessData: true;
  readonly incompatibleSchemaActivationBlocked: true;
}

export const COMMAND_CENTER_PWA_SHELL: PwaShellContract = Object.freeze({
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
  #state: UpdateState = "idle";
  #candidate: ReleaseIdentity | undefined;
  #knownGood: ReleaseIdentity | undefined;

  get state(): UpdateState { return this.#state; }
  get candidate(): ReleaseIdentity | undefined { return this.#candidate; }
  get knownGood(): ReleaseIdentity | undefined { return this.#knownGood; }

  transition(to: UpdateState): void {
    if (!(NEXT[this.#state] as readonly UpdateState[]).includes(to)) throw new Error(`Invalid update transition: ${this.#state} -> ${to}`);
    this.#state = to;
  }

  setCandidate(candidate: ReleaseIdentity): void {
    if (this.#state !== "available" && this.#state !== "downloading") throw new Error("Update candidate can only be set after discovery");
    if (!candidate.releaseId.trim() || !candidate.buildHash.trim() || !candidate.assetManifestHash.trim() || !candidate.schemaCompatibility.trim()) throw new Error("Immutable release identity fields are required");
    this.#candidate = Object.freeze({ ...candidate });
  }

  candidateIsSchemaCompatible(currentSchemaCompatibility: string): boolean {
    if (!currentSchemaCompatibility.trim() || !this.#candidate) return false;
    return this.#candidate.schemaCompatibility === currentSchemaCompatibility;
  }

  markActive(): void {
    if (this.#state !== "active" || !this.#candidate) throw new Error("Cannot mark known-good until candidate is active");
    this.#knownGood = this.#candidate;
    this.#candidate = undefined;
  }

  rollback(): ReleaseIdentity {
    if (!this.#knownGood) throw new Error("No known-good release is available for rollback");
    if (this.#state !== "rolled_back") throw new Error("Coordinator must enter rolled_back before restoring known-good release");
    this.#candidate = undefined;
    return this.#knownGood;
  }
}

export interface OfflinePolicy {
  readonly shellAvailableOffline: boolean;
  readonly queueWritesWhileOffline: false;
  readonly showStaleness: true;
  readonly protectedActionsOffline: false;
}

export const COMMAND_CENTER_OFFLINE_POLICY: OfflinePolicy = Object.freeze({ shellAvailableOffline: true, queueWritesWhileOffline: false, showStaleness: true, protectedActionsOffline: false });
