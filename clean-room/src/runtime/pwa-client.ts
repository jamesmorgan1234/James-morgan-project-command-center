import { PwaUpdateCoordinator, type ReleaseIdentity, type UpdateState } from "../ui/pwa.js";

export interface PwaUpdateView {
  readonly state: UpdateState;
  readonly candidate: ReleaseIdentity | undefined;
  readonly registrationAvailable: boolean;
  readonly message: string;
}

type Listener = (view: PwaUpdateView) => void;

function isReleaseIdentity(value: unknown): value is ReleaseIdentity {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Partial<ReleaseIdentity>;
  return typeof candidate.releaseId === "string" && candidate.releaseId.trim().length > 0
    && typeof candidate.buildHash === "string" && candidate.buildHash.trim().length > 0
    && typeof candidate.assetManifestHash === "string" && candidate.assetManifestHash.trim().length > 0
    && typeof candidate.schemaCompatibility === "string" && candidate.schemaCompatibility.trim().length > 0;
}

export class BrowserPwaUpdateClient {
  readonly #coordinator = new PwaUpdateCoordinator();
  readonly #listeners = new Set<Listener>();
  #registration: ServiceWorkerRegistration | undefined;
  #message = "PWA update service has not been checked.";
  #controllerReloaded = false;

  get view(): PwaUpdateView {
    return Object.freeze({
      state: this.#coordinator.state,
      candidate: this.#coordinator.candidate,
      registrationAvailable: this.#registration !== undefined,
      message: this.#message
    });
  }

  subscribe(listener: Listener): () => void {
    this.#listeners.add(listener);
    listener(this.view);
    return () => this.#listeners.delete(listener);
  }

  async registerAndCheck(): Promise<void> {
    if (!("serviceWorker" in navigator)) {
      this.#message = "Service workers are unavailable in this browser.";
      this.#emit();
      return;
    }
    try {
      if (this.#coordinator.state === "idle") this.#coordinator.transition("checking");
      this.#message = "Checking for a verified Command Center update.";
      this.#emit();
      this.#registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      await this.#registration.update();
      this.#wireRegistration(this.#registration);
      if (this.#registration.waiting) await this.#loadCandidate();
      else if (this.#coordinator.state === "checking") {
        this.#coordinator.transition("idle");
        this.#message = "No verified update is waiting for activation.";
        this.#emit();
      }
    } catch {
      if (this.#coordinator.state === "checking" || this.#coordinator.state === "downloading") this.#coordinator.transition("failed");
      this.#message = "PWA update verification is unavailable. The current shell remains usable.";
      this.#emit();
    }
  }

  async activateVerifiedUpdate(): Promise<boolean> {
    const waiting = this.#registration?.waiting;
    if (!waiting || this.#coordinator.state !== "verified" || !this.#coordinator.candidate) return false;
    this.#coordinator.transition("activating");
    this.#message = `Activating verified release ${this.#coordinator.candidate.releaseId}.`;
    this.#emit();
    waiting.postMessage({ type: "ACTIVATE_UPDATE" });
    return true;
  }

  #wireRegistration(registration: ServiceWorkerRegistration): void {
    registration.addEventListener("updatefound", () => {
      const installing = registration.installing;
      installing?.addEventListener("statechange", () => {
        if (installing.state === "installed" && navigator.serviceWorker.controller && registration.waiting) void this.#loadCandidate();
      });
    });
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (this.#controllerReloaded || this.#coordinator.state !== "activating") return;
      this.#controllerReloaded = true;
      this.#coordinator.transition("active");
      this.#coordinator.markActive();
      this.#message = "Verified update activated. Reloading the controlled shell.";
      this.#emit();
      window.location.reload();
    });
  }

  async #loadCandidate(): Promise<void> {
    try {
      if (this.#coordinator.state === "checking") this.#coordinator.transition("available");
      if (this.#coordinator.state !== "available") return;
      this.#coordinator.transition("downloading");
      this.#message = "Validating the waiting release identity.";
      this.#emit();
      const response = await fetch(`/release.json?candidate=${Date.now()}`, { cache: "no-store", credentials: "same-origin" });
      if (!response.ok) throw new Error("Release identity unavailable");
      const identity: unknown = await response.json();
      if (!isReleaseIdentity(identity)) throw new Error("Release identity malformed");
      this.#coordinator.setCandidate(identity);
      this.#coordinator.transition("verified");
      this.#message = `Verified update ${identity.releaseId} is ready. Activation remains explicit.`;
      this.#emit();
    } catch {
      if (this.#coordinator.state === "downloading") this.#coordinator.transition("failed");
      this.#message = "A waiting update could not be verified and will not be activated.";
      this.#emit();
    }
  }

  #emit(): void { for (const listener of this.#listeners) listener(this.view); }
}
