import { classifyRecoveryFailure, type RecoveryFailureCode } from "../kernel/recovery.js";
import { assertBrowserStartupConfiguration } from "./startup-config.js";
import { BrowserStartupCoordinator } from "./browser-startup.js";
import { installBrowserRecoveryShell, markCurrentReleaseKnownGood } from "./browser-recovery.js";

interface StartupWindow extends Window {
  __commandCenterStartupInstalled?: boolean;
  __commandCenterStartupConfigurationValid?: boolean;
  __commandCenterStartupFailed?: boolean;
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

function renderRecovery(reason: RecoveryFailureCode): void {
  runtimeWindow.__commandCenterStartupFailed = true;
  window.dispatchEvent(new Event("command-center-startup-failed"));
  const node = bootstrapNode();
  if (!node) return;
  installBrowserRecoveryShell(node, reason);
}

export function installBrowserStartupBoundary(): boolean {
  if (runtimeWindow.__commandCenterStartupInstalled) return runtimeWindow.__commandCenterStartupConfigurationValid === true;
  runtimeWindow.__commandCenterStartupInstalled = true;

  const coordinator = new BrowserStartupCoordinator();
  const generation = coordinator.begin({ timeoutMs: 15000, onTimeout: () => renderRecovery("startup_failed") }).generation;
  renderSafeBootstrap("loading", coordinator.current.message);

  try {
    assertBrowserStartupConfiguration(document);
    runtimeWindow.__commandCenterStartupConfigurationValid = true;
  } catch (error) {
    runtimeWindow.__commandCenterStartupConfigurationValid = false;
    coordinator.fail(generation);
    renderRecovery(classifyRecoveryFailure(error));
    return false;
  }

  window.addEventListener("offline", () => {
    if (!bootstrapNode()) return;
    const next = coordinator.degrade(generation);
    renderSafeBootstrap("degraded", next.message);
  });

  window.addEventListener("error", () => {
    if (!bootstrapNode()) return;
    coordinator.fail(generation);
    renderRecovery("startup_failed");
  });

  window.addEventListener("unhandledrejection", (event) => {
    if (!bootstrapNode()) return;
    event.preventDefault();
    coordinator.fail(generation);
    renderRecovery("startup_failed");
  });

  const root = document.querySelector<HTMLElement>("#app");
  if (!root) throw new Error("Missing #app root for startup boundary");
  const observer = new MutationObserver(() => {
    if (!root.querySelector(".app-shell")) return;
    coordinator.commitReady(generation);
    void markCurrentReleaseKnownGood(document);
    observer.disconnect();
  });
  observer.observe(root, { childList: true, subtree: true });
  return true;
}

installBrowserStartupBoundary();
