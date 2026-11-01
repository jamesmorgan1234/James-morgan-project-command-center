import test from "node:test";
import assert from "node:assert/strict";
import {
  finalAudit,
  productionAcceptance,
  lockAcceptance,
  assertAcceptanceLocked,
  assertPostAcceptanceChangeStartsNewCycle
} from "../dist/deployment/index.js";

const T0 = "2026-10-31T10:00:00.000Z";

function passing() {
  return [
    finalAudit("legacy_reference", []),
    finalAudit("security", []),
    finalAudit("architecture", []),
    finalAudit("visual", []),
    finalAudit("agent_e2e", []),
    finalAudit("brain", []),
    finalAudit("portability", [])
  ];
}

test("P7.2 final legacy-reference audit", () => {
  assert.equal(finalAudit("legacy_reference", []).passed, true);
  const failed = finalAudit("legacy_reference", ["/app.js reference"]);
  assert.equal(failed.passed, false);
  assert.deepEqual([...failed.findings], ["/app.js reference"]);
});

test("P7.2 final security audit", () => {
  assert.equal(finalAudit("security", ["service role key in client"]).passed, false);
  assert.equal(finalAudit("security", []).passed, true);
});

test("P7.2 final architecture audit", () => {
  assert.equal(finalAudit("architecture", ["circular module dependency"]).passed, false);
});

test("P7.2 final visual audit", () => {
  assert.equal(finalAudit("visual", ["overflow at 360px"]).passed, false);
});

test("P7.2 final Agent E2E audit", () => {
  assert.equal(finalAudit("agent_e2e", ["run stalled"]).passed, false);
});

test("P7.2 final Brain audit", () => {
  assert.equal(finalAudit("brain", ["contradiction unresolved"]).passed, false);
});

test("P7.2 final portability and export audit", () => {
  assert.equal(finalAudit("portability", ["export missing owner fields"]).passed, false);
});

test("P7.2 final Samsung installed-PWA acceptance", () => {
  const verdict = productionAcceptance({ audits: passing(), samsungInstalledPwaAccepted: false });
  assert.equal(verdict.accepted, false);
  assert.deepEqual([...verdict.blocking], ["samsung_installed_pwa"]);
});

test("P7.2 production is declared accepted only after every audit", () => {
  assert.equal(productionAcceptance({ audits: passing(), samsungInstalledPwaAccepted: true }).accepted, true);
  const audits = passing();
  audits[1] = finalAudit("security", ["open finding"]);
  const verdict = productionAcceptance({ audits, samsungInstalledPwaAccepted: true });
  assert.equal(verdict.accepted, false);
  assert.deepEqual([...verdict.blocking], ["security"]);
});

test("P7.2 acceptance checkpoint is locked", () => {
  const lock = lockAcceptance("checkpoint-199", T0);
  assert.equal(lock.checkpointId, "checkpoint-199");
  assert.equal(Object.isFrozen(lock), true);
  assert.doesNotThrow(() => assertAcceptanceLocked(lock));
  assert.throws(() => assertAcceptanceLocked(null), /not locked/);
});

test("P7.2 post-acceptance changes start a new roadmap and release cycle", () => {
  const lock = lockAcceptance("checkpoint-199", T0);
  assert.doesNotThrow(() => assertPostAcceptanceChangeStartsNewCycle({ kind: "feature" }, null));
  assert.throws(() => assertPostAcceptanceChangeStartsNewCycle({ kind: "feature" }, lock), /new roadmap and release cycle/);
  assert.throws(() => assertPostAcceptanceChangeStartsNewCycle({ kind: " " }, lock), /requires a kind/);
});
