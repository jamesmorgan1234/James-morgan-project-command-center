import test from "node:test";
import assert from "node:assert/strict";
import { evaluateGovernance } from "../dist/kernel/index.js";

const base = {
  ownerId: "owner:james",
  newestInstructionAllows: true,
  freeFirst: true,
  introducesCost: false,
  projectId: "project:command-center",
  now: "2026-10-26T16:30:00.000Z"
};

test("P1 governance permits only explicitly classified non-protected actions and fails closed on unknown action classes", () => {
  assert.deepEqual(evaluateGovernance({ ...base, action: "read" }), {
    allowed: true,
    reason: "allowed_non_protected_action",
    protected: false
  });

  assert.deepEqual(evaluateGovernance({ ...base, action: "future_unknown_action" }), {
    allowed: false,
    reason: "unknown_action_class",
    protected: true
  });
});

test("P1 protected policy cannot broaden silently through missing or mismatched authorization", () => {
  assert.deepEqual(evaluateGovernance({ ...base, action: "deploy_production" }), {
    allowed: false,
    reason: "fresh_owner_authorization_required",
    protected: true
  });

  const mismatched = evaluateGovernance({
    ...base,
    action: "deploy_production",
    authorization: {
      ownerId: "owner:james",
      action: "publish",
      projectId: "project:command-center",
      authorizedAt: "2026-10-26T16:29:00.000Z"
    }
  });
  assert.equal(mismatched.allowed, false);
  assert.equal(mismatched.reason, "authorization_scope_mismatch");
});
