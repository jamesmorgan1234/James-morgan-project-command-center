import test from "node:test";
import assert from "node:assert/strict";
import { GovernanceDeniedError, GovernanceGate, evaluateGovernance } from "../dist/kernel/index.js";

const NOW = "2026-10-27T12:30:00.000Z";

function context(overrides = {}) {
  return {
    ownerId: "owner:james",
    authorityOwnerId: "owner:james",
    newestInstructionAllows: true,
    instructionState: "current",
    freeFirst: true,
    introducesCost: false,
    action: "local_reversible_write",
    executionSurface: "normal_chat",
    normalChatAvailable: true,
    now: NOW,
    ...overrides
  };
}

function authorization(overrides = {}) {
  return {
    ownerId: "owner:james",
    action: "merge",
    projectId: "project:command-center",
    accountId: "account:github-command-center",
    resourceId: "branch:build/spec-lock-v2-clean-room",
    authorizedAt: "2026-10-27T12:00:00.000Z",
    expiresAt: "2026-10-27T13:00:00.000Z",
    ...overrides
  };
}

test("P1.5 final owner authority and newest-instruction precedence fail closed for mismatched stale or conflicting authority", () => {
  assert.equal(evaluateGovernance(context()).allowed, true);
  assert.equal(evaluateGovernance(context({ authorityOwnerId: "owner:other" })).reason, "owner_authority_mismatch");
  assert.equal(evaluateGovernance(context({ instructionState: "stale" })).reason, "stale_owner_instruction");
  assert.equal(evaluateGovernance(context({ instructionState: "conflicting" })).reason, "conflicting_owner_instruction");
  assert.equal(evaluateGovernance(context({ newestInstructionAllows: false })).reason, "newest_owner_instruction_blocks_action");
});

test("P1.5 free-first and normal-chat-first are enforcement hooks rather than advisory metadata", () => {
  assert.equal(evaluateGovernance(context({ introducesCost: true })).reason, "free_first_blocks_cost");
  assert.equal(evaluateGovernance(context({ executionSurface: "work", normalChatAvailable: true })).reason, "normal_chat_first_requires_local_execution");
  assert.equal(evaluateGovernance(context({ executionSurface: "work", normalChatAvailable: false })).allowed, true);
});

test("P1.5 protected actions require fresh exact owner project account and resource authorization", () => {
  const protectedContext = context({
    action: "merge",
    projectId: "project:command-center",
    accountId: "account:github-command-center",
    resourceId: "branch:build/spec-lock-v2-clean-room"
  });

  assert.equal(evaluateGovernance(protectedContext).reason, "fresh_owner_authorization_required");
  assert.equal(evaluateGovernance({ ...protectedContext, authorization: authorization({ ownerId: "owner:other" }) }).reason, "authorization_scope_mismatch");
  assert.equal(evaluateGovernance({ ...protectedContext, authorization: authorization({ projectId: "project:other" }) }).reason, "authorization_project_mismatch");
  assert.equal(evaluateGovernance({ ...protectedContext, authorization: authorization({ accountId: "account:other" }) }).reason, "authorization_account_mismatch");
  assert.equal(evaluateGovernance({ ...protectedContext, authorization: authorization({ resourceId: "branch:main" }) }).reason, "authorization_resource_mismatch");
  assert.equal(evaluateGovernance({ ...protectedContext, authorization: authorization() }).reason, "protected_action_authorized");
});

test("P1.5 protected assets require explicit resource binding", () => {
  const base = context({ action: "change_protected_asset" });
  assert.equal(evaluateGovernance({ ...base, authorization: authorization({ action: "change_protected_asset", resourceId: undefined }) }).reason, "protected_asset_resource_required");

  const bound = context({ action: "change_protected_asset", resourceId: "asset:command-center-icon" });
  assert.equal(evaluateGovernance({ ...bound, authorization: authorization({ action: "change_protected_asset", resourceId: "asset:other" }) }).reason, "authorization_resource_mismatch");
  assert.equal(evaluateGovernance({ ...bound, authorization: authorization({ action: "change_protected_asset", resourceId: "asset:command-center-icon" }) }).allowed, true);
});

test("P1.5 malformed future expired and backwards authorization windows fail safely", () => {
  const protectedContext = context({ action: "merge", authorization: authorization() });
  assert.equal(evaluateGovernance({ ...protectedContext, now: "not-a-time" }).reason, "authorization_timestamp_invalid");
  assert.equal(evaluateGovernance({ ...protectedContext, authorization: authorization({ authorizedAt: "not-a-time" }) }).reason, "authorization_timestamp_invalid");
  assert.equal(evaluateGovernance({ ...protectedContext, authorization: authorization({ authorizedAt: "2026-10-27T12:31:00.000Z" }) }).reason, "authorization_not_yet_valid");
  assert.equal(evaluateGovernance({ ...protectedContext, authorization: authorization({ expiresAt: "not-a-time" }) }).reason, "authorization_expiry_invalid");
  assert.equal(evaluateGovernance({ ...protectedContext, authorization: authorization({ expiresAt: "2026-10-27T11:59:00.000Z" }) }).reason, "authorization_expiry_invalid");
  assert.equal(evaluateGovernance({ ...protectedContext, authorization: authorization({ expiresAt: "2026-10-27T12:15:00.000Z" }) }).reason, "authorization_expired");
});

test("P1.5 governance gate prevents denied module code from running and admits authorized operations", () => {
  const gate = new GovernanceGate();
  let calls = 0;
  assert.throws(
    () => gate.execute(context({ instructionState: "stale" }), () => { calls += 1; return "unsafe"; }),
    (error) => error instanceof GovernanceDeniedError && error.decision.reason === "stale_owner_instruction"
  );
  assert.equal(calls, 0);

  const result = gate.execute(context(), () => { calls += 1; return "safe"; });
  assert.equal(result, "safe");
  assert.equal(calls, 1);
});
