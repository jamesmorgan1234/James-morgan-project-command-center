import test from "node:test";
import assert from "node:assert/strict";
import { TraceLedger } from "../dist/analytics/index.js";

const BASE = {
  traceId: "trace-p15-1",
  correlationId: "corr-p15-1",
  component: "test",
  action: "redaction",
  at: "2026-10-29T13:00:00Z",
  evidenceRefs: ["rg-022"]
};

test("P15.1 RG-022 TraceLedger redacts secret-shaped values even under innocuous keys", () => {
  const ledger = new TraceLedger();
  const event = ledger.append({
    ...BASE,
    fields: {
      project: "command-center",
      note: "sk-123456789012",
      detail: "Bearer 123456789012",
      callback: "https://example.test/path?access_token=synthetic-value",
      endpoint: "https://user:synthetic-password@example.test/path",
      token: "ordinary-looking-but-sensitive"
    }
  });

  assert.equal(event.fields.project, "command-center");
  assert.equal(event.fields.note, "[REDACTED]");
  assert.equal(event.fields.detail, "[REDACTED]");
  assert.equal(event.fields.callback, "https://example.test/path?access_token=[REDACTED]");
  assert.equal(event.fields.endpoint, "https://user:[REDACTED]@example.test/path");
  assert.equal(event.fields.token, "[REDACTED]");

  const stored = ledger.trace(BASE.traceId)[0];
  assert.deepEqual(stored.fields, event.fields);
  assert.doesNotMatch(JSON.stringify(stored), /sk-123456789012|Bearer 123456789012|synthetic-password/);
});

test("P15.1 RG-022 trace redaction preserves non-secret field values", () => {
  const ledger = new TraceLedger();
  const event = ledger.append({ ...BASE, traceId: "trace-safe", fields: { state: "healthy", count: "2" } });
  assert.deepEqual(event.fields, { state: "healthy", count: "2" });
});
