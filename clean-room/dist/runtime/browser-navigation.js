function assertOffset(offset) {
    if (!Number.isFinite(offset) || offset < 0)
        throw new Error("Scroll offset must be a non-negative finite number");
    return offset;
}
function assertPath(path) {
    if (!path.startsWith("/"))
        throw new Error("Navigation path must be absolute");
    return path;
}
export function browserLocationKey(location) {
    const pathname = location.pathname.startsWith("/") ? location.pathname : `/${location.pathname}`;
    return `${pathname}${location.search ?? ""}`;
}
export function readCommandCenterHistoryState(value) {
    if (!value || typeof value !== "object")
        return undefined;
    const candidate = value;
    if (candidate.commandCenter !== true)
        return undefined;
    if (typeof candidate.locationKey !== "string" || !candidate.locationKey.startsWith("/"))
        return undefined;
    if (typeof candidate.scrollY !== "number" || !Number.isFinite(candidate.scrollY) || candidate.scrollY < 0)
        return undefined;
    if (typeof candidate.sequence !== "number" || !Number.isSafeInteger(candidate.sequence) || candidate.sequence < 0)
        return undefined;
    return Object.freeze({ commandCenter: true, locationKey: candidate.locationKey, scrollY: candidate.scrollY, sequence: candidate.sequence });
}
export class BrowserNavigationCoordinator {
    history;
    location;
    scroll;
    #sequence = 0;
    constructor(history, location, scroll) {
        this.history = history;
        this.location = location;
        this.scroll = scroll;
    }
    initialize() {
        this.history.scrollRestoration = "manual";
        const current = readCommandCenterHistoryState(this.history.state);
        if (current)
            this.#sequence = current.sequence;
        const state = this.#state(browserLocationKey(this.location), this.scroll.read(), this.#sequence);
        this.history.replaceState(state, "", browserLocationKey(this.location));
        return state;
    }
    captureCurrent() {
        const current = readCommandCenterHistoryState(this.history.state);
        if (current)
            this.#sequence = Math.max(this.#sequence, current.sequence);
        const state = this.#state(browserLocationKey(this.location), this.scroll.read(), this.#sequence);
        this.history.replaceState(state, "", browserLocationKey(this.location));
        return state;
    }
    navigate(path) {
        const target = assertPath(path);
        this.captureCurrent();
        this.#sequence += 1;
        const state = this.#state(target, 0, this.#sequence);
        this.history.pushState(state, "", target);
        this.scroll.restore(0);
        return state;
    }
    back(fallback = "/") {
        const safeFallback = assertPath(fallback);
        this.captureCurrent();
        if (this.history.length > 1) {
            this.history.back();
            return "history";
        }
        this.navigate(safeFallback);
        return "fallback";
    }
    restore(state) {
        const parsed = readCommandCenterHistoryState(state);
        const offset = parsed && parsed.locationKey === browserLocationKey(this.location) ? parsed.scrollY : 0;
        this.scroll.restore(offset);
        if (parsed)
            this.#sequence = Math.max(this.#sequence, parsed.sequence);
        return offset;
    }
    #state(locationKey, scrollY, sequence) {
        return Object.freeze({ commandCenter: true, locationKey: assertPath(locationKey), scrollY: assertOffset(scrollY), sequence });
    }
}
//# sourceMappingURL=browser-navigation.js.map