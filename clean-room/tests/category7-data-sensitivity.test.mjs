import test from "node:test";
import assert from "node:assert/strict";
import {
  SENSITIVITY_CLASSES,
  classifyDataField,
  projectForSurface,
  clipboardProjection,
  assertNotStoredAsNote,
  assertNotBrainMemory,
  assertNoServiceRoleKeyInClient,
  assertWithinBoundary,
  assertOwnerControl
} from "../dist/security/index.js";

const fields = [
  classifyDataField("headline", "public"),
  classifyDataField("ownerName", "private"),
  classifyDataField("bankBalance", "sensitive"),
  classifyDataField("apiToken", "secret")
];

function redactions(projected) {
  return Object.fromEntries(projected.map((field) => [field.key, field.redacted]));
}

test("P7.2 data sensitivity classification is required", () => {
  assert.equal(classifyDataField("bankBalance", "sensitive").classification, "sensitive");
  assert.throws(() => classifyDataField("bankBalance", "top_secret"), /Unknown sensitivity class/);
  assert.throws(() => classifyDataField(" ", "public"), /requires a key/);
});

test("P7.2 sensitivity classes are public private sensitive and secret", () => {
  assert.deepEqual([...SENSITIVITY_CLASSES], ["public", "private", "sensitive", "secret"]);
});

test("P7.2 sensitive data is minimized in brain context", () => {
  assert.deepEqual(redactions(projectForSurface(fields, "brain_context")), {
    headline: false, ownerName: false, bankBalance: true, apiToken: true
  });
});

test("P7.2 sensitive data is minimized in logs", () => {
  assert.deepEqual(redactions(projectForSurface(fields, "logs")), {
    headline: false, ownerName: false, bankBalance: true, apiToken: true
  });
});

test("P7.2 sensitive data is minimized in notifications", () => {
  assert.deepEqual(redactions(projectForSurface(fields, "notifications")), {
    headline: false, ownerName: true, bankBalance: true, apiToken: true
  });
});

test("P7.2 sensitive data is minimized in exports by default", () => {
  assert.deepEqual(redactions(projectForSurface(fields, "export")), {
    headline: false, ownerName: false, bankBalance: true, apiToken: true
  });
});

test("P7.2 explicit export option exposes sensitive fields where appropriate", () => {
  const projected = projectForSurface(fields, "export", { explicitExport: true });
  assert.equal(projected.find((field) => field.key === "bankBalance").redacted, false);
  assert.equal(projected.find((field) => field.key === "apiToken").redacted, true);
});

test("P7.2 clipboard controls protect sensitive values", () => {
  const sensitive = classifyDataField("bankBalance", "sensitive");
  assert.equal(clipboardProjection(sensitive, false).redacted, true);
  assert.equal(clipboardProjection(sensitive, true).redacted, false);
  assert.throws(() => clipboardProjection(classifyDataField("apiToken", "secret"), true), /cannot be copied/);
});

test("P7.2 MFA secrets are not stored as normal project notes", () => {
  assert.throws(() => assertNotStoredAsNote({ kind: "mfa_secret", classification: "secret" }), /cannot be stored as normal project notes/);
  assert.doesNotThrow(() => assertNotStoredAsNote({ kind: "password", classification: "private" }));
});

test("P7.2 API tokens are not stored in brain memory", () => {
  assert.throws(() => assertNotBrainMemory({ kind: "api_token", classification: "secret" }), /cannot be stored in Brain memory/);
  assert.doesNotThrow(() => assertNotBrainMemory({ kind: "password", classification: "private" }));
});

test("P7.2 service-role keys never appear in the client", () => {
  assert.throws(() => assertNoServiceRoleKeyInClient("const key = SUPABASE_SERVICE_ROLE_KEY"), /must never appear/);
  assert.doesNotThrow(() => assertNoServiceRoleKeyInClient("const key = import.meta.env.PUBLIC_ANON_KEY"));
});

test("P7.2 privacy boundary is enforced per role", () => {
  const viewer = { role: "viewer", allowedClasses: ["public"] };
  assert.doesNotThrow(() => assertWithinBoundary(viewer, classifyDataField("headline", "public")));
  assert.throws(() => assertWithinBoundary(viewer, classifyDataField("bankBalance", "sensitive")), /cannot access sensitive/);
});

test("P7.2 owner retains final control of canonical data", () => {
  assert.doesNotThrow(() => assertOwnerControl("owner"));
  assert.throws(() => assertOwnerControl("agent"), /Owner retains final control/);
});
