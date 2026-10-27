import test from "node:test";
import assert from "node:assert/strict";
import { AuthSessionStore, DeviceRegistry, SecurityInventory } from "../dist/security/index.js";

function session(id, ownerId, overrides = {}) {
  return {
    id,
    ownerId,
    scopes: ["project:write"],
    assurance: "authenticated",
    state: "active",
    createdAt: "2026-10-23T18:00:00Z",
    expiresAt: "2026-10-23T20:00:00Z",
    lastValidatedAt: "2026-10-23T18:10:00Z",
    ...overrides
  };
}

test("P2.3 owner inventory exposes sessions, devices, assurance, activity, trust, and bindings", () => {
  const sessions = new AuthSessionStore();
  sessions.register(session("ses_bound", "owner-1", {
    deviceId: "dev_phone",
    projectId: "command-center",
    companyId: "crestven",
    accountId: "owner-account",
    environment: "preview",
    assurance: "passkey_uv",
    authProviderId: "supabase",
    providerSessionRef: "provider-ref"
  }));
  sessions.register(session("ses_unbound", "owner-1", { lastValidatedAt: "2026-10-23T18:12:00Z" }));
  sessions.register(session("ses_other", "owner-2"));

  const devices = new DeviceRegistry();
  devices.register({ id: "dev_phone", ownerId: "owner-1", label: "Samsung phone", platform: "android", trustState: "trusted", createdAt: "2026-10-23T18:00:00Z" });
  devices.markSeen("dev_phone", "2026-10-23T18:11:00Z");
  devices.register({ id: "dev_other", ownerId: "owner-2", label: "Other phone", platform: "android", trustState: "unknown", createdAt: "2026-10-23T18:00:00Z" });

  const snapshot = new SecurityInventory(sessions, devices).snapshot("owner-1");
  assert.equal(snapshot.ownerId, "owner-1");
  assert.equal(snapshot.sessions.length, 2);
  assert.equal(snapshot.devices.length, 1);

  const bound = snapshot.sessions.find((item) => item.id === "ses_bound");
  assert.deepEqual(bound, {
    id: "ses_bound",
    state: "active",
    assurance: "passkey_uv",
    lastActivityAt: "2026-10-23T18:10:00Z",
    scopes: ["project:write"],
    deviceId: "dev_phone",
    projectId: "command-center",
    companyId: "crestven",
    accountId: "owner-account",
    environment: "preview",
    authProviderId: "supabase"
  });
  assert.deepEqual(snapshot.devices[0], {
    id: "dev_phone",
    label: "Samsung phone",
    platform: "android",
    trustState: "trusted",
    createdAt: "2026-10-23T18:00:00Z",
    lastActivityAt: "2026-10-23T18:11:00Z"
  });
  assert.equal(snapshot.sessions.some((item) => item.id === "ses_other"), false);
  assert.equal(snapshot.devices.some((item) => item.id === "dev_other"), false);
});

test("P2.3 inventory rejects a blank owner scope", () => {
  const inventory = new SecurityInventory(new AuthSessionStore(), new DeviceRegistry());
  assert.throws(() => inventory.snapshot("   "), /ownerId is required/);
});
