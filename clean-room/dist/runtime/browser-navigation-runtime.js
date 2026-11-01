import { BrowserNavigationCoordinator, browserLocationKey } from "./browser-navigation.js";
function absoluteNavigationTarget(value) {
    if (value === undefined || value === null)
        return browserLocationKey(window.location);
    const url = new URL(String(value), window.location.href);
    if (url.origin !== window.location.origin)
        throw new Error("Command Center history navigation must remain same-origin");
    return `${url.pathname}${url.search}`;
}
export function installBrowserNavigationOwnership() {
    const runtimeWindow = window;
    if (runtimeWindow.__commandCenterNavigationInstalled)
        return;
    runtimeWindow.__commandCenterNavigationInstalled = true;
    const nativePushState = window.history.pushState.bind(window.history);
    const nativeReplaceState = window.history.replaceState.bind(window.history);
    const nativeBack = window.history.back.bind(window.history);
    const historyPort = {
        get state() { return window.history.state; },
        set state(_value) { throw new Error("History state is read-only"); },
        get length() { return window.history.length; },
        set length(_value) { throw new Error("History length is read-only"); },
        get scrollRestoration() { return window.history.scrollRestoration; },
        set scrollRestoration(value) { window.history.scrollRestoration = value; },
        pushState(data, unused, url) { nativePushState(data, unused, url); },
        replaceState(data, unused, url) { nativeReplaceState(data, unused, url); },
        back() { nativeBack(); }
    };
    const coordinator = new BrowserNavigationCoordinator(historyPort, window.location, {
        read: () => Math.max(0, window.scrollY),
        restore: (offset) => window.scrollTo({ top: offset, left: 0, behavior: "auto" })
    });
    coordinator.initialize();
    window.history.pushState = ((_data, _unused, url) => {
        coordinator.navigate(absoluteNavigationTarget(url));
    });
    let scrollCaptureFrame;
    const scheduleScrollCapture = () => {
        if (scrollCaptureFrame !== undefined)
            return;
        scrollCaptureFrame = window.requestAnimationFrame(() => {
            scrollCaptureFrame = undefined;
            coordinator.captureCurrent();
        });
    };
    window.addEventListener("scroll", scheduleScrollCapture, { passive: true });
    window.addEventListener("pagehide", () => coordinator.captureCurrent());
    document.addEventListener("click", (event) => {
        const target = event.target;
        if (target instanceof Element && target.closest(".back-control"))
            coordinator.captureCurrent();
    }, true);
    let pendingRestore;
    window.addEventListener("popstate", (event) => { pendingRestore = event.state; });
    const root = document.querySelector("#app");
    if (!root)
        throw new Error("Missing #app root for navigation ownership");
    const observer = new MutationObserver(() => {
        if (pendingRestore === undefined)
            return;
        const state = pendingRestore;
        pendingRestore = undefined;
        window.requestAnimationFrame(() => coordinator.restore(state));
    });
    observer.observe(root, { childList: true });
}
installBrowserNavigationOwnership();
//# sourceMappingURL=browser-navigation-runtime.js.map