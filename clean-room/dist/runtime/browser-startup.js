const SAFE_STARTUP_MESSAGES = Object.freeze({
    loading: "Starting Command Center…",
    ready: "Command Center ready.",
    degraded: "Command Center is starting with limited connectivity.",
    failed: "Command Center could not start safely. Reload to retry."
});
function view(generation, state, privateDataAllowed) {
    return Object.freeze({ generation, state, message: SAFE_STARTUP_MESSAGES[state], privateDataAllowed });
}
export class BrowserStartupCoordinator {
    timers;
    #generation = 0;
    #current = view(0, "loading", false);
    #watchdog;
    constructor(timers = {
        setTimeout: (callback, delayMs) => setTimeout(callback, delayMs),
        clearTimeout: (handle) => clearTimeout(handle)
    }) {
        this.timers = timers;
    }
    get current() { return this.#current; }
    begin(watchdog) {
        if (watchdog && (!Number.isSafeInteger(watchdog.timeoutMs) || watchdog.timeoutMs < 1 || typeof watchdog.onTimeout !== "function"))
            throw new Error("Startup watchdog timeout and callback are required");
        this.#stopWatchdog();
        this.#generation += 1;
        this.#current = view(this.#generation, "loading", false);
        if (watchdog) {
            const generation = this.#generation;
            this.#watchdog = this.timers.setTimeout(() => {
                if (generation !== this.#generation || this.#current.state === "ready" || this.#current.state === "failed")
                    return;
                watchdog.onTimeout(this.fail(generation));
            }, watchdog.timeoutMs);
        }
        return this.#current;
    }
    degrade(generation) {
        if (generation !== this.#generation || this.#current.state === "failed")
            return this.#current;
        this.#current = view(generation, "degraded", false);
        return this.#current;
    }
    fail(generation) {
        if (generation !== this.#generation)
            return this.#current;
        this.#stopWatchdog();
        this.#current = view(generation, "failed", false);
        return this.#current;
    }
    commitReady(generation) {
        if (!this.canCommit(generation))
            return this.#current;
        this.#stopWatchdog();
        this.#current = view(generation, "ready", true);
        return this.#current;
    }
    canCommit(generation) {
        return generation === this.#generation && this.#current.state !== "failed";
    }
    #stopWatchdog() {
        if (this.#watchdog !== undefined)
            this.timers.clearTimeout(this.#watchdog);
        this.#watchdog = undefined;
    }
}
export function isSafeBootstrapMessage(message) {
    return Object.values(SAFE_STARTUP_MESSAGES).includes(message);
}
//# sourceMappingURL=browser-startup.js.map