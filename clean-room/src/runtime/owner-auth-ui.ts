import type { OwnerCredentialSubmit } from "./supabase-owner-provider.js";

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
    inner.append(el("h2", "section-title", "Secure owner sign in"), el("p", "muted", "Use the existing Command Center owner account. Authentication is handled by Supabase; the browser receives only the public project key and your authenticated session."));

    const form = el("form", "owner-auth-form");
    form.noValidate = true;
    const emailLabel = el("label", "owner-auth-field");
    emailLabel.append(el("span", "owner-auth-label", "Email"));
    const email = el("input", "owner-auth-input");
    email.type = "email";
    email.name = "email";
    email.autocomplete = "username";
    email.inputMode = "email";
    email.required = true;
    emailLabel.append(email);

    const passwordLabel = el("label", "owner-auth-field");
    passwordLabel.append(el("span", "owner-auth-label", "Password"));
    const password = el("input", "owner-auth-input");
    password.type = "password";
    password.name = "password";
    password.autocomplete = "current-password";
    password.required = true;
    passwordLabel.append(password);

    const error = el("p", "owner-auth-error");
    error.hidden = true;
    const button = el("button", "owner-auth-submit", "Sign in");
    button.type = "submit";
    form.append(emailLabel, passwordLabel, error, button);
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      if (button.disabled) return;
      error.hidden = true;
      button.disabled = true;
      button.textContent = "Signing in…";
      void submit(email.value, password.value).then(() => {
        password.value = "";
        resolve();
      }).catch(() => {
        password.value = "";
        error.textContent = "Sign-in failed. Check the owner email and password, then try again.";
        error.hidden = false;
        button.disabled = false;
        button.textContent = "Sign in";
        password.focus();
      });
    });

    inner.append(form);
    card.append(inner);
    main.append(card);
    shell.append(main);
    root.append(shell);
    requestAnimationFrame(() => email.focus());
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
      void signOut().finally(() => window.location.assign("/"));
    });
    grid.append(button);
  }, 0);
}
