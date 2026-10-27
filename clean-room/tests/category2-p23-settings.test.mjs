import test from "node:test";
import assert from "node:assert/strict";
import { DeviceRegistry, SecuritySettingsRegistry } from "../dist/security/index.js";

function devices() {
  const registry = new DeviceRegistry();
  registry.register({ id: "dev_phone", ownerId: "owner-1", label: "Samsung phone", platform: "android", trustState: "trusted", createdAt: "2026-10-23T18:00:00Z" });
  registry.register({ id: "dev_other", ownerId: "owner-2", label: "Other phone", platform: "android", trustState: "trusted", createdAt: "2026-10-23T18:00:00Z" });
  return registry;
}

test("P2.3 device-local security settings override owner-global settings without changing the global value", () => {
  const registry = new SecuritySettingsRegistry(devices());
  registry.setGlobal("owner-1", "session.keep_signed_in", true, "2026-10-23T18:01:00Z");
  registry.setDevice("owner-1", "dev_phone", "session.keep_signed_in", false, "2026-10-23T18:02:00Z");

  assert.equal(registry.resolve("owner-1", "session.keep_signed_in").value, true);
  assert.equal(registry.resolve("owner-1", "session.keep_signed_in", "dev_phone").value, false);
  assert.equal(registry.listByOwner("owner-1").length, 2);
  assert.equal(registry.listByOwner("owner-2").length, 0);
});

test("P2.3 device-local settings enforce owner binding and revoked-device state", () => {
  const deviceRegistry = devices();
  const registry = new SecuritySettingsRegistry(deviceRegistry);
  assert.throws(() => registry.setDevice("owner-1", "dev_other", "session.keep_signed_in", false, "2026-10-23T18:02:00Z"), /Device owner mismatch/);

  deviceRegistry.revoke("dev_phone", "2026-10-23T18:03:00Z");
  assert.throws(() => registry.setDevice("owner-1", "dev_phone", "session.keep_signed_in", false, "2026-10-23T18:04:00Z"), /Device revoked/);
  assert.throws(() => registry.resolve("owner-1", "session.keep_signed_in", "dev_phone"), /Device revoked/);
});

test("P2.3 setting updates reject backward timestamps", () => {
  const registry = new SecuritySettingsRegistry(devices());
  registry.setGlobal("owner-1", "session.keep_signed_in", true, "2026-10-23T18:05:00Z");
  assert.throws(() => registry.setGlobal("owner-1", "session.keep_signed_in", false, "2026-10-23T18:04:59Z"), /cannot move backward/);
  assert.equal(registry.resolve("owner-1", "session.keep_signed_in").value, true);
});
