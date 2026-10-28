export type BrowserStartupState = "loading" | "ready" | "degraded" | "failed";

export interface BrowserStartupView {
  readonly generation: number;
  readonly state: BrowserStartupState;
  readonly message: string;
  readonly privateDataAllowed: boolean;
}

export interface StartupTimerHost {
  setTimeout(callback: () => void, delayMs: number): ReturnType<typeof setTimeout>;
  clearTimeout(handle: ReturnType<typeof setTimeout>): void;
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
  #watchdog: ReturnType<typeof setTimeout> | undefined;

  constructor(readonly timers: StartupTimerHost = {
    setTimeout: (callback, delayMs) => setTimeout(callback, delayMs),
    clearTimeout: (handle) => clearTimeout(handle)
  }) {}

  get current(): BrowserStartupView { return this.#current; }

  begin(watchdog?: Readonly<{ timeoutMs: number; onTimeout: (state: BrowserStartupView) => void }>): BrowserStartupView {
    if (watchdog && (!Number.isSafeInteger(watchdog.timeoutMs) || watchdog.timeoutMs < 1 || typeof watchdog.onTimeout !== "function")) throw new Error("Startup watchdog timeout and callback are required");
    this.#stopWatchdog();
    this.#generation += 1;
    this.#current = view(this.#generation, "loading", false);
    if (watchdog) {
      const generation = this.#generation;
      this.#watchdog = this.timers.setTimeout(() => {
        if (generation !== this.#generation || this.#current.state === "ready" || this.#current.state === "failed") return;
        watchdog.onTimeout(this.fail(generation));
      }, watchdog.timeoutMs);
    }
    return this.#current;
  }

  degrade(generation: number): BrowserStartupView {
    if (generation !== this.#generation || this.#current.state === "failed") return this.#current;
    this.#current = view(generation, "degraded", false);
    return this.#current;
  }

  fail(generation: number): BrowserStartupView {
    if (generation !== this.#generation) return this.#current;
    this.#stopWatchdog();
    this.#current = view(generation, "failed", false);
    return this.#current;
  }

  commitReady(generation: number): BrowserStartupView {
    if (!this.canCommit(generation)) return this.#current;
    this.#stopWatchdog();
    this.#current = view(generation, "ready", true);
    return this.#current;
  }

  canCommit(generation: number): boolean {
    return generation === this.#generation && this.#current.state !== "failed";
  }

  #stopWatchdog(): void {
    if (this.#watchdog !== undefined) this.timers.clearTimeout(this.#watchdog);
    this.#watchdog = undefined;
  }
}

export function isSafeBootstrapMessage(message: string): boolean {
  return Object.values(SAFE_STARTUP_MESSAGES).includes(message);
}
