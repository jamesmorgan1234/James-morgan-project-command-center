import test from "node:test";
import assert from "node:assert/strict";
import { AuthSessionStore, DeviceIncidentResponse, DeviceRegistry } from "../dist/security/index.js";

function session(id, deviceId, overrides = {}) {
  return {
    id,
    ownerId: "owner-1",
    deviceId,
    scopes: ["project:write"],
    assurance: "authenticated",
    state: "active",
    createdAt: "2026-10-23T18:00:00Z",
    expiresAt: "2026-10-23T20:00:00Z",
    lastValidatedAt: "2026-10-23T18:05:00Z",
    ...overrides
  };
}

function deviceRegistry() {
  const devices = new DeviceRegistry();
  devices.register({ id: "dev_stolen", ownerId: "owner-1", label: "Samsung phone", platform: "android", trustState: "trusted", createdAt: "2026-10-23T18:00:00Z" });
  devices.markSeen("dev_stolen", "2026-10-23T18:06:00Z");
  devices.register({ id: "dev_safe", ownerId: "owner-1", label: "Windows laptop", platform: "windows", trustState: "trusted", createdAt: "2026-10-23T18:00:00Z" });
  return devices;
}

test("P2.3 stolen-device response revokes the device and every live session bound to it", () => {
  const sessions = new AuthSessionStore();
  sessions.register(session("ses_one", "dev_stolen"));
  sessions.register(session("ses_two", "dev_stolen", { state: "active", lastValidatedAt: "2026-10-23T18:07:00Z" }));
  sessions.register(session("ses_safe", "dev_safe"));
  const devices = deviceRegistry();
  const response = new DeviceIncidentResponse(sessions, devices).containStolenDevice("owner-1", "dev_stolen", "2026-10-23T18:10:00Z");

  assert.deepEqual(response.revokedSessionIds, ["ses_one", "ses_two"]);
  assert.equal(devices.get("dev_stolen").trustState, "revoked");
  assert.equal(sessions.get("ses_one").state, "revoked");
  assert.equal(sessions.get("ses_two").state, "revoked");
  assert.equal(sessions.get("ses_safe").state, "active");
});

test("P2.3 stolen-device response fails before mutation on owner mismatch", () => {
  const sessions = new AuthSessionStore();
  sessions.register(session("ses_one", "dev_stolen"));
  const devices = deviceRegistry();
  const response = new DeviceIncidentResponse(sessions, devices);

  assert.throws(() => response.containStolenDevice("owner-2", "dev_stolen", "2026-10-23T18:10:00Z"), /Device owner mismatch/);
  assert.equal(devices.get("dev_stolen").trustState, "trusted");
  assert.equal(sessions.get("ses_one").state, "active");
});

test("P2.3 stolen-device response preflights time ordering to avoid partial containment", () => {
  const sessions = new AuthSessionStore();
  sessions.register(session("ses_newer", "dev_stolen", { lastValidatedAt: "2026-10-23T18:12:00Z" }));
  const devices = deviceRegistry();
  const response = new DeviceIncidentResponse(sessions, devices);

  assert.throws(() => response.containStolenDevice("owner-1", "dev_stolen", "2026-10-23T18:10:00Z"), /cannot move session time backward/);
  assert.equal(devices.get("dev_stolen").trustState, "trusted");
  assert.equal(sessions.get("ses_newer").state, "active");
});
