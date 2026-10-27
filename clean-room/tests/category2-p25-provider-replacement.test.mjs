import test from "node:test";
import assert from "node:assert/strict";
import { SecretReferenceRegistry } from "../dist/security/index.js";

function original() {
  return { id: "sec_old", provider: "provider-a", purpose: "transactional-email", state: "healthy", createdAt: "2026-10-23T18:00:00Z", version: 1 };
}

function replacement(overrides = {}) {
  return { id: "sec_new", provider: "provider-b", purpose: "transactional-email", state: "configured", createdAt: "2026-10-23T18:05:00Z", version: 1, ...overrides };
}

test("P2.5 provider replacement revokes the old reference and activates only reference metadata for the new provider", () => {
  const registry = new SecretReferenceRegistry();
  registry.register(original());
  const [oldRef, newRef] = registry.replaceProvider("sec_old", replacement(), "2026-10-23T18:06:00Z");

  assert.equal(oldRef.state, "revoked");
  assert.equal(oldRef.replacedBy, "sec_new");
  assert.equal(oldRef.revokedAt, "2026-10-23T18:06:00Z");
  assert.equal(newRef.provider, "provider-b");
  assert.equal(newRef.purpose, "transactional-email");
  assert.throws(() => registry.assertUsable("sec_old", "2026-10-23T18:07:00Z"), /revoked/);
  assert.equal(registry.assertUsable("sec_new", "2026-10-23T18:07:00Z").id, "sec_new");
});

test("P2.5 provider replacement preserves purpose and rejects reference metadata containing secret material", () => {
  const registry = new SecretReferenceRegistry();
  registry.register(original());
  assert.throws(() => registry.replaceProvider("sec_old", replacement({ purpose: "different-purpose" }), "2026-10-23T18:06:00Z"), /preserve credential purpose/);
  assert.throws(() => registry.replaceProvider("sec_old", replacement({ id: "sec_secret", token: "plaintext-secret" }), "2026-10-23T18:06:00Z"), /Secret material field is forbidden/);
  assert.equal(registry.get("sec_old").state, "healthy");
});
