import test from "node:test";
import assert from "node:assert/strict";
import { PortabilityCenter } from "../dist/data/index.js";

function record(id, sensitivity) {
  return {
    id,
    entityType: "artifact",
    version: 1,
    contentHash: `${id}-hash`,
    sensitivity,
    provenanceRefs: [`source:${id}`],
    data: { id }
  };
}

const records = [
  record("internal-1", "internal"),
  record("sensitive-1", "sensitive"),
  record("protected-1", "protected"),
  record("secret-1", "secret")
];

const scope = { ownerId: "owner-1", projectId: "command-center" };

function authorization(overrides = {}) {
  return {
    authorized: true,
    ownerDecisionRef: "decision:p15-1-rg-022",
    scope,
    encrypted: true,
    encryptionKeyRef: "sec_export_encryption_key",
    allowedSensitivities: ["sensitive", "protected"],
    ...overrides
  };
}

test("P15.1 RG-022 portability defaults to internal-only export", () => {
  const center = new PortabilityCenter();
  const manifest = center.export(records);

  assert.equal(manifest.recordCount, 1);
  assert.equal(manifest.redactedCount, 3);
  assert.deepEqual(manifest.records.map((item) => item.id), ["internal-1"]);
});

test("P15.1 RG-022 restricted export requires scoped encrypted authorization", () => {
  const center = new PortabilityCenter();
  const manifest = center.export(records, { scope, authorization: authorization() });

  assert.equal(manifest.recordCount, 3);
  assert.equal(manifest.redactedCount, 1);
  assert.deepEqual(manifest.records.map((item) => item.id), ["internal-1", "sensitive-1", "protected-1"]);
  assert.equal(manifest.records.some((item) => item.sensitivity === "secret"), false);
});

test("P15.1 RG-022 restricted export rejects scope mismatch and missing encryption policy", () => {
  const center = new PortabilityCenter();

  assert.throws(
    () => center.export(records, {
      scope,
      authorization: authorization({ scope: { ownerId: "other-owner", projectId: "command-center" } })
    }),
    /scope mismatch/
  );

  assert.throws(
    () => center.export(records, {
      scope,
      authorization: authorization({ encrypted: false })
    }),
    /encryption policy/
  );

  assert.throws(
    () => center.export(records, {
      scope,
      authorization: authorization({ encryptionKeyRef: "" })
    }),
    /encryption policy/
  );
});

test("P15.1 RG-022 secret export must be named explicitly in the authorization", () => {
  const center = new PortabilityCenter();
  const withoutSecret = center.export(records, { scope, authorization: authorization() });
  assert.equal(withoutSecret.records.some((item) => item.sensitivity === "secret"), false);

  const withSecret = center.export(records, {
    scope,
    authorization: authorization({ allowedSensitivities: ["sensitive", "protected", "secret"] })
  });
  assert.equal(withSecret.records.some((item) => item.sensitivity === "secret"), true);
});
