/**
 * Navigation and kernel invariants.
 *
 * Route restoration, Android and browser Back contracts, nested-detail and
 * expanded-section Back, per-route scroll memory, soft navigation, no shared
 * mutable globals, no competing event loops and a kernel version identifier.
 */
export function restoreRoute(saved, fallback) {
    if (!fallback.startsWith("/"))
        throw new Error("A fallback route must be absolute");
    if (saved !== null && saved.route.startsWith("/"))
        return saved.route;
    return fallback;
}
export function androidBack(state, canExit) {
    if (state.detailStack.length > 0) {
        return { action: "close_detail", state: { ...state, detailStack: state.detailStack.slice(0, -1) } };
    }
    if (state.expandedSections.length > 0) {
        return { action: "collapse_section", state: { ...state, expandedSections: state.expandedSections.slice(0, -1) } };
    }
    return { action: canExit ? "exit" : "navigate", state };
}
export function browserBack(history, index) {
    if (!Number.isSafeInteger(index) || index < 0 || index >= history.length)
        throw new Error("History index is out of range");
    const next = Math.max(0, index - 1);
    const route = history[next];
    if (route === undefined)
        throw new Error("History is empty");
    return { route, index: next };
}
export function nestedDetailBack(stack) {
    if (stack.length === 0)
        return { stack, handled: false };
    return { stack: stack.slice(0, -1), handled: true };
}
export function expandedSectionBack(sections) {
    if (sections.length === 0)
        return { sections, handled: false };
    return { sections: sections.slice(0, -1), handled: true };
}
export function rememberScroll(store, route, offset) {
    if (!route.startsWith("/"))
        throw new Error("Scroll memory requires an absolute route");
    if (!Number.isFinite(offset) || offset < 0)
        throw new Error("Scroll offset must be nonnegative");
    return Object.freeze({ ...store, [route]: offset });
}
export function assertSoftNavigation(navigation) {
    if (navigation.fullPageReload)
        throw new Error("Ordinary navigation must not reload the whole page");
}
export function assertNoSharedMutableGlobals(globals) {
    if (globals.length > 0)
        throw new Error(`Shared mutable globals are not permitted: ${globals.join(", ")}`);
}
export function assertSingleEventLoop(loops) {
    if (loops.length !== 1)
        throw new Error("There must be exactly one application event loop");
}
export function kernelVersion(version) {
    if (!/^\d+\.\d+\.\d+$/.test(version))
        throw new Error("Kernel version must be semantic");
    return version;
}
//# sourceMappingURL=navigation.js.map