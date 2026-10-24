export interface OwnerSessionDescriptor {
  readonly sessionId: string;
  readonly deviceId?: string;
  readonly deviceLabel: string;
  readonly platform?: string;
  readonly trustState: string;
  readonly assurance: string;
  readonly sessionCreatedAt: string;
  readonly lastSeenAt: string;
  readonly notAfter?: string;
  readonly revokedAt?: string;
  readonly revokedReason?: string;
  readonly isCurrent: boolean;
}

export interface OwnerSessionSettingsActions {
  listOwnerSessions(): Promise<readonly OwnerSessionDescriptor[]>;
  revokeOwnerSession(sessionId: string): Promise<void>;
  revokeOwnerDevice(deviceId: string): Promise<void>;
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function observed(value?: string): string {
  if (!value) return "Unavailable";
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toLocaleString() : "Unavailable";
}

function message(reason: unknown): string {
  const raw = reason instanceof Error ? reason.message : "Security operation failed";
  if (/cancel|not allowed|aborted/i.test(raw)) return "Verification was cancelled. No session or device was revoked.";
  return raw;
}

export function installOwnerSessionSettings(actions: OwnerSessionSettingsActions): void {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  if (window.location.pathname !== "/settings") return;
  const screen = document.querySelector<HTMLElement>("main.screen");
  if (!screen || document.querySelector("#command-center-session-settings")) return;

  const card = el("section", "bevel-card");
  card.id = "command-center-session-settings";
  card.setAttribute("aria-labelledby", "command-center-session-title");
  const inner = el("div", "surface-card");
  const title = el("h2", "section-title", "Owner sessions & devices");
  title.id = "command-center-session-title";
  const intro = el("p", "muted", "Review active owner sessions and device bindings. Revocation requires fresh platform passkey verification and invalidates protected access across clients.");
  const status = el("p", "muted");
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");
  const list = el("div", "settings-list");
  inner.append(title, intro, status, list);
  card.append(inner);
  screen.append(card);

  const busy = (value: boolean): void => {
    for (const button of list.querySelectorAll<HTMLButtonElement>("button")) button.disabled = value;
  };

  const render = (sessions: readonly OwnerSessionDescriptor[]): void => {
    list.replaceChildren();
    if (sessions.length === 0) {
      list.append(el("p", "muted", "No owner sessions are currently visible."));
      return;
    }
    for (const session of sessions) {
      const row = el("article", "settings-row");
      const copy = el("div", "settings-row__copy");
      const label = `${session.deviceLabel}${session.isCurrent ? " · Current session" : ""}`;
      const state = session.revokedAt ? `Revoked ${observed(session.revokedAt)}` : `${session.trustState} · ${session.assurance}`;
      copy.append(
        el("strong", "settings-row__title", label),
        el("span", "muted", `${session.platform ?? "Platform unavailable"} · ${state}`),
        el("span", "muted", `Last seen ${observed(session.lastSeenAt)} · Session started ${observed(session.sessionCreatedAt)}`)
      );
      if (session.revokedReason) copy.append(el("span", "muted", `Reason: ${session.revokedReason}`));

      const controls = el("div", "settings-row__actions");
      if (!session.revokedAt) {
        const revokeSession = el("button", "nav-link", "Revoke session");
        revokeSession.type = "button";
        revokeSession.addEventListener("click", () => {
          busy(true);
          status.textContent = "Verify with a passkey to revoke this session…";
          void actions.revokeOwnerSession(session.sessionId).then(() => refresh("Session revoked.")).catch((reason: unknown) => {
            status.textContent = message(reason);
            busy(false);
          });
        });
        controls.append(revokeSession);
      }
      if (session.deviceId && session.trustState !== "revoked") {
        const revokeDevice = el("button", "nav-link", "Revoke device");
        revokeDevice.type = "button";
        revokeDevice.addEventListener("click", () => {
          busy(true);
          status.textContent = "Verify with a passkey to revoke this device and its sessions…";
          void actions.revokeOwnerDevice(session.deviceId as string).then(() => refresh("Device and bound sessions revoked.")).catch((reason: unknown) => {
            status.textContent = message(reason);
            busy(false);
          });
        });
        controls.append(revokeDevice);
      }
      row.append(copy, controls);
      list.append(row);
    }
  };

  const refresh = async (success?: string): Promise<void> => {
    try {
      const sessions = await actions.listOwnerSessions();
      render(sessions);
      status.textContent = success ?? `${sessions.length} owner session${sessions.length === 1 ? "" : "s"} visible.`;
    } catch (reason) {
      list.replaceChildren();
      status.textContent = message(reason);
    } finally {
      busy(false);
    }
  };

  status.textContent = "Loading owner sessions…";
  void refresh();
}
