import { BrowserStartupCoordinator } from "./browser-startup.js";

interface StartupWindow extends Window {
  __commandCenterStartupInstalled?: boolean;
}

const runtimeWindow = window as StartupWindow;

function bootstrapNode(): HTMLElement | null {
  return document.querySelector<HTMLElement>("[data-command-center-bootstrap]");
}

function renderSafeBootstrap(state: "loading" | "degraded" | "failed", message: string): void {
  const node = bootstrapNode();
  if (!node) return;
  node.dataset.state = state;
  node.replaceChildren();
  const kicker = document.createElement("span");
  kicker.className = "brand-kicker";
  kicker.textContent = "COMMAND CENTER";
  const status = document.createElement("p");
  status.className = "boot-state__message";
  status.setAttribute("role", "status");
  status.textContent = message;
  node.append(kicker, status);
}

export function installBrowserStartupBoundary(): void {
  if (runtimeWindow.__commandCenterStartupInstalled) return;
  runtimeWindow.__commandCenterStartupInstalled = true;

  const coordinator = new BrowserStartupCoordinator();
  const generation = coordinator.begin().generation;
  renderSafeBootstrap("loading", coordinator.current.message);

  window.addEventListener("offline", () => {
    if (!bootstrapNode()) return;
    const next = coordinator.degrade(generation);
    renderSafeBootstrap("degraded", next.message);
  });

  window.addEventListener("error", () => {
    if (!bootstrapNode()) return;
    const next = coordinator.fail(generation);
    renderSafeBootstrap("failed", next.message);
  });

  window.addEventListener("unhandledrejection", (event) => {
    if (!bootstrapNode()) return;
    event.preventDefault();
    const next = coordinator.fail(generation);
    renderSafeBootstrap("failed", next.message);
  });

  const root = document.querySelector<HTMLElement>("#app");
  if (!root) throw new Error("Missing #app root for startup boundary");
  const observer = new MutationObserver(() => {
    if (!root.querySelector(".app-shell")) return;
    coordinator.commitReady(generation);
    observer.disconnect();
  });
  observer.observe(root, { childList: true, subtree: true });
}

installBrowserStartupBoundary();
