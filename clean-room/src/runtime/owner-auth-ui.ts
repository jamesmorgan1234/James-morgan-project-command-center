import type { OwnerCredentialSubmit } from "./supabase-owner-provider.js";
import { establishOwnerPasskeySession, ownerPasskeyAvailability } from "./owner-passkey-auth.js";

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function authHeader(): HTMLElement {
  const header = el("header", "app-header owner-auth-header");
  const brand = el("div", "brand-lockup");
  brand.append(el("span", "brand-kicker", "COMMAND CENTER"), el("h1", "screen-title", "Command Center"), el("p", "screen-subtitle", "Private owner command system"));
  header.append(brand, el("div", "header-planet"));
  return header;
}

function authFailureMessage(reason: unknown): string {
  const message = reason instanceof Error ? reason.message : "";
  if (message.toLowerCase().includes("passkey") || message.toLowerCase().includes("webauthn")) return "Passkey sign-in failed. Use your password or try the passkey again.";
  if (message.includes("required")) return "Enter both the owner email and password, or use your saved sign-in, then try again.";
  if (message.includes("Failed to fetch") || message.includes("NetworkError") || message.includes("network")) return "Command Center could not reach the secure sign-in service. Check the connection and try again.";
  return "Sign-in failed. Check the owner email and password, then try again.";
}

export function promptForOwnerCredentials(submit: OwnerCredentialSubmit): Promise<void> {
  const root = document.querySelector<HTMLElement>("#app");
  if (!root) return Promise.reject(new Error("Missing #app root for owner sign-in"));

  return new Promise<void>((resolve) => {
    root.replaceChildren();
    const shell = el("div", "app-shell app-shell--offline_ready owner-auth-shell");
    shell.append(authHeader());

    const connection = el("section", "connection-strip");
    const badge = el("strong", "status status--disconnected", "PRIVATE");
    connection.append(badge, el("span", "connection-message", "Owner authentication is required before canonical Command Center data can be loaded."));
    shell.append(connection);

    const main = el("main", "screen owner-auth-screen");
    const card = el("section", "bevel-card owner-auth-card");
    const inner = el("div", "owner-auth-card__inner");
    inner.append(el("h2", "section-title", "Secure owner sign in"), el("p", "muted", "Use a verified owner passkey when available, or the existing Command Center owner account. Authentication is handled by Supabase and refresh state is kept behind the secure owner-session broker."));

    const form = el("form", "owner-auth-form");
    form.autocomplete = "on";

    const emailLabel = el("label", "owner-auth-field");
    emailLabel.htmlFor = "command-center-owner-email";
    emailLabel.append(el("span", "owner-auth-label", "Email"));
    const email = el("input", "owner-auth-input");
    email.id = "command-center-owner-email";
    email.type = "email";
    email.name = "email";
    email.autocomplete = "username";
    email.inputMode = "email";
    email.autocapitalize = "none";
    email.spellcheck = false;
    email.required = true;
    emailLabel.append(email);

    const passwordLabel = el("label", "owner-auth-field");
    passwordLabel.htmlFor = "command-center-owner-password";
    passwordLabel.append(el("span", "owner-auth-label", "Password"));
    const password = el("input", "owner-auth-input");
    password.id = "command-center-owner-password";
    password.type = "password";
    password.name = "password";
    password.autocomplete = "current-password";
    password.required = true;
    passwordLabel.append(password);

    const error = el("p", "owner-auth-error");
    error.id = "command-center-owner-auth-error";
    error.hidden = true;
    error.setAttribute("role", "alert");
    email.setAttribute("aria-describedby", error.id);
    password.setAttribute("aria-describedby", error.id);

    const button = el("button", "owner-auth-submit", "Sign in with password");
    button.type = "submit";
    form.append(emailLabel, passwordLabel, error, button);

    const passkeyState = ownerPasskeyAvailability(document);
    if (passkeyState.supported) {
      const passkeyButton = el("button", "owner-auth-submit owner-auth-passkey", "Sign in with passkey");
      passkeyButton.type = "button";
      passkeyButton.addEventListener("click", () => {
        if (passkeyButton.disabled || button.disabled) return;
        error.hidden = true;
        passkeyButton.disabled = true;
        button.disabled = true;
        passkeyButton.textContent = "Verifying passkey…";
        void establishOwnerPasskeySession({ documentRef: document }).then(() => {
          password.value = "";
          window.location.reload();
        }).catch((reason: unknown) => {
          error.textContent = authFailureMessage(reason);
          error.hidden = false;
          passkeyButton.disabled = false;
          button.disabled = false;
          passkeyButton.textContent = "Sign in with passkey";
        });
      });
      form.prepend(passkeyButton);
    } else {
      const fallback = el("p", "muted owner-auth-passkey-fallback", passkeyState.reason === "webauthn_unavailable"
        ? "Passkey sign-in is not supported by this browser. Password sign-in remains available."
        : "Passkey sign-in requires the secure Command Center origin. Password sign-in remains available here.");
      form.prepend(fallback);
    }

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      if (button.disabled || !form.reportValidity()) return;
      error.hidden = true;
      button.disabled = true;
      button.textContent = "Signing in…";
      void submit(email.value, password.value).then(() => {
        password.value = "";
        resolve();
      }).catch((reason: unknown) => {
        password.value = "";
        error.textContent = authFailureMessage(reason);
        error.hidden = false;
        button.disabled = false;
        button.textContent = "Sign in with password";
        password.focus();
      });
    });

    inner.append(form);
    card.append(inner);
    main.append(card);
    shell.append(main);
    root.append(shell);
  });
}

export function installOwnerSignOutControl(signOut: () => Promise<void>): void {
  setTimeout(() => {
    const grid = document.querySelector<HTMLElement>(".navigation-grid");
    if (!grid || document.querySelector("#command-center-owner-signout")) return;
    const button = el("button", "nav-link owner-signout", "Sign out");
    button.id = "command-center-owner-signout";
    button.type = "button";
    button.addEventListener("click", () => {
      if (button.disabled) return;
      button.disabled = true;
      button.textContent = "Signing out…";
      // Hide private projections before remote logout, including network failure.
      document.querySelector<HTMLElement>("#app")?.replaceChildren();
      document.title = "Command Center";
      window.dispatchEvent(new Event("command-center-owner-signout"));
      void Promise.resolve().then(signOut).catch(() => undefined).finally(() => window.location.assign("/"));
    });
    grid.append(button);
  }, 0);
}
