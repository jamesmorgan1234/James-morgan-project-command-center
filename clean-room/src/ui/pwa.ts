export type UpdateState = "idle" | "checking" | "available" | "downloading" | "verified" | "activating" | "active" | "rolled_back" | "failed";

const NEXT: Readonly<Record<UpdateState, readonly UpdateState[]>> = Object.freeze({
  idle: Object.freeze(["checking"]),
  checking: Object.freeze(["idle", "available", "failed"]),
  available: Object.freeze(["downloading", "idle"]),
  downloading: Object.freeze(["verified", "failed"]),
  verified: Object.freeze(["activating", "idle"]),
  activating: Object.freeze(["active", "rolled_back", "failed"]),
  active: Object.freeze(["checking", "rolled_back"]),
  rolled_back: Object.freeze(["checking"]),
  failed: Object.freeze(["checking", "rolled_back"])
});

export interface ReleaseIdentity {
  readonly releaseId: string;
  readonly buildHash: string;
  readonly assetManifestHash: string;
  readonly schemaCompatibility: string;
}

export class PwaUpdateCoordinator {
  #state: UpdateState = "idle";
  #candidate?: ReleaseIdentity;
  #knownGood?: ReleaseIdentity;

  get state(): UpdateState { return this.#state; }
  get candidate(): ReleaseIdentity | undefined { return this.#candidate; }
  get knownGood(): ReleaseIdentity | undefined { return this.#knownGood; }

  transition(to: UpdateState): void {
    if (!NEXT[this.#state].includes(to)) throw new Error(`Invalid update transition: ${this.#state} -> ${to}`);
    this.#state = to;
  }

  setCandidate(candidate: ReleaseIdentity): void {
    if (this.#state !== "available" && this.#state !== "downloading") throw new Error("Update candidate can only be set after discovery");
    if (!candidate.releaseId.trim() || !candidate.buildHash.trim() || !candidate.assetManifestHash.trim() || !candidate.schemaCompatibility.trim()) throw new Error("Immutable release identity fields are required");
    this.#candidate = Object.freeze({ ...candidate });
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
