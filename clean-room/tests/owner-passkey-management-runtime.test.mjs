import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function source(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

function methodBody(text, signature, nextSignature) {
  const start = text.indexOf(signature);
  assert.ok(start >= 0, `missing method ${signature}`);
  const end = nextSignature ? text.indexOf(nextSignature, start + signature.length) : text.length;
  return text.slice(start, end === -1 ? text.length : end);
}

test("authenticated runtime exposes passkey and session security management only after a live connection", () => {
  const provider = source("src/runtime/owner-security-provider.ts");
  const rootProvider = source("src/runtime/provider.ts");

  assert.match(rootProvider, /new ManagedOwnerRuntimeProvider/i);
  assert.match(provider, /listOwnerPasskeys\(\)/i);
  assert.match(provider, /registerOwnerPasskey\(\)/i);
  assert.match(provider, /renameOwnerPasskey\(/i);
  assert.match(provider, /removeOwnerPasskey\(/i);
  assert.match(provider, /listOwnerSessions\(\)/i);
  assert.match(provider, /revokeOwnerSession\(/i);
  assert.match(provider, /revokeOwnerDevice\(/i);
  assert.match(provider, /snapshot\.connection\.state === "connected" \|\| snapshot\.connection\.state === "degraded"/i);
  assert.match(provider, /installOwnerPasskeySettings\(this\)/i);
  assert.match(provider, /installOwnerSessionSettings\(this\)/i);
});

test("fresh protected authorization requires a platform passkey before the authorization RPC", () => {
  const provider = source("src/runtime/owner-security-provider.ts");
  const helper = methodBody(provider, "async #freshProtectedAuthorization", "#currentSession()");
  const verify = helper.indexOf('this.#passkeys.signIn({ mediation: "required" })');
  const authorize = helper.indexOf('this.#rpc("command_center_security_authorize_action"');
  assert.ok(verify >= 0, "fresh passkey verification is required");
  assert.ok(authorize > verify, "canonical authorization must follow fresh verification");
  assert.match(helper, /p_idempotency_key:/i);
});

test("passkey removal authorizes, consumes once, then deletes the provider credential", () => {
  const provider = source("src/runtime/owner-security-provider.ts");
  const body = methodBody(provider, "async removeOwnerPasskey", "async listOwnerSessions");
  const authorize = body.indexOf("this.#freshProtectedAuthorization");
  const consume = body.indexOf('this.#rpc("command_center_security_consume_passkey_removal"');
  const remove = body.indexOf('this.#passkeys.remove(fresh.session.accessToken, id)');
  assert.ok(authorize >= 0);
  assert.ok(consume > authorize);
  assert.ok(remove > consume);
  assert.match(body, /"security\.passkey\.remove", "passkey", id, "critical"/i);
});

test("session and device revocation use protected server-owned actions", () => {
  const provider = source("src/runtime/owner-security-provider.ts");
  const sessionBody = methodBody(provider, "async revokeOwnerSession", "async revokeOwnerDevice");
  const deviceBody = methodBody(provider, "async revokeOwnerDevice", "async #freshProtectedAuthorization");
  assert.match(sessionBody, /"security\.revoke_session", "owner_session", id, "high"/i);
  assert.match(sessionBody, /command_center_revoke_owner_session_authorized/i);
  assert.match(deviceBody, /"security\.revoke_device", "owner_device", id, "critical"/i);
  assert.match(deviceBody, /command_center_revoke_owner_device_authorized/i);
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

test("session Settings is owner-visible and exposes session and whole-device revocation", () => {
  const settings = source("src/runtime/owner-session-settings.ts");
  assert.match(settings, /Owner sessions & devices/i);
  assert.match(settings, /Current session/i);
  assert.match(settings, /Revoke session/i);
  assert.match(settings, /Revoke device/i);
  assert.match(settings, /fresh platform passkey verification/i);
  assert.match(settings, /listOwnerSessions/i);
  assert.match(settings, /revokeOwnerSession/i);
  assert.match(settings, /revokeOwnerDevice/i);
  assert.doesNotMatch(settings, /accessToken|refreshToken|authorization:\s*`Bearer/i);
});
