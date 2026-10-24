import type { SupabasePasskeyDescriptor } from "../security/supabase-passkeys.js";

export interface OwnerPasskeySettingsActions {
  listOwnerPasskeys(): Promise<readonly SupabasePasskeyDescriptor[]>;
  registerOwnerPasskey(): Promise<SupabasePasskeyDescriptor>;
  renameOwnerPasskey(passkeyId: string, friendlyName: string): Promise<SupabasePasskeyDescriptor>;
  removeOwnerPasskey(passkeyId: string): Promise<void>;
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function formatObservedAt(value?: string): string {
  if (!value) return "Never used";
  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime()) ? parsed.toLocaleString() : "Usage time unavailable";
}

function errorMessage(reason: unknown): string {
  const raw = reason instanceof Error ? reason.message : "Security operation failed";
  if (/cancel|not allowed|aborted/i.test(raw)) return "Passkey verification was cancelled. No security setting was changed.";
  return raw;
}

export function installOwnerPasskeySettings(actions: OwnerPasskeySettingsActions): void {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  if (window.location.pathname !== "/settings") return;
  const screen = document.querySelector<HTMLElement>("main.screen");
  if (!screen || document.querySelector("#command-center-passkey-settings")) return;

  const card = el("section", "bevel-card");
  card.id = "command-center-passkey-settings";
  card.setAttribute("aria-labelledby", "command-center-passkey-title");

  const inner = el("div", "surface-card");
  const title = el("h2", "section-title", "Owner passkeys");
  title.id = "command-center-passkey-title";
  const intro = el("p", "muted", "Platform passkeys use this device's protected biometric or screen-lock verification. Command Center never stores fingerprint, face, PIN, private-key, or biometric-template data.");
  const status = el("p", "muted");
  status.id = "command-center-passkey-status";
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");
  const list = el("div", "settings-list");
  list.id = "command-center-passkey-list";
  const add = el("button", "owner-auth-submit", "Add passkey on this device");
  add.type = "button";

  inner.append(title, intro, add, status, list);
  card.append(inner);
  screen.append(card);

  const setBusy = (busy: boolean): void => {
    add.disabled = busy;
    for (const button of list.querySelectorAll<HTMLButtonElement>("button")) button.disabled = busy;
  };

  const render = (passkeys: readonly SupabasePasskeyDescriptor[]): void => {
    list.replaceChildren();
    if (passkeys.length === 0) {
      list.append(el("p", "muted", "No owner passkeys are registered yet. Password sign-in remains the secure fallback."));
      return;
    }
    for (const passkey of passkeys) {
      const row = el("article", "settings-row");
      row.dataset.passkeyId = passkey.id;
      const copy = el("div", "settings-row__copy");
      copy.append(
        el("strong", "settings-row__title", passkey.friendlyName ?? "Owner passkey"),
        el("span", "muted", `Created ${formatObservedAt(passkey.createdAt)} · Last used ${formatObservedAt(passkey.lastUsedAt)}`)
      );
      const controls = el("div", "settings-row__actions");
      const rename = el("button", "nav-link", "Rename");
      rename.type = "button";
      const remove = el("button", "nav-link", "Remove");
      remove.type = "button";

      rename.addEventListener("click", () => {
        if (row.querySelector("input")) return;
        const editor = el("form", "owner-auth-form");
        const input = el("input", "owner-auth-input");
        input.type = "text";
        input.maxLength = 120;
        input.required = true;
        input.autocomplete = "off";
        input.value = passkey.friendlyName ?? "Owner passkey";
        input.setAttribute("aria-label", "Passkey name");
        const save = el("button", "owner-auth-submit", "Save name");
        save.type = "submit";
        const cancel = el("button", "nav-link", "Cancel");
        cancel.type = "button";
        editor.append(input, save, cancel);
        copy.append(editor);
        input.focus();
        input.select();
        cancel.addEventListener("click", () => editor.remove());
        editor.addEventListener("submit", (event) => {
          event.preventDefault();
          if (!editor.reportValidity()) return;
          setBusy(true);
          status.textContent = "Renaming passkey…";
          void actions.renameOwnerPasskey(passkey.id, input.value).then(() => refresh("Passkey renamed.")).catch((reason: unknown) => {
            status.textContent = errorMessage(reason);
            setBusy(false);
          });
        });
      });

      remove.addEventListener("click", () => {
        setBusy(true);
        status.textContent = "Verify with a passkey to remove this credential…";
        void actions.removeOwnerPasskey(passkey.id).then(() => refresh("Passkey removed. The removal authorization cannot be replayed.")).catch((reason: unknown) => {
          status.textContent = errorMessage(reason);
          setBusy(false);
        });
      });

      controls.append(rename, remove);
      row.append(copy, controls);
      list.append(row);
    }
  };

  const refresh = async (successMessage?: string): Promise<void> => {
    try {
      const passkeys = await actions.listOwnerPasskeys();
      render(passkeys);
      status.textContent = successMessage ?? `${passkeys.length} registered owner passkey${passkeys.length === 1 ? "" : "s"}.`;
    } catch (reason) {
      list.replaceChildren();
      status.textContent = errorMessage(reason);
    } finally {
      setBusy(false);
    }
  };

  add.addEventListener("click", () => {
    setBusy(true);
    status.textContent = "Verify this device to register a platform passkey…";
    void actions.registerOwnerPasskey().then(() => refresh("Passkey registered with required user verification.")).catch((reason: unknown) => {
      status.textContent = errorMessage(reason);
      setBusy(false);
    });
  });

  setBusy(true);
  status.textContent = "Loading registered passkeys…";
  void refresh();
}
