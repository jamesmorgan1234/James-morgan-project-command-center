import test from "node:test";
import assert from "node:assert/strict";
import { assertSecretChannelSafe, redactSecretText } from "../dist/security/index.js";

const syntheticApiSecret = "sk-" + "12345678901234567890";
const syntheticUrl = "https://example.test/callback?access_" + "token=synthetic-confidential-value";

for (const channel of ["client_bundle", "log", "brain_memory", "url", "note"]) {
  test(`P2.5 ${channel} channel rejects secret-like material`, () => {
    assert.throws(() => assertSecretChannelSafe(channel, { message: syntheticApiSecret }), /Secret-like material/);
  });
}

test("P2.5 restricted channels reject secret-bearing URL parameters even when the value is provider-agnostic", () => {
  assert.throws(() => assertSecretChannelSafe("url", syntheticUrl), /Secret-like material/);
});

test("P2.5 redaction removes recognized secret values while preserving non-secret context", () => {
  const redacted = redactSecretText(`request failed for ${syntheticApiSecret} at ${syntheticUrl}`);
  assert.equal(redacted.includes(syntheticApiSecret), false);
  assert.equal(redacted.includes("synthetic-confidential-value"), false);
  assert.equal(redacted.includes("request failed for"), true);
  assert.equal(redacted.includes("[REDACTED]"), true);
});

test("P2.5 reference-only payloads remain allowed in restricted channels", () => {
  assert.doesNotThrow(() => assertSecretChannelSafe("brain_memory", { credentialRef: "sec_transactional_email", health: "healthy" }));
});
