import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function source(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

test("authenticated runtime exposes passkey metadata management and installs Settings only after a live connection", () => {
  const provider = source("src/runtime/owner-security-provider.ts");
  const rootProvider = source("src/runtime/provider.ts");

  assert.match(rootProvider, /new ManagedOwnerRuntimeProvider/i);
  assert.match(provider, /listOwnerPasskeys\(\)/i);
  assert.match(provider, /registerOwnerPasskey\(\)/i);
  assert.match(provider, /renameOwnerPasskey\(/i);
  assert.match(provider, /removeOwnerPasskey\(/i);
  assert.match(provider, /snapshot\.connection\.state === "connected" \|\| snapshot\.connection\.state === "degraded"/i);
  assert.match(provider, /setTimeout\(\(\) => installOwnerPasskeySettings\(this\), 0\)/i);
});

test("passkey removal uses fresh verification then authorize-consume-delete ordering", () => {
  const provider = source("src/runtime/owner-security-provider.ts");
  const fresh = provider.indexOf('this.#passkeys.signIn({ mediation: "required" })');
  const authorize = provider.indexOf('this.#rpc("command_center_security_authorize_action"');
  const consume = provider.indexOf('this.#rpc("command_center_security_consume_passkey_removal"');
  const remove = provider.indexOf('this.#passkeys.remove(fresh.accessToken, id)');

  assert.ok(fresh >= 0, "fresh passkey verification is required");
  assert.ok(authorize > fresh, "canonical authorization must follow fresh verification");
  assert.ok(consume > authorize, "single-use authorization must be consumed after authorization");
  assert.ok(remove > consume, "provider credential deletion must happen only after authorization is consumed");
  assert.match(provider, /p_action_key: "security\.passkey\.remove"/i);
  assert.match(provider, /p_risk_level: "critical"/i);
});

test("passkey Settings is metadata-only and provides add list rename remove controls", () => {
  const settings = source("src/runtime/owner-security-settings.ts");
  assert.match(settings, /Owner passkeys/i);
  assert.match(settings, /Add passkey on this device/i);
  assert.match(settings, /Rename/i);
  assert.match(settings, /Remove/i);
  assert.match(settings, /never stores fingerprint, face, PIN, private-key, or biometric-template data/i);
  assert.match(settings, /listOwnerPasskeys/i);
  assert.match(settings, /registerOwnerPasskey/i);
  assert.match(settings, /renameOwnerPasskey/i);
  assert.match(settings, /removeOwnerPasskey/i);
  assert.doesNotMatch(settings, /accessToken|refreshToken|authorization:\s*`Bearer/i);
  assert.match(settings, /typeof window === "undefined" \|\| typeof document === "undefined"/i);
});
