import test from "node:test";
import assert from "node:assert/strict";
import {
  CURRENT_RUNTIME_API_VERSION,
  assessApiChange,
  assertBackendClientCompatibility,
  buildApiDeprecationMetadata,
  classifyApiVersionChange,
  negotiateClientCapabilities,
  negotiateServerCapabilities,
  readCompatibilityEnvelope,
  resolveUnsupportedFeature,
  validateApiChangelog,
  writeCompatibilityEnvelope
} from "../dist/kernel/index.js";

const client = {
  apiVersion: CURRENT_RUNTIME_API_VERSION,
  schemaVersion: 1,
  capabilities: ["search", "timeline"],
  acceptsUnknownFields: true
};

const server = {
  apiVersion: CURRENT_RUNTIME_API_VERSION + 1,
  schemaVersion: 1,
  capabilities: ["search", "automation"],
  acceptsUnknownFields: true,
  supportedClientApi: { min: CURRENT_RUNTIME_API_VERSION, max: CURRENT_RUNTIME_API_VERSION + 1 }
};

test("CCR-01127 P1.8 emits explicit API deprecation metadata", () => {
  const metadata = buildApiDeprecationMetadata({
    apiVersion: CURRENT_RUNTIME_API_VERSION,
    deprecatedSince: { major: 1, minor: 1, patch: 0 },
    sunsetAfter: "2027-01-01T00:00:00Z",
    replacement: "/api/v2",
    warning: "Use API v2"
  });
  assert.equal(metadata.Deprecation, "true");
  assert.equal(metadata["X-Command-Center-API-Version"], String(CURRENT_RUNTIME_API_VERSION));
  assert.match(metadata.Link, /successor-version/);
});

test("CCR-01128 and CCR-01129 P1.8 negotiate client/server capabilities symmetrically", () => {
  const clientView = negotiateClientCapabilities(client, server);
  const serverView = negotiateServerCapabilities(server, client);
  assert.equal(clientView.accepted, true);
  assert.equal(serverView.accepted, true);
  assert.deepEqual(clientView.sharedCapabilities, ["search"]);
  assert.deepEqual(serverView.sharedCapabilities, ["search"]);
});

test("CCR-01130 P1.8 handles unsupported optional features without crashing", () => {
  const negotiation = negotiateClientCapabilities(client, server);
  const result = resolveUnsupportedFeature("timeline", negotiation);
  assert.equal(result.supported, false);
  assert.match(result.reason, /Unsupported capability/);
});

test("CCR-01131 and CCR-01132 P1.8 tolerate future unknown fields while parsing known contract fields", () => {
  const parsed = readCompatibilityEnvelope({
    ...client,
    futureMode: "later",
    futureObject: { enabled: true }
  });
  assert.equal(parsed.apiVersion, CURRENT_RUNTIME_API_VERSION);
  assert.deepEqual(parsed.unknownFields, ["futureMode", "futureObject"]);
});

test("CCR-01134 P1.8 keeps read contracts tolerant and write contracts strict", () => {
  assert.equal(readCompatibilityEnvelope({ ...client, futureField: 1 }).apiVersion, CURRENT_RUNTIME_API_VERSION);
  assert.throws(() => writeCompatibilityEnvelope({ ...client, futureField: 1 }), /unknown fields/);
  assert.equal(writeCompatibilityEnvelope(client).apiVersion, CURRENT_RUNTIME_API_VERSION);
});

test("CCR-01178 P1.8 produces an API change impact report", () => {
  const report = assessApiChange(
    { version: { major: 1, minor: 2, patch: 0 }, capabilities: ["a", "b"], deprecatedCapabilities: [] },
    { version: { major: 2, minor: 0, patch: 0 }, capabilities: ["a", "c"], deprecatedCapabilities: ["a"] }
  );
  assert.equal(report.breaking, true);
  assert.deepEqual(report.removedCapabilities, ["b"]);
  assert.deepEqual(report.addedCapabilities, ["c"]);
  assert.deepEqual(report.newlyDeprecatedCapabilities, ["a"]);
});

test("CCR-01179 P1.8 validates an ordered API changelog", () => {
  const changelog = validateApiChangelog([
    { version: { major: 1, minor: 0, patch: 0 }, level: "major", summary: "Initial API", deprecatedCapabilities: [] },
    { version: { major: 1, minor: 1, patch: 0 }, level: "minor", summary: "Add search", deprecatedCapabilities: [] }
  ]);
  assert.equal(changelog.length, 2);
  assert.throws(() => validateApiChangelog([changelog[1], changelog[0]]), /strictly increasing/);
});

test("CCR-01180 P1.8 enforces semantic-version bump size against API impact", () => {
  assert.equal(classifyApiVersionChange({ major: 1, minor: 0, patch: 0 }, { major: 1, minor: 1, patch: 0 }), "minor");
  assert.throws(
    () => assessApiChange(
      { version: { major: 1, minor: 0, patch: 0 }, capabilities: ["a", "b"], deprecatedCapabilities: [] },
      { version: { major: 1, minor: 1, patch: 0 }, capabilities: ["a"], deprecatedCapabilities: [] }
    ),
    /insufficient for major impact/
  );
});

test("CCR-01183 P1.8 safely refuses a dangerously incompatible client", () => {
  const incompatibleClient = { ...client, apiVersion: server.supportedClientApi.max + 1 };
  const negotiation = negotiateServerCapabilities(server, incompatibleClient);
  assert.equal(negotiation.accepted, false);
  assert.throws(() => assertBackendClientCompatibility(negotiation), /Unsafe incompatible client refused/);
});

test("CCR-05287 P1.8 carries an explicit negotiated API version", () => {
  const negotiation = negotiateClientCapabilities(client, server);
  assert.equal(negotiation.negotiatedApiVersion, CURRENT_RUNTIME_API_VERSION);
});
