import { BrowserNavigationCoordinator, browserLocationKey, type BrowserHistoryPort } from "./browser-navigation.js";

interface NavigationRuntimeWindow extends Window {
  __commandCenterNavigationInstalled?: boolean;
}

function absoluteNavigationTarget(value: string | URL | null | undefined): string {
  if (value === undefined || value === null) return browserLocationKey(window.location);
  const url = new URL(String(value), window.location.href);
  if (url.origin !== window.location.origin) throw new Error("Command Center history navigation must remain same-origin");
  return `${url.pathname}${url.search}`;
}

export function installBrowserNavigationOwnership(): void {
  const runtimeWindow = window as NavigationRuntimeWindow;
  if (runtimeWindow.__commandCenterNavigationInstalled) return;
  runtimeWindow.__commandCenterNavigationInstalled = true;

  const nativePushState = window.history.pushState.bind(window.history);
  const nativeReplaceState = window.history.replaceState.bind(window.history);
  const nativeBack = window.history.back.bind(window.history);
  const historyPort: BrowserHistoryPort = {
    get state() { return window.history.state; },
    set state(_value: unknown) { throw new Error("History state is read-only"); },
    get length() { return window.history.length; },
    set length(_value: number) { throw new Error("History length is read-only"); },
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

  window.history.pushState = ((_data: unknown, _unused: string, url?: string | URL | null) => {
    coordinator.navigate(absoluteNavigationTarget(url));
  }) as History["pushState"];

  let scrollCaptureFrame: number | undefined;
  const scheduleScrollCapture = () => {
    if (scrollCaptureFrame !== undefined) return;
    scrollCaptureFrame = window.requestAnimationFrame(() => {
      scrollCaptureFrame = undefined;
      coordinator.captureCurrent();
    });
  };
  window.addEventListener("scroll", scheduleScrollCapture, { passive: true });
  window.addEventListener("pagehide", () => coordinator.captureCurrent());
  document.addEventListener("click", (event) => {
    const target = event.target;
    if (target instanceof Element && target.closest(".back-control")) coordinator.captureCurrent();
  }, true);

  let pendingRestore: unknown | undefined;
  window.addEventListener("popstate", (event) => { pendingRestore = event.state; });
  const root = document.querySelector<HTMLElement>("#app");
  if (!root) throw new Error("Missing #app root for navigation ownership");
  const observer = new MutationObserver(() => {
    if (pendingRestore === undefined) return;
    const state = pendingRestore;
    pendingRestore = undefined;
    window.requestAnimationFrame(() => coordinator.restore(state));
  });
  observer.observe(root, { childList: true });
}

installBrowserNavigationOwnership();
