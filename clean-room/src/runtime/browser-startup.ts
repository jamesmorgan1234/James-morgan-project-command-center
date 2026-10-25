export type BrowserStartupState = "loading" | "ready" | "degraded" | "failed";

export interface BrowserStartupView {
  readonly generation: number;
  readonly state: BrowserStartupState;
  readonly message: string;
  readonly privateDataAllowed: boolean;
}

const SAFE_STARTUP_MESSAGES: Readonly<Record<BrowserStartupState, string>> = Object.freeze({
  loading: "Starting Command Center…",
  ready: "Command Center ready.",
  degraded: "Command Center is starting with limited connectivity.",
  failed: "Command Center could not start safely. Reload to retry."
});

function view(generation: number, state: BrowserStartupState, privateDataAllowed: boolean): BrowserStartupView {
  return Object.freeze({ generation, state, message: SAFE_STARTUP_MESSAGES[state], privateDataAllowed });
}

export class BrowserStartupCoordinator {
  #generation = 0;
  #current: BrowserStartupView = view(0, "loading", false);

  get current(): BrowserStartupView { return this.#current; }

  begin(): BrowserStartupView {
    this.#generation += 1;
    this.#current = view(this.#generation, "loading", false);
    return this.#current;
  }

  degrade(generation: number): BrowserStartupView {
    if (generation !== this.#generation) return this.#current;
    this.#current = view(generation, "degraded", false);
    return this.#current;
  }

  fail(generation: number): BrowserStartupView {
    if (generation !== this.#generation) return this.#current;
    this.#current = view(generation, "failed", false);
    return this.#current;
  }

  commitReady(generation: number): BrowserStartupView {
    if (generation !== this.#generation) return this.#current;
    this.#current = view(generation, "ready", true);
    return this.#current;
  }

  canCommit(generation: number): boolean {
    return generation === this.#generation && this.#current.state !== "failed";
  }
}

export function isSafeBootstrapMessage(message: string): boolean {
  return Object.values(SAFE_STARTUP_MESSAGES).includes(message);
}
