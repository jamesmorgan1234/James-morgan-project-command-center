export class NavigationCoordinator {
    #history = [];
    #scroll = new Map();
    #currentPath;
    constructor(initialPath = "/") {
        if (!initialPath.startsWith("/"))
            throw new Error("Initial path must be absolute");
        this.#currentPath = initialPath;
    }
    get currentPath() { return this.#currentPath; }
    navigate(path) {
        if (!path.startsWith("/"))
            throw new Error("Navigation path must be absolute");
        if (path === this.#currentPath)
            return;
        this.#history.push(this.#currentPath);
        this.#currentPath = path;
    }
    back(fallback = "/") {
        const previous = this.#history.pop();
        this.#currentPath = previous ?? fallback;
        return this.#currentPath;
    }
    recordScroll(path, offset) {
        if (!Number.isFinite(offset) || offset < 0)
            throw new Error("Scroll offset must be a non-negative finite number");
        this.#scroll.set(path, offset);
    }
    restoreScroll(path) { return this.#scroll.get(path) ?? 0; }
    snapshot() {
        return Object.freeze({ currentPath: this.#currentPath, history: Object.freeze([...this.#history]), scrollByPath: Object.freeze(Object.fromEntries(this.#scroll)) });
    }
}
//# sourceMappingURL=navigation.js.map