import { createRecoveryShellPlan, type RecoveryFailureCode } from "../kernel/recovery.js";

const RECOVERY_MESSAGE_TIMEOUT_MS = 1500;

type RecoveryMessageType = "QUERY_KNOWN_GOOD" | "RESTORE_KNOWN_GOOD" | "MARK_RELEASE_KNOWN_GOOD";

async function sendRecoveryMessage(type: RecoveryMessageType, releaseId?: string): Promise<boolean> {
  if (!("serviceWorker" in navigator)) return false;
  try {
    return await new Promise<boolean>((resolve) => {
      let channel: MessageChannel | undefined;
      let settled = false;
      const finish = (value: boolean): void => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        try { channel?.port1.close(); } catch {}
        resolve(value);
      };
      const timer = window.setTimeout(() => finish(false), RECOVERY_MESSAGE_TIMEOUT_MS);
      void (async () => {
        const registration = await navigator.serviceWorker.ready;
        if (settled) return;
        const target = navigator.serviceWorker.controller ?? registration.active;
        if (!target) { finish(false); return; }
        channel = new MessageChannel();
        channel.port1.onmessage = (event) => finish(event.data?.ok === true);
        target.postMessage(releaseId ? { type, releaseId } : { type }, [channel.port2]);
      })().catch(() => finish(false));
    });
  } catch {
    return false;
  }
}

export async function hasKnownGoodRelease(): Promise<boolean> {
  return sendRecoveryMessage("QUERY_KNOWN_GOOD");
}

export async function restoreKnownGoodRelease(): Promise<boolean> {
  return sendRecoveryMessage("RESTORE_KNOWN_GOOD");
}

export async function markCurrentReleaseKnownGood(documentRef: Document): Promise<boolean> {
  const releaseId = documentRef.querySelector<HTMLMetaElement>('meta[name="command-center-release"]')?.content.trim();
  if (!releaseId) return false;
  return sendRecoveryMessage("MARK_RELEASE_KNOWN_GOOD", releaseId);
}

function button(label: string, action: () => void): HTMLButtonElement {
  const control = document.createElement("button");
  control.type = "button";
  control.className = "project-filter-button";
  control.textContent = label;
  control.addEventListener("click", action);
  return control;
}

function render(node: HTMLElement, reason: RecoveryFailureCode, knownGoodFallbackAvailable: boolean): void {
  const plan = createRecoveryShellPlan(reason, knownGoodFallbackAvailable);
  node.dataset.state = "recovery";
  node.setAttribute("aria-busy", "false");
  node.replaceChildren();

  const kicker = document.createElement("span");
  kicker.className = "brand-kicker";
  kicker.textContent = "COMMAND CENTER";
  const heading = document.createElement("h1");
  heading.className = "screen-title";
  heading.textContent = "Recovery mode";
  const status = document.createElement("p");
  status.className = "boot-state__message";
  status.setAttribute("role", "status");
  status.textContent = plan.message;
  const diagnostic = document.createElement("p");
  diagnostic.className = "muted";
  diagnostic.textContent = `Diagnostic: ${plan.diagnostic.code}`;
  const controls = document.createElement("div");
  controls.className = "recovery-controls";
  controls.append(button("Retry startup", () => window.location.reload()));

  if (plan.knownGoodFallbackAvailable) {
    controls.append(button("Use last known-good release", () => {
      status.textContent = "Restoring the last known-good shell…";
      void restoreKnownGoodRelease().then((restored) => {
        if (restored) window.location.reload();
        else status.textContent = "A known-good fallback could not be restored. Retry startup remains available.";
      });
    }));
  }

  node.append(kicker, heading, status, diagnostic, controls);
}

export function installBrowserRecoveryShell(node: HTMLElement, reason: RecoveryFailureCode): void {
  render(node, reason, false);
  void hasKnownGoodRelease().then((available) => {
    if (available && node.isConnected) render(node, reason, true);
  });
}
